import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../context/useRestaurant';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, Lock, RefreshCw, CheckCircle2, User } from 'lucide-react';
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
    loading 
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

  // Priority queue sorting logic: SOS calls first, then oldest first
  const sortedActiveCalls = [...waiterCalls].sort((a, b) => {
    if (a.is_sos && !b.is_sos) return -1;
    if (!a.is_sos && b.is_sos) return 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const getElapsedTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCallClick = (call) => {
    if (call.is_sos) return;
    const targetTable = tables.find(t => t.dbId === call.table_id || t.id === call.table_id);
    if (targetTable) {
      navigate(`/menu?tableId=${targetTable.dbId || targetTable.id}&sessionId=${targetTable.sessionId || ''}`);
    } else {
      navigate('/menu');
    }
  };

  // Metrics
  const activeSosCount = waiterCalls.filter(c => c.is_sos).length;
  const activeRegularCount = waiterCalls.filter(c => !c.is_sos).length;
  const resolvedCount = resolvedCalls.length;

  return (
    <div className="notifications-page" id="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div>
          <h1 className="page-title">Notifications Center</h1>
          <p className="page-subtitle">Manage priority client calls and live waiter request alerts</p>
        </div>
        <button 
          className="notifications-refresh-btn" 
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          title="Refresh Alerts"
          id="btn-notifications-refresh"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
          <span>Sync Alerts</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="notifications-stats-grid">
        <StatCard 
          label="Active SOS Alerts" 
          value={activeSosCount} 
          icon={AlertTriangle} 
          variant={activeSosCount > 0 ? 'occupied' : 'total'} 
          id="stat-active-sos"
        />
        <StatCard 
          label="Pending Calls" 
          value={activeRegularCount} 
          icon={Bell} 
          variant="waiting" 
          id="stat-active-calls"
        />
        <StatCard 
          label="Resolved Today" 
          value={resolvedCount} 
          icon={CheckCircle2} 
          variant="available" 
          id="stat-total-resolved"
        />
      </div>

      {/* Grid Layout for Active vs Resolved */}
      <div className="notifications-layout-grid">
        {/* Active Requests Queue (Priority List) */}
        <div className="notifications-panel-card">
          <div className="panel-card-header">
            <h3>Priority Queue ({sortedActiveCalls.length})</h3>
            <span className="queue-status-badge text-priority">SOS & Oldest First</span>
          </div>

          <div className="panel-card-body active-calls-list">
            {sortedActiveCalls.length > 0 ? (
              sortedActiveCalls.map((call) => (
                <div 
                  key={call.id}
                  className={`notifications-item-card ${
                    call.is_sos ? 'item-card--sos' : 'item-card--clickable'
                  }`}
                  onClick={() => handleCallClick(call)}
                >
                  <div className={`item-card-avatar ${call.is_sos ? 'avatar--sos' : ''}`}>
                    {call.is_sos ? <AlertTriangle size={18} className="animate-pulse" /> : <Bell size={18} />}
                  </div>

                  <div className="item-card-info">
                    <div className="item-card-row-top">
                      <span className="item-card-title">
                        Table {call.table_number || 'General'}
                        {call.is_sos && <span className="sos-pill animate-pulse">EMERGENCY SOS</span>}
                      </span>
                      <span className="item-card-time">
                        <Clock size={12} />
                        {getElapsedTime(call.created_at)}
                      </span>
                    </div>

                    {call.customer_name && call.customer_name !== 'Guest' && (
                      <div className="item-card-guest">
                        <User size={12} className="inline mr-1 opacity-70" />
                        <span>Guest: {call.customer_name}</span>
                      </div>
                    )}

                    <div className="item-card-message">
                      {call.request_type || 'Call Waiter'}
                    </div>
                  </div>

                  {call.is_sos ? (
                    <div 
                      className="item-card-action-disabled"
                      title="Locked: SOS calls can only be resolved by the guest's device"
                    >
                      <Lock size={16} />
                    </div>
                  ) : (
                    <button 
                      className="item-card-action-btn"
                      title="Resolve Request"
                      onClick={(e) => {
                        e.stopPropagation();
                        completeWaiterCall(call.id);
                      }}
                      id={`btn-page-resolve-call-${call.id}`}
                    >
                      <Check size={18} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="panel-empty-state">
                <CheckCircle2 size={48} className="text-available" />
                <h4>All Calls Resolved</h4>
                <p>No pending customer requests at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resolved History Logs */}
        <div className="notifications-panel-card">
          <div className="panel-card-header">
            <h3>Recently Resolved ({resolvedCalls.length})</h3>
            <span className="queue-status-badge text-resolved">Audit Trail</span>
          </div>

          <div className="panel-card-body resolved-calls-list">
            {resolvedCalls.length > 0 ? (
              resolvedCalls.map((call) => (
                <div key={call.id} className="notifications-item-card item-card--resolved">
                  <div className="item-card-avatar avatar--resolved">
                    <Check size={18} />
                  </div>

                  <div className="item-card-info">
                    <div className="item-card-row-top">
                      <span className="item-card-title text-resolved">
                        Table {call.table_number || 'General'}
                        {call.is_sos && <span className="sos-pill-resolved">SOS</span>}
                      </span>
                      <span className="item-card-time">
                        Resolved at {formatTime(call.completed_at || call.created_at)}
                      </span>
                    </div>

                    {call.customer_name && call.customer_name !== 'Guest' && (
                      <div className="item-card-guest">
                        <User size={12} className="inline mr-1 opacity-70" />
                        <span>Guest: {call.customer_name}</span>
                      </div>
                    )}

                    <div className="item-card-message line-through">
                      {call.request_type || 'Call Waiter'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="panel-empty-state">
                <Clock size={48} className="text-tertiary" />
                <h4>No History Yet</h4>
                <p>Calls marked as resolved during this shift will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
