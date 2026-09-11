import React, { useEffect, useState } from 'react';
import { apiFetch, readJsonResponse } from '../../lib/api';

const DashboardPage: React.FC = () => {
  const [procedureCount, setProcedureCount] = useState<number | null>(null);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCounts = async () => {
      setError('');
      try {
        const proceduresResponse = await apiFetch('/api/procedures/', { method: 'GET' });
        const procedures = await readJsonResponse<any[]>(proceduresResponse);
        const procedureList = Array.isArray(procedures) ? procedures : [];
        setProcedureCount(procedureList.length);
        setDraftCount(procedureList.filter((item) => item.statut === 'brouillon').length);
        setPublishedCount(procedureList.filter((item) => item.statut === 'validé').length);

        const documentsResponse = await apiFetch('/api/documents/', { method: 'GET' });
        const documents = await readJsonResponse<any[]>(documentsResponse);
        setDocumentCount(Array.isArray(documents) ? documents.length : 0);
      } catch (err) {
        setError('Unable to load dashboard summary.');
      }
    };

    loadCounts();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-600">Your current procedure and document totals are shown below.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-slate-500">Procedures</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {procedureCount !== null ? procedureCount : '—'}
          </p>
          <p className="mt-2 text-sm text-slate-600">Total procedures accessible to you.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-slate-500">Drafts</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {draftCount !== null ? draftCount : '—'}
          </p>
          <p className="mt-2 text-sm text-slate-600">Procedures currently in draft status.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-slate-500">Published</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {publishedCount !== null ? publishedCount : '—'}
          </p>
          <p className="mt-2 text-sm text-slate-600">Procedures that have been validated.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-slate-500">Documents</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {documentCount !== null ? documentCount : '—'}
          </p>
          <p className="mt-2 text-sm text-slate-600">Attachments linked to your procedures.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
