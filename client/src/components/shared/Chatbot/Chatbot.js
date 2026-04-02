// src/components/shared/Chatbot/Chatbot.js — Karabo AI Assistant
import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chatbot.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.i3wcarculture.com/api';

const WELCOME_MSG = {
  role: 'assistant',
  content: "Hi! I'm **Karabo**, your BW Car Culture assistant 🚗\n\nI can help you:\n• Find cars on the marketplace\n• Discover workshops, rentals & transport\n• Create a listing through chat\n• Navigate the site\n\nWhat can I do for you today?"
};

const QUICK_REPLIES = [
  'Show me cars under P200,000',
  'Find a workshop in Gaborone',
  'I want to sell my car',
  'Take me to the marketplace',
];

const formatPrice = (p) =>
  p != null ? `P${Number(p).toLocaleString()}` : 'Price on request';

// Render markdown-ish bold (**text**) and newlines
const renderText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j, arr) => (
      <Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </Fragment>
    ));
  });
};

const ListingCard = ({ listing, onNavigate }) => (
  <div className="kb-listing-card" onClick={() => onNavigate(`/marketplace/${listing.id}`)}>
    {listing.image && (
      <img src={listing.image} alt={listing.title} className="kb-listing-img" />
    )}
    <div className="kb-listing-info">
      <div className="kb-listing-title">{listing.title || `${listing.year} ${listing.make} ${listing.model}`}</div>
      <div className="kb-listing-price">{formatPrice(listing.price)}</div>
      <div className="kb-listing-meta">
        {listing.location} {listing.mileage ? `· ${Number(listing.mileage).toLocaleString()} km` : ''} {listing.condition ? `· ${listing.condition}` : ''}
      </div>
    </div>
  </div>
);

