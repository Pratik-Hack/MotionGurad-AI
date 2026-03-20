'use client';
import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function PatientDashboard() {
  return (
    <DashboardLayout
      headerProps={{
        breadcrumbs: [{ label: 'Patient' }, { label: 'Dashboard' }],
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your health metrics, medication adherence, and safety alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Health Status</p>
          <p className="text-3xl font-bold text-gray-900">Good</p>
          <p className="text-xs text-green-600 mt-1">No critical alerts</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Heart Rate</p>
          <p className="text-3xl font-bold text-gray-900">72</p>
          <p className="text-xs text-blue-600 mt-1">bpm | normal</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stability Score</p>
          <p className="text-3xl font-bold text-gray-900">85%</p>
          <p className="text-xs text-green-600 mt-1">Low risk</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medication Adherence</p>
          <p className="text-3xl font-bold text-gray-900">96%</p>
          <p className="text-xs text-purple-600 mt-1">This week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/patient/profile" className="px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition-colors">👤 My Profile</Link>
            <Link href="/live-monitor" className="px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-900 font-medium transition-colors">📡 Live Monitoring</Link>
            <Link href="/analytics" className="px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium transition-colors">📊 Health Analytics</Link>
            <Link href="/medication" className="px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 font-medium transition-colors">💊 Medication</Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Health Tips</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Stay hydrated and log medication on time.</p>
            <p>• Do 20 minutes of guided movement daily.</p>
            <p>• Use alerts page to track risk notifications.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
