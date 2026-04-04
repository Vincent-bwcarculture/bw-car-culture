// src/components/shared/Chatbot/Chatbot.js — Mpho AI Assistant
import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X as CloseIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import MphoSubscribeModal from './MphoSubscribeModal.js';
import './Chatbot.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.i3wcarculture.com/api';

const WELCOME_MSG = {
  role: 'assistant',
  content: "Hi, I'm **Mpho AI** — your BW Car Culture assistant.\n\nI can help you:\n• Find cars on the marketplace\n• Discover workshops, rentals & transport\n• Create a listing through chat\n• Navigate the site\n\nWhat can I do for you today?"
};

const QUICK_REPLIES = [
  'Show me cars under P200,000',
  'Find a workshop in Gaborone',
  'I want to sell my car',
  'Take me to the marketplace',
];

const EV_QUICK_REPLIES = [
  { label: 'Browse electric vehicles', msg: 'Show me electric vehicles' },
  { label: 'How EV charging works', msg: 'How does EV charging work?' },
  { label: 'EV vs petrol running costs', msg: 'EV vs petrol running costs' },
  { label: 'EV-friendly workshops', msg: 'Find EV-friendly workshops' },
  { label: 'Why go electric in Botswana?', msg: 'Why go electric in Botswana?' },
];

// Local EV responses — work without login (no API call)
const EV_REPLIES = {
  'Show me electric vehicles': {
    text: "Taking you to the marketplace.\n\nFilter by the **Electric** category to see all EV listings on BW Car Culture. Log in to get personalised recommendations.",
    nav: '/marketplace'
  },
  'How does EV charging work?': {
    text: "**EV Charging — How It Works**\n\n**Level 1** — Standard wall plug. Works overnight (8–20 hrs), no special install.\n**Level 2** — AC wall charger, most common for homes (4–8 hrs).\n**DC Fast Charge** — Public stations. 80% charge in 30–60 mins.\n\nIn Botswana, home charging (Level 2) is the most practical option right now. Public chargers are expanding in Gaborone and major towns.\n\nLog in to ask about specific EV models."
  },
  'EV vs petrol running costs': {
    text: "**Running Cost Comparison**\n\n**Electric:** ~P0.30–0.60 per km\n**Petrol:** ~P1.20–1.80 per km at current BW prices\n\n**Servicing:** EVs save roughly 40% — no oil changes, and regenerative braking means fewer brake replacements.\n\n**Payback period:** For drivers covering 1,500+ km/month, the savings typically offset the higher purchase price within 3–5 years."
  },
  'Find EV-friendly workshops': {
    text: "EV servicing requires high-voltage system certification — not every mechanic is qualified. I'm taking you to the Services directory where you can find workshops listing EV or hybrid specialisation.",
    nav: '/services'
  },
  'Why go electric in Botswana?': {
    text: "**Going Electric in Botswana**\n\n• Cheaper to run — electricity costs far less per km than petrol\n• Lower servicing costs — no engine oil, simpler drivetrain\n• Instant torque — smooth, quiet, responsive drive\n• Zero tailpipe emissions — cleaner air in cities\n• Infrastructure growing — more public chargers coming to Gaborone and major towns\n\n**Best suited for:** Daily commuters and city drivers with home charging access.\n\nLog in to explore specific EV models."
  }
};

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

