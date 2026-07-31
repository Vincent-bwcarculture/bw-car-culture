import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../config/axios.js';
import './DistributorPortal.css';

const TOKEN_KEY = 'mor_dist_token';

// ── Helpers ───────────────────────────────────────────────────
const fmt  = n  => 'P ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = d  => d ? new Date(d).toLocaleDateString('en-BW', { year: 'numeric', month: 'short', day: '2-digit' }) : '–';

const BADGE_MAP = {
  pending:   { cls: 'warn', label: 'Pending' },
  verified:  { cls: 'ok',   label: 'Verified' },
  rejected:  { cls: 'bad',  label: 'Rejected' },
  paid:      { cls: 'blue', label: 'Paid' },
  cancelled: { cls: 'dim',  label: 'Cancelled' },
  approved:  { cls: 'ok',   label: 'Approved' },
  active:    { cls: 'ok',   label: 'Active' },
};

const Badge = ({ s }) => {
  const m = BADGE_MAP[s] || { cls: 'dim', label: s };
  return <span className={`dp-badge ${m.cls}`}>{m.label}</span>;
};

// Distributor API helper — attaches their token
const dApi = {
  get:   (url)       => api.get(url,       { headers: { Authorization: `Bearer dist:${localStorage.getItem(TOKEN_KEY) || ''}` } }),
  post:  (url, data) => api.post(url, data, { headers: { Authorization: `Bearer dist:${localStorage.getItem(TOKEN_KEY) || ''}` } }),
};

