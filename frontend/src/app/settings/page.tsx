'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToggleSwitch } from '@/components/ui/Cards';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [darkMode, setDarkMode] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState('ADVANCED');

  const tabs = ['Profile', 'System Configuration', 'Workspace', 'User Management'];

  return (
    <DashboardLayout headerProps={{
      showSearch: true,
      breadcrumbs: undefined,
      doctorName: 'Dr. Sarah Chen',
      doctorRole: 'Neurologist',
    }}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your clinical profile, system configurations, and workspace preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-3 text-sm font-medium transition-colors relative',
              activeTab === tab
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="col-span-4 glass-card p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-lg">
                SC
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-3">Dr. Sarah Chen</h2>
            <p className="text-sm text-primary-500 font-medium">Chief of Neurology</p>
            <p className="text-xs text-gray-500">St. Jude Medical Center</p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
              <p className="text-gray-700 mt-0.5">s.chen@stjude.medical</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clinical ID</p>
              <p className="text-gray-700 mt-0.5">#MG-98233-CHEN</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timezone</p>
              <p className="text-gray-700 mt-0.5">Pacific Time (PT)</p>
            </div>
          </div>

          <button className="w-full mt-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Edit Details
          </button>
        </div>

        {/* Right Side */}
        <div className="col-span-8 space-y-6">
          {/* System Configuration */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span>⚙️</span>
              <h2 className="text-base font-bold text-gray-900">System Configuration</h2>
            </div>

            {/* AI Analysis Engine */}
            <div className="border border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">AI Analysis Engine</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">ACTIVE</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Configure connection to the MotionGuard processing core.</p>
              <div>
                <p className="text-xs text-gray-500 mb-1">API Endpoint Key</p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value="mg-api-key-xxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                  />
                  <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Device Pairing */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">Device Pairing</span>
                <button className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600">
                  Scan New Device
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm">⌚</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Patient-Watch-04</p>
                      <p className="text-[10px] text-gray-400">Wrist Sensor • ID: 4B22-X</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Signal: Good</span>
                    <span className="cursor-pointer text-primary-500">📡</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm">📡</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Room-Hub-Beta</p>
                      <p className="text-[10px] text-gray-400">Motion Sensor • ID: 9VE1-Y</p>
                    </div>
                  </div>
                  <button className="text-xs text-primary-500 font-medium hover:underline">Re-pair</button>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Settings */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span>🔧</span>
              <h2 className="text-base font-bold text-gray-900">Workspace Settings</h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                  <p className="text-xs text-gray-500">Adjust UI theme for clinical lighting environments.</p>
                </div>
                <ToggleSwitch enabled={darkMode} onChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Critical Alert Notifications</p>
                  <p className="text-xs text-gray-500">Instant push notifications for abnormal motion detection.</p>
                </div>
                <ToggleSwitch enabled={criticalAlerts} onChange={setCriticalAlerts} />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">Data Privacy Level</p>
                <div className="grid grid-cols-3 gap-3">
                  {['STANDARD', 'ADVANCED', 'STRICT'].map(level => (
                    <button
                      key={level}
                      onClick={() => setPrivacyLevel(level)}
                      className={cn(
                        'py-3 rounded-xl text-sm font-semibold transition-all border-2',
                        privacyLevel === level
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">
                          {level === 'STANDARD' ? '🔒' : level === 'ADVANCED' ? '✅' : '🛡️'}
                        </span>
                        {level}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span>👥</span>
                <h2 className="text-base font-bold text-gray-900">User Management</h2>
              </div>
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 flex items-center gap-1">
                <span className="text-sm">+</span> Invite Caregiver
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name & Role</th>
                  <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Access Level</th>
                  <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Kevin Lee', role: 'Head Nurse', access: 'Admin', status: 'Active', avatar: 'KL' },
                  { name: 'Maria Rodriguez', role: 'Patient Guardian (Family)', access: 'Viewer', status: 'Offline', avatar: 'MR' },
                  { name: 'James Doe', role: 'Caregiver', access: 'Viewer', status: 'Pending', avatar: 'JD' },
                ].map((user, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-[10px] text-gray-400">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-primary-500 text-[10px] font-bold rounded-md">
                        {user.access}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'flex items-center gap-1.5 text-xs font-medium',
                        user.status === 'Active' ? 'text-green-600' :
                          user.status === 'Offline' ? 'text-gray-400' : 'text-yellow-600'
                      )}>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          user.status === 'Active' ? 'bg-green-500' :
                            user.status === 'Offline' ? 'bg-gray-300' : 'bg-yellow-500'
                        )}></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {user.status !== 'Pending' ? (
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      ) : (
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* HIPAA Compliance */}
        <div className="col-span-4 glass-card p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
            <h3 className="text-sm font-bold text-primary-500">HIPAA Compliance</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your account is currently protected under MotionGuard Enterprise encryption. All patient data is anonymized during processing.
          </p>
          <button className="mt-3 text-xs text-primary-500 font-medium hover:underline">
            View Security Logs →
          </button>
        </div>

        {/* System Status */}
        <div className="col-span-8 flex justify-end">
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
              Save All Changes
            </button>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="mt-6 flex items-center gap-3 px-2">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> AI Engine Online</span>
            <span className="flex items-center gap-1 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 4 Wearables Syncing</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
