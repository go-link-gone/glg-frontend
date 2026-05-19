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

async function handle(res) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message =
      body?.message ||
      body?.error ||
      (res.status === 401
        ? 'You are not signed in.'
        : res.status === 403
        ? 'Access denied.'
        : res.status === 404
        ? 'Not found.'
        : res.status === 429
        ? 'Too many requests. Please slow down.'
        : `Request failed (${res.status})`);
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

export async function fetchDashboard(shortKey, timeRange = '24h') {
  const headers = await authHeaders();
  const res = await fetch(
    `${API_BASE_URL}/${encodeURIComponent(shortKey)}/dashboard?timeRange=${encodeURIComponent(timeRange)}`,
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

export async function deleteAccount() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/account`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) await handle(res);
  return true;
}
