'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import NetworkDrawer from '@/components/network-drawer';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: '👤 Profile', exact: true },
  { href: '/dashboard/chat', label: '💬 Chat' },
  { href: '/dashboard/products', label: '📦 Products' },
  { href: '/dashboard/health', label: '🩺 Health' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout, baseUrl, setBaseUrl } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => { if (!token) router.replace('/'); }, [token]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-52 flex-shrink-0 border-r flex flex-col bg-card">
        <div className="p-4 border-b">
          <p className="font-bold text-sm text-primary">⚡ NestJS Template</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email ?? '…'}</p>
        </div>
        <nav className="flex-1 py-2">
          {NAV.map(n => {
            const active = n.exact ? path === n.href : path.startsWith(n.href) && n.href !== '/dashboard' || path === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={cn('flex items-center px-4 py-2 text-sm border-l-2 transition-colors',
                  active ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Base URL</p>
          <Input className="h-7 text-xs" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={logout}>
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
      <NetworkDrawer />
    </div>
  );
}
