import React, { useEffect, useState } from 'react';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface ChatMessage {
  id: number;
  contenu_message: string;
  reponse_bot: string;
  date_envoi: string;
}

const getDayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

const formatDay = (dayKey: string) => new Date(`${dayKey}T12:00:00`).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const ChatHistoryPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedDay, setSelectedDay] = useState('all');
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

  const availableDays = Array.from(new Set(messages.map((message) => getDayKey(message.date_envoi))))
    .sort((a, b) => b.localeCompare(a));
  const filteredMessages = selectedDay === 'all'
    ? messages
    : messages.filter((message) => getDayKey(message.date_envoi) === selectedDay);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Chat history</h1>
        <p className="mt-2 text-sm text-slate-600">Review your recent conversations with the assistant.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="history-day" className="text-sm font-semibold text-slate-900">View messages from</label>
          <select
            id="history-day"
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">All days</option>
            {availableDays.map((day) => (
              <option key={day} value={day}>{formatDay(day)}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-sm text-slate-600">Loading your chat history…</p>
        ) : error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-sm text-slate-600">No chat history yet. Start a conversation in the assistant to save your messages.</p>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
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
