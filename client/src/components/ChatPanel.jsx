import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import '../styles/ChatPanel.css';

export default function ChatPanel({ messages, onSend, onClose, senderName }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text, senderName);
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>In-call messages</h3>
        <button className="chat-close-btn" onClick={onClose} title="Close chat">
          <X size={18} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Messages can only be seen by people in the call and are deleted when the call ends.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.isLocal ? 'local' : 'remote'}`}>
            <div className="msg-meta">
              <span className="msg-sender">{msg.isLocal ? 'You' : msg.senderName}</span>
              <span className="msg-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="msg-text">{msg.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Send a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          autoComplete="off"
        />
        <button type="submit" className="chat-send-btn" disabled={!text.trim()} title="Send">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