// ── Login page ────────────────────────────────────────────────
function LoginPage({ onSuccess, onRegister }) {
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !pw) return setError('Please fill in all fields');
    setError(''); setLoading(true);
    try {
      const r = await api.post('/api/morasimo/distributor/login', { email, password: pw });
      if (r.data.success) {
        localStorage.setItem(TOKEN_KEY, r.data.token);
        onSuccess(r.data.distributor);
      } else {
        setError(r.data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dp-auth-page">
      <div className="dp-auth-card">
        <div className="dp-auth-logo">
          <span className="dp-auth-logo-hex">⬡</span>
          <span className="dp-auth-logo-name">MORASIMO</span>
          <span className="dp-auth-logo-sub">Distributor Portal</span>
        </div>

        <h2 className="dp-auth-title">Welcome back</h2>
        <p className="dp-auth-desc">Login to access your dashboard and referral code</p>

        <form className="dp-form" onSubmit={submit}>
          {error && <div className="dp-error">⚠ {error}</div>}

          <div className="dp-field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div className="dp-field">
            <label>Password</label>
            <div className="dp-field-pw">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button type="button" className="dp-pw-toggle" onClick={() => setShowPw(p => !p)}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className="dp-btn-primary" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="dp-auth-foot">
          Don't have an account?{' '}
          <button onClick={onRegister}>Register here</button>
        </p>
      </div>
    </div>
  );
}

// ── Register page ─────────────────────────────────────────────
function RegisterPage({ onBack, onSuccess }) {
  const [form,     setForm]     = useState({
    name: '', email: '', phone: '', idNumber: '',
    password: '', confirmPw: '',
    withdrawalMethod: '', accountDetails: '',
    referralCode: '', inviteCode: '',
  });
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);
  const [activated,setActivated]= useState(false);

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password)
      return setError('Name, email, phone and password are required');
    if (form.password !== form.confirmPw)
      return setError('Passwords do not match');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters');
    setError(''); setLoading(true);
    try {
      const r = await api.post('/api/morasimo/distributor/register', {
        name: form.name, email: form.email, phone: form.phone,
        idNumber: form.idNumber, password: form.password,
        withdrawalMethod: form.withdrawalMethod, accountDetails: form.accountDetails,
        referralCode: form.referralCode.toUpperCase() || undefined,
        inviteCode: form.inviteCode || undefined,
      });
      if (r.data.success) {
        setActivated(!!r.data.activated);
        setDone(true);
      } else {
        setError(r.data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done && activated) {
    return (
      <div className="dp-auth-page">
        <div className="dp-auth-card dp-pending-card">
          <div className="dp-auth-logo">
            <span className="dp-auth-logo-hex">⬡</span>
            <span className="dp-auth-logo-name">MORASIMO</span>
          </div>
          <span className="dp-pending-icon">✅</span>
          <h2 className="dp-pending-title">Account Activated!</h2>
          <p className="dp-pending-desc">
            Your account is ready. You can now log in with your email and password.
          </p>
          <button className="dp-btn-primary" style={{ marginTop: '24px' }} onClick={onBack}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="dp-auth-page">
        <div className="dp-auth-card dp-pending-card">
          <div className="dp-auth-logo">
            <span className="dp-auth-logo-hex">⬡</span>
            <span className="dp-auth-logo-name">MORASIMO</span>
          </div>
          <span className="dp-pending-icon">⏳</span>
          <h2 className="dp-pending-title">Application Submitted!</h2>
          <p className="dp-pending-desc">
            Your distributor application has been received.<br />
            An admin will review and activate your account shortly.<br /><br />
            Once approved, you can login with your email and password.
          </p>
          <button className="dp-btn-primary" style={{ marginTop: '24px' }} onClick={onBack}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-auth-page">
      <div className="dp-auth-card" style={{ maxWidth: '480px' }}>
        <div className="dp-auth-logo">
          <span className="dp-auth-logo-hex">⬡</span>
          <span className="dp-auth-logo-name">MORASIMO</span>
          <span className="dp-auth-logo-sub">Distributor Registration</span>
        </div>

        <h2 className="dp-auth-title">Create your account</h2>
        <p className="dp-auth-desc">Join Morasimo and start earning commissions</p>

        <form className="dp-form" onSubmit={submit}>
          {error && <div className="dp-error">⚠ {error}</div>}

          <div className="dp-field-row">
            <div className="dp-field">
              <label>Full Name *</label>
              <input value={form.name} onChange={e => F('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div className="dp-field">
              <label>Phone Number *</label>
              <input value={form.phone} onChange={e => F('phone', e.target.value)} placeholder="+267 7X XXX XXX" />
            </div>
          </div>

          <div className="dp-field">
            <label>Email Address *</label>
            <input type="email" value={form.email} onChange={e => F('email', e.target.value)} placeholder="your@email.com" />
          </div>

          <div className="dp-field">
            <label>National ID Number</label>
            <input value={form.idNumber} onChange={e => F('idNumber', e.target.value)} placeholder="For KYC verification" />
          </div>

          <div className="dp-divider">Password</div>

          <div className="dp-field-row">
            <div className="dp-field">
              <label>Password *</label>
              <div className="dp-field-pw">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => F('password', e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <button type="button" className="dp-pw-toggle" onClick={() => setShowPw(p => !p)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="dp-field">
              <label>Confirm Password *</label>
              <div className="dp-field-pw">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.confirmPw}
                  onChange={e => F('confirmPw', e.target.value)}
                  placeholder="Repeat password"
                />
              </div>
            </div>
          </div>

          <div className="dp-divider">Payout Details</div>

          <div className="dp-field">
            <label>Withdrawal Method</label>
            <select value={form.withdrawalMethod} onChange={e => F('withdrawalMethod', e.target.value)}>
              <option value="">Select method…</option>
              <option value="bank">Bank Transfer</option>
              <option value="orange_money">Orange Money</option>
              <option value="myzaka">MyZaka</option>
            </select>
          </div>

          <div className="dp-field">
            <label>Account / Wallet Number</label>
            <input value={form.accountDetails} onChange={e => F('accountDetails', e.target.value)} placeholder="Bank account or mobile wallet number" />
          </div>

          <div className="dp-divider">Optional</div>

          <div className="dp-field">
            <label>Invite Code</label>
            <input
              value={form.inviteCode}
              onChange={e => F('inviteCode', e.target.value.toUpperCase())}
              placeholder="Enter invite code to activate instantly"
              maxLength={20}
            />
            <span className="dp-field-hint">Have an invite code? Enter it to skip the approval wait.</span>
          </div>

          <div className="dp-field">
            <label>Preferred Referral Code</label>
            <input
              value={form.referralCode}
              onChange={e => F('referralCode', e.target.value.toUpperCase())}
              placeholder="e.g. KATSO24 (leave blank to auto-assign)"
              maxLength={12}
            />
            <span className="dp-field-hint">Uppercase letters and numbers only. Auto-generated if left blank.</span>
          </div>

          <button type="submit" className="dp-btn-primary" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>

        <p className="dp-auth-foot">
          Already have an account?{' '}
          <button onClick={onBack}>Login</button>
        </p>
      </div>
    </div>
  );
}

// ── Withdrawal modal ──────────────────────────────────────────
function WithdrawModal({ available, distData, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    if (amt > available) return setError(`Maximum available is ${fmt(available)}`);
    setError(''); setLoading(true);
    try {
      await dApi.post('/api/morasimo/distributor/withdrawals', {
        amount: amt,
        method: distData.withdrawalMethod,
        accountDetails: distData.accountDetails,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dp-modal-overlay" onClick={onClose}>
      <div className="dp-modal" onClick={e => e.stopPropagation()}>
        <div className="dp-modal-head">
          <h3>Request Withdrawal</h3>
          <button className="dp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="dp-modal-body">
          <div className="dp-modal-amount">
            <p>Available Balance</p>
            <strong>{fmt(available)}</strong>
          </div>
          {error && <div className="dp-error" style={{ marginBottom: '14px' }}>⚠ {error}</div>}
          <div className="dp-field" style={{ marginBottom: '12px' }}>
            <label>Amount to Withdraw (P)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              max={available}
            />
          </div>
          <div className="dp-field">
            <label>Payout Method</label>
            <input value={(distData.withdrawalMethod || '').replace('_', ' ')} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
          </div>
          <div className="dp-field" style={{ marginTop: '10px' }}>
            <label>Account / Wallet</label>
            <input value={distData.accountDetails || '–'} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
          </div>
          <span className="dp-modal-note">Withdrawals are processed within 1–3 business days after admin approval.</span>
        </div>
        <div className="dp-modal-foot">
          <button className="dp-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="dp-btn-gold" onClick={submit} disabled={loading || !amount}>
            {loading ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ dist: initDist, onLogout }) {
  const [dist,       setDist]       = useState(initDist);
  const [txns,       setTxns]       = useState([]);
  const [withdrawals,setWithdrawals]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [showWdModal,setShowWdModal]= useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, txnRes, wdRes] = await Promise.all([
        dApi.get('/api/morasimo/distributor/me'),
        dApi.get('/api/morasimo/distributor/transactions'),
        dApi.get('/api/morasimo/distributor/withdrawals'),
      ]);
      if (meRes.data.success)  setDist(meRes.data.data);
      if (txnRes.data.success) setTxns(txnRes.data.data || []);
      if (wdRes.data.success)  setWithdrawals(wdRes.data.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyCode = () => {
    navigator.clipboard.writeText(dist.referralCode || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareCode = () => {
    const text = `Use my Morasimo referral code: ${dist.referralCode}`;
    if (navigator.share) {
      navigator.share({ title: 'My Morasimo Code', text });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const wallet = dist.wallet || {};
  const available = wallet.available || 0;

  // QR encodes the referral code
  const qrValue = dist.referralCode || 'MORASIMO';

  if (loading) return (
    <div className="dp-dashboard">
      <div className="dp-spin" />
    </div>
  );

  return (
    <div className="dp-dashboard">
      {/* Top bar */}
      <header className="dp-topbar">
        <div className="dp-topbar-logo">
          <span>⬡</span> MORASIMO
        </div>
        <span className="dp-topbar-greeting">
          Welcome, <strong>{dist.name}</strong>
        </span>
        <div className="dp-topbar-right">
          <Badge s={dist.status} />
          <button className="dp-btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dp-body">
        {/* Status notice if not active */}
        {dist.status !== 'active' && (
          <div className={`dp-status-bar ${dist.status}`}>
            {dist.status === 'pending'
              ? "⏳ Your account is pending admin approval. You'll be able to use your referral code once activated."
              : '⚠ Your account has been suspended. Please contact support.'}
          </div>
        )}

        {/* Referral code card */}
        <div className="dp-code-card">
          <p className="dp-code-card-head">Your Referral Code</p>
          <div className="dp-code-layout">
            <div className="dp-code-left">
              <p className="dp-code-label">Share this code with customers at checkout</p>
              <div className="dp-code-value">{dist.referralCode || '–'}</div>
              <div className="dp-code-actions">
                <button className={`dp-btn-copy${copied ? ' copied' : ''}`} onClick={copyCode}>
                  {copied ? '✓ Copied!' : '⎘ Copy Code'}
                </button>
                <button className="dp-btn-share" onClick={shareCode}>
                  ↗ Share
                </button>
              </div>
            </div>
            {dist.referralCode && dist.status === 'active' && (
              <div className="dp-qr-section">
                <div className="dp-qr-box">
                  <QRCodeSVG
                    value={qrValue}
                    size={130}
                    bgColor="#FFFFFF"
                    fgColor="#0A0A0E"
                    level="M"
                  />
                </div>
                <span className="dp-qr-label">Scan to get code</span>
              </div>
            )}
          </div>
        </div>

        {/* Wallet */}
        <div className="dp-wallet-grid">
          <div className="dp-wallet-card">
            <span className="dp-wallet-label">Pending</span>
            <span className="dp-wallet-val">{fmt(wallet.pending || 0)}</span>
            <span className="dp-wallet-sub">Awaiting verification</span>
          </div>
          <div className="dp-wallet-card available">
            <span className="dp-wallet-label">Available</span>
            <span className="dp-wallet-val">{fmt(available)}</span>
            <span className="dp-wallet-sub">Ready to withdraw</span>
          </div>
          <div className="dp-wallet-card">
            <span className="dp-wallet-label">Withdrawn</span>
            <span className="dp-wallet-val">{fmt(wallet.withdrawn || 0)}</span>
            <span className="dp-wallet-sub">Total paid out</span>
          </div>
          <div className="dp-wallet-card">
            <span className="dp-wallet-label">Lifetime</span>
            <span className="dp-wallet-val">{fmt(wallet.lifetime || 0)}</span>
            <span className="dp-wallet-sub">All time earnings</span>
          </div>
        </div>

        {/* Withdraw bar */}
        <div className="dp-withdraw-bar">
          <h3>Withdrawals</h3>
          <button
            className="dp-btn-gold"
            disabled={available <= 0 || dist.status !== 'active'}
            onClick={() => setShowWdModal(true)}
            title={available <= 0 ? 'No available balance' : ''}
          >
            Request Withdrawal
          </button>
        </div>

        {/* Withdrawal history */}
        <div className="dp-section-card">
          <div className="dp-section-head">
            <h3>Withdrawal History</h3>
            <span className="dp-section-count">{withdrawals.length} requests</span>
          </div>
          {withdrawals.length === 0 ? (
            <div className="dp-empty">No withdrawal requests yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dp-table">
                <thead><tr>
                  <th>Amount</th><th>Method</th><th>Status</th><th>Requested</th>
                </tr></thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w._id}>
                      <td className="dp-mono">{fmt(w.amount)}</td>
                      <td>{(w.method || '').replace('_', ' ')}</td>
                      <td><Badge s={w.status} /></td>
                      <td className="dp-muted">{fmtD(w.requestedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction history */}
        <div className="dp-section-card">
          <div className="dp-section-head">
            <h3>My Transactions</h3>
            <span className="dp-section-count">{txns.length} recorded</span>
          </div>
          {txns.length === 0 ? (
            <div className="dp-empty">No transactions recorded yet — start sharing your code!</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dp-table">
                <thead><tr>
                  <th>Ref</th><th>Business</th><th>Product</th>
                  <th>Sale</th><th>Commission</th><th>Net Earned</th><th>Status</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {txns.map(t => (
                    <tr key={t._id}>
                      <td className="dp-mono">{t.refId}</td>
                      <td>{t.businessName}</td>
                      <td>{t.productName || '–'}</td>
                      <td className="dp-mono">{fmt(t.saleAmount)}</td>
                      <td className="dp-mono">{fmt(t.commission)}</td>
                      <td className="dp-mono" style={{ color: '#C9A94E' }}>{fmt(t.netCommission)}</td>
                      <td><Badge s={t.status} /></td>
                      <td className="dp-muted">{fmtD(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showWdModal && (
        <WithdrawModal
          available={available}
          distData={dist}
          onClose={() => setShowWdModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

// ── Main: DistributorPortal ───────────────────────────────────
export default function DistributorPortal() {
  const [view,     setView]     = useState('login'); // login | register | dashboard
  const [dist,     setDist]     = useState(null);
  const [checking, setChecking] = useState(true);

  // On mount: check if stored token is valid
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setChecking(false); return; }
    dApi.get('/api/morasimo/distributor/me')
      .then(r => {
        if (r.data.success) {
          setDist(r.data.data);
          setView('dashboard');
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setChecking(false));
  }, []);

  const onLoginSuccess = (distData) => {
    setDist(distData);
    setView('dashboard');
  };

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setDist(null);
    setView('login');
  };

  if (checking) {
    return (
      <div className="dp-root">
        <div className="dp-spin" />
      </div>
    );
  }

  return (
    <div className="dp-root">
      {view === 'dashboard' && dist && (
        <Dashboard dist={dist} onLogout={onLogout} />
      )}
      {view === 'register' && (
        <RegisterPage
          onBack={() => setView('login')}
          onSuccess={onLoginSuccess}
        />
      )}
      {(view === 'login' || (!dist && view === 'dashboard')) && (
        <LoginPage
          onSuccess={onLoginSuccess}
          onRegister={() => setView('register')}
        />
      )}
    </div>
  );
}
