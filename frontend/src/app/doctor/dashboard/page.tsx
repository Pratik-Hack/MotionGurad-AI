'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DoctorDashboard() {
  const router = useRouter();
  const { getToken, logout } = useAuth();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            👨‍⚕️ Doctor Dashboard - MotionGuard AI
          </h1>
          <div className="flex gap-4">
            <Link
              href="/doctor/profile"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              My Profile
            </Link>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Your Dashboard
          </h2>
          <p className="text-gray-600">
            Manage your patients, view analytics, and monitor health metrics in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Total Patients
            </h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-xs text-gray-500 mt-2">Active monitoring</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Alerts Today
            </h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-xs text-gray-500 mt-2">Critical events</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Pending Tasks
            </h3>
            <p className="text-3xl font-bold text-yellow-600">3</p>
            <p className="text-xs text-gray-500 mt-2">Reviews needed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Messages
            </h3>
            <p className="text-3xl font-bold text-purple-600">2</p>
            <p className="text-xs text-gray-500 mt-2">Unread</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/doctor/profile"
                className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-900 font-medium transition-colors"
              >
                👤 View My Profile
              </Link>
              <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-900 font-medium transition-colors">
                ➕ Add New Patient
              </button>
              <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-900 font-medium transition-colors">
                📊 View Analytics
              </button>
              <button className="w-full text-left p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-900 font-medium transition-colors">
                📋 Patient Reports
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Coming Soon
            </h3>
            <div className="space-y-4 text-gray-600 text-sm">
              <p>
                More features including patient management, real-time monitoring,
                and advanced analytics are coming soon!
              </p>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 mb-2">📌 Tip</p>
                <p className="text-blue-800">
                  Complete your profile first to get started
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
