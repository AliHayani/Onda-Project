import React, { useEffect, useState } from 'react';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface ChatMessage {
  id: number;
  contenu_message: string;
  reponse_bot: string;
  date_envoi: string;
}

const ChatHistoryPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setError('');
      setLoading(true);

      try {
        const response = await apiFetch('/api/chat/', { method: 'GET' });
        const data = await readJsonResponse<ChatMessage[]>(response);
        const sorted = data.slice().sort((a, b) => new Date(b.date_envoi).getTime() - new Date(a.date_envoi).getTime());
        setMessages(sorted);
      } catch (err) {
        setError('Unable to load chat history.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Chat history</h1>
        <p className="mt-2 text-sm text-slate-600">Review your recent conversations with the assistant.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-600">Loading your chat history…</p>
        ) : error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-600">No chat history yet. Start a conversation in the assistant to save your messages.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(message.date_envoi).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="mt-2 text-sm text-slate-600">Q: {message.contenu_message}</p>
                <p className="mt-2 text-sm text-slate-500">A: {message.reponse_bot}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryPage;
