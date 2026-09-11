import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth, { AuthUser } from '../../features/auth/useAuth';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: identifier.trim(), password }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Login failed');
      }

      const data = await response.json();
      const user: AuthUser = {
        id: String(data.user.id),
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        isStaff: data.user.is_staff,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        accessToken: data.access,
        refreshToken: data.refresh,
      };

      login(user);
      navigate(from, { replace: true });
    } catch (loginError) {
      setError('Unable to sign in. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Sign in</h1>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-slate-700">
            Email or username
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <button type="button" className="text-slate-700 hover:text-slate-900">
            Forgot password?
          </button>
          <Link to="/signup" className="text-slate-700 hover:text-slate-900">
            Create an account
          </Link>
        </div>

        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
