'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function LoginPage() {
  const { login, token } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: 'admin@example.com', password: 'Admin1234!', firstName: '', lastName: '' });

  useEffect(() => { if (token) router.replace('/dashboard'); }, [token]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    setLoading(true);
    try {
      let resp: any;
      if (mode === 'login') {
        resp = await api('POST', '/api/v1/auth/login', { email: form.email, password: form.password });
      } else {
        resp = await api('POST', '/api/v1/auth/register', {
          email: form.email, password: form.password,
          firstName: form.firstName || 'User', lastName: form.lastName || 'Name',
        });
      }
      const data = resp?.data ?? resp;
      await login(data.accessToken);
      router.replace('/dashboard');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">⚡ NestJS Template</CardTitle>
          <CardDescription>Development test environment</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={set('email')} type="email" onKeyDown={onKey} />
          </div>
          {mode === 'register' && (
            <>
              <div className="flex flex-col gap-2">
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={set('firstName')} placeholder="Jane" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={set('lastName')} placeholder="Doe" />
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            <Label>Password</Label>
            <Input value={form.password} onChange={set('password')} type="password" onKeyDown={onKey} />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? '…' : mode === 'login' ? 'Login' : 'Register'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have one?'}{' '}
            <button className="text-primary underline" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
