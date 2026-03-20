"""
MotionGuard AI - FastAPI Backend Server
Real-time motion instability prediction system.
"""
import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_to_database, close_database_connection, get_database
from app.models import *
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, decode_token,
    get_current_user_optional, get_current_doctor, get_current_patient
)
from app.ml_engine import pipeline
from app.sensor_simulator import get_simulator
from app.seed_data import (
    DEMO_PATIENTS, DEMO_MEDICATIONS, DEMO_USERS,
    DEMO_EMERGENCY_CONTACTS, generate_demo_alerts, generate_adherence_history
)

# ─── App Setup ─────────────────────────────────────────────
app = FastAPI(
    title="MotionGuard AI",
    description="AI-powered wearable monitoring system for real-time motion instability prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str = "default"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "default"):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)

    async def broadcast(self, message: dict, channel: str = "default"):
        if channel in self.active_connections:
            dead = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead.append(connection)
            for d in dead:
                self.disconnect(d, channel)

manager = ConnectionManager()

# ─── Lifecycle ─────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    try:
        await connect_to_database()
        db = get_database()
        if db is not None:
            # Seed demo data if empty
            patient_count = await db.patients.count_documents({})
            if patient_count == 0:
                await db.patients.insert_many(DEMO_PATIENTS)
                await db.medications.insert_many(DEMO_MEDICATIONS)
                await db.alerts.insert_many(generate_demo_alerts())
                for user in DEMO_USERS:
                    user_doc = {**user, "password_hash": hash_password("demo123")}
                    await db.users.insert_one(user_doc)
                print("Demo data seeded successfully")
    except Exception as e:
        print(f"Warning: Could not connect to MongoDB: {e}")
        print("Running in demo mode without database persistence")

    # Start background telemetry generation
    asyncio.create_task(telemetry_broadcast_loop())

@app.on_event("shutdown")
async def shutdown():
    await close_database_connection()

# ─── Background Telemetry Loop ─────────────────────────────
async def telemetry_broadcast_loop():
    """Continuously generates and broadcasts simulated sensor data."""
    patient_ids = ["8821", "8829", "99210", "6829"]
    while True:
        for pid in patient_ids:
            sim = get_simulator(pid)
            sample = sim.generate_sample()

            # Feed into ML pipeline
            pipeline.add_sample(
                patient_id=pid,
                accel_x=sample["accelerometer"]["x"],
                accel_y=sample["accelerometer"]["y"],
                accel_z=sample["accelerometer"]["z"],
                gyro_x=sample["gyroscope"]["x"],
                gyro_y=sample["gyroscope"]["y"],
                gyro_z=sample["gyroscope"]["z"],
                heart_rate=sample["heart_rate"]["bpm"]
            )

            # Run analysis every 10th sample (10Hz analysis rate)
            analysis = pipeline.analyze(pid)

            telemetry_frame = {
                "type": "telemetry",
                "patient_id": pid,
                "timestamp": sample["timestamp"],
                "accel_x": sample["accelerometer"]["x"],
                "accel_y": sample["accelerometer"]["y"],
                "accel_z": sample["accelerometer"]["z"],
                "gyro_x": sample["gyroscope"]["x"],
                "gyro_y": sample["gyroscope"]["y"],
                "gyro_z": sample["gyroscope"]["z"],
                "heart_rate": sample["heart_rate"]["bpm"],
                "spo2": sample["heart_rate"]["spo2"],
                "stability_score": analysis["stability"]["score"],
                "risk_level": analysis["stability"]["risk_level"],
                "tremor_severity": analysis["tremor"]["severity"],
                "dominant_frequency": analysis["tremor"]["dominant_frequency"],
                "fall_probability": analysis["fall_risk"]["probability"],
                "motion_intensity": analysis["motion_intensity"],
                "fft_spectrum": analysis["tremor"]["fft_spectrum"],
                "fft_frequencies": analysis["tremor"]["fft_frequencies"],
                "motion_smoothness": analysis["stability"]["motion_smoothness"],
                "gait_consistency": analysis["stability"]["gait_consistency"],
                "heart_rhythm_stability": analysis["stability"]["heart_rhythm_stability"],
            }

            await manager.broadcast(telemetry_frame, f"telemetry_{pid}")
            await manager.broadcast(telemetry_frame, "telemetry_all")

        await asyncio.sleep(0.1)  # 10Hz update rate

# ─── WebSocket Endpoints ───────────────────────────────────
@app.websocket("/ws/telemetry/{patient_id}")
async def websocket_telemetry(websocket: WebSocket, patient_id: str):
    await manager.connect(websocket, f"telemetry_{patient_id}")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming commands from frontend
            try:
                cmd = json.loads(data)
                if cmd.get("action") == "simulate_fall":
                    sim = get_simulator(patient_id)
                    sim.set_mode("fall")
                    pipeline.simulate_fall(patient_id)
                elif cmd.get("action") == "simulate_tremor":
                    sim = get_simulator(patient_id)
                    sim.set_mode("tremor")
                    pipeline.simulate_tremor_spike(patient_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"telemetry_{patient_id}")

@app.websocket("/ws/telemetry")
async def websocket_telemetry_all(websocket: WebSocket):
    await manager.connect(websocket, "telemetry_all")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "telemetry_all")

