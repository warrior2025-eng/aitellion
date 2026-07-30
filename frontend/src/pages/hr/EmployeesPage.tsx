import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Badge, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

export default function EmployeesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/hr/employees')).data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/hr/departments')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/hr/employees', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowCreate(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Everyone on the team, their department, and status."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New employee
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-text-faint">Loading employees…</p>}

      {!isLoading && employees?.length === 0 && (
        <EmptyState title="No employees yet" description="Add your first team member to start tracking attendance and leaves." />
      )}

      {employees?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Designation</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e: any) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 font-medium text-text">{e.fullName}</td>
                    <td className="px-5 py-3 text-text-muted">{e.designation ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{e.department?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{e.email ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge label={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateEmployeeModal
          departments={departments ?? []}
          onClose={() => setShowCreate(false)}
          onSubmit={(p) => createMutation.mutate(p)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateEmployeeModal({
  departments,
  onClose,
  onSubmit,
  loading,
}: {
  departments: any[];
  onClose: () => void;
  onSubmit: (p: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ fullName: '', designation: '', email: '', departmentId: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New employee</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ ...form, departmentId: form.departmentId || undefined });
          }}
        >
          <Field label="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Field label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Department</label>
            <select
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create employee'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}