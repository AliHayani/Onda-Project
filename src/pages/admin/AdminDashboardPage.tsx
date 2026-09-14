import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, readJsonResponse } from '../../lib/api';
import { getCategoryLabel, getProcedureStatusLabel, ProcedureRecord } from '../../features/procedures/rbac';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface DocumentRecord {
  id: number;
}

const normalizeStatus = (value?: string) => (value || '').trim().toLowerCase();

const AdminDashboardPage: React.FC = () => {
  const [procedures, setProcedures] = useState<ProcedureRecord[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const [proceduresResponse, usersResponse, documentsResponse] = await Promise.all([
          apiFetch('/api/procedures/'),
          apiFetch('/api/utilisateurs/'),
          apiFetch('/api/documents/'),
        ]);
        const [procedureData, userData, documentData] = await Promise.all([
          readJsonResponse<ProcedureRecord[]>(proceduresResponse),
          readJsonResponse<AdminUser[]>(usersResponse),
          readJsonResponse<DocumentRecord[]>(documentsResponse),
        ]);
        setProcedures(Array.isArray(procedureData) ? procedureData : []);
        setUsers(Array.isArray(userData) ? userData : []);
        setDocumentCount(Array.isArray(documentData) ? documentData.length : 0);
      } catch {
        setError('Unable to load the admin overview.');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const pendingDrafts = useMemo(
    () => procedures.filter((procedure) => normalizeStatus(procedure.statut) === 'brouillon'),
    [procedures]
  );
  const publishedCount = procedures.filter((procedure) => normalizeStatus(procedure.statut) === 'validé').length;
  const rejectedCount = procedures.filter((procedure) => normalizeStatus(procedure.statut) === 'refusé').length;
  const totalProcedures = procedures.length;
  const chartTotal = Math.max(totalProcedures, 1);
  const activityBars = [
    { label: 'Validated', value: publishedCount, color: 'bg-emerald-500' },
    { label: 'Draft', value: pendingDrafts.length, color: 'bg-amber-400' },
    { label: 'Refused', value: rejectedCount, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">System oversight</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Admin dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Monitor governance, approvals, and platform activity.</p>
        </div>
        <Link to="/admin/procedures" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900">
          Review queue
        </Link>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending validations</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{loading ? '—' : pendingDrafts.length}</p>
          <p className="mt-1 text-sm text-amber-800">Drafts awaiting review</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total users</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{loading ? '—' : users.length}</p>
          <p className="mt-1 text-sm text-slate-500">Registered accounts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published procedures</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{loading ? '—' : publishedCount}</p>
          <p className="mt-1 text-sm text-slate-500">Validated and visible</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">System documents</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{loading ? '—' : documentCount}</p>
          <p className="mt-1 text-sm text-slate-500">Files across procedures</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-950">Action required: pending drafts</h3>
              <p className="mt-1 text-xs text-slate-500">Submissions waiting for an administrator decision.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{pendingDrafts.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Procedure name</th>
                  <th className="px-5 py-3 font-semibold">Author</th>
                  <th className="px-5 py-3 font-semibold">Submission date</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDrafts.slice(0, 6).map((procedure) => (
                  <tr key={procedure.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">{procedure.titre}</td>
                    <td className="px-5 py-4 text-slate-600">{procedure.createur_username || 'Unknown author'}</td>
                    <td className="px-5 py-4 text-slate-500">{procedure.date_creation ? new Date(procedure.date_creation).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/procedures/${procedure.id}`} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900">Review</Link>
                    </td>
                  </tr>
                ))}
                {!loading && pendingDrafts.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">No pending drafts.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="font-semibold text-slate-950">Platform activity</h3>
            <p className="mt-1 text-xs text-slate-500">Current procedure status distribution.</p>
          </div>
          <div className="mt-6 space-y-5">
            {activityBars.map((bar) => (
              <div key={bar.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{bar.label}</span>
                  <span className="text-slate-500">{bar.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${Math.max((bar.value / chartTotal) * 100, bar.value ? 8 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>{totalProcedures} total procedures</span>
            <Link to="/admin/procedures" className="font-semibold text-blue-700 hover:text-blue-900">Open management</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
