'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function save() {
    try {
      await api('PATCH', `/api/v1/users/${user?.id}`, form);
      toast.success('Profile updated');
    } catch (e: any) { toast.error(e.message); }
  }

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm">Your account details</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Account</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground">{initials}</div>
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">{user?.role?.name ?? 'No role'}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Verified</span>
              <Badge variant={user?.isEmailVerified ? 'default' : 'outline'}>
                {user?.isEmailVerified ? '✓ Verified' : '✗ Unverified'}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Provider</span>
              <span>{user?.provider ?? 'local'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Last login</span>
              <span className="font-mono text-xs">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Update profile</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1"><Label className="text-xs">First Name</Label><Input value={form.firstName} onChange={set('firstName')} /></div>
            <div className="flex flex-col gap-1"><Label className="text-xs">Last Name</Label><Input value={form.lastName} onChange={set('lastName')} /></div>
            <div className="flex flex-col gap-1"><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={set('phone')} placeholder="+1 555 0000" /></div>
            <Button onClick={save}>Save changes</Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">JWT Token</CardTitle></CardHeader>
        <CardContent>
          <p className="font-mono text-xs text-muted-foreground break-all bg-muted p-3 rounded">{token || '—'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
