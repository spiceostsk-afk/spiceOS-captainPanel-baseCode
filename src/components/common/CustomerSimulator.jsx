import React, { useState } from 'react';
import { X, Smartphone, Bell, AlertTriangle, CheckCircle2, Send, HelpCircle, User, MessageCircle } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './CustomerSimulator.css';

function CustomerSimulator({ onClose }) {
  const { tables, waiterCalls, createWaiterCall, completeWaiterCall } = useRestaurant();
  
  // Default to first table or 'T-01'
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.dbId || 'T-01');
  const [customMsg, setCustomMsg] = useState('');
  const [customSosMsg, setCustomSosMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('request'); // 'request' or 'active'

  const selectedTable = tables.find(t => t.dbId === selectedTableId || t.id === selectedTableId) || tables[0];
  const activeTableCalls = waiterCalls.filter(
    call => call.table_id === selectedTableId || 
            String(call.table_number) === String(selectedTable?.id || '').replace(/^T-/, '')
  );

  const handleSendCall = async (msgText, isSos = false) => {
    if (!msgText.trim()) return;
    setIsSending(true);
    try {
      await createWaiterCall({
        tableNumber: selectedTable?.id || selectedTableId,
        customerName: selectedTable?.guest || 'Guest',
        message: msgText,
        is_sos: isSos
      });
      if (isSos) {
        setCustomSosMsg('');
      } else {
        setCustomMsg('');
      }
      // Switch tab to active requests to show the customer the request was sent
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to send call:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveCall = async (callId) => {
    try {
      await completeWaiterCall(callId);
    } catch (err) {
      console.error('Failed to resolve call:', err);
    }
  };

  return (
    <div className="customer-sim-backdrop" onClick={onClose} id="customer-simulator">
      <div className="customer-sim-container" onClick={(e) => e.stopPropagation()}>
        {/* Smartphone Border Mockup */}
        <div className="phone-wrapper">
          {/* Phone Header Indicator */}
          <div className="phone-notch"></div>
          
          <div className="phone-screen">
            {/* Screen Top Bar */}
            <div className="screen-header">
              <div className="screen-header__info">
                <Smartphone size={16} />
                <span>Customer Console</span>
              </div>
              <button className="screen-close-btn" onClick={onClose} title="Close Simulator">
                <X size={18} />
              </button>
            </div>

            {/* Table Details Area */}
            <div className="screen-table-selector">
              <label htmlFor="table-select" className="selector-label">Seated Table</label>
              <div className="select-container">
                <select
                  id="table-select"
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="table-dropdown"
                >
                  {tables.map((t) => (
                    <option key={t.dbId} value={t.dbId}>
                      Table {t.id} ({t.guest ? `${t.guest}` : 'Empty / Walk-in'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="selected-table-info">
                <div className="guest-badge">
                  <User size={12} />
                  <span>{selectedTable?.guest || 'No Active Guest'}</span>
                </div>
                <div className="status-badge-inline">
                  <span>Status: {selectedTable?.status || 'available'}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="screen-tabs">
              <button
                className={`tab-btn ${activeTab === 'request' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab('request')}
              >
                Send Request
              </button>
              <button
                className={`tab-btn ${activeTab === 'active' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active Call List ({activeTableCalls.length})
              </button>
            </div>

            {/* Main Scrollable Screen Content */}
            <div className="screen-body">
              {activeTab === 'request' ? (
                <div className="request-pane">
                  
                  {/* Normal Call Section */}
                  <div className="request-section">
                    <h3 className="section-title-sim text-amber-500">
                      <Bell size={14} className="inline mr-1" />
                      Normal Waiter Request
                    </h3>
                    <p className="section-desc-sim">Standard requests that captains can complete directly from their dashboard.</p>
                    
                    <div className="quick-grid">
                      <button 
                        onClick={() => handleSendCall('Request Water 💧')}
                        disabled={isSending}
                        className="quick-btn"
                      >
                        Water 💧
                      </button>
                      <button 
                        onClick={() => handleSendCall('Need Napkins 🧻')}
                        disabled={isSending}
                        className="quick-btn"
                      >
                        Napkins 🧻
                      </button>
                      <button 
                        onClick={() => handleSendCall('Bring Bill 🧾')}
                        disabled={isSending}
                        className="quick-btn"
                      >
                        Bring Bill 🧾
                      </button>
                      <button 
                        onClick={() => handleSendCall('Extra Cutlery 🍴')}
                        disabled={isSending}
                        className="quick-btn"
                      >
                        Cutlery 🍴
                      </button>
                    </div>

                    <div className="custom-input-group">
                      <input 
                        type="text" 
                        placeholder="Type standard request..."
                        value={customMsg}
                        onChange={(e) => setCustomMsg(e.target.value)}
                        className="custom-sim-input"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendCall(customMsg)}
                      />
                      <button 
                        onClick={() => handleSendCall(customMsg)}
                        disabled={isSending || !customMsg.trim()}
                        className="send-sim-btn"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  {/* SOS Call Section */}
                  <div className="request-section request-section--sos">
                    <h3 className="section-title-sim text-red-500">
                      <AlertTriangle size={14} className="inline mr-1 text-red-500 animate-pulse" />
                      SOS Query & Complaint
                    </h3>
                    <p className="section-desc-sim">Urgent queries or complaints. <strong>These remain open until you close them.</strong> Captains cannot dismiss SOS notifications.</p>
                    
                    <div className="quick-grid">
                      <button 
                        onClick={() => handleSendCall('SOS: Service is too slow ⏳', true)}
                        disabled={isSending}
                        className="quick-btn quick-btn--sos"
                      >
                        Slow Service ⏳
                      </button>
                      <button 
                        onClick={() => handleSendCall('SOS: Wrong / Cold Food 🍲', true)}
                        disabled={isSending}
                        className="quick-btn quick-btn--sos"
                      >
                        Wrong Food 🍲
                      </button>
                      <button 
                        onClick={() => handleSendCall('SOS: Hygiene / Cleanliness 🧹', true)}
                        disabled={isSending}
                        className="quick-btn quick-btn--sos"
                      >
                        Cleanliness 🧹
                      </button>
                      <button 
                        onClick={() => handleSendCall('SOS: Staff Behavior Complaint 😠', true)}
                        disabled={isSending}
                        className="quick-btn quick-btn--sos"
                      >
                        Staff Complain 😠
                      </button>
                    </div>

                    <div className="custom-input-group">
                      <input 
                        type="text" 
                        placeholder="Type SOS complain or query..."
                        value={customSosMsg}
                        onChange={(e) => setCustomSosMsg(e.target.value)}
                        className="custom-sim-input custom-sim-input--sos"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendCall(customSosMsg, true)}
                      />
                      <button 
                        onClick={() => handleSendCall(customSosMsg, true)}
                        disabled={isSending || !customSosMsg.trim()}
                        className="send-sim-btn send-sim-btn--sos"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="active-pane">
                  <h3 className="section-title-sim">Active Requests for Table {selectedTable?.id}</h3>
                  {activeTableCalls.length > 0 ? (
                    <div className="sim-calls-list">
                      {activeTableCalls.map((call) => (
                        <div 
                          key={call.id} 
                          className={`sim-call-card ${call.is_sos ? 'sim-call-card--sos' : ''}`}
                        >
                          <div className="sim-call-card__header">
                            <span className="sim-call-card__time">
                              {call.is_sos ? '🚨 SOS Alert' : '🔔 Normal Request'}
                            </span>
                            <span className="sim-call-card__ago">Just now</span>
                          </div>
                          <div className="sim-call-card__msg">{call.request_type}</div>
                          
                          <div className="sim-call-card__footer">
                            <span className="sim-call-card__status">
                              {call.is_sos ? 'Awaiting your resolution' : 'Pending captain action'}
                            </span>
                            <button
                              onClick={() => handleResolveCall(call.id)}
                              className="sim-resolve-btn"
                              title="Close / Resolve this call"
                            >
                              <CheckCircle2 size={12} className="inline mr-1" />
                              Close
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-sim-state">
                      <HelpCircle size={36} className="empty-icon" />
                      <p>No pending calls for this table.</p>
                      <button className="empty-action-btn" onClick={() => setActiveTab('request')}>
                        Create one now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerSimulator;
