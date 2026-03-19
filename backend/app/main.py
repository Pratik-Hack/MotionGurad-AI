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
    get_current_user, decode_token
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
@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_database()
    if db is not None:
        user = await db.users.find_one({"email": credentials.email})
        if user and verify_password(credentials.password, user.get("password_hash", "")):
            token = create_access_token({
                "sub": user["email"],
                "role": user["role"],
                "name": user["name"]
            })
            return Token(access_token=token)
    # Demo fallback
    if credentials.email == "demo@motionguard.ai":
        token = create_access_token({"sub": "demo@motionguard.ai", "role": "Doctor", "name": "Dr. Sarah Chen"})
        return Token(access_token=token)
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/register")
async def register(user: UserCreate):
    db = get_database()
    if db is not None:
        existing = await db.users.find_one({"email": user.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        doc = {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "specialty": user.specialty,
            "institution": user.institution,
            "password_hash": hash_password(user.password)
        }
        await db.users.insert_one(doc)
        return {"message": "User registered successfully"}
    raise HTTPException(status_code=503, detail="Database unavailable")

@app.get("/api/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {
        "email": user.get("sub"),
        "name": user.get("name", "Dr. Sarah Chen"),
        "role": user.get("role", "Doctor"),
        "specialty": "Chief of Neurology",
        "institution": "St. Jude Medical Center"
    }

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
