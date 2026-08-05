import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field, Select, Button } from '../../components/ui';
import { getCountryList } from '../../lib/countries';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const countries = useMemo(() => getCountryList(), []);

  const [form, setForm] = useState({ fullName: '', organizationName: '', email: '', password: '', country: '' });
  const [designations, setDesignations] = useState<string[]>([]);
  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/auth/designations')
      .then((res) => setAvailableDesignations(res.data.designations))
      .catch(() => {
        // fallback list in case /auth/designations is unreachable
        setAvailableDesignations(['Sales & CRM', 'Human Resources', 'Finance & Accounts', 'Inventory & Operations']);
      });
  }, []);

  function update(key: 'fullName' | 'organizationName' | 'email' | 'password') {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function toggleDesignation(designation: string) {
    setDesignations((prev) =>
      prev.includes(designation) ? prev.filter((d) => d !== designation) : [...prev, designation],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.country) {
      setError('Select your country.');
      return;
    }
    if (designations.length === 0) {
      setError('Select at least one department your company will use AITELLION for.');
      return;
    }

    setLoading(true);
    try {
      await signup({ ...form, designations });
      navigate('/app');
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your workspace" subtitle="Start running your business on AITELLION">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label="Full name" required value={form.fullName} onChange={update('fullName')} placeholder="Jordan Lee" />
        <Field label="Company / organization name" required value={form.organizationName} onChange={update('organizationName')} placeholder="Acme Retail Co." />

        <Select
          label="Country"
          required
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
        >
          <option value="" disabled>
            Select your country
          </option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>

        <Field label="Work email" type="email" required value={form.email} onChange={update('email')} placeholder="you@company.com" />
        <Field label="Password" type="password" required value={form.password} onChange={update('password')} placeholder="At least 8 characters" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted">Which departments will use AITELLION?</label>
          <p className="text-xs text-text-faint">Only the modules for these departments will show up in your sidebar.</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {availableDesignations.map((designation) => {
              const selected = designations.includes(designation);
              return (
                <button
                  key={designation}
                  type="button"
                  onClick={() => toggleDesignation(designation)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                    selected
                      ? 'border-volt bg-volt/15 text-volt-soft'
                      : 'border-border text-text-muted hover:bg-surface-2 hover:text-text'
                  }`}
                >
                  {designation}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating workspace…' : 'Create workspace'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        Already on AITELLION?{' '}
        <Link to="/login" className="text-volt-soft hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}