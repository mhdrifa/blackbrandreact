/* global __ALLOW_MOCK__ */
const PRODUCTION_API_URL = String(
  import.meta.env.VITE_PRODUCTION_API_URL || ''
).trim();

const APPS_SCRIPT_EXEC_RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_\-]+\/exec$/;

const rawMode = String(import.meta.env.VITE_APP_MODE || '').trim().toLowerCase();

export const APP_MODE =
  rawMode === 'staging'
    ? 'staging'
    : __ALLOW_MOCK__ && (rawMode === 'mock' || (import.meta.env.DEV && !rawMode))
      ? 'mock'
      : 'production';

export const IS_TEST_MODE = APP_MODE !== 'production';
export const STAGING_API_URL = String(import.meta.env.VITE_STAGING_API_URL || '').trim();

export function resolveApiEndpoint() {
  if (__ALLOW_MOCK__ && APP_MODE === 'mock') {
    return { mode: 'mock', url: '' };
  }
  if (APP_MODE === 'staging') {
    if (!APPS_SCRIPT_EXEC_RE.test(STAGING_API_URL)) {
      throw new Error(
        'Staging mode requires a valid VITE_STAGING_API_URL (https://script.google.com/macros/s/.../exec).'
      );
    }
    if (STAGING_API_URL === PRODUCTION_API_URL) {
      throw new Error(
        'Safety block: VITE_STAGING_API_URL cannot match the live production Apps Script URL.'
      );
    }
    return { mode: 'staging', url: STAGING_API_URL };
  }
  if (!APPS_SCRIPT_EXEC_RE.test(PRODUCTION_API_URL)) {
    throw new Error(
      'Configuration error: Production API URL is missing or invalid.'
    );
  }
  return { mode: 'production', url: PRODUCTION_API_URL };
}

export const BRAND_CONFIG = {
  API_URL: PRODUCTION_API_URL,
  LOGO_URL: '/RESOURCES/38667688-5F43-4087-B2AC-CE4ABF5291F8.png',
  DEFAULT_WHATSAPP_URL: 'https://wa.me/message/IFADOYDEKWLEA1',
  DEFAULT_WHATSAPP_NUMBER: '94770498004',
  DEFAULT_PHONE_DISPLAY: '+94 77 049 8004',
  DEFAULT_PHONE_TEL: '+94770498004'
};

export const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha',
  'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala',
  'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

export const PROVINCES = [
  'Central', 'Eastern', 'North Central', 'North Western', 'Northern',
  'Sabaragamuwa', 'Southern', 'Uva', 'Western'
];

export const DISTRICT_PROVINCE = {
  Colombo: 'Western', Gampaha: 'Western', Kalutara: 'Western',
  Kandy: 'Central', Matale: 'Central', 'Nuwara Eliya': 'Central',
  Galle: 'Southern', Matara: 'Southern', Hambantota: 'Southern',
  Jaffna: 'Northern', Kilinochchi: 'Northern', Mannar: 'Northern', Mullaitivu: 'Northern', Vavuniya: 'Northern',
  Trincomalee: 'Eastern', Batticaloa: 'Eastern', Ampara: 'Eastern',
  Kurunegala: 'North Western', Puttalam: 'North Western',
  Anuradhapura: 'North Central', Polonnaruwa: 'North Central',
  Badulla: 'Uva', Monaragala: 'Uva',
  Ratnapura: 'Sabaragamuwa', Kegalle: 'Sabaragamuwa'
};
