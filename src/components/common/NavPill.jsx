import { useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../context/useRestaurant';
import './NavPill.css';

/**
 * Thumb-reach shortcut to the three screens a captain lives in during service.
 * Everything else stays in the drawer.
 */
function NavPill() {
  const location = useLocation();
  const navigate = useNavigate();
  const { waitingList, waiterCalls } = useRestaurant();

  const items = [
    { key: 'floor', label: 'Floor', path: '/', match: (p) => p === '/' },
    {
      key: 'waitlist',
      label: 'Waitlist',
      path: '/waiting-list',
      match: (p) => p.startsWith('/waiting-list'),
      badge: (waitingList || []).length,
      tone: 'neutral',
    },
    {
      key: 'alerts',
      label: 'Alerts',
      path: '/notifications',
      match: (p) => p.startsWith('/notifications'),
      badge: (waiterCalls || []).length,
      tone: 'danger',
    },
  ];

  return (
    <div className="nav-pill" id="nav-pill">
      {items.map((item) => {
        const active = item.match(location.pathname);
        return (
          <button
            key={item.key}
            className={`nav-pill__btn ${active ? 'nav-pill__btn--active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
            {item.badge > 0 && (
              <span className={`nav-pill__badge nav-pill__badge--${item.tone} ${active ? 'is-on-active' : ''}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default NavPill;
