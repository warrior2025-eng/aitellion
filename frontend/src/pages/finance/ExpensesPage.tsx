import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function ExpensesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => (await api.get('/finance/expenses')).data,
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: async () => (await api.get('/finance/expenses/summary')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/finance/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      setShowCreate(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track what the business is spending."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New expense
          </Button>
        }
      />

      {summary?.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summary.map((s: any) => (
            <Card key={s.category}>
              <p className="text-sm text-text-muted">{s.category}</p>
              <p className="mt-2 font-display text-lg font-semibold text-text">{formatCurrency(s.totalCents)}</p>
            </Card>
          ))}
        </div>
      )}

      {isLoading && <p className="text-sm text-text-faint">Loading expenses…</p>}

      {!isLoading && expenses?.length === 0 && (
        <EmptyState title="No expenses yet" description="Log your first business expense to start tracking spend." />
      )}

      {expenses?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 text-text-muted font-mono text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-text">{e.category}</td>
                    <td className="px-5 py-3 text-text-muted">{e.vendor ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{e.description ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-mono text-text">{formatCurrency(e.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateExpenseModal onClose={() => setShowCreate(false)} onSubmit={(p) => createMutation.mutate(p)} loading={createMutation.isPending} />
      )}
    </div>
  );
}

function CreateExpenseModal({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (p: any) => void; loading: boolean }) {
  const [form, setForm] = useState({
    category: '',
    description: '',
    vendor: '',
    amountDollars: '',
    date: new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New expense</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              category: form.category,
              description: form.description || undefined,
              vendor: form.vendor || undefined,
              amountCents: Math.round(Number(form.amountDollars) * 100),
              date: form.date,
            });
          }}
        >
          <Field label="Category" required placeholder="Rent, Utilities, Marketing…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Field label="Amount (USD)" type="number" min="0.01" step="0.01" required value={form.amountDollars} onChange={(e) => setForm({ ...form, amountDollars: e.target.value })} />
          <Field label="Date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Field label="Vendor (optional)" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <Field label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save expense'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}