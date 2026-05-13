import React, { useState, useMemo } from 'react';
import './PriceCalculator.css';

const VAT_RATE    = 0.14;
const DUTY_RATE   = 0.27;
const REG_FEE     = 5000;
const BOND_FEE    = 1500;

const fmt = (n) => `P ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PriceCalculator = () => {
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [margin, setMargin]             = useState('');
  const [copied, setCopied]             = useState(false);

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
              <span className="pc-row-value">{fmt(calc.price)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">Duty (27%)</span>
              <span className="pc-row-value">{fmt(calc.duty)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">VAT (14%)</span>
              <span className="pc-row-value">{fmt(calc.vat)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">Registration Fee</span>
              <span className="pc-row-value">{fmt(REG_FEE)}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-label">Bond Fee</span>
              <span className="pc-row-value">{fmt(BOND_FEE)}</span>
            </div>
            {calc.mgn > 0 && (
              <div className="pc-row">
                <span className="pc-row-label">Margin</span>
                <span className="pc-row-value">{fmt(calc.mgn)}</span>
              </div>
            )}

            <div className="pc-total-row">
              <span className="pc-total-label">Total Selling Price</span>
              <span className="pc-total-value">{fmt(calc.total)}</span>
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
