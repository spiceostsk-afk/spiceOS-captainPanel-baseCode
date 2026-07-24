import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, Bell, Utensils, BarChart3 } from 'lucide-react';
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

function Sidebar() {
  const location = useLocation();
  const { logoUrl } = useBranding();

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            : 'SO'}
        </div>
        <div className="sidebar__brand-text">
          <h1>Spice OS</h1>
          <span>Captain Console</span>
        </div>
      </div>

      {/* Navigation */}
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
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <Icon />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Captain Info */}
      <div className="sidebar__captain">
        <div className="sidebar__captain-avatar">{captainInfo.initials}</div>
        <div className="sidebar__captain-info">
          <h4>{captainInfo.name}</h4>
          <span>{captainInfo.role}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-tertiary)', padding: '0.5rem 0 0.75rem', letterSpacing: '0.04em' }}>
        Powered by Spice OS
      </div>
    </aside>
  );
}

export default Sidebar;
