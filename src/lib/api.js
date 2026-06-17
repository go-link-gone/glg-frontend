import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function hasSession() {
  const { data } = await supabase.auth.getSession();
  return !!data?.session?.access_token;
}

async function handle(res) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    let message = body?.message || body?.error;
    if (!message) {
      if (res.status === 401) {
        message = (await hasSession())
          ? 'Your session is no longer valid. Please sign out and sign in again.'
          : 'You need to sign in to do that.';
      } else if (res.status === 403) {
        message = 'Access denied.';
      } else if (res.status === 404) {
        message = 'Not found.';
      } else if (res.status === 429) {
        message = 'Too many requests. Please slow down.';
      } else {
        message = `Request failed (${res.status})`;
      }
    }
    throw new ApiError(message, res.status, body);
  }
  return body;
}

export async function createShortLink(originalUrl) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
  };
  const res = await fetch(`${API_BASE_URL}/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ originalUrl }),
  });
  return handle(res);
}

export async function fetchMyLinks(page = 0, size = 20) {
  const headers = await authHeaders();
  const res = await fetch(
    `${API_BASE_URL}/my-links?page=${page}&size=${size}`,
    { headers }
  );
  return handle(res);
}

export async function fetchDashboard(shortKey, timeRange = '24h', granularity = 'day', tz = 'UTC') {
  const headers = await authHeaders();
  const qs = new URLSearchParams({ timeRange, granularity, tz }).toString();
  const res = await fetch(
    `${API_BASE_URL}/${encodeURIComponent(shortKey)}/dashboard?${qs}`,
    { headers }
  );
  return handle(res);
}

export async function deleteLink(shortKey) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(shortKey)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) await handle(res);
  return true;
}

export async function fetchLinkQrs(shortKey) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(shortKey)}/qr`, { headers });
  return handle(res);
}

export async function createQr(shortKey, label, config) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(shortKey)}/qr`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ label, config }),
  });
  return handle(res);
}

export async function updateQr(qrId, label, config) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${API_BASE_URL}/qr/${encodeURIComponent(qrId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ label, config }),
  });
  return handle(res);
}

export async function deleteQr(qrId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/qr/${encodeURIComponent(qrId)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) await handle(res);
  return true;
}

export async function deleteAccount() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/account`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) await handle(res);
  return true;
}
