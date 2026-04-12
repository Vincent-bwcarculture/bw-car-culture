// CheckinReminderModal.js — shown on dashboard entry if not checked in or overdue for checkout
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CheckinReminderModal.css';

const API = process.env.REACT_APP_API_URL || '/api';
const OVERDUE_HOURS = 14;

const CheckinReminderModal = ({ user }) => {
  const [modal, setModal] = useState(null); // null | 'not-in' | 'overdue'
  const [checkinTime, setCheckinTime] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/admin/checkins/today`, { headers })
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        const myId = String(user._id || user.id || '');
        const myRecord = (d.data || []).find(c => c.adminId === myId);

        if (!myRecord) {
          // Not checked in at all today
          setModal('not-in');
        } else if (!myRecord.checkOut) {
          // Checked in but not out — check if overdue
          const [inH, inM] = myRecord.checkIn.split(':').map(Number);
          const now = new Date();
          const elapsedMins = now.getHours() * 60 + now.getMinutes() - (inH * 60 + inM);
          if (elapsedMins >= OVERDUE_HOURS * 60) {
            setCheckinTime(myRecord.checkIn);
            setModal('overdue');
          }
          // Under 14hrs checked in → no modal, they're actively working
        }
        // Already checked out → no modal
      })
      .catch(() => {});
  }, [user]);

  if (!modal || dismissed) return null;

  const firstName = (user?.name || 'Admin').split(' ')[0];
  const isNotIn = modal === 'not-in';

  return (
    <div className="cir-overlay">
      <div className="cir-modal">
        <div className="cir-icon">{isNotIn ? '◌' : '⏱'}</div>

        <h2 className="cir-title">
          {isNotIn
            ? `Good to see you, ${firstName}!`
            : `Still checked in, ${firstName}`}
        </h2>

        <p className="cir-sub">
          {isNotIn
            ? "You haven't checked in yet today."
            : `You checked in at ${checkinTime} and it's been over ${OVERDUE_HOURS} hours.`}
        </p>

        <div className="cir-body">
          {isNotIn ? (
            <>
              <p>Starting your day with a check-in keeps your contributions visible and your time accounted for. It also helps the team know who's active.</p>
              <p>Your daily logs are part of how we understand team effort, track progress toward the mission, and make decisions about where to invest resources and support.</p>
              <p className="cir-highlight">Head over to the <strong>Operations Centre → Team</strong> section to check in and add a note on what you're working on today.</p>
            </>
          ) : (
            <>
              <p>It looks like you're still checked in from this morning. If you've wrapped up for the day, don't forget to log your checkout.</p>
              <p>Accurate checkout times help the team get a clear picture of hours contributed and ensure your work is fully accounted for when assessing contributions and planning ahead.</p>
              <p className="cir-highlight">Head to <strong>Operations Centre → Team</strong> to check out and leave a note on what you accomplished today.</p>
            </>
          )}
        </div>

        <div className="cir-actions">
          <button className="cir-btn cir-btn--ghost" onClick={() => setDismissed(true)}>
            {isNotIn ? 'I'll check in later' : 'Remind me later'}
          </button>
          <Link to="/admin/ops" className="cir-btn cir-btn--primary" onClick={() => setDismissed(true)}>
            {isNotIn ? '● Go Check In' : '○ Go Check Out'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckinReminderModal;
