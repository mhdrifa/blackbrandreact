
/* global __ALLOW_MOCK__ */
import { APP_MODE, resolveApiEndpoint } from '../config/brand';

export class ApiError extends Error {
  constructor(code, message, details, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function parseResponse(res) {
  let json;

  try {
    json = await res.json();
  } catch {
    throw new ApiError(
      'NETWORK',
      'The server returned an unreadable response. Please try again.'
    );
  }

  if (!res.ok || !json.ok) {
    const error = json.error;

    throw new ApiError(
      error?.code || 'ERROR',
      error?.message || (typeof error === 'string' ? error : 'Request failed.'),
      error?.details,
      res.status
    );
  }

  return json.data;
}

export async function apiGet(action, params = {}) {
  // Preserve mock mode
  if (__ALLOW_MOCK__ && APP_MODE === 'mock') {
    try {
      const { mockGet } = await import('./mockBackend');
      return await mockGet(action, params);
    } catch (e) {
      throw new ApiError(e.code || 'ERROR', e.message, e.details);
    }
  }

 // Supabase migration: explicitly enabled for testing only
const isSupabasePreview =
  import.meta.env.VITE_USE_SUPABASE_PRODUCTS === 'true';

if (isSupabasePreview && action === 'catalog') {
    let response;

    try {
      response = await fetch('/api/catalog');
    } catch {
      throw new ApiError(
        'NETWORK',
        'Cannot reach the products API.'
      );
    }

    return parseResponse(response);
  }

  // All other requests use the existing Google Apps Script
  const { url } = resolveApiEndpoint();

  const q = new URLSearchParams({
    action,
    ...params
  });

  let res;

  try {
    res = await fetch(`${url}?${q.toString()}`);
  } catch {
    throw new ApiError(
      'NETWORK',
      'Cannot reach the server. Check your connection and try again.'
    );
  }

  return parseResponse(res);
}

// Existing POST requests remain unchanged
export async function apiPost(action, data = {}, auth = {}) {
  if (__ALLOW_MOCK__ && APP_MODE === 'mock') {
    try {
      const { mockPost } = await import('./mockBackend');
      return await mockPost(action, data, auth);
    } catch (e) {
      throw new ApiError(e.code || 'ERROR', e.message, e.details);
    }
  }
  if (isSupabasePreview) {
  console.warn('[Supabase Preview] Unsupported GET action:', action);

  throw new ApiError(
    'MIGRATION_NOT_READY',
    `Preview backend does not support "${action}" yet.`
  );
}

  const { url } = resolveApiEndpoint();

  const body = {
    action,
    data,
    ...auth
  };

  let res;

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new ApiError(
      'NETWORK',
      'Cannot reach the server. Check your connection and try again.'
    );
  }

  return parseResponse(res);
}
