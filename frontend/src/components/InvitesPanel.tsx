import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

const ROLES = ['ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SALES', 'EMPLOYEE', 'VIEWER'];

const STATUS_META: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  PENDING: { label: 'Pending', icon: Clock, className: 'text-spark' },
  ACCEPTED: { label: 'Accepted', icon: CheckCircle2, className: 'text-emerald-400' },
  REVOKED: { label: 'Revoked', icon: XCircle, className: 'text-text-faint' },
  EXPIRED: { label: 'Expired', icon: XCircle, className: 'text-danger' },
};

export function InvitesPanel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'EMPLOYEE' });
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: invitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => (await api.get('/organizations/current/invitations')).data,
  });

  const pendingCount = invitations?.filter((i: any) => i.status === 'PENDING').length ?? 0;

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/organizations/current/invitations', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setForm({ email: '', role: 'EMPLOYEE' });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/current/invitations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations'] }),
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-2 hover:text-text"
        aria-label="Invite teammates"
        title="Invite teammates"
      >
        <UserPlus size={18} />
        {pendingCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-spark px-1 text-[10px] font-semibold text-ink">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-96 rounded-xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display text-sm font-semibold text-text">Invite teammates</p>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-text-faint hover:bg-surface-2 hover:text-text"
            >
              <X size={14} />
            </button>
          </div>

          <form
            className="flex flex-col gap-2 border-b border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
          >
            <input
              type="email"
              required
              placeholder="teammate@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none focus:border-volt"
            />
            <div className="flex gap-2">
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-volt"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviteMutation.isPending || !form.email}
                className="rounded-lg bg-volt px-3 py-2 text-sm font-medium text-white transition hover:bg-volt-soft disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {inviteMutation.isError && (
              <p className="text-xs text-danger">
                {(inviteMutation.error as any)?.response?.data?.message ?? 'Could not send this invite.'}
              </p>
            )}
            {inviteMutation.isSuccess && <p className="text-xs text-emerald-400">Invite sent.</p>}
          </form>

          <div className="max-h-72 overflow-y-auto">
            {(!invitations || invitations.length === 0) && (
              <p className="px-4 py-6 text-center text-sm text-text-faint">No invites sent yet.</p>
            )}
            {invitations?.map((inv: any) => {
              const meta = STATUS_META[inv.status] ?? STATUS_META.PENDING;
              const Icon = meta.icon;
              return (
                <div key={inv.id} className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">{inv.email}</p>
                    <p className="text-[11px] text-text-faint">
                      {inv.role} &middot; {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`flex items-center gap-1 text-[11px] font-medium ${meta.className}`}>
                      <Icon size={12} /> {meta.label}
                    </span>
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => revokeMutation.mutate(inv.id)}
                        className="text-[11px] text-text-faint hover:text-danger"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="border-t border-border px-4 py-2.5 text-[11px] text-text-faint">
            Replies to invite emails go straight to your inbox — accepted status updates here.
          </p>
        </div>
      )}
    </div>
  );
}