'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

type Product = { id: string; name: string; slug: string; price: number; status: string; stockQuantity: number };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', price: '', stock: '', status: 'active', description: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const r = await api<any>('GET', '/api/v1/products');
      const arr = r?.data?.data ?? r?.data?.items ?? r?.data;
      setProducts(Array.isArray(arr) ? arr : []);
    } catch (e: any) { toast.error(e.message); }
  }

  async function create() {
    if (!form.name) return;
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      await api('POST', '/api/v1/products', { name: form.name, slug, price: parseFloat(form.price) || 0, stockQuantity: parseInt(form.stock) || 0, status: form.status, description: form.description });
      setForm({ name: '', slug: '', price: '', stock: '', status: 'active', description: '' });
      await load();
      toast.success('Product created');
    } catch (e: any) { toast.error(e.message); }
  }

  async function del(id: string) {
    if (!confirm('Delete?')) return;
    try { await api('DELETE', `/api/v1/products/${id}`); await load(); toast.success('Deleted'); }
    catch (e: any) { toast.error(e.message); }
  }

  const statusColor: Record<string, 'default' | 'secondary' | 'outline'> = { active: 'default', draft: 'secondary', archived: 'outline' };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold">Products</h1><p className="text-muted-foreground text-sm">Create and manage catalog</p></div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">New product</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1"><Label className="text-xs">Name</Label><Input value={form.name} onChange={set('name')} /></div>
            <div className="flex flex-col gap-1"><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={set('slug')} placeholder="auto-generated" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1"><Label className="text-xs">Price</Label><Input type="number" value={form.price} onChange={set('price')} /></div>
              <div className="flex flex-col gap-1"><Label className="text-xs">Stock</Label><Input type="number" value={form.stock} onChange={set('stock')} /></div>
            </div>
            <Select value={form.status} onValueChange={(v: string | null) => { if (v) setForm(p => ({ ...p, status: v })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
            </Select>
            <div className="flex flex-col gap-1"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={set('description')} rows={2} /></div>
            <Button onClick={create}>Create product</Button>
          </CardContent>
        </Card>
        <Card className="overflow-auto max-h-[520px]">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">Products ({products.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={load}>↺ Refresh</Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {products.length === 0 && <p className="text-sm text-muted-foreground">No products yet</p>}
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.slug}</p>
                </div>
                <span className="font-mono text-sm text-green-500">${p.price}</span>
                <Badge variant={statusColor[p.status] ?? 'outline'}>{p.status}</Badge>
                <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => del(p.id)}>✕</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
