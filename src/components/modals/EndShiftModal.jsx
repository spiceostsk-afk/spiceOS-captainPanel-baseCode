import React, { useState } from 'react';
import { X, Calendar, DollarSign, ClipboardList, Utensils, Bell, Loader, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './modal-shell.css';
import './EndShiftModal.css';

function EndShiftModal({ reportData, onClose }) {
  const { endShift } = useRestaurant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (startIso, endIso) => {
    if (!startIso || !endIso) return '--';
    const start = new Date(startIso);
    const end = new Date(endIso);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await endShift(reportData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to submit the shift report.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const duration = calculateDuration(reportData.shift_start, reportData.shift_end);

  return (
    <div className="modal-overlay" onClick={!loading ? onClose : null} id="end-shift-modal-overlay">
      <div className="modal end-shift-modal" onClick={(e) => e.stopPropagation()} id="end-shift-modal">
        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-left">
            <div className="modal__header-icon end-shift-icon">
              <Calendar />
            </div>
            <div className="modal__header-text">
              <h2>End shift</h2>
              <span>Captain: {reportData.captain_name}</span>
            </div>
          </div>
          {!loading && !success && (
            <button className="modal__close" onClick={onClose} id="btn-modal-close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal__body">
          {success ? (
            <div className="end-shift-success">
              <div className="success-icon-container">
                <CheckCircle2 size={64} className="success-checkmark" />
              </div>
              <h3>Shift report submitted</h3>
              <p>The report is saved and now visible in the manager dashboard.</p>
              
              <div className="final-summary-card">
                <h4>Shift summary</h4>
                <div className="summary-row">
                  <span>Duration</span>
                  <strong>{duration}</strong>
                </div>
                <div className="summary-row">
                  <span>Collected</span>
                  <strong className="text-revenue">₹{reportData.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                </div>
                <div className="summary-row">
                  <span>Tables served</span>
                  <strong>{reportData.total_tables_served}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="end-shift-preview">
              <p className="end-shift-intro">
                Review the summary below. Ending the shift finalises these numbers and resets the timer for the next one.
              </p>

              {error && (
                <div className="end-shift-error">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Time stats */}
              <div className="shift-time-summary">
                <div className="time-stat">
                  <span className="stat-label">Start</span>
                  <span className="stat-val">{formatTime(reportData.shift_start)}</span>
                </div>
                <div className="time-divider">➜</div>
                <div className="time-stat">
                  <span className="stat-label">End</span>
                  <span className="stat-val">{formatTime(reportData.shift_end)}</span>
                </div>
                <div className="time-stat duration-badge">
                  <span className="stat-label">Duration</span>
                  <span className="stat-val">{duration}</span>
                </div>
              </div>

              {/* Metric grid */}
              <div className="shift-metrics-grid">
                <div className="metric-box">
                  <div className="metric-icon val-revenue"><DollarSign size={20} /></div>
                  <div className="metric-info">
                    <span className="metric-label">Collected</span>
                    <span className="metric-value">₹{reportData.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="metric-box">
                  <div className="metric-icon val-tables"><ClipboardList size={20} /></div>
                  <div className="metric-info">
                    <span className="metric-label">Tables served</span>
                    <span className="metric-value">{reportData.total_tables_served}</span>
                  </div>
                </div>

                <div className="metric-box">
                  <div className="metric-icon val-orders"><Utensils size={20} /></div>
                  <div className="metric-info">
                    <span className="metric-label">Orders</span>
                    <span className="metric-value">{reportData.total_orders}</span>
                  </div>
                </div>

                <div className="metric-box">
                  <div className="metric-icon val-calls"><Bell size={20} /></div>
                  <div className="metric-info">
                    <span className="metric-label">Waiter calls</span>
                    <span className="metric-value">{reportData.total_waiter_calls}</span>
                  </div>
                </div>
              </div>

              {reportData.breakdown?.length > 0 && (
                <div className="shift-breakdown">
                  <h4>Breakdown by table</h4>
                  <table className="shift-breakdown__table">
                    <thead>
                      <tr>
                        <th>Table</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.breakdown.map((b) => (
                        <tr key={b.table}>
                          <td>{b.table}</td>
                          <td>{b.orders}</td>
                          <td>₹{b.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal__footer">
          {success ? (
            <button 
              className="modal__btn-submit success-btn" 
              onClick={onClose} 
              id="btn-shift-close"
            >
              Back to floor
            </button>
          ) : (
            <>
              <button 
                className="modal__btn-cancel" 
                onClick={onClose} 
                disabled={loading}
                id="btn-shift-cancel"
              >
                Cancel
              </button>
              <button 
                className="modal__btn-submit end-shift-confirm-btn" 
                onClick={handleConfirm} 
                disabled={loading}
                id="btn-shift-confirm"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <span>End shift &amp; submit report</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EndShiftModal;
