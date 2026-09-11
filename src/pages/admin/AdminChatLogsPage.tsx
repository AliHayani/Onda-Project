import React, { useEffect, useState } from 'react';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface ChatMessage {
  id: number;
  utilisateur: number;
  contenu_message: string;
  reponse_bot: string;
  date_envoi: string;
}

const AdminChatLogsPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMessages = async () => {
      setError('');
      setLoading(true);

      try {
        const response = await apiFetch('/api/messages-chat/', { method: 'GET' });
        const data = await readJsonResponse<ChatMessage[]>(response);
        const sorted = data.slice().sort((a, b) => new Date(b.date_envoi).getTime() - new Date(a.date_envoi).getTime());
        setMessages(sorted);
      } catch (err) {
        setError('Unable to load chat logs.');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin chat logs</h1>
        <p className="mt-2 text-sm text-slate-600">Inspect conversation history and compliance metadata.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-600">Loading chat logs…</p>
        ) : error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-600">No chat logs available yet.</p>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <div key={message.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">User ID: {message.utilisateur}</p>
                <p className="mt-1 text-sm text-slate-600">Sent: {new Date(message.date_envoi).toLocaleString()}</p>
                <p className="mt-3 text-sm text-slate-800">Q: {message.contenu_message}</p>
                <p className="mt-2 text-sm text-slate-500">A: {message.reponse_bot}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatLogsPage;
