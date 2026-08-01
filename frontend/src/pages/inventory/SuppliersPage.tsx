import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

export default function SuppliersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/inventory/suppliers')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/inventory/suppliers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowCreate(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Everyone you buy stock from."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New supplier
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-text-faint">Loading suppliers…</p>}

      {!isLoading && suppliers?.length === 0 && (
        <EmptyState title="No suppliers yet" description="Add a supplier so you can link products to where they come from." />
      )}

      {suppliers?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Products</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s: any) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 font-medium text-text">{s.name}</td>
                    <td className="px-5 py-3 text-text-muted">{s.email ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted font-mono text-xs">{s.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{s._count?.products ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateSupplierModal onClose={() => setShowCreate(false)} onSubmit={(p) => createMutation.mutate(p)} loading={createMutation.isPending} />
      )}
    </div>
  );
}

function CreateSupplierModal({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (p: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New supplier</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              name: form.name,
              email: form.email || undefined,
              phone: form.phone || undefined,
              address: form.address || undefined,
            });
          }}
        >
          <Field label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Field label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create supplier'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}