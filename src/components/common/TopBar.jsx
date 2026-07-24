import { useState } from 'react';
import { Search, RefreshCw, Settings, Bell, Smartphone, LogOut } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import { useAuth } from '../../context/AuthContext';
import EndShiftModal from '../modals/EndShiftModal';
import './TopBar.css';

function TopBar() {
  const {
    createWaiterCall,
    refresh,
    setShowCustomerSim,
    generateShiftReport,
    isShiftActive,
    startShift
  } = useRestaurant();
  const { signOut, user } = useAuth();
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleSimulateCall = async () => {
    const randomTables = ['01', '02', '03', '05', '12', 'VIP-1'];
    const randomTable = randomTables[Math.floor(Math.random() * randomTables.length)];
    const messages = ['Call Waiter', 'Water Refill Please', 'Bill / Check Requested', 'Extra Cutlery'];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    
    await createWaiterCall({
      tableNumber: randomTable,
      customerName: 'Aman VIP',
      message: randomMsg
    });
  };

  const handleEndShiftClick = async () => {
    try {
      const data = await generateShiftReport();
      setReportData(data);
      setShowEndShiftModal(true);
    } catch (err) {
      console.error('Error generating shift report:', err);
      alert('Failed to generate shift report: ' + err.message);
    }
  };

  return (
    <header className="topbar" id="topbar">
      {/* Search */}
      <div className="topbar__search" id="topbar-search">
        <Search />
        <input type="text" placeholder="Search table or guest..." />
      </div>

      {/* Status */}
      <div className="topbar__status">
        <div className="topbar__status-dot" style={{ backgroundColor: isShiftActive ? '#10b981' : '#ef4444', boxShadow: isShiftActive ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : '0 0 0 3px rgba(239, 68, 68, 0.15)' }} />
        <span>Status: {isShiftActive ? 'Shift Active' : 'Shift Ended'}</span>
      </div>



      {/* Actions */}
      <div className="topbar__actions">
        <button 
          className="topbar__btn" 
          style={{ borderColor: '#10b981', color: '#10b981' }}
          onClick={() => setShowCustomerSim(true)}
          title="Open Customer Simulator"
          id="btn-customer-sim"
          disabled={!isShiftActive}
        >
          <Smartphone size={16} />
          <span>Customer Sim</span>
        </button>
        <button 
          className="topbar__btn" 
          style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
          onClick={handleSimulateCall}
          title="Simulate Customer Calling Waiter"
          disabled={!isShiftActive}
        >
          <Bell size={16} className={isShiftActive ? 'animate-bounce' : ''} />
          <span>Test Call</span>
        </button>
        <button className="topbar__btn" id="btn-sync" onClick={refresh} title="Sync" disabled={!isShiftActive}>
          <RefreshCw />
          <span>Sync</span>
        </button>
        
        {isShiftActive ? (
          <button 
            className="topbar__btn topbar__btn--end-shift" 
            id="btn-end-shift"
            onClick={handleEndShiftClick}
            title="End Shift and Generate Report"
          >
            End Shift
          </button>
        ) : (
          <button 
            className="topbar__btn topbar__btn--start-shift" 
            id="btn-start-shift"
            onClick={startShift}
            title="Start New Shift"
          >
            Start Shift
          </button>
        )}
        <div className="topbar__avatar" id="topbar-avatar" title="Settings">
          <Settings size={16} />
        </div>
        <button
          className="topbar__btn"
          onClick={signOut}
          title={user?.email ? `Sign out (${user.email})` : 'Sign out'}
          id="btn-logout"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {showEndShiftModal && reportData && (
        <EndShiftModal 
          reportData={reportData} 
          onClose={() => setShowEndShiftModal(false)} 
        />
      )}
    </header>
  );
}

export default TopBar;

