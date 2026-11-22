/* global __ALLOW_MOCK__ */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, RotateCcw } from 'lucide-react';
import { APP_MODE, BRAND_CONFIG, IS_TEST_MODE } from '../../config/brand';
import { apiGet, apiPost, IS_SUPABASE_PREVIEW } from '../../services/api';
import { downloadFile, modeKey } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { LUXURY_EASE, PageTransition, Spinner } from '../../components/ui/Primitives';
import { AdminBtn } from '../../components/admin/AdminPrimitives';
import { AdminLoginView, AdminTotpSetupView } from './AdminAuth';
import { AnalyticsPage, DashboardPage } from './AdminDashboard';
import { AdminProductEditorPage, AdminProductsListPage } from './AdminProducts';
import { EntityCrudPage, InventoryPage, OrdersPage } from './AdminEntities';
import {
  ActivityPage,
  CustomersPage,
  MarketingPage,
  MessagesPage,
  PaymentsPage,
  ReportsPage,
  ReviewsPage,
  SettingsPage,
  StaffPage
} from './AdminOperations';

const KEY_ADMIN_TOK = modeKey('bb_admin_tok');

const MENU = [
  ['', 'OVERVIEW'],
  ['dashboard', 'Dashboard'],
  ['analytics', 'Sales Analytics'],
  ['', 'CATALOG'],
  ['products', 'Products'],
  ['product/new', 'Add Product'],
  ['categories', 'Categories'],
  ['collections', 'Collections'],
  ['inventory', 'Inventory'],
  ['', 'SALES'],
  ['orders', 'Orders'],
  ['payments', 'Payments'],
  ['customers', 'Customers'],
  ['coupons', 'Coupons'],
  ['', 'ENGAGE'],
  ['marketing', 'Marketing'],
  ['banners', 'Homepage Banners'],
  ['reviews', 'Reviews'],
  ['messages', 'Customer Messages'],
  ['', 'ADMIN'],
  ['reports', 'Reports'],
  ['staff', 'Staff Management'],
  ['settings', 'Store Settings'],
  ['activity', 'Activity Logs']
];

const OWNER_ONLY = ['staff', 'settings'];
const STAFF_HIDDEN = [
  'dashboard', 'analytics', 'payments', 'customers', 'coupons',
  'marketing', 'banners', 'reports', 'activity', 'categories',
  'collections', 'product/new', 'products'
];

function isRouteAllowed(role, routeKey) {
  if (OWNER_ONLY.includes(routeKey) && role !== 'owner') return false;
  if (role === 'staff' && (STAFF_HIDDEN.includes(routeKey) || routeKey.startsWith('product/'))) {
    return false;
  }
  return true;
}

