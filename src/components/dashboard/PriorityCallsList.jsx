import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, Lock } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './PriorityCallsList.css';

function PriorityCallsList() {
  const navigate = useNavigate();
  const { waiterCalls = [], completeWaiterCall, tables = [] } = useRestaurant();

  // Sort calls by: 1. SOS calls first, 2. Created_at ascending (oldest first)
  const sortedCalls = [...waiterCalls].sort((a, b) => {
    if (a.is_sos && !b.is_sos) return -1;
    if (!a.is_sos && b.is_sos) return 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const formatElapsedTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
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

  return (
    <section className="priority-calls" id="priority-calls-section">
      <h2 className="priority-calls__title">Priority Call List</h2>

      <div className="priority-calls__cards">
        {sortedCalls.length > 0 ? (
          sortedCalls.map((call) => (
            <div 
              key={call.id} 
              className={`priority-call-card ${call.is_sos ? 'priority-call-card--sos' : 'priority-call-card--clickable'}`} 
              id={`priority-call-card-${call.id}`}
              onClick={() => handleCallClick(call)}
            >
              <div className={`priority-call-card__avatar ${call.is_sos ? 'priority-call-card__avatar--sos' : ''}`}>
                {call.is_sos ? <AlertTriangle size={16} className="animate-pulse" /> : <Bell size={16} />}
              </div>
              <div className="priority-call-card__info">
                <span className="priority-call-card__name">
                  Table {call.table_number || 'General'}
                  {call.is_sos && <span className="priority-call-sos-badge">SOS</span>}
                </span>
                <span className="priority-call-card__meta">
                  <Clock size={12} />
                  {call.request_type || 'Call Waiter'} • {formatElapsedTime(call.created_at)}
                </span>
              </div>
              {call.is_sos ? (
                <div 
                  className="priority-call-card__lock"
                  title="Only client can resolve this SOS call"
                >
                  <Lock size={16} />
                </div>
              ) : (
                <button
                  className="priority-call-card__action"
                  onClick={(e) => {
                    e.stopPropagation();
                    completeWaiterCall(call.id);
                  }}
                  title="Mark Resolved"
                  id={`btn-resolve-call-${call.id}`}
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="priority-calls__empty">
            All calls resolved. No pending requests.
          </div>
        )}
      </div>
    </section>
  );
}

export default PriorityCallsList;
