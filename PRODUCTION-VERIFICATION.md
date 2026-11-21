# BLACK BRAND — Production candidate verification

Date: 2026-11-21

## Maintenance fixes — 2026-11-21

- **Fixed sandbox checkout failure**: `createOrder` used to pass nested `shipping.district` to `computeMockQuote`, which expected a top-level `district`. It now normalizes the district before recalculating delivery charges and totals. This does not alter the production `Code.gs` API contract.
- **Fixed admin TOTP setup effect race**: React StrictMode's development effect replay could leave the authenticator QR permanently loading when the first request resolved after cleanup. The component now reuses the same in-flight request with a fresh subscriber on replay.
- **Updated mock homepage banner** to match requested copy: `DEFINE YOUR STYLE.` and the full men's fashion supporting sentence. The hero renders this exact title on two editorial lines. Real production banners remain editable through admin settings; their data takes precedence, so update the live banner record separately during staging.
- **Added automated tests**: `npm test` covers a sandbox quote, successful order placement using nested shipping district, an idempotent repeated order, mock owner login, and the mock TOTP enrollment flow.
- `npm test`: **PASS** (2 tests); `VITE_APP_MODE=production VITE_PRODUCTION_API_URL=<previously supplied URL> npm run build`: **PASS** (2032 modules).

### Not yet verified

- Complete admin CRUD workflows, real Google Authenticator TOTP enrollment/login, server-side role authorization, token expiry/revocation, rate limiting, and real product/image persistence depend on a separate staging `Code.gs` deployment and test Sheet.
- Browser interactions and responsive visual checks could not be executed here; prior Chromium attempts failed due to socket permissions.
- **Do not deploy to the live domain or process real payments** until these checks pass. A successful bundle build is not proof of production readiness.

## Cinematic homepage update

- Integrated the four complete files from `Pasted text(20261121-004626).txt`: `src/components/ui/Primitives.jsx`, `src/components/store/Header.jsx`, `src/components/store/ProductCard.jsx`, and `src/pages/store/HomePage.jsx`.
- Updated the hero motion timings and image scale, introduced desktop-only parallax behavior, refined shared reveals, adjusted hover to hover-capable devices, and added homepage category filter pills.
- Source comparison against the prior production candidate showed **only these four source files changed**. Backend services, admin pages, checkout and authentication source files were not modified.
- `VITE_APP_MODE=production VITE_PRODUCTION_API_URL=<previously supplied Apps Script URL> npm run build`: **PASS** (2032 modules transformed).
- Bundle scan: no `mockBackend` module reference, demo admin credentials, reset sandbox label, or mock database key found in compiled JS/HTML/CSS.
- Interactive/browser, 320px–1440px responsive, keyboard, reduced-motion, catalog, cart, and live payment checks remain **unverified**. The headless Chromium launch was blocked by this environment previously.
- The new category filters compare product `category` values with existing category names; this matches the previous catalog filtering pattern, but must be confirmed against actual live catalog data.

## Integrated changes

- Nine files supplied in `Pasted text(20261121-003407).txt` were integrated into a copy of the latest React release candidate: `.gitignore`, `.env.example`, `vite.config.js`, `src/config/brand.js`, `src/services/api.js`, `src/components/store/Header.jsx`, `src/pages/store/CheckoutPage.jsx`, `src/pages/admin/AdminAuth.jsx`, and `src/pages/admin/AdminApp.jsx`.
- `src/config/brand.js` was further hardened to require an explicit `VITE_PRODUCTION_API_URL`, rather than silently using an unverified deployment URL.
- Existing backend `Code.gs` was not changed. The existing Vercel live project and domain were not modified.

## Verification performed

- `npm ci --offline`: PASS (165 packages installed).
- `VITE_APP_MODE=production VITE_PRODUCTION_API_URL=<previously supplied Apps Script URL> npm run build`: PASS (2032 modules transformed).
- Production `dist` contains `index.html`, `brand-management.html`, `order-confirmation.html`, `robots.txt`, `sitemap.xml`, and the expected logo under `RESOURCES/`.
- Compiled JS does **not** contain the `mockBackend` module name, demo admin email/password strings, Reset Sandbox control label, or mock database key.
- The broad text search for `SANDBOX` does have matches, because Cashfree's legitimate **sandbox environment** setting and the `mockSandboxPayment` response field remain in the storefront's payment code. Those are not bundled mock accounts or mock database code. Audit the payment flows against a test backend before release.
- Browser smoke test: **BLOCKED**. Headless Chromium failed to start due to container socket permission restrictions. No UI interaction, login, payment, or mobile behavior has been verified.
- API URL equivalence with the current `mhdrifa/black_brand/js/config.js`: **UNVERIFIED**.
- Staging Apps Script, test Google Sheet, admin TOTP, live customer OTP, inventory, checkout, and Cashfree verification: **UNVERIFIED**.

## How to test locally

1. Copy `.env.example` to `.env.local`, then enter the **verified** production Apps Script URL. For safe initial testing, instead set `VITE_APP_MODE=staging` and point `VITE_STAGING_API_URL` to a separate test deployment and Sheet.
2. Run `npm ci` and `npm run dev`, then inspect the storefront and `/brand-management.html`.
3. Run `npm run build` and `npm run preview`. Inspect the browser's Network and Console panels.
4. Verify catalog, quote, order, customer OTP, admin TOTP, all admin management modules, and Cashfree in sandbox/test mode. Test 320px–1920px and reduced-motion behavior.
5. Deploy to an independent Vercel preview. Do not attach `blackbrand.com.lk` or `www.blackbrand.com.lk` until all staging checks pass and the owner explicitly approves cutover.

## Security and deployment notes

- The `VITE_*` variables are embedded in browser bundles: use them only for public backend URLs, never private credentials.
- Client-side role checks do **not** replace backend `Code.gs` authorization.
- A static admin URL is discoverable even when unlinked; security depends on valid backend authentication, TOTP, authorization, throttling, and token policies.
- An `npm run build` success does not prove the website is bug-free or production-ready.
- Do not delete the legacy deployment. Keep it intact for DNS/domain rollback.
