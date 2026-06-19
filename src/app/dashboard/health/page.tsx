'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, networkLog } from '@/lib/api';

type HealthResult = { endpoint: string; status: number | null; ok: boolean; data: unknown; duration: number; error?: string };

const ENDPOINTS = [
  { label: 'Health', path: '/api/v1/health' },
  { label: 'Auth Login', path: '/api/v1/auth/login', method: 'POST', body: { email: 'admin@example.com', password: 'Admin1234!' } },
  { label: 'Users', path: '/api/v1/users' },
  { label: 'Products', path: '/api/v1/products' },
  { label: 'Tenants', path: '/api/v1/tenants' },
  { label: 'Chat Rooms', path: '/api/v1/chat/rooms' },
];

export default function HealthPage() {
  const [results, setResults] = useState<HealthResult[]>([]);
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setResults([]);
    const out: HealthResult[] = [];
    for (const ep of ENDPOINTS) {
      const t0 = Date.now();
      try {
        const data = await api<unknown>(ep.method ?? 'GET', ep.path, (ep as any).body);
        out.push({ endpoint: ep.label, status: 200, ok: true, data, duration: Date.now() - t0 });
      } catch (e: any) {
        const lastEntry = networkLog[0];
        const status = (lastEntry?.path === ep.path && typeof lastEntry?.status === 'number') ? lastEntry.status : null;
        out.push({ endpoint: ep.label, status, ok: false, data: null, duration: Date.now() - t0, error: e.message });
      }
      setResults([...out]);
    }
    setRunning(false);
    const failed = out.filter(r => !r.ok).length;
    if (failed === 0) toast.success('All checks passed');
    else toast.error(`${failed} check(s) failed`);
  }

  const okCount = results.filter(r => r.ok).length;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-muted-foreground text-sm">Check all API endpoints at once</p>
        </div>
        <Button onClick={runAll} disabled={running}>{running ? 'Checking…' : '▶ Run all checks'}</Button>
      </div>

      {results.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{okCount}/{results.length} passed</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${(okCount / results.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {ENDPOINTS.map((ep, i) => {
          const r = results[i];
          return (
            <Card key={ep.label} className={r ? (r.ok ? 'border-green-500/40' : 'border-destructive/40') : ''}>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{ep.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{ep.method ?? 'GET'} {ep.path}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r && <span className="text-xs text-muted-foreground">{r.duration}ms</span>}
                  {r ? (
                    <Badge variant={r.ok ? 'default' : 'destructive'}>{r.ok ? `✓ ${r.status ?? 'OK'}` : `✗ ${r.status ?? 'ERR'}`}</Badge>
                  ) : running ? (
                    <Badge variant="outline">…</Badge>
                  ) : null}
                </div>
              </CardHeader>
              {r?.error && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-destructive font-mono">{r.error}</p>
                </CardContent>
              )}
              {r?.ok && r.data !== undefined && (
                <CardContent className="pt-0 pb-3">
                  <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-auto max-h-32">
                    {JSON.stringify(r.data, null, 2)}
                  </pre>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