# ─── Auth Endpoints ────────────────────────────────────────
@app.post("/api/auth/doctor/register")
async def register_doctor(doctor: DoctorRegister):
    """Register a new doctor account."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": doctor.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create doctor record
    doctor_doc = {
        "email": doctor.email,
        "name": doctor.name,
        "role": "Doctor",
        "specialty": doctor.specialty,
        "license_number": doctor.license_number,
        "institution": doctor.institution,
        "phone": doctor.phone,
        "password_hash": hash_password(doctor.password),
        "avatar_url": None,
        "created_at": datetime.now().isoformat()
    }
    
    result = await db.users.insert_one(doctor_doc)
    doctor_doc["_id"] = str(result.inserted_id)
    
    return {
        "message": "Doctor registered successfully",
        "user_id": str(result.inserted_id),
        "email": doctor.email
    }

@app.post("/api/auth/patient/register")
async def register_patient(patient: PatientRegister):
    """Register a new patient account."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": patient.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create patient record
    patient_doc = {
        "email": patient.email,
        "name": patient.name,
        "role": "Patient",
        "age": patient.age,
        "medical_conditions": patient.medical_conditions or [],
        "emergency_contact": patient.emergency_contact,
        "emergency_phone": patient.emergency_phone,
        "phone": patient.phone,
        "password_hash": hash_password(patient.password),
        "avatar_url": None,
        "assigned_doctor": None,
        "created_at": datetime.now().isoformat()
    }
    
    result = await db.users.insert_one(patient_doc)
    
    return {
        "message": "Patient registered successfully",
        "user_id": str(result.inserted_id),
        "email": patient.email
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Login for both doctors and patients."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify role matches
    if user.get("role") != credentials.role:
        raise HTTPException(status_code=401, detail=f"This account is registered as {user.get('role')}, not {credentials.role}")
    
    # Create token
    token = create_access_token({
        "sub": user["email"],
        "user_id": str(user["_id"]),
        "role": user["role"],
        "name": user["name"]
    })
    
    # Prepare user response
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        role=user["role"],
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at")
    )
    
    return Token(access_token=token, user=user_response)

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user_optional)):
    """Get current user profile."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await db.users.find_one({"email": current_user.get("sub")})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] == "Doctor":
        patients_count = await db.users.count_documents({"assigned_doctor": str(user["_id"]), "role": "Patient"})
        return DoctorProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            specialty=user.get("specialty", ""),
            license_number=user.get("license_number", ""),
            institution=user.get("institution"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            created_at=user.get("created_at"),
            patients_count=patients_count
        )
    else:
        return PatientProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            age=user.get("age", 0),
            medical_conditions=user.get("medical_conditions", []),
            emergency_contact=user.get("emergency_contact"),
            emergency_phone=user.get("emergency_phone"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            assigned_doctor=user.get("assigned_doctor"),
            created_at=user.get("created_at")
        )

@app.get("/api/auth/doctor/{doctor_id}")
async def get_doctor_profile(doctor_id: str):
    """Get doctor profile by ID."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(doctor_id), "role": "Doctor"})
        if not user:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        patients_count = await db.users.count_documents({"assigned_doctor": doctor_id, "role": "Patient"})
        
        return DoctorProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            specialty=user.get("specialty", ""),
            license_number=user.get("license_number", ""),
            institution=user.get("institution"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            created_at=user.get("created_at"),
            patients_count=patients_count
        )
    except:
        raise HTTPException(status_code=404, detail="Doctor not found")

