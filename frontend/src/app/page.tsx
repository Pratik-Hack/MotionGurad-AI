'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        // Redirect to appropriate dashboard
        if (userData.role === 'Doctor') {
          router.push('/doctor/dashboard');
        } else if (userData.role === 'Patient') {
          router.push('/patient/dashboard');
        }
      } catch (err) {
        // Invalid user data, go to login
        router.push('/auth/login');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
                MG
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MotionGuard AI</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            AI-Powered Real-Time
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Motion Monitoring
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Detect motion instability and fall risks in real-time using advanced AI algorithms.
            Designed for doctors to monitor patients and patients to track their health.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Doctors</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Monitor multiple patients</li>
              <li>✓ Real-time health alerts</li>
              <li>✓ Comprehensive analytics</li>
              <li>✓ Patient management tools</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Patients</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Track your health metrics</li>
              <li>✓ Get safety alerts</li>
              <li>✓ Connect with your doctor</li>
              <li>✓ View health records</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Advanced ML algorithms</li>
              <li>✓ Real-time predictions</li>
              <li>✓ Wearable integration</li>
              <li>✓ Instant notifications</li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-lg p-12 my-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Register Account</h4>
              <p className="text-gray-600">Create an account as a doctor or patient</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Setup Profile</h4>
              <p className="text-gray-600">Complete your profile information</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Connect Devices</h4>
              <p className="text-gray-600">Pair your wearable devices</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Get Monitored</h4>
              <p className="text-gray-600">Start receiving health insights</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of healthcare providers and patients using MotionGuard AI
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 mb-2">
            &copy; 2024 MotionGuard AI. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Designed for real-time motion instability prediction
          </p>
        </div>
      </footer>
    </div>
  );
}
