import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './PriceCalculator.css';

const VAT_RATE  = 0.14;
const DUTY_RATE = 0.27;
const REG_FEE   = 5000;
const BOND_FEE  = 1500;

const fmtP   = (n) => `P ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtUSD = (n) => `$ ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PriceCalculator = () => {
  // ── Import price calculator state ───────────────────────────────────────────
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [margin, setMargin]             = useState('');
  const [copied, setCopied]             = useState(false);

  // ── USD → BWP converter state ───────────────────────────────────────────────
  const [usdAmount, setUsdAmount]   = useState('');
  const [rate, setRate]             = useState(null);
  const [rateStatus, setRateStatus] = useState('idle'); // idle | loading | ok | error
  const [rateAge, setRateAge]       = useState(null);
  const [copiedBwp, setCopiedBwp]   = useState(false);

  // Fetch live rate from Open Exchange Rates (free, no key for USD base)
  const fetchRate = useCallback(async () => {
    setRateStatus('loading');
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.rates?.BWP) {
        setRate(data.rates.BWP);
        setRateAge(new Date());
        setRateStatus('ok');
      } else {
        setRateStatus('error');
      }
    } catch {
      setRateStatus('error');
    }
  }, []);

  useEffect(() => { fetchRate(); }, [fetchRate]);

  const bwpResult = useMemo(() => {
    const usd = parseFloat(usdAmount) || 0;
    if (!rate || usd === 0) return null;
    return usd * rate;
  }, [usdAmount, rate]);

  const useAsBwp = () => {
    if (bwpResult !== null) setVehiclePrice(bwpResult.toFixed(2));
  };

  const copyBwp = () => {
    if (bwpResult === null) return;
    navigator.clipboard.writeText(bwpResult.toFixed(2)).then(() => {
      setCopiedBwp(true);
      setTimeout(() => setCopiedBwp(false), 2000);
    });
  };

  // ── Import calculator ────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const price = parseFloat(vehiclePrice) || 0;
    const mgn   = parseFloat(margin) || 0;
    const vat   = price * VAT_RATE;
    const duty  = price * DUTY_RATE;
    const total = price + vat + duty + REG_FEE + BOND_FEE + mgn;
    return { price, vat, duty, mgn, total };
  }, [vehiclePrice, margin]);

  const handleCopy = () => {
    navigator.clipboard.writeText(calc.total.toFixed(2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const ready = calc.price > 0;

  return (
    <div className="pc-page">

      {/* ── USD → BWP Converter ─────────────────────────────────────────────── */}
      <div className="pc-card pc-card--converter">
        <div className="pc-header">
          <div className="pc-header-row">
            <div>
              <h2 className="pc-title">USD → BWP Converter</h2>
              <p className="pc-sub">Live exchange rate — convert a USD price to Pula.</p>
            </div>
            <div className="pc-rate-badge">
              {rateStatus === 'loading' && <span className="pc-rate-loading">Fetching rate…</span>}
              {rateStatus === 'ok' && (
                <span className="pc-rate-ok">
                  1 USD = {rate?.toFixed(4)} BWP
                  <span className="pc-rate-time">
                    {rateAge ? `· ${rateAge.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                </span>
              )}
              {rateStatus === 'error' && (
                <button className="pc-rate-retry" onClick={fetchRate}>Retry</button>
              )}
            </div>
          </div>
        </div>

        <div className="pc-converter-body">
          <div className="pc-field">
            <label className="pc-label">Amount (USD)</label>
            <div className="pc-input-wrap">
              <span className="pc-prefix">$</span>
              <input
                className="pc-input"
                type="number"
                min="0"
                placeholder="0.00"
                value={usdAmount}
                onChange={e => setUsdAmount(e.target.value)}
              />
            </div>
          </div>

          {bwpResult !== null && (
            <div className="pc-conv-result">
              <span className="pc-conv-label">Converted</span>
              <span className="pc-conv-value">{fmtP(bwpResult)}</span>
              <div className="pc-conv-actions">
                <button className="pc-conv-use" onClick={useAsBwp}>
                  Use as Vehicle Price
                </button>
                <button className="pc-copy-btn pc-copy-btn--sm" onClick={copyBwp}>
                  {copiedBwp ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {rateStatus === 'error' && (
            <p className="pc-rate-err">Could not fetch live rate. Check your connection and retry.</p>
          )}
        </div>
      </div>

      {/* ── Import Price Calculator ──────────────────────────────────────────── */}
      <div className="pc-card">
        <div className="pc-header">
          <h2 className="pc-title">SA Import Price Calculator</h2>
          <p className="pc-sub">Enter the vehicle price (BWP) and your margin to get the final selling price.</p>
        </div>

        <div className="pc-inputs">
          <div className="pc-field">
            <label className="pc-label">Vehicle Price (BWP)</label>
            <div className="pc-input-wrap">
              <span className="pc-prefix">P</span>
              <input
                className="pc-input"
                type="number"
                min="0"
                placeholder="0.00"
                value={vehiclePrice}
                onChange={e => setVehiclePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="pc-field">
            <label className="pc-label">Margin (BWP)</label>
            <div className="pc-input-wrap">
              <span className="pc-prefix">P</span>
              <input
                className="pc-input"
                type="number"
                min="0"
                placeholder="0.00"
                value={margin}
                onChange={e => setMargin(e.target.value)}
              />
            </div>
          </div>
        </div>

        {ready && (
          <div className="pc-breakdown">
            <div className="pc-breakdown-title">Breakdown</div>

            <div className="pc-row">
              <span className="pc-row-label">Vehicle Price</span>
              <span className="pc-row-value">{fmtP(calc.price)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">Duty (27%)</span>
              <span className="pc-row-value">{fmtP(calc.duty)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">VAT (14%)</span>
              <span className="pc-row-value">{fmtP(calc.vat)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">Registration Fee</span>
              <span className="pc-row-value">{fmtP(REG_FEE)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">Bond Fee</span>
              <span className="pc-row-value">{fmtP(BOND_FEE)}</span>
            </div>
            {calc.mgn > 0 && (
              <div className="pc-row">
                <span className="pc-row-label">Margin</span>
                <span className="pc-row-value">{fmtP(calc.mgn)}</span>
              </div>
            )}

            <div className="pc-total-row">
              <span className="pc-total-label">Total Selling Price</span>
              <span className="pc-total-value">{fmtP(calc.total)}</span>
            </div>

            <button className="pc-copy-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Total'}
            </button>
          </div>
        )}

        {!ready && (
          <div className="pc-empty">Enter a vehicle price to see the breakdown.</div>
        )}
      </div>
    </div>
  );
};

export default PriceCalculator;
