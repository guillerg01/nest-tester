'use client';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { networkLog, networkListeners, type Entry } from '@/lib/api';

export default function NetworkDrawer() {
  const [entries, setEntries] = useState<Entry[]>([...networkLog]);
  const [selected, setSelected] = useState<Entry | null>(null);

  const refresh = useCallback(() => setEntries([...networkLog]), []);

  useEffect(() => {
    networkListeners.push(refresh);
    return () => {
      const idx = networkListeners.indexOf(refresh);
      if (idx !== -1) networkListeners.splice(idx, 1);
    };
  }, [refresh]);

  const statusVariant = (s: number | string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const n = typeof s === 'number' ? s : 0;
    if (!n) return 'outline';
    if (n < 300) return 'default';
    if (n < 400) return 'secondary';
    return 'destructive';
  };

  return (
    <Sheet>
      <SheetTrigger className="fixed bottom-4 right-4 z-50 bg-card border rounded-full px-3 py-1.5 text-xs font-mono shadow-lg hover:bg-muted transition-colors flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Network ({entries.length})
      </SheetTrigger>
      <SheetContent side="right" className="w-[640px] max-w-full flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between">
          <SheetTitle className="text-sm">Network Log</SheetTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { networkLog.length = 0; setEntries([]); setSelected(null); }}>
            Clear
          </Button>
        </SheetHeader>
        <div className="flex flex-1 overflow-hidden">
          <ScrollArea className="w-64 border-r">
            {entries.length === 0 && <p className="text-xs text-muted-foreground p-4">No requests yet</p>}
            {entries.map((e, i) => (
              <button key={i} onClick={() => setSelected(e)}
                className={`w-full text-left px-3 py-2 border-b border-border/40 hover:bg-muted/50 transition-colors ${selected === e ? 'bg-muted' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusVariant(e.status)} className="text-[10px] h-4 px-1">{e.status}</Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{e.method}</span>
                </div>
                <p className="text-xs truncate mt-0.5">{e.path}</p>
                <p className="text-[10px] text-muted-foreground">{e.ms}ms</p>
              </button>
            ))}
          </ScrollArea>
          <div className="flex-1 overflow-auto p-3">
            {selected ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Request</p>
                  <div className="bg-muted rounded p-2 font-mono text-xs">
                    <p className="text-primary">{selected.method} {selected.url}</p>
                    {selected.reqBody !== null && selected.reqBody !== undefined && (
                      <pre className="mt-1 text-muted-foreground whitespace-pre-wrap break-all">{JSON.stringify(selected.reqBody, null, 2)}</pre>
                    )}
                  </div>
                </div>
                {selected.resBody !== null && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      Response <Badge variant={statusVariant(selected.status)} className="text-[10px] h-4">{selected.status}</Badge>
                    </p>
                    <pre className="bg-muted rounded p-2 font-mono text-xs whitespace-pre-wrap break-all max-h-96 overflow-auto">
                      {typeof selected.resBody === 'string' ? selected.resBody : JSON.stringify(selected.resBody, null, 2)}
                    </pre>
                  </div>
                )}
                {selected.error && (
                  <div>
                    <p className="text-xs font-bold text-destructive uppercase mb-1">Error</p>
                    <p className="bg-destructive/10 rounded p-2 text-xs text-destructive">{selected.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select a request to inspect</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
