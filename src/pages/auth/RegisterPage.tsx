import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '@/hooks';
import { LoadingButton, InputField } from '@/components';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await registerMutation.mutateAsync({ username, email, password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="card-base w-full max-w-md p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <Icon icon="material-symbols:person-add-rounded" className="text-4xl text-[var(--primary)] mb-4" />
        <h1 className="text-90 text-2xl font-bold">Register</h1>
        <p className="text-50 text-sm mt-2">Create your account</p>
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
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="Your username"
          required
        />

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
          placeholder="At least 8 characters"
          required
        />

        <InputField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat password"
          required
        />

        <LoadingButton
          type="submit"
          loading={registerMutation.isPending}
          className="w-full"
        >
          Register
        </LoadingButton>
      </form>

      {/* Footer */}
      <div className="text-center mt-6 text-50 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--primary)] hover:underline">
          Login
        </Link>
      </div>
    </div>
  );
}