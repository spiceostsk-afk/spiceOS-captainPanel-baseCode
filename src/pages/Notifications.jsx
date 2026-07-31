import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../context/useRestaurant';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import './Notifications.css';

function Notifications() {
  const navigate = useNavigate();
  const {
    waiterCalls = [],
    resolvedCalls = [],
    fetchResolvedCalls,
    completeWaiterCall,
    tables = [],
    loading,
  } = useRestaurant();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchResolvedCalls();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchResolvedCalls();
    setIsRefreshing(false);
  };

  // Priority queue: SOS first, then oldest first.
  const sortedActiveCalls = [...waiterCalls].sort((a, b) => {
    if (a.is_sos && !b.is_sos) return -1;
    if (!a.is_sos && b.is_sos) return 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const getElapsedTime = (timestamp) => {
    if (!timestamp) return 'just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'just now';
    return `${diff} min ago`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCallClick = (call) => {
    if (call.is_sos) return;
    const targetTable = tables.find((t) => t.dbId === call.table_id || t.id === call.table_id);
    if (targetTable) {
      navigate(`/menu?tableId=${targetTable.dbId || targetTable.id}&sessionId=${targetTable.sessionId || ''}`);
    } else {
      navigate('/menu');
    }
  };

  const activeSosCount = waiterCalls.filter((c) => c.is_sos).length;
  const activeRegularCount = waiterCalls.filter((c) => !c.is_sos).length;
  const resolvedCount = resolvedCalls.length;

  return (
    <div className="notifications-page" id="notifications-page">
      <div className="notifications-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Priority guest calls and live waiter requests.</p>
        </div>
        <button
          className="notifications-refresh-btn"
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          title="Refresh alerts"
          id="btn-notifications-refresh"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
          Sync alerts
        </button>
      </div>

      <div className="notifications-stats-grid">
        <StatCard
          label="Active SOS"
          value={activeSosCount}
          icon={AlertTriangle}
          variant={activeSosCount > 0 ? 'occupied' : 'total'}
        />
        <StatCard label="Pending calls" value={activeRegularCount} icon={Bell} variant="waiting" />
        <StatCard label="Resolved today" value={resolvedCount} icon={CheckCircle2} variant="available" />
      </div>

      <div className="notifications-layout-grid">
        {/* ---- Priority queue ---- */}
        <div className="notifications-panel-card">
          <div className="panel-card-header">
            <h3>Priority queue ({sortedActiveCalls.length})</h3>
            <span className="queue-status-badge text-priority">SOS &amp; oldest first</span>
          </div>

          <div className="panel-card-body">
            {sortedActiveCalls.length > 0 ? (
              sortedActiveCalls.map((call) => (
                <div
                  key={call.id}
                  className={`notifications-item-card ${call.is_sos ? 'item-card--sos' : 'item-card--clickable'}`}
                  onClick={() => handleCallClick(call)}
                >
                  <div className="notifications-item-card__row">
                    <span className="item-card-table">{call.table_number || 'GEN'}</span>

                    <div className="item-card-info">
                      <div className="item-card-message">
                        {call.request_type || 'Call waiter'}
                        {call.is_sos && <span className="sos-pill">Emergency SOS</span>}
                      </div>
                      <div className="item-card-meta">
                        {getElapsedTime(call.created_at)}
                        {call.customer_name && call.customer_name !== 'Guest' && ` · ${call.customer_name}`}
                      </div>
                    </div>
                  </div>

                  {call.is_sos ? (
                    <div
                      className="item-card-locked"
                      title="SOS calls can only be resolved from the guest's device"
                    >
                      <Lock size={15} /> Resolved by the guest’s device
                    </div>
                  ) : (
                    <button
                      className="item-card-resolve-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        completeWaiterCall(call.id);
                      }}
                      id={`btn-page-resolve-call-${call.id}`}
                    >
                      <Check size={17} /> Resolve
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="panel-empty-state">
                <div className="panel-empty-state__mark panel-empty-state__mark--ok">
                  <Check size={30} />
                </div>
                <h4>All calls resolved</h4>
                <p>Nothing needs you right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Resolved log ---- */}
        <div className="notifications-panel-card notifications-panel-card--muted">
          <div className="panel-card-header">
            <h3>Resolved this shift ({resolvedCount})</h3>
            <span className="queue-status-badge text-resolved">Audit trail</span>
          </div>

          {resolvedCount > 0 ? (
            <div className="resolved-log">
              {resolvedCalls.map((call) => (
                <div key={call.id} className="resolved-log__row">
                  <span className="resolved-log__table">{call.table_number || 'GEN'}</span>
                  <span className="resolved-log__text">
                    {call.request_type || 'Call waiter'}
                    {call.is_sos && <span className="resolved-log__sos">SOS</span>}
                  </span>
                  <span className="resolved-log__time">
                    {formatTime(call.completed_at || call.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-empty-state">
              <div className="panel-empty-state__mark panel-empty-state__mark--idle">
                <Clock size={30} />
              </div>
              <h4>No history yet</h4>
              <p>Calls resolved during this shift will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
