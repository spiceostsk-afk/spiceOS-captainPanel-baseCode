import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import TopBar from './components/common/TopBar';
import NavPill from './components/common/NavPill';
import TableDashboard from './pages/TableDashboard';
import TableManagement from './pages/TableManagement';
import WaitingList from './pages/WaitingList';
import MenuCatalog from './pages/MenuCatalog';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import NotificationToast from './components/common/NotificationToast';
import CustomerSimulator from './components/common/CustomerSimulator';
import ShiftLockOverlay from './components/common/ShiftLockOverlay';
import { RestaurantProvider } from './context/RestaurantContext';
import { useRestaurant } from './context/useRestaurant';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import Login from './components/common/Login';
import NoTenant from './components/common/NoTenant';
import './App.css';

/** The pill only shows on the screens it navigates between. */
const PILL_ROUTES = ['/', '/waiting-list', '/notifications'];

function MainAppLayout() {
  const { showCustomerSim, setShowCustomerSim, isShiftActive } = useRestaurant();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isLocked = !isShiftActive && location.pathname !== '/reports';
  const showPill = PILL_ROUTES.includes(location.pathname) && !isLocked;

  return (
    <div className="app-layout">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="app-main">
        <TopBar
          onOpenMenu={() => setMenuOpen(true)}
          search={search}
          onSearch={setSearch}
        />

        <div className="app-content">
          {isLocked && <ShiftLockOverlay />}
          <Routes>
            <Route path="/" element={<TableDashboard search={search} />} />
            <Route path="/table-management" element={<TableManagement />} />
            <Route path="/waiting-list" element={<WaitingList />} />
            <Route path="/menu" element={<MenuCatalog />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {showPill && <NavPill />}

      <NotificationToast />
      {showCustomerSim && isShiftActive && <CustomerSimulator onClose={() => setShowCustomerSim(false)} />}
    </div>
  );
}

/** Decides what to render based on auth + tenant state. */
function Gate() {
  const { loading, session, restaurantId } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--color-text-secondary)',
        fontWeight: 600,
      }}>
        Loading…
      </div>
    );
  }

  if (!session) return <Login />;
  if (!restaurantId) return <NoTenant />;

  // RestaurantProvider fires all the tenant-scoped queries + realtime, so it
  // only mounts once we have an authenticated user with a restaurant claim.
  return (
    <BrandingProvider>
      <RestaurantProvider>
        <MainAppLayout />
      </RestaurantProvider>
    </BrandingProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;
