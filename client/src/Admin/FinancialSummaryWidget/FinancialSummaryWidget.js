import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../../config/axios.js';
import './FinancialSummaryWidget.css';

const API = '/api/admin/financial-records';

const formatBWP = (n) =>
  'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const INCOME_CATEGORY_LABELS = {
  car_sales_ad:      'Car Sales Ad',
  company_marketing: 'Company Marketing',
  motorshow_event:   'Motorshow / Event',
  inventory_sale:    'Inventory Sale',
  other_income:      'Other Income',
};

const COLORS = ['#ff3300', '#ff6633', '#ff9966', '#ffcc99', '#e6704d', '#cc5500', '#ffaa00', '#ff7700'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="fsw-tooltip">
      <p className="fsw-tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color, margin: '2px 0' }}>
          {p.name}: {formatBWP(p.value)}
        </p>
      ))}
    </div>
  );
};

const FinancialSummaryWidget = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(API, { params: { limit: 2000 } });
        if (res.data.success) {
          const allRecords = res.data.data || [];
          setRecords(allRecords.filter(r => {
            const year = new Date(r.date).getFullYear();
            return year >= 2026;
          }));
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const income   = records.filter(r => r.type === 'income');
  const expenses = records.filter(r => r.type === 'expense');

  const totalIncome   = income.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const netProfit     = totalIncome - totalExpenses;

  // Top money generators: group income by category
  const byCategory = {};
  income.forEach(r => {
    const key = INCOME_CATEGORY_LABELS[r.category] || r.category || 'Other';
    byCategory[key] = (byCategory[key] || 0) + Number(r.amount || 0);
  });
  const topGenerators = Object.entries(byCategory)
    .map(([name, Revenue]) => ({ name, Revenue }))
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 8);

  if (loading) {
    return (
      <div className="fsw-container fsw-loading">
        <div className="fsw-spinner" />
        <span>Loading financial summary…</span>
      </div>
    );
  }

  return (
    <div className="fsw-container">
      <div className="fsw-header">
        <div>
          <h3 className="fsw-title">Financial Overview</h3>
          <p className="fsw-subtitle">2026 onwards · BW Car Culture</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="fsw-cards">
        <div className="fsw-card income">
          <p className="fsw-card-label">Total Revenue</p>
          <p className="fsw-card-amount">{formatBWP(totalIncome)}</p>
          <p className="fsw-card-sub">{income.length} income records</p>
        </div>
        <div className="fsw-card expense">
          <p className="fsw-card-label">Total Expenses</p>
          <p className="fsw-card-amount">{formatBWP(totalExpenses)}</p>
          <p className="fsw-card-sub">{expenses.length} expense records</p>
        </div>
        <div className={`fsw-card net ${netProfit >= 0 ? 'positive' : 'negative'}`}>
          <p className="fsw-card-label">Net Profit</p>
          <p className="fsw-card-amount">{formatBWP(netProfit)}</p>
          <p className="fsw-card-sub">{netProfit >= 0 ? 'In the green' : 'Negative balance'}</p>
        </div>
      </div>

      {/* Top money generators chart */}
      {topGenerators.length > 0 && (
        <div className="fsw-chart-card">
          <p className="fsw-chart-title">Top Money Generators</p>
          <ResponsiveContainer width="100%" height={Math.max(180, topGenerators.length * 38)}>
            <BarChart
              data={topGenerators}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fill: '#8b949e', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="Revenue" radius={[0, 5, 5, 0]}>
                {topGenerators.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default FinancialSummaryWidget;
