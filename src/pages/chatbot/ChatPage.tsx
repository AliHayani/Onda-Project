import React, { useEffect, useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface ChatMessage {
  id: number;
  utilisateur: number;
  contenu_message: string;
  reponse_bot: string;
  date_envoi: string;
}

const ChatPage: React.FC = () => {
  const supportMessageLimit = 6;
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    setError('');
    try {
      const response = await apiFetch('/api/chat/', { method: 'GET' });
      const data = await readJsonResponse<ChatMessage[]>(response);
      const today = new Date();
      const todayMessages = data.filter((message) => {
        const sentAt = new Date(message.date_envoi);
        return sentAt.getFullYear() === today.getFullYear()
          && sentAt.getMonth() === today.getMonth()
          && sentAt.getDate() === today.getDate();
      });
      setMessages(todayMessages
        .sort((a, b) => new Date(a.date_envoi).getTime() - new Date(b.date_envoi).getTime())
        .slice(-supportMessageLimit));
    } catch (err) {
      setError('Unable to load chat history.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!user) {
      setError('Please log in to use the chat assistant.');
      return;
    }

    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/chat/', {
        method: 'POST',
        body: JSON.stringify({ contenu_message: trimmed }),
      });
      const data = await readJsonResponse<{ reponse: string }>(response);
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          utilisateur: Number(user.id),
          contenu_message: trimmed,
          reponse_bot: data.reponse,
          date_envoi: new Date().toISOString(),
        },
      ].slice(-supportMessageLimit));
      setInputValue('');
    } catch (err) {
      setError('Unable to send the message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Chat assistant</h1>
        <p className="mt-2 text-sm text-slate-600">Ask questions, search procedures, and get guided support from the bot.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Welcome back! Start a new chat session to explore procedure details, document status, or workflow guidance.</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet. Ask the bot a question to get started.</p>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-100 p-4">
                      <p className="text-sm font-semibold text-slate-900">You</p>
                      <p className="mt-1 text-sm text-slate-700">{message.contenu_message}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Assistant</p>
                      <p className="mt-1 text-sm text-slate-700">{message.reponse_bot}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <textarea
              rows={5}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              className="block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Ask the assistant about procedure next steps, compliance details, or document mapping..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
