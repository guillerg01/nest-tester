'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { api, getBaseUrl } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

type Room = { id: string; name: string; description?: string };
type Msg  = { id?: string; senderId: string; senderName?: string; content: string; createdAt: string; roomId: string };

export default function ChatPage() {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [active, setActive] = useState<Room | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [connected, setConnected] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', desc: '' });
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTmr = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadRooms();
    const s = io(getBaseUrl() + '/chat', { auth: { token }, transports: ['websocket'] });
    socketRef.current = s;
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('new_message', (m: Msg) => setMsgs(p => [...p, m]));
    s.on('typing', ({ isTyping, userId }: any) => {
      if (userId !== user?.id) {
        setTyping(isTyping ? 'Someone is typing…' : '');
        if (typingTmr.current) clearTimeout(typingTmr.current);
        if (isTyping) typingTmr.current = setTimeout(() => setTyping(''), 3000);
      }
    });
    s.on('history', ({ messages }: { messages: Msg[] }) => setMsgs([...(messages ?? [])].reverse()));
    return () => { s.disconnect(); };
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function loadRooms() {
    try {
      const r = await api<any>('GET', '/api/v1/chat/rooms');
      setRooms(r?.data ?? r ?? []);
    } catch (e: any) { toast.error(e.message); }
  }

  function joinRoom(room: Room) {
    setActive(room);
    setMsgs([]);
    const s = socketRef.current;
    if (!s?.connected) return;
    s.emit('join_room', { roomId: room.id });
    s.emit('get_history', { roomId: room.id, limit: 50 });
  }

  function sendMsg() {
    const content = input.trim();
    if (!content || !active || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', { roomId: active.id, content });
    setInput('');
    socketRef.current.emit('typing', { roomId: active.id, isTyping: false });
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (!active || !socketRef.current?.connected) return;
    socketRef.current.emit('typing', { roomId: active.id, isTyping: true });
    if (typingTmr.current) clearTimeout(typingTmr.current);
    typingTmr.current = setTimeout(() => socketRef.current?.emit('typing', { roomId: active.id, isTyping: false }), 1500);
  }

  async function createRoom() {
    if (!newRoom.name) return;
    try {
      await api('POST', '/api/v1/chat/rooms', { name: newRoom.name, description: newRoom.desc });
      setNewRoom({ name: '', desc: '' });
      await loadRooms();
      toast.success('Room created');
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="flex h-full">
      {/* Rooms panel */}
      <div className="w-56 border-r flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-muted-foreground">Rooms</span>
          <Badge variant={connected ? 'default' : 'outline'} className="text-xs">{connected ? 'Live' : 'Off'}</Badge>
        </div>
        <ScrollArea className="flex-1">
          {rooms.map(r => (
            <button key={r.id} onClick={() => joinRoom(r)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-border/50 transition-colors hover:bg-muted/50 ${active?.id === r.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'}`}>
              <p className="font-medium"># {r.name}</p>
              <p className="text-xs truncate">{r.description}</p>
            </button>
          ))}
        </ScrollArea>
        <div className="p-2 border-t flex flex-col gap-1">
          <Input className="h-7 text-xs" placeholder="Room name" value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} />
          <Button size="sm" className="h-7 text-xs" onClick={createRoom}>+ Create room</Button>
        </div>
      </div>

      {/* Chat main */}
      {active ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <p className="font-bold"># {active.name}</p>
            <p className="text-xs text-muted-foreground">{active.description}</p>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-3">
              {msgs.map((m, i) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={i} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(m.senderName ?? m.senderId ?? '?')[0].toUpperCase()}
                    </div>
                    <div className={`max-w-[70%]`}>
                      <p className={`text-xs text-muted-foreground mb-1 ${mine ? 'text-right' : ''}`}>
                        {mine ? 'You' : (m.senderName ?? m.senderId?.slice(0,8))} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className={`px-3 py-2 rounded-xl text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <p className="px-4 text-xs text-muted-foreground min-h-[18px]">{typing}</p>
          <div className="p-3 border-t flex gap-2">
            <Input value={input} onChange={onInput} placeholder="Message… (Enter to send)"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()} className="flex-1" />
            <Button onClick={sendMsg}>Send</Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
          <span className="text-4xl opacity-30">💬</span>
          <p className="text-sm">Select or create a room</p>
        </div>
      )}
    </div>
  );
}
