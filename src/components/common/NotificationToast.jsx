import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, User, AlertTriangle, Lock } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './NotificationToast.css';

function NotificationToast() {
  const navigate = useNavigate();
  const { waiterCalls, completeWaiterCall, tables } = useRestaurant();
  const [seenIds, setSeenIds] = useState(new Set());
  const prevCallsRef = useRef([]);

  // Helper to play a premium pleasant chime using Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // First note (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      // Second note (A5)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 150);
    } catch (e) {
      console.warn('Audio autoplay prevented or unsupported:', e);
    }
  };

  // Helper to play a distinct alert chime for SOS calls
  const playSOSChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      let count = 0;
      const playBeep = () => {
        if (count >= 10) return; // Play 10 times then stop to avoid infinite annoyance, though it blinks continuously
        count++;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);

        setTimeout(playBeep, 800);
      };
      
      playBeep();
    } catch (e) {
      console.warn('Audio autoplay prevented or unsupported:', e);
    }
  };

  useEffect(() => {
    // Detect newly added calls to trigger chime
    const currentIds = waiterCalls.map(c => c.id);
    const hasNew = waiterCalls.some(call => !seenIds.has(call.id));

    if (hasNew && seenIds.size > 0) {
      const newCalls = waiterCalls.filter(call => !seenIds.has(call.id));
      const hasNewSos = newCalls.some(call => call.is_sos);
      if (hasNewSos) {
        playSOSChime();
      } else {
        playNotificationChime();
      }
    }

    if (waiterCalls.length > 0) {
      setSeenIds(prev => {
        const next = new Set(prev);
        currentIds.forEach(id => next.add(id));
        return next;
      });
    }
    prevCallsRef.current = waiterCalls;
  }, [waiterCalls]);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
  };

  const handleNotificationClick = (call) => {
    if (call.is_sos) return; // Clicking SOS does not navigate or do anything on standard card

    const targetTable = tables.find(t => t.dbId === call.table_id || t.id === call.table_id);
    if (targetTable) {
      navigate(`/menu?tableId=${targetTable.dbId || targetTable.id}&sessionId=${targetTable.sessionId || ''}`);
    } else {
      navigate('/menu');
    }
  };

  if (!waiterCalls || waiterCalls.length === 0) return null;

  return (
    <div className="notification-stack" id="notification-stack">
      {waiterCalls.map((call) => (
        <div 
          key={call.id} 
          className={`notification-toast ${call.is_sos ? 'notification-toast--sos' : 'notification-toast--clickable'}`}
          onClick={() => handleNotificationClick(call)}
        >
          <div className={`notification-toast__icon ${call.is_sos ? 'notification-toast__icon--sos' : ''}`}>
            {call.is_sos ? <AlertTriangle size={20} className="animate-pulse" /> : <Bell size={20} />}
          </div>
          
          <div className="notification-toast__content">
            <div className="notification-toast__header">
              <span className="notification-toast__title">
                Table {call.table_number || 'General'}
                {call.is_sos && <span className="sos-badge">SOS</span>}
              </span>
              <span className="notification-toast__time">
                {getRelativeTime(call.created_at)}
              </span>
            </div>

            {call.customer_name && call.customer_name !== 'Guest' && (
              <div className="notification-toast__guest">
                <User size={12} className="inline mr-1 opacity-70" />
                {call.customer_name}
              </div>
            )}

            <div className="notification-toast__message">
              {call.request_type || 'Call Waiter'}
            </div>
          </div>

          {call.is_sos ? (
            <div 
              className="notification-toast__lock"
              title="Only client can resolve this SOS call"
            >
              <Lock size={18} />
            </div>
          ) : (
            <button
              className="notification-toast__action"
              title="Mark as Completed"
              onClick={(e) => {
                e.stopPropagation();
                completeWaiterCall(call.id);
              }}
            >
              <Check size={18} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default NotificationToast;