export default function AdminApp() {
  const toast = useToast();
  const location = useLocation();

  const [token, setToken] = useState(() =>
    IS_SUPABASE_PREVIEW ? '' : sessionStorage.getItem(KEY_ADMIN_TOK) || ''
  );
  const [serverAuthenticated, setServerAuthenticated] = useState(false);
  const [staff, setStaff] = useState(null);
  const [scope, setScope] = useState('');
  const [booting, setBooting] = useState(
    IS_SUPABASE_PREVIEW || Boolean(sessionStorage.getItem(KEY_ADMIN_TOK))
  );
  const [loginMsg, setLoginMsg] = useState('');
  const [apiVersion, setApiVersion] = useState('');
  const [sideOpen, setSideOpen] = useState(false);

  const logout = useCallback((expiredMsg = '', notifyServer = true) => {
    if (IS_SUPABASE_PREVIEW && notifyServer) {
      apiPost('adminLogout').catch(() => {});
    }
    if (!IS_SUPABASE_PREVIEW) sessionStorage.removeItem(KEY_ADMIN_TOK);
    setServerAuthenticated(false);
    setToken('');
    setStaff(null);
    setScope('');
    setLoginMsg(expiredMsg);
  }, []);

  useEffect(() => {
    if (!IS_SUPABASE_PREVIEW && !token) {
      setBooting(false);
      return;
    }
    let alive = true;
    setBooting(true);
    apiPost('adminMe', {}, IS_SUPABASE_PREVIEW ? {} : { token })
      .then((me) => {
        if (!alive) return;
        if (IS_SUPABASE_PREVIEW) setServerAuthenticated(true);
        setStaff(me.staff);
        setScope(me.scope);
      })
      .catch((e) => {
        if (!alive) return;
        if (e.code === 'SETUP_REQUIRED') {
          if (IS_SUPABASE_PREVIEW) setServerAuthenticated(true);
          setScope('setup');
        } else {
          logout(
            e.code === 'SESSION_EXPIRED' ? 'Your session ended. Please sign in again.' : '',
            false
          );
        }
      })
      .finally(() => { if (alive) setBooting(false); });
    return () => { alive = false; };
  }, [token, logout]);

  useEffect(() => {
    if (!staff) return;
    apiGet('ping').then((d) => setApiVersion(d.version)).catch(() => {});
  }, [staff]);

  useEffect(() => {
    setSideOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!sideOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSideOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sideOpen]);

  const call = useCallback(
    async (action, data = {}) => {
      try {
        return await apiPost(action, data, { token });
      } catch (e) {
        if (e.code === 'UNAUTHORIZED' || e.code === 'SESSION_EXPIRED') {
          logout('Your session ended. Please sign in again.');
        } else if (e.code === 'SETUP_REQUIRED' && token) {
          setScope('setup');
        }
        throw e;
      }
    },
    [token, logout]
  );

  const list = useCallback(
    (sheet, extra = {}) => call('list', { sheet, limit: 1000, ...extra }),
    [call]
  );

  const exportSheet = useCallback(
    async (sheet) => {
      try {
        const x = await call('exportCsv', { sheet });
        downloadFile(x.filename, x.csv);
        toast(`${x.rows} rows exported`);
      } catch (e) {
        toast(e.message, true);
      }
    },
    [call, toast]
  );

  const handleResetSandbox = async () => {
    if (!__ALLOW_MOCK__) return;
    const { resetMockDb } = await import('../../services/mockBackend');
    resetMockDb();
    try {
      localStorage.removeItem(modeKey('bb_cat_cache'));
      localStorage.removeItem(modeKey('bb_last_order'));
      sessionStorage.removeItem(modeKey('bb_idem'));
    } catch { /* ignore */ }
    toast('Sandbox test data reset');
    window.location.reload();
  };

  const role = staff?.role || 'staff';
  const visibleMenu = useMemo(
    () => MENU.filter(([routeKey]) => routeKey === '' || isRouteAllowed(role, routeKey)),
    [role]
  );

  const pageTitle = useMemo(() => {
    const clean = location.pathname.replace(/^\//, '');
    if (clean.startsWith('product/')) return clean === 'product/new' ? 'Add Product' : 'Edit Product';
    const match = MENU.find(([k]) => k && k === clean);
    return match ? match[1] : 'Admin';
  }, [location.pathname]);

  useEffect(() => {
    document.title = staff ? `${pageTitle} — BLACK BRAND Admin` : 'BLACK BRAND — Enterprise Admin';
  }, [staff, pageTitle]);

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3f3f1]">
        <Spinner />
      </div>
    );
  }

  const authenticated = IS_SUPABASE_PREVIEW ? serverAuthenticated : Boolean(token);

  if (!authenticated) {
    return (
      <AdminLoginView
        initialMsg={loginMsg}
        onAuthenticated={(r) => {
          if (!IS_SUPABASE_PREVIEW && r.token) {
            sessionStorage.setItem(KEY_ADMIN_TOK, r.token);
            setToken(r.token);
          }
          setServerAuthenticated(true);
          setStaff(r.staff);
          setScope(r.scope);
        }}
        onRequireSetup={(r) => {
          if (!IS_SUPABASE_PREVIEW && r.token) {
            sessionStorage.setItem(KEY_ADMIN_TOK, r.token);
            setToken(r.token);
          }
          setServerAuthenticated(true);
          setStaff(r.staff);
          setScope('setup');
        }}
      />
    );
  }

  if (scope === 'setup') {
    return (
      <AdminTotpSetupView
        token={token}
        onComplete={(s) => {
          setToken(s.token || '');
          setServerAuthenticated(true);
          setStaff(s.staff);
          setScope('full');
        }}
        onCancel={(msg) => logout(msg)}
      />
    );
  }

  if (!staff) return null;

  const currentRoute = location.pathname.replace(/^\//, '');
  const defaultRoute = role === 'staff' ? '/orders' : '/dashboard';

  const guard = (routeKey, element) =>
    isRouteAllowed(role, routeKey) ? (
      element
    ) : (
      <div className="border border-[#f3c1bd] bg-[#fff1f0] p-6 text-xs text-[#8a1a14]">
        You do not have permission to view this page.
      </div>
    );

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
      <AnimatePresence>
        {sideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSideOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col overflow-y-auto bg-charcoal py-4 text-[#c9c6c5] transition-transform duration-200 ease-luxury lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${
          sideOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="mb-2 flex items-center gap-2.5 border-b border-[#2c2b2b] px-5 pb-3.5 font-display text-xl tracking-[0.06em] text-white">
          <img src={BRAND_CONFIG.LOGO_URL} alt="" className="h-9 w-9 bg-black object-contain" />
          <div>
            BLACK BRAND
            <small className="block font-sans text-[10px] font-semibold tracking-[0.2em] text-champagne-soft">
              ADMIN CONSOLE
            </small>
          </div>
        </div>

        <nav className="flex-1">
          {visibleMenu.map(([routeKey, label], idx) =>
            routeKey === '' ? (
              <div key={`g-${idx}`} className="px-5 pb-1 pt-3.5 text-[10px] font-bold tracking-[0.18em] text-[#6b6b6b]">
                {label}
              </div>
            ) : (
              <Link
                key={routeKey}
                to={`/${routeKey}`}
                className={`relative block px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                  currentRoute === routeKey
                    ? 'bg-[#262525] text-champagne-soft'
                    : 'hover:bg-[#262525]/60 hover:text-white'
                }`}
              >
                {currentRoute === routeKey && (
                  <motion.span
                    layoutId="admin-nav-active"
                    transition={{ duration: 0.22, ease: LUXURY_EASE }}
                    className="absolute inset-y-0 left-0 w-[3px] bg-champagne"
                  />
                )}
                {label}
              </Link>
            )
          )}
        </nav>

        <div className="mt-auto px-5 pt-4">
          <a href="index.html" className="text-xs text-[#8b8d8d] transition-colors hover:text-white">
            ← View storefront
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        {IS_TEST_MODE && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-champagne/40 bg-[#1a1610] px-4 py-1.5 text-[11px] font-medium tracking-[0.08em] text-champagne-soft lg:px-6">
            <span>
              {__ALLOW_MOCK__ && APP_MODE === 'mock'
                ? 'SANDBOX ADMIN — SAFE LOCAL TESTING (CHANGES STAY IN BROWSER ONLY)'
                : 'STAGING ADMIN — CONNECTED TO TEST APPS SCRIPT ONLY'}
            </span>
            {__ALLOW_MOCK__ && APP_MODE === 'mock' && (
              <button
                type="button"
                onClick={handleResetSandbox}
                className="inline-flex items-center gap-1 border border-champagne/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-champagne-soft transition hover:bg-champagne-soft hover:text-black"
              >
                <RotateCcw className="h-3 w-3" /> Reset Sandbox
              </button>
            )}
          </div>
        )}

        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-hairline bg-white/95 px-4 py-2.5 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setSideOpen((s) => !s)}
              className="flex h-10 w-10 items-center justify-center lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <b className="text-sm">{pageTitle}</b>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="hidden sm:inline">{staff.name}</span>
            <span className="bg-charcoal px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-champagne-soft">
              {role}
            </span>
            <AdminBtn
              size="sm"
              variant="outline"
                  onClick={() => logout()}
            >
              Sign out
            </AdminBtn>
            {apiVersion && (
              <small className="hidden text-[10px] font-normal text-slate md:inline">
                API v{apiVersion}
              </small>
            )}
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <PageTransition routeKey={location.pathname}>
            <Routes>
              <Route path="/" element={<Navigate to={defaultRoute} replace />} />
              <Route path="/dashboard" element={guard('dashboard', <DashboardPage call={call} />)} />
              <Route path="/analytics" element={guard('analytics', <AnalyticsPage call={call} list={list} />)} />
              <Route path="/products" element={guard('products', <AdminProductsListPage call={call} list={list} toast={toast} />)} />
              <Route path="/product/:id" element={guard('products', <AdminProductEditorPage call={call} list={list} toast={toast} />)} />
              <Route path="/categories" element={guard('categories', <EntityCrudPage entityKey="category" call={call} list={list} toast={toast} />)} />
              <Route path="/collections" element={guard('collections', <EntityCrudPage entityKey="collection" call={call} list={list} toast={toast} />)} />
              <Route path="/banners" element={guard('banners', <EntityCrudPage entityKey="banner" call={call} list={list} toast={toast} />)} />
              <Route path="/coupons" element={guard('coupons', <EntityCrudPage entityKey="coupon" call={call} list={list} toast={toast} />)} />
              <Route path="/inventory" element={guard('inventory', <InventoryPage call={call} list={list} exportSheet={exportSheet} role={role} toast={toast} />)} />
              <Route path="/orders" element={guard('orders', <OrdersPage call={call} list={list} exportSheet={exportSheet} role={role} toast={toast} />)} />
              <Route path="/payments" element={guard('payments', <PaymentsPage call={call} list={list} exportSheet={exportSheet} toast={toast} />)} />
              <Route path="/customers" element={guard('customers', <CustomersPage call={call} list={list} exportSheet={exportSheet} toast={toast} />)} />
              <Route path="/reviews" element={guard('reviews', <ReviewsPage call={call} list={list} exportSheet={exportSheet} toast={toast} />)} />
              <Route path="/messages" element={guard('messages', <MessagesPage call={call} list={list} exportSheet={exportSheet} toast={toast} />)} />
              <Route path="/marketing" element={guard('marketing', <MarketingPage list={list} exportSheet={exportSheet} />)} />
              <Route path="/reports" element={guard('reports', <ReportsPage call={call} exportSheet={exportSheet} toast={toast} />)} />
              <Route path="/staff" element={guard('staff', <StaffPage call={call} toast={toast} />)} />
              <Route
                path="/settings"
                element={guard(
                  'settings',
                  <SettingsPage
                    call={call}
                    list={list}
                    staff={staff}
                    onTokenUpdated={(s) => {
                      if (!IS_SUPABASE_PREVIEW && s.token) {
                        sessionStorage.setItem(KEY_ADMIN_TOK, s.token);
                      }
                      setToken(s.token || '');
                      setStaff(s.staff);
                    }}
                    toast={toast}
                  />
                )}
              />
              <Route path="/activity" element={guard('activity', <ActivityPage list={list} exportSheet={exportSheet} />)} />
              <Route
                path="*"
                element={
                  <div className="border border-hairline bg-white p-10 text-center text-xs text-slate">
                    Page not found.
                  </div>
                }
              />
            </Routes>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
