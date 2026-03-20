'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function PatientDashboard() {
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
            👤 Patient Dashboard - MotionGuard AI
          </h1>
          <div className="flex gap-4">
            <Link
              href="/patient/profile"
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
            Welcome to Your Health Dashboard
          </h2>
          <p className="text-gray-600">
            Monitor your health metrics, view alerts, and stay connected with your doctor
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Metrics Cards */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Health Status
            </h3>
            <p className="text-2xl font-bold text-green-600">Good</p>
            <p className="text-xs text-gray-500 mt-2">No active alerts</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Heart Rate
            </h3>
            <p className="text-3xl font-bold text-blue-600">72</p>
            <p className="text-xs text-gray-500 mt-2">bpm - Normal</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Activity Level
            </h3>
            <p className="text-2xl font-bold text-purple-600">Moderate</p>
            <p className="text-xs text-gray-500 mt-2">Today's activity</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Stability Score
            </h3>
            <p className="text-3xl font-bold text-orange-600">85%</p>
            <p className="text-xs text-gray-500 mt-2">Low risk</p>
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
                href="/patient/profile"
                className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-900 font-medium transition-colors"
              >
                👤 View My Profile
              </Link>
              <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-900 font-medium transition-colors">
                📞 Contact My Doctor
              </button>
              <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-900 font-medium transition-colors">
                📊 View Health Metrics
              </button>
              <button className="w-full text-left p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-900 font-medium transition-colors">
                🏥 Medical Records
              </button>
            </div>
          </div>

          {/* Health Tips */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Health Tips
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 mb-2">💡 Tip #1</p>
                <p className="text-sm text-blue-800">
                  Stay hydrated throughout the day
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold text-green-900 mb-2">💡 Tip #2</p>
                <p className="text-sm text-green-800">
                  Regular exercise improves stability
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="font-semibold text-purple-900 mb-2">
                  💡 Coming Soon
                </p>
                <p className="text-sm text-purple-800">
                  More features being added soon!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
