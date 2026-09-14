import React, { useEffect, useState } from 'react';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface NotificationRecord {
  id: number;
  titre: string;
  message: string;
  lue: boolean;
  date_creation: string;
}

const DashboardPage: React.FC = () => {
  const [procedureCount, setProcedureCount] = useState<number | null>(null);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [error, setError] = useState('');

  const dismissNotification = async (notification: NotificationRecord) => {
    try {
      const response = await apiFetch(`/api/notifications/${notification.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ lue: true }),
      });
      if (!response.ok) {
        throw new Error('Unable to dismiss notification');
      }
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    } catch {
      setError('Unable to dismiss this notification.');
    }
  };

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

        const notificationsResponse = await apiFetch('/api/notifications/', { method: 'GET' });
        const notificationData = await readJsonResponse<NotificationRecord[]>(notificationsResponse);
        setNotifications(Array.isArray(notificationData) ? notificationData : []);
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

      {notifications.length > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-rose-950">Notifications</h2>
            <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
              {notifications.filter((notification) => !notification.lue).length} new
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{notification.titre}</p>
                  <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(notification.date_creation).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(notification)}
                  className="notification-dismiss-button"
                  aria-label="Dismiss notification"
                  title="Dismiss notification"
                >
                  &#10003;
                </button>
              </div>
            ))}
          </div>
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
