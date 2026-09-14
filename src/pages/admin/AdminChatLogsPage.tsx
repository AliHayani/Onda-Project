import React, { useEffect, useState } from 'react';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface ChatUser {
  id: number;
  username: string;
  email: string;
  total_messages: number;
  last_message_at: string;
}

interface ChatMessage {
  id: number;
  utilisateur: number;
  contenu_message: string;
  reponse_bot: string;
  date_envoi: string;
  session_title?: string;
}

const initials = (username: string) => username.slice(0, 2).toUpperCase();

const relativeTime = (value: string) => {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
};

const formatTimestamp = (value: string) => new Date(value).toLocaleString(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const AdminChatLogsPage: React.FC = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiFetch('/api/admin/chat-users/');
        setUsers(await readJsonResponse<ChatUser[]>(response));
      } catch {
        setError('Unable to load chatbot users.');
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const selectUser = async (userId: number) => {
    setSelectedUserId(userId);
    setLoadingMessages(true);
    setError('');
    try {
      const response = await apiFetch(`/api/admin/chat-logs/?user_id=${userId}`);
      const data = await readJsonResponse<ChatMessage[]>(response);
      setMessages(data.sort((a, b) => new Date(a.date_envoi).getTime() - new Date(b.date_envoi).getTime()));
    } catch {
      setMessages([]);
      setError('Unable to load this user’s chat logs.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectedUser = users.find((user) => user.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Governance</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Chat logs</h1>
        <p className="mt-1 text-sm text-slate-600">Select a chatbot user to inspect their complete conversation history.</p>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Chatbot users</h2>
            <p className="mt-1 text-xs text-slate-500">{users.length} active users</p>
          </div>
          <div className="max-h-[34rem] overflow-y-auto p-3">
            {loadingUsers ? <p className="p-3 text-sm text-slate-500">Loading users...</p> : users.length === 0 ? <p className="p-3 text-sm text-slate-500">No chatbot users yet.</p> : users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectUser(user.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl border-l-4 p-3 text-left transition ${selectedUserId === user.id ? 'border-blue-600 bg-blue-50/70 text-slate-900 shadow-sm' : 'border-transparent text-slate-800 hover:bg-white hover:shadow-sm'}`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${selectedUserId === user.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>{initials(user.username)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{user.username}</span>
                  <span className={`mt-1 block text-xs ${selectedUserId === user.id ? 'text-slate-300' : 'text-slate-500'}`}>{user.total_messages} messages · {relativeTime(user.last_message_at)}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-slate-50/60">
          {!selectedUser ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-2xl text-blue-700">⌁</div>
              <h2 className="mt-5 text-lg font-semibold text-slate-950">Select a chatbot user</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Select a user from the list to review their chatbot interactions.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 bg-white px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{initials(selectedUser.username)}</span>
                  <div>
                    <h2 className="font-semibold text-slate-950">{selectedUser.username}</h2>
                    <p className="text-xs text-slate-500">{selectedUser.email || 'No email provided'} · {selectedUser.total_messages} messages</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {loadingMessages ? <p className="text-sm text-slate-500">Loading conversation...</p> : messages.length === 0 ? <p className="text-sm text-slate-500">No messages found for this user.</p> : messages.map((message) => (
                  <div key={message.id} className="flex flex-col gap-3">
                    <div className="max-w-[75%] self-end rounded-2xl rounded-br-none bg-slate-800 px-4 py-3 text-white shadow-sm">
                      <p className="text-sm leading-6">{message.contenu_message}</p>
                      <p className="mt-2 text-xs text-white/60">{formatTimestamp(message.date_envoi)}</p>
                    </div>
                    <div className="max-w-[75%] self-start rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-700">Assistant</p>
                      <p className="text-sm leading-6 text-slate-700">{message.reponse_bot}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatTimestamp(message.date_envoi)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminChatLogsPage;
