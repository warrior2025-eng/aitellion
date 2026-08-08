import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function AcceptInvitePage() {
  const { acceptInvite } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await acceptInvite({ token, fullName, password });
      navigate('/app');
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ?? 'This invite link is invalid or has expired. Ask whoever invited you to send a new one.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Accept your invite" subtitle="Missing invite token">
        <p className="text-sm text-danger">
          This link is missing its invite token. Ask whoever invited you to resend the invite.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-volt-soft hover:underline">
          Go to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="You're invited" subtitle="Set your name and password to join the workspace">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field
          label="Full name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jordan Lee"
        />
        <Field
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Joining…' : 'Accept invitation'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an AITELLION account?{' '}
        <Link to="/login" className="text-volt-soft hover:underline">
          Sign in
        </Link>{' '}
        first, then reopen this link.
      </p>
    </AuthLayout>
  );
}