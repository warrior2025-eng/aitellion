import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, EmptyState } from '../../components/patterns';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function PaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => (await api.get('/finance/payments')).data,
  });

  const { data: cashFlow } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: async () => (await api.get('/finance/payments/cash-flow')).data,
  });

  return (
    <div>
      <PageHeader title="Payments" description="Cash flow and payment history." />

      {cashFlow && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">Collected</p>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <p className="mt-3 font-display text-xl font-semibold text-text">{formatCurrency(cashFlow.totalCollectedCents)}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">Spent</p>
              <TrendingDown size={16} className="text-danger" />
            </div>
            <p className="mt-3 font-display text-xl font-semibold text-text">{formatCurrency(cashFlow.totalSpentCents)}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">Net</p>
              <Wallet size={16} className="text-volt-soft" />
            </div>
            <p className={`mt-3 font-display text-xl font-semibold ${cashFlow.netCents >= 0 ? 'text-emerald-400' : 'text-danger'}`}>
              {formatCurrency(cashFlow.netCents)}
            </p>
          </Card>
        </div>
      )}

      {isLoading && <p className="text-sm text-text-faint">Loading payments…</p>}

      {!isLoading && payments?.length === 0 && (
        <EmptyState title="No payments recorded yet" description="Record a payment against an invoice to see it here." />
      )}

      {payments?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 text-text-muted font-mono text-xs">{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-text-muted font-mono text-xs">{p.invoice?.invoiceNumber ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{p.customer?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{p.method.replace('_', ' ')}</td>
                    <td className="px-5 py-3 text-right font-mono text-text">{formatCurrency(p.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}