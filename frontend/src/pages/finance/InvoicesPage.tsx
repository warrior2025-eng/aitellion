import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Trash2, IndianRupee } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

const STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER'];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function InvoicesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [payInvoice, setPayInvoice] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await api.get('/finance/invoices')).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/crm/customers', { params: { take: 100 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/finance/invoices', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCreate(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/finance/invoices/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/finance/payments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPayInvoice(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Bill your customers and track what's been paid."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New invoice
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-text-faint">Loading invoices…</p>}

      {!isLoading && invoices?.length === 0 && (
        <EmptyState title="No invoices yet" description="Create your first invoice to start billing customers." />
      )}

      {invoices?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice #</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 font-mono text-xs text-text">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-text-muted">{inv.customer?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted font-mono text-xs">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-text">{formatCurrency(inv.totalCents)}</td>
                    <td className="px-5 py-3">
                      <select
                        value={inv.status}
                        onChange={(e) => statusMutation.mutate({ id: inv.id, status: e.target.value })}
                        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-text outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => setPayInvoice(inv)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-volt-soft hover:underline"
                        >
                          <IndianRupee size={14} /> Record payment
                        </button>
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
        <CreateInvoiceModal
          customers={customers?.items ?? []}
          onClose={() => setShowCreate(false)}
          onSubmit={(p) => createMutation.mutate(p)}
          loading={createMutation.isPending}
        />
      )}

      {payInvoice && (
        <RecordPaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onSubmit={(p) => paymentMutation.mutate({ ...p, invoiceId: payInvoice.id })}
          loading={paymentMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateInvoiceModal({
  customers,
  onClose,
  onSubmit,
  loading,
}: {
  customers: any[];
  onClose: () => void;
  onSubmit: (p: any) => void;
  loading: boolean;
}) {
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [taxDollars, setTaxDollars] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: '1', unitPriceDollars: '' }]);

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPriceDollars) || 0), 0);
  const tax = Number(taxDollars) || 0;

  function updateItem(index: number, field: string, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto">
      <Card className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New invoice</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              customerId: customerId || undefined,
              issueDate,
              dueDate,
              taxCents: Math.round(tax * 100),
              notes: notes || undefined,
              items: items
                .filter((it) => it.description.trim())
                .map((it) => ({
                  description: it.description,
                  quantity: Number(it.quantity) || 1,
                  unitPriceCents: Math.round((Number(it.unitPriceDollars) || 0) * 100),
                })),
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Customer</label>
            <select
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">No customer linked</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Issue date" type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            <Field label="Due date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Line items</label>
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none focus:border-volt"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                />
                <input
                  className="w-16 rounded-lg border border-border bg-surface-2 px-2 py-2 text-sm text-text outline-none focus:border-volt"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                <input
                  className="w-24 rounded-lg border border-border bg-surface-2 px-2 py-2 text-sm text-text outline-none focus:border-volt"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={item.unitPriceDollars}
                  onChange={(e) => updateItem(i, 'unitPriceDollars', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-text-faint hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { description: '', quantity: '1', unitPriceDollars: '' }])}
              className="self-start text-xs font-medium text-volt-soft hover:underline"
            >
              + Add line item
            </button>
          </div>

          <Field label="Tax (USD)" type="number" min="0" step="0.01" value={taxDollars} onChange={(e) => setTaxDollars(e.target.value)} />
          <Field label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm">
            <span className="text-text-muted">Total</span>
            <span className="font-mono font-semibold text-text">${(subtotal + tax).toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create invoice'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function RecordPaymentModal({
  invoice,
  onClose,
  onSubmit,
  loading,
}: {
  invoice: any;
  onClose: () => void;
  onSubmit: (p: any) => void;
  loading: boolean;
}) {
  const [amountDollars, setAmountDollars] = useState((invoice.totalCents / 100).toFixed(2));
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">Record payment — {invoice.invoiceNumber}</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ amountCents: Math.round(Number(amountDollars) * 100), method, notes: notes || undefined });
          }}
        >
          <Field label="Amount (USD)" type="number" min="0.01" step="0.01" required value={amountDollars} onChange={(e) => setAmountDollars(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Method</label>
            <select
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <Field label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording…' : 'Record payment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}