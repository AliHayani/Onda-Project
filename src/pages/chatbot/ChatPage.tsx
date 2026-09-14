import React, { useEffect, useRef, useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { apiFetch, readJsonResponse } from '../../lib/api';

interface ChatMessage {
  id: number;
  utilisateur: number;
  session_id?: number | null;
  session_title?: string | null;
  contenu_message: string;
  reponse_bot: string;
  date_envoi: string;
}

interface ChatSession {
  id: number;
  session_title: string;
  date_creation: string;
  date_modification: string;
  latest_message: string;
  latest_message_date: string;
  message_count: number;
}

const formatSessionDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Conversation';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatMessageTime = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sessionRequestRef = useRef(0);
  const [inputValue, setInputValue] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<ChatSession | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [error, setError] = useState('');

  const fetchMessages = async (sessionId: number) => {
    const requestId = ++sessionRequestRef.current;
    setError('');
    const response = await apiFetch(`/api/chat/?session_id=${encodeURIComponent(sessionId)}`, { method: 'GET' });
    const data = await readJsonResponse<ChatMessage[]>(response);
    const sorted = [...data].sort(
      (a, b) => new Date(a.date_envoi).getTime() - new Date(b.date_envoi).getTime()
    );
    if (requestId === sessionRequestRef.current) {
      setCurrentMessages(sorted);
    }
    return sorted;
  };

  const fetchSessions = async () => {
    const response = await apiFetch('/api/chat/sessions/', { method: 'GET' });
    return readJsonResponse<ChatSession[]>(response);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const loadInitialSession = async () => {
      setError('');
      try {
        const loadedSessions = await fetchSessions();

        if (cancelled) {
          return;
        }

        setSessions(loadedSessions);

        if (!loadedSessions.length) {
          setActiveSessionId(null);
          setCurrentMessages([]);
          return;
        }

        const latestSessionId = loadedSessions[0].id;
        setActiveSessionId(latestSessionId);
        setSessionLoading(true);
        await fetchMessages(latestSessionId);
      } catch {
        if (!cancelled) {
          setError('Unable to load chat history.');
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    };

    loadInitialSession();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const visibleMessages = currentMessages;

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }, [visibleMessages.length, activeSessionId]);

  const handleNewChat = () => {
    setInputValue('');
    setError('');
    setActiveSessionId(null);
    setCurrentMessages([]);
  };

  const handleSelectSession = async (session: ChatSession) => {
    setActiveSessionId(session.id);
    setError('');
    setCurrentMessages([]);
    setSessionLoading(true);
    try {
      await fetchMessages(session.id);
    } catch {
      setError('Unable to load this conversation.');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleDeleteSession = async (session: ChatSession) => {
    setError('');
    setDeleteCandidate(session);
  };

  const confirmDeleteSession = async () => {
    if (!deleteCandidate) {
      return;
    }

    const session = deleteCandidate;
    setDeletingSession(true);
    try {
      const response = await apiFetch(`/api/chat/sessions/${session.id}/`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Delete request failed');
      }
      const remainingSessions = sessions.filter((item) => item.id !== session.id);
      setSessions(remainingSessions);

      if (activeSessionId === session.id) {
        const nextSession = remainingSessions[0];
        if (nextSession) {
          await handleSelectSession(nextSession);
        } else {
          setActiveSessionId(null);
          setCurrentMessages([]);
        }
      }
      setDeleteCandidate(null);
    } catch {
      setError('Unable to delete this conversation.');
    } finally {
      setDeletingSession(false);
    }
  };

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
        body: JSON.stringify({
          contenu_message: trimmed,
          session_id: activeSessionId,
        }),
      });
      const data = await readJsonResponse<{
        reponse: string;
        session_id: number;
        session_title: string;
        date_creation: string;
        date_modification: string;
      }>(response);
      const newMessage: ChatMessage = {
        id: Date.now(),
        utilisateur: Number(user.id),
        session_id: data.session_id,
        session_title: data.session_title ?? 'New chat',
        contenu_message: trimmed,
        reponse_bot: data.reponse,
        date_envoi: new Date().toISOString(),
      };

      const nextSessionId = data.session_id ? String(data.session_id) : null;

      setCurrentMessages((current) => [...current, newMessage].sort(
        (a, b) => new Date(a.date_envoi).getTime() - new Date(b.date_envoi).getTime()
      ));
      setSessions((current) => {
        const existing = current.find((session) => session.id === data.session_id);
        const updated: ChatSession = {
          id: data.session_id,
          session_title: data.session_title,
          date_creation: data.date_creation,
          date_modification: data.date_modification,
          latest_message: trimmed,
          latest_message_date: newMessage.date_envoi,
          message_count: (existing?.message_count || 0) + 1,
        };
        return [updated, ...current.filter((session) => session.id !== data.session_id)];
      });
      setActiveSessionId(data.session_id);
      setInputValue('');
    } catch {
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
    <div className="support-shell">
      <div className="support-header">
        <div>
          <p className="support-eyebrow">Support</p>
          <h1>AI assistant</h1>
        </div>
        <button type="button" className="new-chat-button" onClick={handleNewChat}>+ New chat</button>
      </div>

      <div className="support-canvas">
        <aside className="support-sidebar">
          <div className="sidebar-header">
            <span>Previous sessions</span>
          </div>

          <div className="session-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${activeSessionId === session.id ? 'is-active' : ''}`}
              >
                <button
                  type="button"
                  className="session-select-button"
                  onClick={() => handleSelectSession(session)}
                >
                  <span className="session-name">{session.session_title}</span>
                </button>
                <button
                  type="button"
                  className="delete-session-button"
                  aria-label={`Delete ${session.session_title}`}
                  title="Delete conversation"
                  onClick={() => handleDeleteSession(session)}
                >
                  &#128465;
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="support-chat-panel">
          <div className="support-chat-header">
            <div>
              <h2>
                {activeSessionId === null
                  ? 'Recent conversations'
                  : sessions.find((session) => session.id === activeSessionId)
                    ? formatSessionDate(sessions.find((session) => session.id === activeSessionId)!.date_modification)
                    : 'Conversation'}
              </h2>
            </div>
          </div>

          <div ref={scrollRef} className="support-messages">
            {sessionLoading ? (
              <div className="empty-state"><p>Loading conversation...</p></div>
            ) : visibleMessages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration">✦</div>
                <p>No messages yet.</p>
                <span>Ask about procedures, documents, validation workflow, or account access.</span>
              </div>
            ) : (
              visibleMessages.map((message) => (
                <div key={message.id} className="message-row">
                  <div className="message-bubble is-user">
                    <div className="message-content">{message.contenu_message}</div>
                    <div className="message-time">{formatMessageTime(message.date_envoi)}</div>
                  </div>

                  <div className="message-bubble is-assistant is-response">
                    <div className="message-content">{message.reponse_bot}</div>
                    <div className="message-time">{formatMessageTime(message.date_envoi)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div className="support-error">{error}</div>
          )}

          <div className="support-input-wrap">
            <div className="support-input-shell">
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask the assistant..."
                className="support-textarea"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="send-button"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </main>
      </div>

      {deleteCandidate && (
        <div className="delete-modal-backdrop" role="presentation" onClick={() => !deletingSession && setDeleteCandidate(null)}>
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-modal-icon" aria-hidden="true">&#128465;</div>
            <h2 id="delete-modal-title">Delete conversation?</h2>
            <p>“{deleteCandidate.session_title}” will be permanently removed.</p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-button"
                onClick={() => setDeleteCandidate(null)}
                disabled={deletingSession}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDeleteSession}
                disabled={deletingSession}
              >
                {deletingSession ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