const ServiceCard = ({ service, onNavigate }) => (
  <div className="kb-service-card" onClick={() => onNavigate(`/services`)}>
    <div className="kb-service-name">{service.name}</div>
    <div className="kb-service-meta">
      {service.city}{service.verified ? ' · ✓ Verified' : ''}{service.rating ? ` · ⭐ ${service.rating.toFixed(1)}` : ''}
    </div>
    {service.phone && <div className="kb-service-phone">{service.phone}</div>}
  </div>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'feedback'
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [history, setHistory] = useState([]); // [{role,content}] sent to API
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ category: 'general', rating: 0, comment: '', email: '' });
  const [fbLoading, setFbLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  const appendMsg = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    appendMsg(userMsg);
    setInput('');
    setLoading(true);

    const newHistory = [...history, userMsg];

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory })
      });

      const data = await res.json();

      if (!data.success) throw new Error('API error');

      const assistantMsg = { role: 'assistant', content: data.reply };
      appendMsg(assistantMsg);
      setHistory([...newHistory, assistantMsg]);

      // Handle actions
      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          if (action.type === 'navigate') {
            // Small delay so user reads reply first
            setTimeout(() => navigate(action.path), 1200);
          } else if (action.type === 'prefill_listing') {
            localStorage.setItem('ai_listing_prefill', JSON.stringify(action.data));
            setTimeout(() => navigate('/marketplace?action=sell'), 1200);
          } else if (action.type === 'show_listings') {
            appendMsg({ role: 'listings', listings: action.listings });
          } else if (action.type === 'show_services') {
            appendMsg({ role: 'services', services: action.services });
          }
        }
      }
    } catch (err) {
      appendMsg({
        role: 'assistant',
        content: "Sorry, I'm having a moment. Try again or reach us on WhatsApp at +26774122453 😊"
      });
      setHistory(newHistory); // keep user msg in history
    } finally {
      setLoading(false);
    }
  }, [loading, history, appendMsg, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hi! I was browsing BW Car Culture and need some help.');
    window.open(`https://wa.me/26774122453?text=${msg}`, '_blank');
  };

  const submitFeedback = async () => {
    if (!feedback.rating) return;
    setFbLoading(true);
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...feedback, source: 'chatbot' })
      });
    } catch (_) {}
    setFbLoading(false);
    setFeedback({ category: 'general', rating: 0, comment: '', email: '' });
    setView('chat');
    appendMsg({ role: 'assistant', content: "Thank you for your feedback! It means a lot to us 🙏" });
  };

  const renderMessage = (msg, idx) => {
    if (msg.role === 'listings') {
      return (
        <div key={idx} className="kb-action-cards">
          {msg.listings.map(l => (
            <ListingCard key={l.id} listing={l} onNavigate={handleNavigate} />
          ))}
          <button className="kb-view-all" onClick={() => handleNavigate('/marketplace')}>
            View all in Marketplace →
          </button>
        </div>
      );
    }
    if (msg.role === 'services') {
      return (
        <div key={idx} className="kb-action-cards">
          {msg.services.map(s => (
            <ServiceCard key={s.id} service={s} onNavigate={handleNavigate} />
          ))}
          <button className="kb-view-all" onClick={() => handleNavigate('/services')}>
            View all Services →
          </button>
        </div>
      );
    }

    const isUser = msg.role === 'user';
    return (
      <div key={idx} className={`kb-msg ${isUser ? 'kb-msg-user' : 'kb-msg-bot'}`}>
        {!isUser && <div className="kb-avatar">K</div>}
        <div className="kb-bubble">{renderText(msg.content)}</div>
      </div>
    );
  };

  const renderChat = () => (
    <>
      <div className="kb-messages">
        {messages.map((msg, i) => renderMessage(msg, i))}
        {loading && (
          <div className="kb-msg kb-msg-bot">
            <div className="kb-avatar">K</div>
            <div className="kb-bubble kb-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies — only show when not loading and last msg is from bot */}
      {!loading && messages.length <= 1 && (
        <div className="kb-quick-replies">
          {QUICK_REPLIES.map((qr, i) => (
            <button key={i} className="kb-qr-chip" onClick={() => sendMessage(qr)}>
              {qr}
            </button>
          ))}
        </div>
      )}

      <div className="kb-footer">
        <div className="kb-input-row">
          <input
            ref={inputRef}
            className="kb-input"
            type="text"
            placeholder={loading ? 'Karabo is thinking…' : 'Ask me anything…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={500}
          />
          <button
            className="kb-send"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
        <div className="kb-footer-links">
          <button className="kb-footer-link" onClick={handleWhatsApp}>💬 WhatsApp</button>
          <button className="kb-footer-link" onClick={() => setView('feedback')}>📋 Feedback</button>
        </div>
      </div>
    </>
  );

  const renderFeedback = () => (
    <div className="kb-feedback-view">
      <div className="kb-feedback-title">📋 Website Feedback</div>
      <div className="kb-form-group">
        <label>Category</label>
        <select value={feedback.category} onChange={e => setFeedback(f => ({ ...f, category: e.target.value }))}>
          <option value="general">General Experience</option>
          <option value="design">Website Design</option>
          <option value="performance">Performance</option>
          <option value="content">Content Quality</option>
          <option value="navigation">Navigation</option>
          <option value="mobile">Mobile Experience</option>
          <option value="search">Search</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="kb-form-group">
        <label>Rating</label>
        <div className="kb-stars">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`kb-star ${s <= feedback.rating ? 'active' : ''}`}
              onClick={() => setFeedback(f => ({ ...f, rating: s }))}>★</span>
          ))}
        </div>
      </div>
      <div className="kb-form-group">
        <label>Comments (optional)</label>
        <textarea rows={3} maxLength={1000} placeholder="Tell us what you think…"
          value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))} />
      </div>
      <div className="kb-form-group">
        <label>Email (optional)</label>
        <input type="email" placeholder="you@example.com"
          value={feedback.email} onChange={e => setFeedback(f => ({ ...f, email: e.target.value }))} />
      </div>
      <div className="kb-feedback-btns">
        <button className="kb-btn-back" onClick={() => setView('chat')}>← Back</button>
        <button className="kb-btn-submit" disabled={!feedback.rating || fbLoading} onClick={submitFeedback}>
          {fbLoading ? 'Sending…' : 'Submit'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="kb-wrapper">
      {/* FAB */}
      <button
        className={`kb-fab ${isOpen ? 'kb-fab-open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close Karabo' : 'Open Karabo AI Assistant'}
      >
        <span className="kb-fab-icon">{isOpen ? '✕' : 'AI'}</span>
        {!isOpen && <div className="kb-fab-pulse" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="kb-panel">
          <div className="kb-header">
            <div className="kb-header-info">
              <div className="kb-header-avatar">K</div>
              <div>
                <div className="kb-header-name">Karabo</div>
                <div className="kb-header-status">BW Car Culture AI · Online</div>
              </div>
            </div>
            <button className="kb-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {view === 'chat' ? renderChat() : renderFeedback()}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
