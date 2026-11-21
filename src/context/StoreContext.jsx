import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost } from '../services/api';
import { BRAND_CONFIG } from '../config/brand';
import { lsGet, lsSet, modeKey } from '../utils/format';
import { useToast } from './ToastContext';

const StoreContext = createContext(null);

const KEY_CAT_CACHE = modeKey('bb_cat_cache');
const KEY_CART = modeKey('bb_cart');
const KEY_WISH = modeKey('bb_wish');
const KEY_COUPON = modeKey('bb_coupon');
const KEY_CUST = modeKey('bb_cust');
const KEY_RECENT = modeKey('bb_recent');
const KEY_IDEM = modeKey('bb_idem');

export function StoreProvider({ children }) {
  const toast = useToast();
  const [catalog, setCatalog] = useState(() => {
    const cached = lsGet(KEY_CAT_CACHE, null);
    return cached?.d || null;
  });
  const [catalogLoading, setCatalogLoading] = useState(!catalog);
  const [catalogError, setCatalogError] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = lsGet(KEY_CART, []);
    return Array.isArray(saved) ? saved.filter((i) => i && i.variantId && i.quantity > 0) : [];
  });
  const [wish, setWish] = useState(() => {
    const saved = lsGet(KEY_WISH, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = lsGet(KEY_RECENT, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [coupon, setCouponState] = useState(() => lsGet(KEY_COUPON, ''));
  const [bagOpen, setBagOpen] = useState(false);
  const [quickProductId, setQuickProductId] = useState(null);

  const [auth, setAuth] = useState(() => {
    const saved = lsGet(KEY_CUST, null);
    if (saved?.token) {
      return { token: saved.token, user: { email: saved.email, displayName: saved.name } };
    }
    return { token: null, user: null };
  });

  const inflightRef = useRef(null);

  const loadCatalog = useCallback(async (force = false) => {
    const cached = lsGet(KEY_CAT_CACHE, null);
    if (!force && cached?.d) {
      setCatalog(cached.d);
      setCatalogLoading(false);
      if (Date.now() - cached.t <= 120000) return cached.d;
    }
    if (inflightRef.current) return inflightRef.current;
    if (!cached?.d) setCatalogLoading(true);
    setCatalogError(null);
    inflightRef.current = apiGet('catalog')
      .then((d) => {
        setCatalog(d);
        lsSet(KEY_CAT_CACHE, { t: Date.now(), d });
        return d;
      })
      .catch((e) => {
        if (!cached?.d) setCatalogError(e);
        throw e;
      })
      .finally(() => {
        setCatalogLoading(false);
        inflightRef.current = null;
      });
    return inflightRef.current;
  }, []);

  useEffect(() => {
    loadCatalog().catch(() => {});
  }, [loadCatalog]);

  useEffect(() => { lsSet(KEY_CART, cart); }, [cart]);
  useEffect(() => { lsSet(KEY_WISH, wish); }, [wish]);
  useEffect(() => { lsSet(KEY_COUPON, coupon); }, [coupon]);
  useEffect(() => { lsSet(KEY_RECENT, recentlyViewed); }, [recentlyViewed]);

  const contact = useMemo(() => {
    const settings = catalog?.settings || {};
    const oldDigits = String(settings.contact_phone || '').replace(/\D/g, '');
    const phone = oldDigits === '94750789338'
      ? BRAND_CONFIG.DEFAULT_PHONE_DISPLAY
      : String(settings.contact_phone || BRAND_CONFIG.DEFAULT_PHONE_DISPLAY).trim();
    const digits = phone.replace(/\D/g, '');
    const validDigits = digits.length >= 9 && digits.length <= 15;
    const whatsappUrl =
      /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(settings.whatsapp_url || '') &&
      !/94750789338/.test(settings.whatsapp_url)
        ? settings.whatsapp_url
        : BRAND_CONFIG.DEFAULT_WHATSAPP_URL;

    return {
      phoneDisplay: validDigits ? phone : BRAND_CONFIG.DEFAULT_PHONE_DISPLAY,
      phoneTel: validDigits ? `+${digits}` : BRAND_CONFIG.DEFAULT_PHONE_TEL,
      whatsappNumber: validDigits ? digits : BRAND_CONFIG.DEFAULT_WHATSAPP_NUMBER,
      whatsappUrl
    };
  }, [catalog]);

  const findProduct = useCallback(
    (id) => catalog?.products?.find((p) => p.productId === id) || null,
    [catalog]
  );

  const upsertProduct = useCallback((fresh) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const idx = prev.products.findIndex((p) => p.productId === fresh.productId);
      const products =
        idx >= 0
          ? prev.products.map((p, i) => (i === idx ? fresh : p))
          : [...prev.products, fresh];
      return { ...prev, products };
    });
  }, []);

  const recordViewed = useCallback((productId) => {
    if (!productId) return;
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 8));
  }, []);

  const addToCart = useCallback(
    (product, variant, qty = 1, openDrawer = true) => {
      const existing = cart.find((i) => i.variantId === variant.variantId);
      const have = existing ? existing.quantity : 0;
      if (have + qty > variant.availableQuantity) {
        toast(`Only ${variant.availableQuantity} available in this size/colour.`, true);
        return false;
      }
      if (have + qty > 20) {
        toast('Maximum 20 per item.', true);
        return false;
      }
      setCart((prev) =>
        existing
          ? prev.map((i) =>
              i.variantId === variant.variantId ? { ...i, quantity: i.quantity + qty } : i
            )
          : [...prev, { variantId: variant.variantId, productId: product.productId, quantity: qty }]
      );
      if (openDrawer) setBagOpen(true);
      return true;
    },
    [cart, toast]
  );

  const updateCartQty = useCallback(
    (variantId, delta) => {
      const item = cart.find((i) => i.variantId === variantId);
      if (!item) return;
      const p = findProduct(item.productId);
      const v = p?.variants?.find((x) => x.variantId === variantId);
      const next = item.quantity + delta;
      if (next < 1) return;
      if (v && next > Math.min(v.availableQuantity, 20)) {
        toast(`Only ${v.availableQuantity} available.`, true);
        return;
      }
      setCart((prev) =>
        prev.map((i) => (i.variantId === variantId ? { ...i, quantity: next } : i))
      );
    },
    [cart, findProduct, toast]
  );

  const removeFromCart = useCallback((variantId) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clearCartAfterOrder = useCallback(() => {
    setCart([]);
    setCouponState('');
    sessionStorage.removeItem(KEY_IDEM);
  }, []);

  const toggleWish = useCallback(
    (productId) => {
      const exists = wish.includes(productId);
      setWish((prev) =>
        exists ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
      toast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
    },
    [wish, toast]
  );

  const setCustomerSession = useCallback((res) => {
    const session = { token: res.token, email: res.profile.email, name: res.profile.fullName };
    lsSet(KEY_CUST, session);
    setAuth({ token: res.token, user: { email: res.profile.email, displayName: res.profile.fullName } });
  }, []);

  const clearCustomerSession = useCallback(() => {
    try { localStorage.removeItem(KEY_CUST); } catch { /* ignore */ }
    setAuth({ token: null, user: null });
  }, []);

  const authPost = useCallback(
    async (action, data = {}) => {
      if (!auth.token) {
        const err = new Error('Please sign in to continue.');
        err.code = 'UNAUTHORIZED';
        throw err;
      }
      try {
        return await apiPost(action, data, { idToken: auth.token });
      } catch (e) {
        if (e.code === 'UNAUTHORIZED' || e.code === 'SESSION_EXPIRED') {
          clearCustomerSession();
        }
        throw e;
      }
    },
    [auth.token, clearCustomerSession]
  );

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const value = {
    catalog, catalogLoading, catalogError, loadCatalog, findProduct, upsertProduct,
    contact, cart, cartCount, wish, recentlyViewed, recordViewed, coupon, setCoupon: setCouponState,
    addToCart, updateCartQty, removeFromCart, clearCartAfterOrder, toggleWish,
    bagOpen, setBagOpen, quickProductId, setQuickProductId,
    auth, setCustomerSession, clearCustomerSession, authPost
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
