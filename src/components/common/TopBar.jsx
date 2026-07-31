import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, MoreHorizontal } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import { useAuth } from '../../context/AuthContext';
import { captainInfo } from '../../data/mockData';
import EndShiftModal from '../modals/EndShiftModal';
import './TopBar.css';

function TopBar({ onOpenMenu, search, onSearch }) {
  const {
    createWaiterCall,
    refresh,
    setShowCustomerSim,
    generateShiftReport,
    isShiftActive,
    startShift,
    waiterCalls,
  } = useRestaurant();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  const pendingCalls = (waiterCalls || []).length;

  const handleSimulateCall = async () => {
    const randomTables = ['01', '02', '03', '05', '12', 'VIP-1'];
    const randomTable = randomTables[Math.floor(Math.random() * randomTables.length)];
    const messages = ['Call Waiter', 'Water Refill Please', 'Bill / Check Requested', 'Extra Cutlery'];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    await createWaiterCall({
      tableNumber: randomTable,
      customerName: 'Aman VIP',
      message: randomMsg,
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

  /* Everything that used to be its own top-bar button now lives in one menu,
     so the bar stays legible on a tablet held one-handed. */
  const menuItems = [
    { label: 'Waiting list', onTap: () => navigate('/waiting-list') },
    { label: 'Shift report', onTap: () => navigate('/reports') },
    { label: 'Customer Sim', onTap: () => setShowCustomerSim(true), disabled: !isShiftActive },
    { label: 'Test Call', onTap: handleSimulateCall, disabled: !isShiftActive },
    { label: 'Sync', onTap: refresh, disabled: !isShiftActive },
    isShiftActive
      ? { label: 'End shift', onTap: handleEndShiftClick }
      : { label: 'Start shift', onTap: startShift },
    {
      label: 'Logout',
      onTap: signOut,
      muted: true,
      title: user?.email ? `Sign out (${user.email})` : 'Sign out',
    },
  ];

  const run = (item) => {
    if (item.disabled) return;
    setMenuOpen(false);
    item.onTap();
  };

  return (
    <header className="topbar" id="topbar">
      <button className="topbar__hamburger" onClick={onOpenMenu} aria-label="Open menu" id="btn-menu">
        <Menu size={19} />
      </button>

      <div className="topbar__brand">
        <span className="topbar__mark">S</span>
        <span className="topbar__brand-text">
          <span className="topbar__outlet">Main Outlet</span>
          <span className="topbar__captain">{captainInfo.name} · {captainInfo.role}</span>
        </span>
      </div>

      <div className="topbar__search" id="topbar-search">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search table or guest…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="topbar__right">
        <div className="topbar__status">
          <span
            className="topbar__status-dot"
            style={{ background: isShiftActive ? 'var(--color-success)' : 'var(--color-danger)' }}
          />
          {isShiftActive ? 'Shift active' : 'Shift ended'}
        </div>

        <button
          className="topbar__icon"
          onClick={() => navigate('/notifications')}
          title="Notifications"
          id="btn-alerts"
        >
          <Bell size={18} />
          {pendingCalls > 0 && <span className="topbar__badge">{pendingCalls}</span>}
        </button>

        <div className="topbar__menu-wrap">
          <button
            className="topbar__icon"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More actions"
            id="btn-more"
          >
            <MoreHorizontal size={19} />
          </button>

          {menuOpen && (
            <>
              <div className="topbar__menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="topbar__menu">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    className={`topbar__menu-item ${item.muted ? 'is-muted' : ''}`}
                    onClick={() => run(item)}
                    disabled={item.disabled}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
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
