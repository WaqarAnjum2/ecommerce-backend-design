import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Save, Edit2, ShieldAlert } from 'lucide-react';

const Profile = ({ setPage, onAuthRequired }) => {
  const { user, profile, refetchProfile, signOut, getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      onAuthRequired();
      setPage('home');
      return;
    }
    if (profile) {
      setFullName(profile.fullName || '');
    }
  }, [user, profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await refetchProfile();
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setPage('home');
  };

  if (!user || !profile) {
    return (
      <div className="container py-8 text-center">
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  const initials = (profile.fullName || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="container py-8">
      <div className="bg-white border border-[#DEE2E7] rounded-lg p-8 shadow-sm max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#DEE2E7]">
          <div className="w-24 h-24 rounded-full bg-[#E3F0FF] flex items-center justify-center text-primary text-3xl font-bold">
            {initials}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-[#1C1C1C]">{profile.fullName || 'User'}</h2>
            <p className="text-[#8B96A5]">{profile.email}</p>
            {profile.isAdmin && (
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-200 mt-1">
                <ShieldAlert size={12} />
                Administrator
              </span>
            )}
          </div>
        </div>

        {message && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">{message}</div>}
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

        <div className="space-y-4">
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#505050] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#00B517] hover:bg-[#00A015] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition disabled:bg-gray-400"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="border border-[#DEE2E7] hover:bg-shade text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full text-left p-4 border border-[#DEE2E7] rounded-lg hover:bg-shade transition-colors flex justify-between items-center"
            >
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <Edit2 size={18} className="text-[#8B96A5]" />
                Edit Profile Name
              </span>
              <span className="text-[#8B96A5]">→</span>
            </button>
          )}

          <button
            onClick={() => setPage('orders')}
            className="w-full text-left p-4 border border-[#DEE2E7] rounded-lg hover:bg-shade transition-colors flex justify-between items-center"
          >
            <span className="font-medium text-gray-700">Order History</span>
            <span className="text-[#8B96A5]">→</span>
          </button>

          {profile.isAdmin && (
            <button
              onClick={() => setPage('admin')}
              className="w-full text-left p-4 border border-red-200 bg-red-50/30 hover:bg-red-50/60 rounded-lg transition-colors flex justify-between items-center"
            >
              <span className="font-semibold text-red-700">Go to Admin Portal</span>
              <span className="text-red-400">→</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full text-left p-4 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors flex justify-between items-center"
          >
            <span className="flex items-center gap-2 font-medium">
              <LogOut size={18} />
              Sign Out
            </span>
            <span className="text-red-400">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
