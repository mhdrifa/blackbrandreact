import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import './styles/index.css';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { money, placeholderImg, safeImg } from './utils/format';
import { EmptyState, Modal, PageTransition } from './components/ui/Primitives';
import Header from './components/store/Header';
import Footer from './components/store/Footer';
import CartDrawer from './components/store/CartDrawer';
import VariantPicker from './components/store/VariantPicker';
import HomePage from './pages/store/HomePage';
import CatalogPage, { CollectionsPage } from './pages/store/CatalogPage';
import ProductPage from './pages/store/ProductPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import OrderConfirmationPage from './pages/store/OrderConfirmationPage';
import TrackingPage from './pages/store/TrackingPage';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/store/AuthPages';
import AccountPage from './pages/store/AccountPage';
import { ContactPage, StaticPage, WishlistPage } from './pages/store/InfoPages';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);
  return null;
}

function QuickViewModal() {
  const { quickProductId, setQuickProductId, findProduct } = useStore();
  const product = quickProductId ? findProduct(quickProductId) : null;

  return (
    <Modal open={!!product} onClose={() => setQuickProductId(null)} maxWidth="max-w-3xl">
      {product && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="aspect-[4/5] overflow-hidden bg-[#eceae4]">
            <img
              src={safeImg(product.mainImageUrl)}
              onError={(e) => { e.currentTarget.src = placeholderImg; }}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-slate">SKU {product.sku}</div>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">{product.name}</h2>
            <div className="my-3 flex items-baseline gap-2.5 text-xl font-semibold">
              <span>{money(product.salePrice > 0 ? product.salePrice : product.priceFrom)}</span>
              {product.salePrice > 0 && (
                <s className="text-sm font-normal text-slate">{money(product.regularPrice)}</s>
              )}
            </div>
            <VariantPicker product={product} onDone={() => setQuickProductId(null)} />
            <Link
              to={`/product/${encodeURIComponent(product.productId)}`}
              onClick={() => setQuickProductId(null)}
              className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] underline"
            >
              FULL DETAILS →
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}

function StoreShell() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <PageTransition routeKey={location.pathname}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<CatalogPage mode="shop" />} />
            <Route path="/new-arrivals" element={<CatalogPage mode="new" />} />
            <Route path="/best-sellers" element={<CatalogPage mode="best" />} />
            <Route path="/sale" element={<CatalogPage mode="sale" />} />
            <Route path="/search" element={<CatalogPage mode="search" />} />
            <Route path="/category/:name" element={<CatalogPage mode="category" />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collection/:slug" element={<CatalogPage mode="collection" />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/complete-registration" element={<Navigate to="/account" replace />} />
            <Route path="/account" element={<AccountPage tab="overview" />} />
            <Route path="/account/profile" element={<AccountPage tab="profile" />} />
            <Route path="/account/addresses" element={<AccountPage tab="addresses" />} />
            <Route path="/account/orders" element={<AccountPage tab="orders" />} />
            <Route path="/account/orders/:orderId" element={<AccountPage tab="order-detail" />} />
            <Route path="/about" element={<StaticPage kind="about" />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<StaticPage kind="faq" />} />
            <Route path="/size-guide" element={<StaticPage kind="size-guide" />} />
            <Route path="/shipping" element={<StaticPage kind="shipping" />} />
            <Route path="/returns" element={<StaticPage kind="returns" />} />
            <Route path="/privacy" element={<StaticPage kind="privacy" />} />
            <Route path="/terms" element={<StaticPage kind="terms" />} />
            <Route
              path="*"
              element={
                <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
                  <EmptyState
                    title="Page not found"
                    body="The page you are looking for does not exist."
                    to="/"
                    label="GO HOME"
                  />
                </div>
              }
            />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
      <CartDrawer />
      <QuickViewModal />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <StoreProvider>
          <HashRouter>
            <StoreShell />
          </HashRouter>
        </StoreProvider>
      </ToastProvider>
    </MotionConfig>
  </React.StrictMode>
);
