'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

type Tenant = { id: string; name: string; slug: string; plan: string; isActive: boolean; createdAt: string };

const planColor: Record<string, 'default' | 'secondary' | 'outline'> = { enterprise: 'default', pro: 'secondary', free: 'outline' };

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', plan: 'free' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const r = await api<any>('GET', '/api/v1/tenants');
      const arr = r?.data?.data ?? r?.data?.items ?? r?.data;
      setTenants(Array.isArray(arr) ? arr : []);
    } catch (e: any) { toast.error(e.message); }
  }

  async function create() {
    if (!form.name) return;
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      await api('POST', '/api/v1/tenants', { name: form.name, slug, plan: form.plan });
      setForm({ name: '', slug: '', plan: 'free' });
      await load();
      toast.success('Tenant created');
    } catch (e: any) { toast.error(e.message); }
  }

  async function del(id: string) {
    if (!confirm('Delete tenant?')) return;
    try { await api('DELETE', `/api/v1/tenants/${id}`); await load(); toast.success('Deleted'); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold">Tenants</h1><p className="text-muted-foreground text-sm">Multi-tenant management</p></div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">New tenant</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1"><Label className="text-xs">Name</Label><Input value={form.name} onChange={set('name')} /></div>
            <div className="flex flex-col gap-1"><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={set('slug')} placeholder="auto-generated" /></div>
            <Select value={form.plan} onValueChange={(v: string | null) => { if (v) setForm(p => ({ ...p, plan: v })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={create}>Create tenant</Button>
          </CardContent>
        </Card>
        <Card className="overflow-auto max-h-[480px]">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">Tenants ({tenants.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={load}>↺ Refresh</Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {tenants.length === 0 && <p className="text-sm text-muted-foreground">No tenants yet</p>}
            {tenants.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                </div>
                <Badge variant={planColor[t.plan] ?? 'outline'}>{t.plan}</Badge>
                <Badge variant={t.isActive ? 'default' : 'outline'}>{t.isActive ? 'Active' : 'Off'}</Badge>
                <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => del(t.id)}>✕</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">X-Tenant-ID header</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Pass tenant slug or UUID as <code className="bg-muted px-1 rounded">X-Tenant-ID</code> header in requests. The backend resolves it via middleware and attaches the tenant to <code className="bg-muted px-1 rounded">req.tenant</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