@app.get("/api/auth/patient/{patient_id}")
async def get_patient_profile(patient_id: str):
    """Get patient profile by ID."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(patient_id), "role": "Patient"})
        if not user:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return PatientProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            age=user.get("age", 0),
            medical_conditions=user.get("medical_conditions", []),
            emergency_contact=user.get("emergency_contact"),
            emergency_phone=user.get("emergency_phone"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            assigned_doctor=user.get("assigned_doctor"),
            created_at=user.get("created_at")
        )
    except:
        raise HTTPException(status_code=404, detail="Patient not found")

@app.put("/api/auth/doctor/profile")
async def update_doctor_profile(
    update: DoctorUpdate,
    current_user: dict = Depends(get_current_doctor)
):
    """Update doctor profile."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    result = await db.users.update_one(
        {"email": current_user.get("sub"), "role": "Doctor"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    user = await db.users.find_one({"email": current_user.get("sub")})
    patients_count = await db.users.count_documents({"assigned_doctor": str(user["_id"]), "role": "Patient"})
    
    return DoctorProfile(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        specialty=user.get("specialty", ""),
        license_number=user.get("license_number", ""),
        institution=user.get("institution"),
        phone=user.get("phone"),
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at"),
        patients_count=patients_count
    )

@app.put("/api/auth/patient/profile")
async def update_patient_profile(
    update: PatientUpdate,
    current_user: dict = Depends(get_current_patient)
):
    """Update patient profile."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    result = await db.users.update_one(
        {"email": current_user.get("sub"), "role": "Patient"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    user = await db.users.find_one({"email": current_user.get("sub")})
    
    return PatientProfile(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        age=user.get("age", 0),
        medical_conditions=user.get("medical_conditions", []),
        emergency_contact=user.get("emergency_contact"),
        emergency_phone=user.get("emergency_phone"),
        phone=user.get("phone"),
        avatar_url=user.get("avatar_url"),
        assigned_doctor=user.get("assigned_doctor"),
        created_at=user.get("created_at")
    )

@app.post("/api/doctor/{doctor_id}/assign-patient/{patient_id}")
async def assign_patient_to_doctor(
    doctor_id: str,
    patient_id: str,
    current_user: dict = Depends(get_current_doctor)
):
    """Assign a patient to a doctor."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    
    # Verify the doctor is updating their own assignments
    if current_user.get("user_id") != doctor_id:
        raise HTTPException(status_code=403, detail="Cannot assign patients to other doctors")
    
    # Update patient's assigned doctor
    result = await db.users.update_one(
        {"_id": ObjectId(patient_id), "role": "Patient"},
        {"$set": {"assigned_doctor": doctor_id}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"message": "Patient assigned successfully"}

@app.get("/api/doctor/{doctor_id}/patients")
async def get_doctor_patients(
    doctor_id: str,
    current_user: dict = Depends(get_current_doctor)
):
    """Get all patients assigned to a doctor."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Verify the doctor is viewing their own patients
    if current_user.get("user_id") != doctor_id:
        raise HTTPException(status_code=403, detail="Cannot view other doctors' patients")
    
    patients = await db.users.find(
        {"assigned_doctor": doctor_id, "role": "Patient"},
        {"password_hash": 0}
    ).to_list(None)
    
    return [
        PatientProfile(
            id=str(p["_id"]),
            email=p["email"],
            name=p["name"],
            age=p.get("age", 0),
            medical_conditions=p.get("medical_conditions", []),
            emergency_contact=p.get("emergency_contact"),
            emergency_phone=p.get("emergency_phone"),
            phone=p.get("phone"),
            avatar_url=p.get("avatar_url"),
            assigned_doctor=p.get("assigned_doctor"),
            created_at=p.get("created_at")
        )
        for p in patients
    ]

# ─── Patient Endpoints ─────────────────────────────────────
@app.get("/api/patients")
async def get_patients():
    db = get_database()
    if db is not None:
        patients = await db.patients.find({}, {"_id": 0}).to_list(100)
        return patients
    return DEMO_PATIENTS

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    db = get_database()
    if db is not None:
        patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
        if patient:
            return patient
    for p in DEMO_PATIENTS:
        if p["patient_id"] == patient_id:
            return p
    raise HTTPException(status_code=404, detail="Patient not found")

@app.get("/api/patients/{patient_id}/summary")
async def get_patient_summary(patient_id: str):
    analysis = pipeline.analyze(patient_id)
    patient = None
    for p in DEMO_PATIENTS:
        if p["patient_id"] == patient_id:
            patient = p
            break
    return {
        "patient_id": patient_id,
        "name": patient["name"] if patient else "Unknown",
        "stability_score": analysis["stability"]["score"],
        "risk_level": analysis["stability"]["risk_level"],
        "heart_rate": analysis["heart_rate"],
        "motion_intensity": analysis["motion_intensity"],
        "tremor_severity": analysis["tremor"]["severity"],
        "dominant_frequency": analysis["tremor"]["dominant_frequency"],
        "fall_probability": analysis["fall_risk"]["probability"],
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/patients/{patient_id}/analysis")
async def get_patient_analysis(patient_id: str):
    return pipeline.analyze(patient_id)

# ─── Alert Endpoints ───────────────────────────────────────
@app.get("/api/alerts")
async def get_alerts(patient_id: Optional[str] = None):
    db = get_database()
    if db is not None:
        query = {"patient_id": patient_id} if patient_id else {}
        alerts = await db.alerts.find(query, {"_id": 0}).sort("timestamp", -1).to_list(100)
        return alerts
    return generate_demo_alerts()

@app.post("/api/alerts")
async def create_alert(alert: AlertCreate):
    alert_doc = {
        "patient_id": alert.patient_id,
        "severity": alert.severity,
        "alert_type": alert.alert_type,
        "message": alert.message,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending",
        "action_taken": None
    }
    db = get_database()
    if db is not None:
        await db.alerts.insert_one(alert_doc)
    # Broadcast alert
    await manager.broadcast({"type": "alert", **alert_doc}, "telemetry_all")
    return alert_doc

@app.post("/api/alerts/manual-emergency")
async def manual_emergency(patient_id: str = "8821"):
    alert_doc = {
        "patient_id": patient_id,
        "severity": "CRITICAL",
        "alert_type": "Manual Emergency Trigger",
        "message": "Emergency manually triggered by clinical staff",
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending",
        "action_taken": None
    }
    db = get_database()
    if db is not None:
        await db.alerts.insert_one(alert_doc)
    await manager.broadcast({"type": "alert", **alert_doc}, "telemetry_all")
    return alert_doc

@app.get("/api/alerts/thresholds")
async def get_thresholds():
    return {
        "stability_threshold": 65,
        "voice_alerts": True,
        "telegram_bot": True,
        "ems_dispatch": False
    }

@app.put("/api/alerts/thresholds")
async def update_thresholds(thresholds: RiskThresholds):
    return thresholds.dict()

# ─── Medication Endpoints ──────────────────────────────────
@app.get("/api/medications")
async def get_medications(patient_id: Optional[str] = None):
    db = get_database()
    if db is not None:
        query = {"patient_id": patient_id} if patient_id else {}
        meds = await db.medications.find(query, {"_id": 0}).to_list(100)
        return meds
    if patient_id:
        return [m for m in DEMO_MEDICATIONS if m["patient_id"] == patient_id]
    return DEMO_MEDICATIONS

@app.get("/api/medications/{patient_id}/stats")
async def get_medication_stats(patient_id: str):
    adherence = generate_adherence_history(patient_id, 30)
    taken = sum(1 for a in adherence if a["status"] == "Taken")
    total = len(adherence)
    return {
        "adherence_rate": round(taken / total * 100, 1) if total > 0 else 0,
        "avg_stability_gain": 12.0,
        "doses_taken": taken,
        "doses_total": total,
        "current_status": "Optimal Stability"
    }

@app.get("/api/medications/{patient_id}/adherence")
async def get_adherence(patient_id: str, days: int = 30):
    return generate_adherence_history(patient_id, days)

@app.post("/api/medications")
async def add_medication(med: Medication):
    db = get_database()
    if db is not None:
        await db.medications.insert_one(med.dict(exclude={"id"}))
    return {"message": "Medication added successfully"}

# ─── Analytics Endpoints ───────────────────────────────────
@app.get("/api/analytics/{patient_id}/stability-trend")
async def get_stability_trend(patient_id: str, period: str = "weeks"):
    """Generate stability trend data."""
    import random
    random.seed(42)
    data = []
    base = 75
    for i in range(30 if period == "weeks" else 120):
        base += random.uniform(-3, 3.5)
        base = max(40, min(98, base))
        data.append({
            "day": i,
            "score": round(base, 1),
            "label": f"Day {i}"
        })
    return data

@app.get("/api/analytics/{patient_id}/activity-breakdown")
async def get_activity_breakdown(patient_id: str):
    return {
        "total_hours": 7.2,
        "breakdown": [
            {"activity": "Walking", "percentage": 60, "color": "#137fec"},
            {"activity": "Standing", "percentage": 15, "color": "#f59e0b"},
            {"activity": "Sitting", "percentage": 15, "color": "#9ca3af"},
            {"activity": "Tremors", "percentage": 10, "color": "#ef4444"}
        ]
    }

@app.get("/api/analytics/{patient_id}/stats")
async def get_analytics_stats(patient_id: str):
    return {
        "stability_index": {"value": 88, "change": 4.2},
        "avg_daily_walk": {"value": 142, "unit": "m", "change": -10.5},
        "tremor_events": {"value": 12, "change": 2.1},
        "fall_risk": {"value": "Low", "label": "Based on gait symmetry"},
        "gait_symmetry": 94.2,
        "postural_sway": 0.12,
        "resting_tremor": "Moderate"
    }

# ─── Sensor Config Endpoints ──────────────────────────────
@app.get("/api/sensors/status")
async def get_sensor_status():
    return {
        "sensors": [
            {
                "name": "MPU6050 (Motion)",
                "type": "Accelerometer",
                "device_id": "ESP32-MG-001",
                "status": "Connected",
                "latency": "4.2ms",
                "signal_strength": 3,
                "packet_loss": 0.02
            },
            {
                "name": "MAX30102 (OX)",
                "type": "Heart Rate",
                "device_id": "ESP32-MG-001",
                "status": "Connected",
                "latency": "6.1ms",
                "signal_strength": 4,
                "signal_label": "STRONG",
                "packet_loss": 0.01
            }
        ],
        "system": {
            "sampling_rate": "100Hz",
            "buffer_size": "5.0s",
            "packet_loss": "0.02%",
            "uptime": "14d 6h 22m"
        }
    }

# ─── Settings Endpoints ───────────────────────────────────
@app.get("/api/settings/devices")
async def get_paired_devices():
    return [
        {"device_name": "Patient-Watch-04", "device_type": "Wrist Sensor", "device_id": "ID: 4B22-X", "signal_status": "Signal: Good"},
        {"device_name": "Room-Hub-Beta", "device_type": "Motion Sensor", "device_id": "ID: 9VE1-Y", "signal_status": None}
    ]

@app.get("/api/settings/workspace")
async def get_workspace_settings():
    return {
        "dark_mode": False,
        "critical_alert_notifications": True,
        "data_privacy_level": "ADVANCED"
    }

@app.get("/api/settings/users")
async def get_users():
    return [
        {"name": "Kevin Lee", "role": "Head Nurse", "access_level": "Admin", "status": "Active"},
        {"name": "Maria Rodriguez", "role": "Patient Guardian (Family)", "access_level": "Viewer", "status": "Offline"},
        {"name": "James Doe", "role": "Caregiver", "access_level": "Viewer", "status": "Pending"}
    ]

@app.get("/api/emergency-contacts")
async def get_emergency_contacts():
    return DEMO_EMERGENCY_CONTACTS

# ─── Demo Simulation Endpoints ─────────────────────────────
@app.post("/api/simulate/fall/{patient_id}")
async def simulate_fall(patient_id: str):
    sim = get_simulator(patient_id)
    sim.set_mode("fall")
    pipeline.simulate_fall(patient_id)
    # Create alert
    alert_doc = {
        "type": "alert",
        "patient_id": patient_id,
        "severity": "CRITICAL",
        "alert_type": "Fall Detected (Simulated)",
        "message": f"Simulated fall event for patient {patient_id}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending"
    }
    await manager.broadcast(alert_doc, "telemetry_all")
    await manager.broadcast(alert_doc, f"telemetry_{patient_id}")
    return {"message": "Fall simulation triggered", "patient_id": patient_id}

@app.post("/api/simulate/tremor/{patient_id}")
async def simulate_tremor(patient_id: str):
    sim = get_simulator(patient_id)
    sim.set_mode("tremor")
    pipeline.simulate_tremor_spike(patient_id)
    alert_doc = {
        "type": "alert",
        "patient_id": patient_id,
        "severity": "WARNING",
        "alert_type": "Tremor Spike (Simulated)",
        "message": f"Simulated severe tremor for patient {patient_id}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending"
    }
    await manager.broadcast(alert_doc, "telemetry_all")
    await manager.broadcast(alert_doc, f"telemetry_{patient_id}")
    return {"message": "Tremor simulation triggered", "patient_id": patient_id}

# ─── Health Check ──────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "MotionGuard AI",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
