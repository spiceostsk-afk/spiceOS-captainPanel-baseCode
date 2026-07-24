import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import TopBar from './components/common/TopBar';
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

function MainAppLayout() {
  const { showCustomerSim, setShowCustomerSim, isShiftActive } = useRestaurant();
  const location = useLocation();

  const isLocked = !isShiftActive && location.pathname !== '/reports';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar />
        <div className="app-content" style={{ position: 'relative' }}>
          {isLocked && <ShiftLockOverlay />}
          <Routes>
            <Route path="/" element={<TableDashboard />} />
            <Route path="/table-management" element={<TableManagement />} />
            <Route path="/waiting-list" element={<WaitingList />} />
            <Route path="/menu" element={<MenuCatalog />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
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

