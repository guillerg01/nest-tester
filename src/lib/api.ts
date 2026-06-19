const getBase = () =>
  (typeof window !== 'undefined' && localStorage.getItem('baseUrl')) ||
  'http://localhost:3000';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

export type Entry = {
  method: string;
  path: string;
  url: string;
  reqBody: unknown;
  status: number | string;
  ms: number;
  resBody: unknown;
  error: string | null;
};

export const networkLog: Entry[] = [];
export const networkListeners: Array<() => void> = [];

function notify() {
  networkListeners.forEach((fn) => fn());
}

export async function api<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = getBase() + path;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const t0 = Date.now();
  const entry: Entry = { method, path, url, reqBody: body ?? null, status: '…', ms: 0, resBody: null, error: null };
  networkLog.unshift(entry);
  notify();

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
    entry.status = res.status;
    entry.ms = Date.now() - t0;
    const text = await res.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    entry.resBody = json;
    notify();
    if (!res.ok) {
      const msg = (json as any)?.message;
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || `Error ${res.status}`);
    }
    return json as T;
  } catch (e: any) {
    if (entry.status === '…') { entry.status = 'ERR'; entry.error = e.message; entry.ms = Date.now() - t0; }
    notify();
    throw e;
  }
}

export const getBaseUrl = getBase;
export const getAuthToken = getToken;
