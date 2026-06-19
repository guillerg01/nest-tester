'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

type User = Record<string, any>;

type AuthCtx = {
  user: User | null;
  token: string;
  login: (token: string) => Promise<void>;
  logout: () => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
};

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const DEFAULT_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const [baseUrl, _setBaseUrl] = useState(DEFAULT_URL);

  useEffect(() => {
    const saved = localStorage.getItem('baseUrl');
    if (saved) _setBaseUrl(saved);
    const t = localStorage.getItem('token');
    if (t) { setToken(t); loadMe(); }
  }, []);

  async function loadMe() {
    try {
      const r = await api<any>('GET', '/api/v1/users/me');
      setUser(r?.data ?? r);
    } catch {}
  }

  async function login(t: string) {
    setToken(t);
    localStorage.setItem('token', t);
    await loadMe();
  }

  function logout() {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  }

  function setBaseUrl(url: string) {
    const clean = url.replace(/\/$/, '');
    _setBaseUrl(clean);
    localStorage.setItem('baseUrl', clean);
  }

  return (
    <Ctx.Provider value={{ user, token, login, logout, baseUrl, setBaseUrl }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
