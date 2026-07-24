import { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AuthScreens.css';

function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // On success the auth listener swaps this screen for the app.
    } catch (err) {
      setError(err?.message || 'Sign in failed. Check your credentials.');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <span className="auth-brand-mark">SPICE OS</span>
          <span className="auth-brand-sub">CAPTAIN CONSOLE</span>
        </div>
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-hint">Use your captain account to manage the floor.</p>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <label className="auth-field">
          <span><Mail size={14} /> Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@restaurant.com"
            required
          />
        </label>

        <label className="auth-field">
          <span><Lock size={14} /> Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit" className="auth-btn" disabled={submitting}>
          <LogIn size={18} />
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default Login;
