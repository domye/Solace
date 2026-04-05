import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/hooks';
import { LoadingButton, InputField } from '@/components';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = (location.state as { from?: string })?.from || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="card-base w-full max-w-md p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <Icon icon="material-symbols:login-rounded" className="text-4xl text-[var(--primary)] mb-4" />
        <h1 className="text-90 text-2xl font-bold">Login</h1>
        <p className="text-50 text-sm mt-2">Welcome back!</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 text-red-500 rounded-lg p-3 mb-4 text-sm text-center">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          required
        />

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter password"
          required
        />

        <LoadingButton
          type="submit"
          loading={loginMutation.isPending}
          className="w-full"
        >
          Login
        </LoadingButton>
      </form>

      {/* Footer */}
      <div className="text-center mt-6 text-50 text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-[var(--primary)] hover:underline">
          Register
        </Link>
      </div>
    </div>
  );
}