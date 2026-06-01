import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail } from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { PasswordInput } from './ui/PasswordInput';

const genericForgotMessage = 'If an admin account exists for this email, reset instructions have been sent.';

const AdminAuthShell = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4">
          <Lock className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
        <p className="text-zinc-500 text-sm">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  </div>
);

export function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await fetch(apiUrl('/api/admin/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setMessage(genericForgotMessage);
    } catch {
      setError('We could not process that request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAuthShell
      title="Reset Admin Password"
      subtitle="Enter your admin email to receive reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-semibold text-zinc-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              placeholder="admin@example.com"
              required
            />
          </div>
        </div>

        {message && <p className="text-emerald-700 text-sm text-center font-medium">{message}</p>}
        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
        </button>
        <Link to="/admin" className="block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          Back to login
        </Link>
      </form>
    </AdminAuthShell>
  );
}

export function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This reset link is invalid or expired. Please request a new one.');
      return;
    }

    if (password.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('New password and confirm password must match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/admin/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'This reset link is invalid or expired. Please request a new one.');
        return;
      }

      setPassword('');
      setConfirmPassword('');
      setMessage('Your password has been reset. You can now sign in.');
    } catch {
      setError('We could not reset your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAuthShell
      title="Create New Password"
      subtitle="Choose a secure password for your admin account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-zinc-700 mb-1">
            New Password
          </label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            placeholder="Minimum 8 characters"
            leftIcon={<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />}
            toggleLabel="new password"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-zinc-700 mb-1">
            Confirm Password
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            placeholder="Repeat password"
            leftIcon={<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />}
            toggleLabel="confirm password"
            autoComplete="new-password"
            required
          />
        </div>

        {message && <p className="text-emerald-700 text-sm text-center font-medium">{message}</p>}
        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
        <Link to="/admin" className="block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          Back to login
        </Link>
      </form>
    </AdminAuthShell>
  );
}
