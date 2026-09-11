import React, { useEffect, useState } from 'react';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  service?: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formState, setFormState] = useState({
    username: '',
    email: '',
    role: 'user',
    service: '',
    is_active: true,
    password: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await apiFetch('/api/utilisateurs/', { method: 'GET' });
      const data = await readJsonResponse<AdminUser[]>(response);
      setUsers(data);
    } catch (err) {
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setFormState({
      username: user.username,
      email: user.email,
      role: user.role || (user.is_staff ? 'admin' : 'user'),
      service: user.service || '',
      is_active: user.is_active,
      password: '',
    });
    setSuccessMessage('');
    setError('');
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete user ${user.username}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiFetch(`/api/utilisateurs/${user.id}/`, { method: 'DELETE' });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
    } catch (err) {
      setError('Unable to delete the user.');
    }
  };

  const handleSave = async () => {
    if (!selectedUser) {
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const payload: any = {
        username: formState.username,
        email: formState.email,
        role: formState.role,
        service: formState.service,
        is_active: formState.is_active,
      };

      if (formState.password) {
        payload.password = formState.password;
      }

      const response = await apiFetch(`/api/utilisateurs/${selectedUser.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const updatedUser = await readJsonResponse<AdminUser>(response);
      setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
      setSelectedUser(updatedUser);
      setFormState((current) => ({ ...current, password: '' }));
      setSuccessMessage('User updated successfully.');
    } catch (err) {
      setError('Unable to update the user.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin user management</h1>
            <p className="mt-2 text-sm text-slate-600">View, modify, or delete user accounts and manage administrative roles.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-600">Loading users…</p>
          ) : error ? (
            <p className="text-sm text-rose-700">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-600">No users found.</p>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <div key={user.id} className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.username}</p>
                      <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                        {user.role || (user.is_staff ? 'admin' : 'user')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                      <p className="mt-1 text-sm text-slate-700">{user.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Service</p>
                      <p className="mt-1 text-sm text-slate-700">{user.service || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Joined</p>
                      <p className="mt-1 text-sm text-slate-700">{new Date(user.date_joined).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Selected user</h2>
          {!selectedUser ? (
            <p className="mt-4 text-sm text-slate-600">Select a user to edit their profile, role, and account status.</p>
          ) : (
            <div className="space-y-4 pt-4 text-sm text-slate-600">
              {successMessage && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-800">Username</label>
                <input
                  type="text"
                  value={formState.username}
                  onChange={(event) => setFormState({ ...formState, username: event.target.value })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Email</label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Role</label>
                <select
                  value={formState.role}
                  onChange={(event) => setFormState({ ...formState, role: event.target.value })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Service</label>
                <input
                  type="text"
                  value={formState.service}
                  onChange={(event) => setFormState({ ...formState, service: event.target.value })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={formState.is_active}
                    onChange={(event) => setFormState({ ...formState, is_active: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                  />
                  Account active
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">New password</label>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(event) => setFormState({ ...formState, password: event.target.value })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Saving changes…' : 'Save changes'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminUsersPage;
