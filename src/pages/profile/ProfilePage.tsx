import React, { useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { apiFetch, readJsonResponse } from '../../lib/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'User';
  const displayRole = user?.role === 'admin' || user?.isStaff ? 'Administrator' : 'Standard user';
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleResetPassword = async () => {
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }

    if (!user) {
      setError('Unable to reset password. Please sign in and try again.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiFetch(`/api/utilisateurs/${user.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      });
      await readJsonResponse(response);
      setMessage('Your password has been updated successfully.');
      setShowResetForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Unable to reset your password. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
            <p className="mt-2 text-sm text-slate-600">View and update your account details.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Account information</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-800">Name</p>
              <p className="mt-1">{displayName}</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Email</p>
              <p className="mt-1">{user?.email || 'No email available'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Role</p>
              <p className="mt-1">{displayRole}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Security</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-800">Password</p>
              <p className="mt-1">••••••••</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Password management</p>
              <p className="mt-1">Use the form below to reset your password while logged in. You do not need to provide your current password.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetForm((current) => !current)}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {showResetForm ? 'Cancel password reset' : 'Reset password'}
            </button>

            {showResetForm && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-800">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Enter a new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Confirm your new password"
                  />
                </div>
                {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Updating password…' : 'Update password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
