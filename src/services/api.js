
/* global __ALLOW_MOCK__ */
import { APP_MODE, resolveApiEndpoint } from '../config/brand';

// Supabase testing mode.
// Enable only in the Vercel Preview environment.
export const IS_SUPABASE_PREVIEW =
  import.meta.env.VITE_USE_SUPABASE_PRODUCTS === 'true';

export class ApiError extends Error {
  constructor(code, message, details, status) {
    super(message);

    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

// Parse standard API responses
async function parseResponse(res) {
  let json;

  try {
    json = await res.json();
  } catch {
    throw new ApiError(
      'NETWORK',
      'The server returned an unreadable response. Please try again.',
      undefined,
      res.status
    );
  }

  if (!res.ok || !json.ok) {
    const error = json.error;

    throw new ApiError(
      error?.code || 'ERROR',
      error?.message ||
        (typeof error === 'string'
          ? error
          : 'Request failed.'),
      error?.details,
      res.status
    );
  }

  return json.data;
}

// GET REQUESTS
export async function apiGet(action, params = {}) {
  // Preserve existing mock mode
  if (__ALLOW_MOCK__ && APP_MODE === 'mock') {
    try {
      const { mockGet } = await import('./mockBackend');
      return await mockGet(action, params);
    } catch (error) {
      throw new ApiError(
        error.code || 'ERROR',
        error.message,
        error.details
      );
    }
  }

  // Supabase migration Preview
  if (IS_SUPABASE_PREVIEW) {
    // Public storefront catalog
    if (action === 'catalog') {
      let response;

      try {
        response = await fetch('/api/catalog', {
          method: 'GET',
          cache: 'no-store'
        });
      } catch {
        throw new ApiError(
          'NETWORK',
          'Cannot reach the Supabase catalog API.'
        );
      }

      return parseResponse(response);
    }

    // Other endpoints have not been migrated yet
    console.warn(
      '[Supabase Preview] Unsupported GET action:',
      action
    );

    throw new ApiError(
      'MIGRATION_NOT_READY',
      `The "${action}" feature is not available in this test version.`
    );
  }

  // Existing production Google Apps Script backend
  const { url } = resolveApiEndpoint();

  const query = new URLSearchParams({
    action,
    ...params
  });

  let response;

  try {
    response = await fetch(
      `${url}?${query.toString()}`
    );
  } catch {
    throw new ApiError(
      'NETWORK',
      'Cannot reach the server. Check your connection and try again.'
    );
  }

  return parseResponse(response);
}

// POST REQUESTS
export async function apiPost(action, data = {}, auth = {}) {
  // Preserve existing mock mode
  if (__ALLOW_MOCK__ && APP_MODE === 'mock') {
    try {
      const { mockPost } = await import('./mockBackend');

      return await mockPost(action, data, auth);
    } catch (error) {
      throw new ApiError(
        error.code || 'ERROR',
        error.message,
        error.details
      );
    }
  }

  // Block all writes during Supabase migration testing.
  // Prevents test orders, payments, and admin changes
  // from reaching the existing production backend.
 
  // Supabase migration Preview:
  // Allow only admin authentication requests.
  if (IS_SUPABASE_PREVIEW) {
    const allowedAuthActions = new Set([
      'adminLogin',
      'adminTotpSetup',
      'adminTotpConfirm',
      'adminMe',
      'adminLogout'
    ]);

    if (allowedAuthActions.has(action)) {
      let response;

      try {
        response = await fetch('/api/admin-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ action, data })
        });
      } catch {
        throw new ApiError(
          'NETWORK',
          'Cannot reach the Supabase admin authentication API.'
        );
      }

      return parseResponse(response);
    }

    // Keep all other Preview POST operations disabled.
    console.warn(
      '[Supabase Preview] Blocked POST action:',
      action
    );

    throw new ApiError(
      'MIGRATION_NOT_READY',
      'This feature is not available during Supabase migration testing.'
    );
  }


  // Existing production Google Apps Script backend
  const { url } = resolveApiEndpoint();

  const body = {
    action,
    data,
    ...auth
  };

  let response;

  try {
    response = await fetch(url, {
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

  return parseResponse(response);
}
