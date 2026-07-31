import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, Bell, Utensils, BarChart3, X } from 'lucide-react';
import { captainInfo } from '../../data/mockData';
import { useBranding } from '../../context/BrandingContext';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Table Dashboard', icon: LayoutDashboard },
  { path: '/waiting-list', label: 'Waiting List', icon: ClipboardList },
  { path: '/table-management', label: 'Active Customers', icon: Users },
  { path: '/menu', label: 'Menu Selection', icon: Utensils },
  { path: '/reports', label: 'Shift Reports', icon: BarChart3 },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

/**
 * Slide-in navigation drawer. Every destination lives here; the floating pill
 * on the floor is a shortcut to the three a captain uses mid-service.
 */
function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { logoUrl } = useBranding();

  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} id="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon">
            {logoUrl ? <img src={logoUrl} alt="Logo" /> : 'S'}
          </div>
          <div className="sidebar__brand-text">
            <h1>Spice OS</h1>
            <span>Captain Console</span>
          </div>
          <button className="sidebar__close" onClick={onClose} aria-label="Close menu">
            <X size={17} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__captain">
          <div className="sidebar__captain-avatar">{captainInfo.initials}</div>
          <div className="sidebar__captain-info">
            <h4>{captainInfo.name}</h4>
            <span>{captainInfo.role}</span>
          </div>
        </div>

        <div className="sidebar__credit">Powered by Spice OS</div>
      </aside>
    </>
  );
}

export default Sidebar;
