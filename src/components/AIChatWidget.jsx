'use client';

import { useEffect, useRef, useState } from 'react';
import './AIChatWidget.css';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_AI_CHAT_API_URL || '/api/ai/chat';

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào, tôi có thể kiểm tra tồn kho, size còn hàng và gợi ý size theo chiều dài chân.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const response = await fetch(DEFAULT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'AI không phản hồi.');
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || 'Tôi chưa tìm thấy câu trả lời phù hợp.'
        }
      ]);
    } catch (err) {
      setError(err.message || 'Lỗi kết nối AI.');
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
      <button className="ai-chat-fab" type="button" onClick={() => setOpen(v => !v)}>
        AI
      </button>

      {open && (
        <div className="ai-chat-panel" role="dialog" aria-label="AI tư vấn khách hàng">
          <div className="ai-chat-header">
            <div>
              <div className="ai-chat-kicker">AI Advisor</div>
              <h3>Tư vấn khách hàng</h3>
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
            {loading && <div className="ai-chat-message assistant">Đang tra cứu CSDL...</div>}
            <div ref={bottomRef} />
          </div>

          {error && <div className="ai-chat-error">{error}</div>}

          <div className="ai-chat-input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ví dụ: sản phẩm này còn size 40 không?"
              rows={2}
            />
            <button type="button" onClick={sendMessage} disabled={loading}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
