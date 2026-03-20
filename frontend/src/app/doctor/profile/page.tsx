'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DoctorProfile } from '@/hooks/useAuth';
import Link from 'next/link';

export default function DoctorProfilePage() {
  const router = useRouter();
  const { user, getToken, fetchWithAuth, logout } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    institution: '',
    phone: '',
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchDoctorProfile();
    fetchPatients();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name,
        specialty: data.specialty,
        institution: data.institution || '',
        phone: data.phone || '',
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) return;

      const response = await fetchWithAuth(`/api/doctor/${user.id}/patients`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchWithAuth('/api/auth/doctor/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load profile</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {profile.name.charAt(0)}
            </div>
            <h1 className="text-xl font-bold text-gray-900">MotionGuard AI - Doctor</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/doctor/dashboard"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Dashboard
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
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Professional Profile</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    editing
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {/* Profile Avatar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-gray-600">{profile.specialty}</p>
                  <p className="text-sm text-gray-500">License: {profile.license_number}</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialty
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.specialty}
                        onChange={(e) =>
                          setFormData({ ...formData, specialty: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.specialty}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            institution: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.institution || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone || 'N/A'}</p>
                  )}
                </div>

                {editing && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Assigned Patients</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {profile.patients_count || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-lg font-semibold text-green-600">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patients Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Assigned Patients ({patients.length})
          </h2>

          {patients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No patients assigned yet</p>
              <p className="text-sm text-gray-400">
                Patients will appear here once they are assigned to you
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {patient.name}
                      </h4>
                      <p className="text-sm text-gray-500">Age {patient.age}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      <strong>Email:</strong> {patient.email}
                    </p>
                    {patient.medical_conditions?.length > 0 && (
                      <p className="text-gray-600">
                        <strong>Conditions:</strong>{' '}
                        {patient.medical_conditions.join(', ')}
                      </p>
                    )}
                    {patient.phone && (
                      <p className="text-gray-600">
                        <strong>Phone:</strong> {patient.phone}
                      </p>
                    )}
                  </div>
                  <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                    View Patient Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
