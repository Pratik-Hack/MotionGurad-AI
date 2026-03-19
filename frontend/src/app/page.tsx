'use client';
import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { StatCard, RiskBadge, StabilityRing, SensorStatusCard } from '@/components/ui/Cards';
import { useTelemetry } from '@/hooks/useTelemetry';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';

export default function DashboardPage() {
  const { data, history, alerts, connected, sendCommand } = useTelemetry('8821');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'analysis',
      time: '09:12 AM',
      text: 'Patient shows increased hand tremors (+12%) following morning medication. Consider reviewing dosage timing.'
    },
    {
      role: 'prediction',
      time: '10:45 AM',
      text: 'Stability score trending downward. High risk of fall event if physical activity continues at current intensity.'
    }
  ]);

  // Rolling telemetry chart data (last 50 points)
  const chartData = useMemo(() => {
    const slice = history.slice(-60);
    return slice.map((d, i) => ({
      idx: i,
      tremor: Math.sqrt(d.accel_x ** 2 + d.accel_y ** 2 + d.accel_z ** 2),
      heartRate: d.heart_rate,
    }));
  }, [history]);

  // FFT data
  const fftData = useMemo(() => {
    if (!data?.fft_spectrum || !data?.fft_frequencies) return [];
    return data.fft_frequencies.map((f, i) => ({
      freq: f.toFixed(1),
      magnitude: data.fft_spectrum[i] || 0,
    })).slice(0, 12);
  }, [data]);

  // Heatmap data (simulated weekly)
  const heatmapData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 8 }, (_, i) => `${8 + i * 2}:00`);
    return days.map(day => ({
      day,
      hours: hours.map(h => ({
        hour: h,
        value: Math.random() * 100,
      }))
    }));
  }, []);

  const stabilityScore = data?.stability_score ?? 82;
  const riskLevel = data?.risk_level ?? 'MEDIUM';
  const heartRate = data?.heart_rate ?? 74;
  const motionIntensity = data?.motion_intensity ?? 2.4;
  const confidence = data?.fall_probability ? (100 - data.fall_probability) : 85;

  return (
    <DashboardLayout>
      {/* Top Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Stability Score */}
        <div className="glass-card p-5 flex items-center gap-4">
          <StabilityRing score={stabilityScore} size={72} change={`+5% vs`} />
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stability Score</p>
          </div>
        </div>

        {/* Risk Level */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Risk Level</p>
          <RiskBadge level={riskLevel} size="lg" animated />
          <div className="flex items-center gap-1 mt-3">
            <div className="w-2 h-8 rounded-full bg-yellow-400"></div>
            <div className="w-2 h-8 rounded-full bg-yellow-200"></div>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Heart Rate</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{heartRate}</span>
            <span className="text-sm text-gray-500">BPM</span>
          </div>
          <svg className="mt-2 w-full h-6" viewBox="0 0 120 24">
            <path
              d="M0,12 L20,12 L25,4 L30,20 L35,8 L40,16 L45,12 L120,12"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Motion Intensity */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Motion Intensity</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{motionIntensity.toFixed(1)}</span>
            <span className="text-sm text-gray-500">m/s²</span>
          </div>
          <p className="text-xs text-primary-500 font-medium mt-2">Within Normal Range</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Real-time Telemetry Chart */}
        <div className="col-span-8 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Real-time Telemetry</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500"></span> Tremor Intensity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Heart Rate
              </span>
            </div>
          </div>

          {/* Tremor Intensity Chart */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tremor Intensity (G)</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="idx" tick={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="tremor"
                  stroke="#137fec"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={0}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom: FFT + Sensor Status */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* FFT Spectrum */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Frequency Spectrum (FFT)</p>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fftData}>
                    <XAxis dataKey="freq" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <Bar dataKey="magnitude" radius={[3, 3, 0, 0]}>
                      {fftData.map((_, i) => (
                        <Cell key={i} fill={i === 3 || i === 4 ? '#137fec' : '#bfdbfe'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sensor Status */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sensor Status</p>
              <SensorStatusCard name="MPU6050 Accelerometer" status="Connected" latency="4.2ms" />
              <SensorStatusCard name="MAX30102 Heart Rate" status="Connected" latency="6.1ms" />
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs text-gray-500">
                  WebSocket: {connected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - AI Assistant */}
        <div className="col-span-4 space-y-4">
          {/* AI Health Assistant */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">AI Health Assistant</h3>
            </div>

            {chatMessages.map((msg, i) => (
              <div key={i} className="mb-4">
                <p className={`text-xs font-bold uppercase ${msg.role === 'analysis' ? 'text-primary-500' : 'text-red-500'}`}>
                  {msg.role === 'analysis' ? 'ANALYSIS' : 'PREDICTION'} - {msg.time}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{msg.text}</p>
              </div>
            ))}

            {/* Chat Input */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <input
                type="text"
                placeholder="Ask AI about patient health..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary-500"
              />
              <button className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white hover:bg-primary-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Alert History */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Alert History</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">Fall Risk Detected</p>
                  <p className="text-[10px] text-gray-500">Today, 08:34 AM • Notification Sent</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-primary-500 cursor-pointer">▶</span>
                    <span className="text-green-500 cursor-pointer">📞</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">Irregular Heart Rate</p>
                  <p className="text-[10px] text-gray-500">Yesterday, 11:20 AM • Logged</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact Button */}
            <button className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Emergency Contact
            </button>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="col-span-4 glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Weekly Stability Heatmap</h3>
          <div className="grid grid-cols-7 gap-1">
            {heatmapData.flatMap(day =>
              day.hours.map((h, i) => (
                <div
                  key={`${day.day}-${i}`}
                  className="h-5 rounded-sm"
                  style={{
                    backgroundColor: h.value > 70 ? '#22c55e' : h.value > 40 ? '#fbbf24' : '#ef4444',
                    opacity: 0.3 + (h.value / 100) * 0.7,
                  }}
                  title={`${day.day} ${h.hour}: ${Math.round(h.value)}%`}
                />
              ))
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic">Highest instability observed Tuesdays 2PM-4PM</p>
        </div>

        <div className="col-span-4 glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-500">⚡</span>
            <h3 className="text-sm font-semibold text-gray-900">AI Prediction (Next 5s)</h3>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Confidence</span>
              <span className="font-bold text-primary-500">{Math.round(confidence)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-xs text-red-700 font-medium">
              {data?.fall_probability && data.fall_probability > 30
                ? 'Potential gait disturbance detected. Suggested intervention: Rest.'
                : 'Motion patterns within normal parameters. Continue monitoring.'}
            </p>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="col-span-4 glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🎮 Demo Controls</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => sendCommand('simulate_fall')}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Simulate Fall
            </button>
            <button
              onClick={() => sendCommand('simulate_tremor')}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Simulate Tremor Spike
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
