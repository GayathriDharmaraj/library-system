import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'member' ? '/my-account' : '/dashboard'} replace />;
  }

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = 'Username or email is required.';
    if (!password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const result = login(email, password, remember);
    setSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.error });
      return;
    }
    navigate(result.user?.role === 'member' ? '/my-account' : '/dashboard', { replace: true });
  };

  return (
    <div className="login-backdrop relative overflow-hidden min-h-screen flex items-center justify-center px-4">
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 text-amber-glow/10 sm:w-96 sm:h-96"
      >
        <g fill="currentColor">
          <rect x="20" y="70" width="26" height="100" rx="2" transform="rotate(-6 33 120)" />
          <rect x="55" y="55" width="26" height="115" rx="2" />
          <rect x="90" y="65" width="26" height="105" rx="2" transform="rotate(4 103 118)" />
          <rect x="10" y="170" width="150" height="10" rx="2" />
        </g>
      </svg>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="stamp text-amber-glow border-amber-glow/60 text-lg mb-3">LH</div>
          <h1 className="font-display font-bold text-2xl text-white" data-testid="app-title">
            LibraryHub
          </h1>
          <p className="text-paper-200/70 text-sm mt-1">Sign in to manage your library</p>
        </div>

        <form
          onSubmit={handleSubmit}
          data-testid="login-form"
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
          noValidate
        >
          {errors.form && (
            <div
              role="alert"
              data-testid="login-error"
              className="mb-4 rounded-lg bg-rust-glow/10 border border-rust-glow/30 text-rust-glow text-sm px-4 py-3"
            >
              {errors.form}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="login-username" className="block text-sm font-medium text-ink-800 mb-1.5">
              Email / Username
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              data-testid="login-username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/40 ${
                errors.email ? 'border-rust-glow' : 'border-ink-900/15'
              }`}
              placeholder="admin@library.com"
            />
            {errors.email && (
              <p role="alert" data-testid="login-username-error" className="text-rust-glow text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="block text-sm font-medium text-ink-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                data-testid="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2.5 pr-16 text-sm focus:ring-2 focus:ring-brand-500/40 ${
                  errors.password ? 'border-rust-glow' : 'border-ink-900/15'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                data-testid="toggle-password-visibility"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-600 px-2 py-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p role="alert" data-testid="login-password-error" className="text-rust-glow text-xs mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                data-testid="remember-me"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-ink-900/20"
              />
              Remember me
            </label>
            <button
              type="button"
              data-testid="forgot-password-link"
              onClick={() =>
                setErrors({ form: 'Password reset isn\'t available in this demo. Use the test credentials below.' })
              }
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            data-testid="login-button"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 text-paper-200/80 text-xs" data-testid="demo-credentials">
          <p className="font-semibold text-white mb-1">Test credentials</p>
          <p>Admin — admin@library.com / Admin@123</p>
          <p>Librarian — librarian@library.com / Librarian@123</p>
          <p>Member — member@library.com / Member@123</p>
          <p className="mt-1 text-paper-200/60">Any registered member can also sign in with their own email + Member@123 (e.g. aarav.sharma@mail.com)</p>
        </div>
      </div>
    </div>
  );
}
