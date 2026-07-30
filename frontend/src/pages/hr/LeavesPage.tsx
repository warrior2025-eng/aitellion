import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Check, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Badge, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';
import { format } from 'date-fns';

const LEAVE_TYPES = ['SICK', 'CASUAL', 'EARNED', 'UNPAID'];

export default function LeavesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => (await api.get('/hr/leaves')).data,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/hr/employees')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/hr/leaves', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowCreate(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/hr/leaves/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/hr/leaves/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });

  return (
    <div>
      <PageHeader
        title="Leaves"
        description="Leave requests and approvals."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New leave request
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-text-faint">Loading leave requests…</p>}

      {!isLoading && leaves?.length === 0 && (
        <EmptyState title="No leave requests yet" description="When someone requests time off, it'll show up here." />
      )}

      {leaves?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Dates</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l: any) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 font-medium text-text">{l.employee.fullName}</td>
                    <td className="px-5 py-3 text-text-muted">{l.type}</td>
                    <td className="px-5 py-3 text-text-muted font-mono text-xs">
                      {format(new Date(l.startDate), 'd MMM')} – {format(new Date(l.endDate), 'd MMM yyyy')}
                    </td>
                    <td className="px-5 py-3">
                      <Badge label={l.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approveMutation.mutate(l.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:underline"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(l.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateLeaveModal
          employees={employees ?? []}
          onClose={() => setShowCreate(false)}
          onSubmit={(p) => createMutation.mutate(p)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateLeaveModal({
  employees,
  onClose,
  onSubmit,
  loading,
}: {
  employees: any[];
  onClose: () => void;
  onSubmit: (p: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ employeeId: '', type: 'CASUAL', startDate: '', endDate: '', reason: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New leave request</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Employee</label>
            <select
              required
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Leave type</label>
            <select
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Field label="End date" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Field label="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}