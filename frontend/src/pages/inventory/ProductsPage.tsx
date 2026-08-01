import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, PackagePlus, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function ProductsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory/products')).data,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/inventory/suppliers')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/inventory/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowCreate(false);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.post(`/inventory/products/${id}/adjust-stock`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setAdjustProduct(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Track what you sell and how much stock is left."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New product
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-text-faint">Loading products…</p>}

      {!isLoading && products?.length === 0 && (
        <EmptyState title="No products yet" description="Add your first product to start tracking inventory." />
      )}

      {products?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => {
                  const low = p.stockQuantity <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                      <td className="px-5 py-3 font-medium text-text">{p.name}</td>
                      <td className="px-5 py-3 text-text-muted font-mono text-xs">{p.sku}</td>
                      <td className="px-5 py-3 text-text-muted">{p.supplier?.name ?? '—'}</td>
                      <td className="px-5 py-3 font-mono text-text">{formatCurrency(p.unitPriceCents)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 font-mono text-sm ${low ? 'text-danger' : 'text-text'}`}>
                          {low && <AlertTriangle size={13} />}
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setAdjustProduct(p)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-volt-soft hover:underline"
                        >
                          <PackagePlus size={14} /> Adjust stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateProductModal
          suppliers={suppliers ?? []}
          onClose={() => setShowCreate(false)}
          onSubmit={(p) => createMutation.mutate(p)}
          loading={createMutation.isPending}
        />
      )}

      {adjustProduct && (
        <AdjustStockModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSubmit={(payload) => adjustMutation.mutate({ id: adjustProduct.id, payload })}
          loading={adjustMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateProductModal({
  suppliers,
  onClose,
  onSubmit,
  loading,
}: {
  suppliers: any[];
  onClose: () => void;
  onSubmit: (p: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    priceDollars: '',
    stockQuantity: '0',
    lowStockThreshold: '10',
    supplierId: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New product</h2>
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
              sku: form.sku,
              category: form.category || undefined,
              unitPriceCents: Math.round(Number(form.priceDollars) * 100),
              stockQuantity: Number(form.stockQuantity) || 0,
              lowStockThreshold: Number(form.lowStockThreshold) || 10,
              supplierId: form.supplierId || undefined,
            });
          }}
        >
          <Field label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Field label="Category (optional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Field label="Price (USD)" type="number" min="0" step="0.01" required value={form.priceDollars} onChange={(e) => setForm({ ...form, priceDollars: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting stock" type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
            <Field label="Low stock alert at" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Supplier (optional)</label>
            <select
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function AdjustStockModal({
  product,
  onClose,
  onSubmit,
  loading,
}: {
  product: any;
  onClose: () => void;
  onSubmit: (p: any) => void;
  loading: boolean;
}) {
  const [type, setType] = useState('IN');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">Adjust stock — {product.name}</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-sm text-text-muted">Current stock: <span className="font-mono text-text">{product.stockQuantity}</span></p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ type, quantity: Number(quantity), reason: reason || undefined });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Movement type</label>
            <select
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="IN">Stock in (restock)</option>
              <option value="OUT">Stock out (sold/used)</option>
              <option value="ADJUSTMENT">Set exact quantity</option>
            </select>
          </div>
          <Field
            label={type === 'ADJUSTMENT' ? 'New quantity' : 'Quantity'}
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Field label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}