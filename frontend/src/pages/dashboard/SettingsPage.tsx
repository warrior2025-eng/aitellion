import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, PageHeader, Badge } from '../../components/patterns';
import { Field, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');

  const { data: org } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => (await api.get('/organizations/current')).data,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/organizations/current/members')).data,
  });

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user?.fullName]);

  const profileMutation = useMutation({
    mutationFn: () => api.patch('/users/me', { fullName }),
    onSuccess: () => refreshUser(),
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Manage your profile and organization." />

      <Card className="mb-6">
        <h2 className="font-display text-base font-semibold text-text">Profile</h2>
        <form
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            profileMutation.mutate();
          }}
        >
          <Field
            label="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="flex-1"
          />
          <Field label="Email" value={user?.email ?? ''} disabled className="flex-1" />
          <Button type="submit" disabled={profileMutation.isPending || !fullName.trim()}>
            Save
          </Button>
        </form>
        {profileMutation.isSuccess && <p className="mt-2 text-xs text-emerald-400">Profile updated.</p>}
        <p className="mt-3 text-xs text-text-faint">
          To change your password, sign out and use "Forgot password" from the sign-in page.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="font-display text-base font-semibold text-text">Organization</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Name</dt>
            <dd className="text-text">{org?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Workspace slug</dt>
            <dd className="font-mono text-text">{org?.slug}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-text">Team members</h2>
          {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
            <p className="text-xs text-text-faint">Use the invite icon in the header to add teammates.</p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {members?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
              <div>
                <p className="text-sm text-text">{m.user.fullName}</p>
                <p className="text-xs text-text-faint">{m.user.email}</p>
              </div>
              <Badge label={m.role} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}