// Admin/BroadcastNotification/BroadcastNotification.js
import React, { useState, useEffect } from 'react';
import { Bell, Send, Clock, Users, ChevronDown, AlertTriangle, Info, Megaphone } from 'lucide-react';
import './BroadcastNotification.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';
const authHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

const NOTIFICATION_TYPES = [
  { value: 'system_alert',    label: 'System Alert',     icon: AlertTriangle, color: '#fbbf24' },
  { value: 'feature_update',  label: 'Feature Update',   icon: Megaphone,     color: '#60a5fa' },
  { value: 'announcement',    label: 'Announcement',     icon: Bell,          color: '#a78bfa' },
  { value: 'info',            label: 'General Info',     icon: Info,          color: '#34d399' },
];

const BroadcastNotification = () => {
  const [title, setTitle]           = useState('');
  const [message, setMessage]       = useState('');
  const [type, setType]             = useState('system_alert');
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState(null); // { success, message, count }
  const [history, setHistory]       = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-history`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setHistory(data.broadcasts || []);
    } catch (_) {}
    finally { setHistoryLoading(false); }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    if (!window.confirm(`Send "${title}" to ALL users? This cannot be undone.`)) return;

    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-notification`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type })
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setTitle('');
        setMessage('');
        fetchHistory();
      }
    } catch (err) {
      setResult({ success: false, message: 'Network error: ' + err.message });
    } finally {
      setSending(false);
    }
  };

  const selectedType = NOTIFICATION_TYPES.find(t => t.value === type);
  const TypeIcon = selectedType?.icon || Bell;
  const charCount = message.length;

  return (
    <div className="bcast-container">

      {/* Page header */}
      <div className="bcast-page-header">
        <div className="bcast-page-title">
          <Megaphone size={22} style={{ color: '#ff3300' }} />
          <h2>Broadcast Notification</h2>
        </div>
        <p className="bcast-page-subtitle">
          Send a notification to every user on the platform simultaneously.
        </p>
      </div>

      <div className="bcast-layout">

        {/* Compose panel */}
        <div className="bcast-compose-card">
          <div className="bcast-compose-header">
            <Bell size={16} style={{ color: '#ff3300' }} />
            Compose Message
          </div>

          {/* Type selector */}
          <div className="bcast-field">
            <label className="bcast-label">Notification Type</label>
            <div className="bcast-type-grid">
              {NOTIFICATION_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    className={`bcast-type-btn ${type === t.value ? 'active' : ''}`}
                    style={type === t.value ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : {}}
                    onClick={() => setType(t.value)}
                  >
                    <Icon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="bcast-field">
            <label className="bcast-label">Title <span className="bcast-required">*</span></label>
            <input
              className="bcast-input"
              type="text"
              placeholder="e.g. New feature available!"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
            <span className="bcast-char-count">{title.length}/100</span>
          </div>

          {/* Message */}
          <div className="bcast-field">
            <label className="bcast-label">Message <span className="bcast-required">*</span></label>
            <textarea
              className="bcast-textarea"
              placeholder="Write your notification message here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <span className="bcast-char-count">{charCount}/500</span>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="bcast-preview">
              <div className="bcast-preview-label">Preview</div>
              <div className="bcast-preview-card">
                <div className="bcast-preview-icon" style={{ background: `${selectedType?.color}22` }}>
                  <TypeIcon size={16} style={{ color: selectedType?.color }} />
                </div>
                <div className="bcast-preview-body">
                  <div className="bcast-preview-title">{title || 'Notification title'}</div>
                  <div className="bcast-preview-msg">{message || 'Your message here...'}</div>
                  <div className="bcast-preview-time">Just now</div>
                </div>
              </div>
            </div>
          )}

          {/* Result feedback */}
          {result && (
            <div className={`bcast-result ${result.success ? 'success' : 'error'}`}>
              {result.success
                ? `✓ Sent to ${result.count} users successfully`
                : `✗ ${result.message}`}
            </div>
          )}

          {/* Send button */}
          <button
            className="bcast-send-btn"
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
          >
            {sending ? (
              <><div className="bcast-spinner" /> Sending...</>
            ) : (
              <><Send size={15} /> Send to All Users</>
            )}
          </button>
        </div>

        {/* History panel */}
        <div className="bcast-history-card">
          <button
            className="bcast-history-toggle"
            onClick={() => setShowHistory(h => !h)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={15} style={{ color: '#aaa' }} />
              <span>Past Broadcasts</span>
            </div>
            <ChevronDown size={15} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {showHistory && (
            historyLoading ? (
              <div className="bcast-history-loading">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="bcast-history-empty">
                <Bell size={28} style={{ opacity: 0.25, marginBottom: '0.5rem' }} />
                <p>No broadcasts sent yet</p>
              </div>
            ) : (
              <div className="bcast-history-list">
                {history.map((b, i) => {
                  const hType = NOTIFICATION_TYPES.find(t => t.value === b.type);
                  const HIcon = hType?.icon || Bell;
                  return (
                    <div key={i} className="bcast-history-item">
                      <div className="bcast-history-icon" style={{ background: `${hType?.color || '#aaa'}18` }}>
                        <HIcon size={13} style={{ color: hType?.color || '#aaa' }} />
                      </div>
                      <div className="bcast-history-body">
                        <div className="bcast-history-title">{b.title}</div>
                        <div className="bcast-history-msg">{b.message}</div>
                        <div className="bcast-history-meta">
                          <Users size={11} /> {b.recipientCount} recipients &nbsp;·&nbsp;
                          {new Date(b.createdAt).toLocaleDateString()} &nbsp;·&nbsp;
                          by {b.sentBy}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default BroadcastNotification;
