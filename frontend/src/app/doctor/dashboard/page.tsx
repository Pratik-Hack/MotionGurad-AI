'use client';
import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function DoctorDashboard() {
  return (
    <DashboardLayout
      headerProps={{
        breadcrumbs: [{ label: 'Doctor' }, { label: 'Dashboard' }],
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage patients, monitor telemetry, and review risk insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Patients</p>
          <p className="text-3xl font-bold text-gray-900">12</p>
          <p className="text-xs text-green-600 mt-1">+2 this week</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Critical Alerts</p>
          <p className="text-3xl font-bold text-gray-900">3</p>
          <p className="text-xs text-red-600 mt-1">Needs attention</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Avg Stability</p>
          <p className="text-3xl font-bold text-gray-900">88%</p>
          <p className="text-xs text-green-600 mt-1">Improving trend</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending Reviews</p>
          <p className="text-3xl font-bold text-gray-900">5</p>
          <p className="text-xs text-yellow-600 mt-1">Follow-up required</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/doctor/profile" className="px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition-colors">👤 My Profile</Link>
            <Link href="/live-monitor" className="px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-900 font-medium transition-colors">📡 Live Monitoring</Link>
            <Link href="/analytics" className="px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium transition-colors">📊 Analytics</Link>
            <Link href="/alerts" className="px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 font-medium transition-colors">🚨 Alerts</Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Today Overview</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• 2 fall-risk warnings generated</p>
            <p>• 4 medication adherence reminders sent</p>
            <p>• 1 patient needs immediate callback</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
