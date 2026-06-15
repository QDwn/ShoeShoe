'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './AIChatWidget.css';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_AI_CHAT_API_URL || '/api/ai/chat';

export default function AIChatWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('aiChat.greeting'),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: t('aiChat.greeting') }]);
  }, [t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const response = await fetch(DEFAULT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || t('aiChat.noReply'));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || t('aiChat.noResponse'),
        },
      ]);
    } catch (err) {
      setError(err.message || t('aiChat.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button className="ai-chat-fab" type="button" onClick={() => setOpen((v) => !v)}>
        AI
      </button>

      {open && (
        <div className="ai-chat-panel" role="dialog" aria-label={t('aiChat.panelLabel')}>
          <div className="ai-chat-header">
            <div>
              <div className="ai-chat-kicker">{t('aiChat.kicker')}</div>
              <h3>{t('aiChat.title')}</h3>
            </div>
            <button type="button" className="ai-chat-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="ai-chat-message assistant">{t('aiChat.loading')}</div>}
            <div ref={bottomRef} />
          </div>

          {error && <div className="ai-chat-error">{error}</div>}

          <div className="ai-chat-input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t('aiChat.placeholder')}
              rows={2}
            />
            <button type="button" onClick={sendMessage} disabled={loading}>
              {t('aiChat.send')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
