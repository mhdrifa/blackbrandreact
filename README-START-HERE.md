# BLACK BRAND React — Independent Preview

The supplied React/Vite storefront and admin code has been assembled with the
latest uploaded fixes. This package is a **separate project**, not a replacement
for your live site.

## Run locally (Windows PowerShell)

1. Extract this ZIP to a separate directory, then open the inner
   `blackbrand-react` project in VS Code.
2. Open its terminal and run:

   ```powershell
   npm install
   npm run dev
   ```

3. Open `http://localhost:5173/` and
   `http://localhost:5173/brand-management.html`.

4. To build the isolated mock version:

   ```powershell
   $env:VITE_APP_MODE = 'mock'
   npm run build
   npm run preview
   ```

The development server defaults to **mock** mode when no mode is set. For a
mock preview build, explicitly set `VITE_APP_MODE=mock` before `npm run build`.
Production builds default to production mode and require the real public API
URL to be supplied explicitly via `VITE_PRODUCTION_API_URL`; see `.env.example`.
The mock storefront and admin use simulated, local browser data; do not assume
the actual Google Apps Script backend or payments have been tested.

## Supabase Preview admin authentication

Enable `VITE_USE_SUPABASE_PRODUCTS=true` only in an isolated Vercel Preview
or local test environment. Configure `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and a random 32-byte
`ADMIN_SESSION_ENCRYPTION_KEY` (hex or base64) as server environment variables.
Set `ADMIN_ALLOWED_ORIGIN` to the exact Preview origin when available. Do not
prefix server secrets with `VITE_`.

The session store uses the existing `black_brand.admin_sessions` columns:
`session_hash` (text primary key), `user_id` (UUID), `assurance_level`,
`encrypted_auth_state`, `created_at`, `expires_at`, `revoked_at`, and
`updated_at`. Keep this table inaccessible to browser clients; only the server
secret key should access it. Login throttling calls `admin_login_reserve` and
`admin_login_reset` with `p_identifier_hash`. Supabase Preview exposes
authentication only; admin data operations remain blocked until their
server-side authorization and data APIs are implemented.

The existing `admin_login_reserve` and `admin_login_reset` functions were
verified to allow three reservations, lock for 15 minutes on the third, deny
the fourth request, and reset the lock after successful MFA. This application
does not replace those database functions. The rollback-only SQL assertions
are in `supabase/tests/admin_login_lockout.sql`; an authorized database
operator may run them against staging to verify the deployed behavior.

## Run regression tests

```powershell
npm test
```

The suite includes the sandbox Kandy delivery/checkout regression and an
idempotent order-retry check. It does not place real orders.

## Safety and status

- Both mock and production-mode Vite builds have succeeded during development.
- A subsequent Vite build also passed after the animation polish changes.
- The latest storefront and admin corrections were merged, and `npm run build`
  passed in isolated mock mode with 2,031 modules transformed.
- An attempted headless Chromium smoke test was blocked by environment
  permissions, so browser workflows remain **unverified**.
- This is a **release candidate**, not a certified bug-free production release.
- The nine animation-enhanced source files from Google AI Studio were
  integrated together and successfully compiled in mock mode.
- The animation integration has not been browser-tested; check Quick View,
  add-to-bag timing, focus handling, scrolling, and mobile performance.
- Animation polish includes a subtle storefront entrance, refined product-card
  hover/focus feedback, and additional reduced-motion safeguards. Existing
  cinematic homepage and bag-drawer transitions are preserved.
- No live orders, card charges, production sheet changes, or deployment were run.
- Browser interaction, mobile layout, auth, admin workflows, and end-to-end
  payments still need testing. Do not replace the live website yet.
- The package contains the uploaded logo; verify whether you have other assets.
- The original Google Apps Script `Code.gs` is intentionally not bundled and
  has not been modified.
- Only connect a separately provisioned staging backend after its URL and
  permissions are verified.

## Production warning

Production mode must be explicitly selected with `VITE_APP_MODE=production`.
Do **not** select it while testing, because it connects to the live backend.
