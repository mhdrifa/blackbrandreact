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
    throw new ApiError('NETWORK', 'The server returned an unreadable response. Please try again.');
  }
  if (!json.ok) {
    throw new ApiError(json.error?.code || 'ERROR', json.error?.message || 'Request failed.', json.error?.details);
  }
  return json.data;
}

export async function apiGet(action, params = {}) {
  if (__ALLOW_MOCK__ && APP_MODE === 'mock') {
    try {
      const { mockGet } = await import('./mockBackend');
      return await mockGet(action, params);
    } catch (e) {
      throw new ApiError(e.code || 'ERROR', e.message, e.details);
    }
  }
  const { url } = resolveApiEndpoint();
  const q = new URLSearchParams({ action, ...params });
  let res;
  try {
    res = await fetch(`${url}?${q.toString()}`);
  } catch {
    throw new ApiError('NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }
  return parseResponse(res);
}

// POST uses text/plain;charset=utf-8 to avoid CORS preflight on Google Apps Script
export async function apiPost(action, data = {}, auth = {}) {
  if (__ALLOW_MOCK__ && APP_MODE === 'mock') {
    try {
      const { mockPost } = await import('./mockBackend');
      return await mockPost(action, data, auth);
    } catch (e) {
      throw new ApiError(e.code || 'ERROR', e.message, e.details);
    }
  }
  const { url } = resolveApiEndpoint();
  const body = { action, data, ...auth };
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
  } catch {
    throw new ApiError('NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }
  return parseResponse(res);
}