const ContactDraftCard = ({ draftMessage, onSent }) => {
  const [draft, setDraft] = useState(draftMessage || '');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const encoded = encodeURIComponent(draft.trim());
    window.open(`https://wa.me/26774122453?text=${encoded}`, '_blank');
    setSent(true);
    if (onSent) onSent();
  };

  if (sent) {
    return (
      <div className="kb-draft-sent">
        <span>Enquiry sent to the BW Car Culture team. They'll connect you with the seller shortly.</span>
      </div>
    );
  }

  return (
    <div className="kb-draft-card">
      <div className="kb-draft-label">Draft message — edit if you'd like:</div>
      <textarea
        className="kb-draft-textarea"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={7}
        maxLength={1000}
      />
      <div className="kb-draft-footer">
        <span className="kb-draft-chars">{draft.length}/1000</span>
        <button className="kb-draft-send" onClick={handleSend} disabled={!draft.trim()}>
          Send via WhatsApp
        </button>
      </div>
    </div>
  );
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'feedback'
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [history, setHistory] = useState([]); // [{role,content}] sent to API
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ category: 'general', rating: 0, comment: '', email: '' });
  const [fbLoading, setFbLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null); // { used, limit, isPro }
  const [isPro, setIsPro] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasStoredHistory, setHasStoredHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // On login: load chat history + pro status in parallel
  useEffect(() => {
    if (!isAuthenticated) {
      setIsPro(false);
      setMessages([WELCOME_MSG]);
      setHistory([]);
      setHistoryLoaded(false);
      setHasStoredHistory(false);
      return;
    }
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE}/ai/subscription`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/ai/history`,      { headers }).then(r => r.json()).catch(() => ({}))
    ]).then(([subData, histData]) => {
      if (subData.success) setIsPro(subData.isPro);
      if (histData.success && histData.messages?.length) {
        // Restore text messages only (not card-type messages)
        const restored = histData.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content }));
        if (restored.length) {
          setMessages([WELCOME_MSG, { role: 'assistant', content: '**Welcome back.** Here\'s your recent conversation:', isResume: true }, ...restored]);
          setHistory(restored);
          setHasStoredHistory(true);
        }
      }
      setHistoryLoaded(true);
    });
  }, [isAuthenticated]);

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

  const clearHistory = useCallback(async () => {
    setMessages([WELCOME_MSG]);
    setHistory([]);
    setHasStoredHistory(false);
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/ai/history/clear`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).catch(() => {});
  }, []);

  const appendMsg = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  // Listen for contact-assist events from VehicleCard
  useEffect(() => {
    const handler = (e) => {
      const { vehicleTitle, draftMessage } = e.detail || {};
      setIsOpen(true);
      setView('chat');
      // Small delay so panel is mounted before we append
      setTimeout(() => {
        setMessages(prev => {
          // Avoid duplicate contact_assist cards
          const already = prev.some(m => m.role === 'contact_assist' && m.draftMessage === draftMessage);
          if (already) return prev;
          return [
            ...prev,
            {
              role: 'assistant',
              content: `I wasn't able to retrieve the seller's contact number for **${vehicleTitle || 'this vehicle'}**.\n\nI've drafted an enquiry below that will go directly to the **BW Car Culture team**, who will forward it to the seller on your behalf. Feel free to edit it before sending.`
            },
            { role: 'contact_assist', draftMessage, vehicleTitle }
          ];
        });
      }, 120);
    };
    window.addEventListener('mpho:contact-assist', handler);
    return () => window.removeEventListener('mpho:contact-assist', handler);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // EV quick replies work without login — serve local responses
    const evReply = EV_REPLIES[trimmed];
    if (evReply && !isAuthenticated) {
      appendMsg({ role: 'user', content: trimmed });
      setInput('');
      appendMsg({ role: 'assistant', content: evReply.text });
      if (evReply.nav) setTimeout(() => navigate(evReply.nav), 1400);
      return;
    }

    // Gate: must be logged in for everything else
    if (!isAuthenticated) {
      appendMsg({ role: 'user', content: trimmed });
      setInput('');
      appendMsg({
        role: 'assistant',
        content: "To chat with Mpho AI you'll need to **log in or create a free account** first.\n\nIt only takes a minute.",
        authGate: true
      });
      return;
    }

    const userMsg = { role: 'user', content: trimmed };
    appendMsg(userMsg);
    setInput('');
    setLoading(true);

    const newHistory = [...history, userMsg];
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: newHistory })
      });

      const data = await res.json();

      // Soft errors (quota, daily limit) — show message + upsell if present, don't throw
      if (!data.success) {
        if (data.usage) { setUsageInfo(data.usage); if (data.usage.isPro !== undefined) setIsPro(data.usage.isPro); }
        if (data.reply) appendMsg({ role: 'assistant', content: data.reply });
        if (data.actions?.some(a => a.type === 'show_upsell')) {
          appendMsg({ role: 'upsell' });
        }
        return;
      }

      // Update usage + Pro status
      if (data.usage) {
        setUsageInfo(data.usage);
        if (data.usage.isPro !== undefined) setIsPro(data.usage.isPro);
      }

      const assistantMsg = { role: 'assistant', content: data.reply };
      appendMsg(assistantMsg);
      setHistory([...newHistory, assistantMsg]);

      // Handle actions
      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          if (action.type === 'navigate') {
            setTimeout(() => navigate(action.path), 1200);
          } else if (action.type === 'prefill_listing') {
            localStorage.setItem('ai_listing_prefill', JSON.stringify(action.data));
            setTimeout(() => navigate('/marketplace?action=sell'), 1200);
          } else if (action.type === 'prefill_article') {
            localStorage.setItem('ai_article_prefill', JSON.stringify(action.data));
            setTimeout(() => navigate('/admin/news'), 1200);
          } else if (action.type === 'show_valuation') {
            appendMsg({ role: 'valuation', data: action.valuation });
          } else if (action.type === 'show_market_data') {
            appendMsg({ role: 'market_data', data: action.data });
          } else if (action.type === 'show_upsell') {
            appendMsg({ role: 'upsell' });
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
        content: "Sorry, I'm having a moment. Try again or reach us on WhatsApp at +26774122453."
      });
      // Do NOT keep the failed user message in history — it would break Gemini's
      // strict user/model alternation on the next send attempt
    } finally {
      setLoading(false);
    }
  }, [loading, isAuthenticated, history, appendMsg, navigate]);

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
    if (msg.role === 'contact_assist') {
      return (
        <div key={idx} className="kb-action-cards">
          <ContactDraftCard
            draftMessage={msg.draftMessage}
            onSent={() => appendMsg({ role: 'assistant', content: "Your enquiry has been sent. The BW Car Culture team will be in touch shortly. You can also reach us directly at +26774122453." })}
          />
        </div>
      );
    }
    if (msg.role === 'upsell') {
      return (
        <div key={idx} className="kb-upsell-card">
          <div className="kb-upsell-title">Mpho — BWP 100/month</div>
          <ul className="kb-upsell-list">
            <li>50 messages/day (vs 12 free)</li>
            <li>AI fills your listing form for you</li>
            <li>Vehicle valuations from real market data</li>
            <li>Market price insights & trends</li>
            <li>Priority admin review of your listings</li>
          </ul>
          <button className="kb-upsell-btn" onClick={() => setShowSubscribeModal(true)}>
            Subscribe to Mpho — BWP 100/mo
          </button>
        </div>
      );
    }
    if (msg.role === 'valuation') {
      const v = msg.data;
      return (
        <div key={idx} className="kb-valuation-card">
          <div className="kb-val-title">{v.year} {v.make} {v.model} — Market Valuation</div>
          <div className="kb-val-estimate">{formatPrice(v.mileageAdjusted ? v.adjusted : v.avg)}</div>
          <div className="kb-val-label">{v.mileageAdjusted ? 'Mileage-adjusted estimate' : 'Market average'}</div>
          <div className="kb-val-range">
            <span>Low: {formatPrice(v.low)}</span>
            <span>Avg: {formatPrice(v.avg)}</span>
            <span>High: {formatPrice(v.high)}</span>
          </div>
          <div className="kb-val-sample">Based on {v.sampleSize} similar listings on BW Car Culture</div>
        </div>
      );
    }
    if (msg.role === 'market_data') {
      const d = msg.data;
      return (
        <div key={idx} className="kb-market-card">
          <div className="kb-market-title">Market Overview</div>
          <div className="kb-market-stat">{d.recentListings} new listings in last 30 days</div>
          {d.topMakes?.length > 0 && (
            <div className="kb-market-section">
              <div className="kb-market-label">Top Makes</div>
              {d.topMakes.map((m, i) => (
                <div key={i} className="kb-market-row">
                  <span>{m.make}</span>
                  <span>{m.count} listings · avg {formatPrice(m.avgPrice)}</span>
                </div>
              ))}
            </div>
          )}
          {d.categories?.length > 0 && (
            <div className="kb-market-section">
              <div className="kb-market-label">By Category</div>
              {d.categories.filter(c => c.category).map((c, i) => (
                <div key={i} className="kb-market-row">
                  <span>{c.category}</span>
                  <span>{c.count} listings · avg {formatPrice(c.avgPrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (msg.role === 'listings' && msg.listings?.length > 0) {
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
        {!isUser && <div className="kb-avatar">M</div>}
        <div className="kb-bubble" {...(msg.isResume ? { 'data-resume': 'true' } : {})}>
          {renderText(msg.content)}
          {msg.authGate && (
            <div className="kb-auth-btns">
              <button className="kb-auth-btn kb-auth-login" onClick={() => handleNavigate('/login')}>Log In</button>
              <button className="kb-auth-btn kb-auth-register" onClick={() => handleNavigate('/register')}>Register Free</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <>
      <div className="kb-messages">
        {messages.map((msg, i) => renderMessage(msg, i))}
        {loading && (
          <div className="kb-msg kb-msg-bot">
            <div className="kb-avatar">M</div>
            <div className="kb-bubble kb-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies — only show on welcome screen */}
      {!loading && messages.length <= 1 && (
        <>
          <div className="kb-quick-replies">
            {QUICK_REPLIES.map((qr, i) => (
              <button key={i} className="kb-qr-chip" onClick={() => sendMessage(qr)}>
                {qr}
              </button>
            ))}
          </div>
          <div className="kb-ev-section">
            <div className="kb-ev-label">Electric Vehicles · no login needed</div>
            <div className="kb-quick-replies">
              {EV_QUICK_REPLIES.map((ev, i) => (
                <button key={i} className="kb-qr-chip kb-ev-chip" onClick={() => sendMessage(ev.msg)}>
                  {ev.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="kb-footer">
        <div className="kb-input-row">
          <input
            ref={inputRef}
            className="kb-input"
            type="text"
            placeholder={loading ? 'Mpho AI is thinking…' : 'Ask me anything…'}
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
        {usageInfo && (
          <div className="kb-usage">
            <div className="kb-usage-bar">
              <div
                className="kb-usage-fill"
                style={{ width: `${Math.min(100, (usageInfo.used / usageInfo.limit) * 100)}%`,
                         background: usageInfo.used >= usageInfo.limit ? '#ef4444' : usageInfo.used >= usageInfo.limit * 0.8 ? '#f97316' : '#4ade80' }}
              />
            </div>
            <span className="kb-usage-text">{usageInfo.used}/{usageInfo.limit} messages today</span>
          </div>
        )}
        <div className="kb-footer-links">
          <button className="kb-footer-link" onClick={handleWhatsApp}>WhatsApp</button>
          <button className="kb-footer-link" onClick={() => setView('feedback')}>Feedback</button>
        </div>
      </div>
    </>
  );

  const renderFeedback = () => (
    <div className="kb-feedback-view">
      <div className="kb-feedback-title">Website Feedback</div>
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
        aria-label={isOpen ? 'Close Mpho AI' : 'Open Mpho AI Assistant'}
      >
        <span className="kb-fab-icon">
          {isOpen ? <CloseIcon size={18} strokeWidth={2.5} /> : <Sparkles size={20} />}
        </span>
        {!isOpen && <div className="kb-fab-pulse" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="kb-panel">
          <div className="kb-header">
            <div className="kb-header-info">
              <div className="kb-header-avatar">M</div>
              <div>
                <div className="kb-header-name">Mpho AI</div>
                <div className="kb-header-status">
                  BW Car Culture AI · Online
                  {isPro && <span className="kb-pro-badge">MPHO</span>}
                </div>
              </div>
            </div>
            <div className="kb-header-actions">
              {isAuthenticated && hasStoredHistory && (
                <button className="kb-new-chat" onClick={clearHistory} title="Start new chat">
                  ✦ New
                </button>
              )}
              <button className="kb-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          {view === 'chat' ? renderChat() : renderFeedback()}
        </div>
      )}

      <MphoSubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
      />
    </div>
  );
};

export default Chatbot;
