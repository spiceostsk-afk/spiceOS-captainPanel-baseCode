import { AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AuthScreens.css';

/**
 * Shown when a user is authenticated but their JWT carries no restaurant_id.
 * Means the access-token hook is disabled, or the user has no restaurant_members
 * row. Without a tenant claim, RLS returns nothing, so the app can't function.
 */
function NoTenant() {
  const { signOut, user } = useAuth();
  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--center">
        <AlertTriangle size={40} color="var(--color-occupied)" />
        <h1 className="auth-title">No restaurant linked</h1>
        <p className="auth-hint">
          You're signed in as <strong>{user?.email}</strong>, but this account
          isn't linked to a restaurant yet.
        </p>
        <p className="auth-hint">
          An admin needs to add a <code>restaurant_members</code> row for you, and
          the access-token hook must be enabled in Supabase.
        </p>
        <button className="auth-btn" onClick={signOut}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}

export default NoTenant;
