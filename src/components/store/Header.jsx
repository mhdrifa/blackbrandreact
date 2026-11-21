/* global __ALLOW_MOCK__ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Heart, Menu, RotateCcw, Search, ShoppingBag, X } from 'lucide-react';
import { APP_MODE, BRAND_CONFIG, IS_TEST_MODE } from '../../config/brand';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { modeKey, money, placeholderImg, safeImg } from '../../utils/format';
import { LUXURY_EASE, MOTION_TOKENS } from '../ui/Primitives';

export default function Header() {
  const { catalog, contact, cartCount, wish, auth, setBagOpen, loadCatalog } = useStore();
  const toast = useToast();
  const reduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopDropdown, setShopDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const menuBtnRef = useRef(null);
  const closeMenuBtnRef = useRef(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShopDropdown(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    if (menuOpen) {
      requestAnimationFrame(() => closeMenuBtnRef.current?.focus());
    } else if (wasMenuOpenRef.current) {
      menuBtnRef.current?.focus();
    }
    wasMenuOpenRef.current = menuOpen;
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen && !searchOpen && !shopDropdown) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
        setShopDropdown(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, searchOpen, shopDropdown]);

  const categories = catalog?.categories || [];
  const acctLabel = auth.user
    ? (auth.user.displayName || auth.user.email.split('@')[0]).toUpperCase().slice(0, 12)
    : 'ACCOUNT';
  const acctInitial = auth.user ? (auth.user.displayName || auth.user.email)[0].toUpperCase() : 'B';

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2 || !catalog?.products?.length) return [];
    return catalog.products
      .filter((p) =>
        `${p.name} ${p.category} ${p.subcategory} ${p.sku}`.toLowerCase().includes(term)
      )
      .slice(0, 5);
  }, [q, catalog]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/shop');
  };

  const handleResetSandbox = async () => {
    if (!__ALLOW_MOCK__) return;
    const { resetMockDb } = await import('../../services/mockBackend');
    resetMockDb();
    try {
      localStorage.removeItem(modeKey('bb_cat_cache'));
      localStorage.removeItem(modeKey('bb_last_order'));
      sessionStorage.removeItem(modeKey('bb_idem'));
    } catch { /* ignore */ }
    await loadCatalog(true).catch(() => {});
    toast('Sandbox test data reset');
  };

  const desktopNavLink = (to, label, opts = {}) => (
    <NavLink
      to={to}
      end={opts.end}
      className="group/link relative py-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
    >
      {({ isActive }) => (
        <>
          <span className={`transition-colors duration-200 ${isActive ? 'text-obsidian' : 'text-[#444748] group-hover/link:text-obsidian'}`}>
            {label}
            {opts.saleDot && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-crimson align-middle" />
            )}
          </span>
          <span
            className={`absolute inset-x-0 bottom-0.5 h-[1.5px] origin-left bg-obsidian transition-transform duration-300 ease-luxury ${
              isActive ? 'scale-x-100' : 'scale-x-0 group-hover/link:scale-x-100'
            }`}
          />
        </>
      )}
    </NavLink>
  );

  const mobileLinks = [
    { to: '/', label: 'Home' },
    { type: 'shop' },
    { to: '/new-arrivals', label: 'New Arrivals' },
    { to: '/best-sellers', label: 'Best Sellers' },
    { to: '/collections', label: 'Collections' },
    { to: '/sale', label: 'Sale', sale: true },
    { to: '/tracking', label: 'Track Order' },
    { to: '/cart', label: `Shopping Bag (${cartCount})` }
  ];

  return (
    <>
      {IS_TEST_MODE && (
        <div className="border-b border-champagne/40 bg-[#1a1610] px-4 py-1.5 text-[11px] font-medium tracking-[0.08em] text-champagne-soft">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 md:px-8">
            <span>
              {__ALLOW_MOCK__ && APP_MODE === 'mock'
                ? 'SANDBOX / MOCK MODE — SAFE LOCAL TESTING (NO LIVE ORDERS, INVENTORY, OR PAYMENTS)'
                : 'STAGING MODE — CONNECTED TO TEST APPS SCRIPT ONLY'}
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
        </div>
      )}

      <div className="bg-black text-[11px] font-semibold tracking-[0.1em] text-white">
        <div className="mx-auto flex min-h-[32px] max-w-[1280px] items-center justify-between gap-4 px-4 md:px-12">
          <div className="truncate">
            <span className="text-[#8b8d8d]">FLAGSHIP CONCIERGE: </span>
            <a href={`tel:${contact.phoneTel}`} className="transition-colors hover:text-champagne-soft">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-champagne-soft align-middle" />
              {contact.phoneDisplay} (KALPITIYA)
            </a>
          </div>
          <div className="hidden font-medium lg:block">NEW SEASON. NEW STYLE. EXPLORE BLACK BRAND.</div>
          <div className="hidden shrink-0 sm:block">
            <span className="text-champagne-soft">LKR (Rs.)</span>
            <span className="mx-2 text-[#8b8d8d]">|</span>
            <span className="text-[#8b8d8d]">ISLANDWIDE EXPRESS</span>
          </div>
        </div>
      </div>

      <motion.header
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION_TOKENS.standard, ease: LUXURY_EASE }}
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ease-luxury ${
          scrolled
            ? 'border-[#dedad0] bg-ivory/95 shadow-[0_8px_28px_rgba(0,0,0,0.05)] md:backdrop-blur-md'
            : 'border-hairline bg-ivory/95 md:backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:h-20 md:px-12">
          <div className="flex items-center gap-4 lg:gap-7">
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 font-display text-[17px] font-medium leading-none tracking-[0.06em]">
              <img
                src={BRAND_CONFIG.LOGO_URL}
                alt="Black Brand logo"
                className="h-9 w-9 rounded-[5px] object-contain"
              />
              <span>
                BLACK<br />BRAND
              </span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
              {desktopNavLink('/', 'HOME', { end: true })}

              <div
                className="relative"
                onMouseEnter={() => setShopDropdown(true)}
                onMouseLeave={() => setShopDropdown(false)}
                onFocus={() => setShopDropdown(true)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setShopDropdown(false);
                }}
              >
                <NavLink
                  to="/shop"
                  aria-haspopup="true"
                  aria-expanded={shopDropdown}
                  className="group/link relative inline-flex items-center gap-1 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
                >
                  {({ isActive }) => (
                    <>
                      <span className={`transition-colors duration-200 ${isActive ? 'text-obsidian' : 'text-[#444748] group-hover/link:text-obsidian'}`}>
                        SHOP
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 opacity-60 transition-transform duration-200 ${
                          shopDropdown ? 'rotate-180' : ''
                        }`}
                      />
                      <span
                        className={`absolute inset-x-0 bottom-0.5 h-[1.5px] origin-left bg-obsidian transition-transform duration-300 ease-luxury ${
                          isActive || shopDropdown ? 'scale-x-100' : 'scale-x-0 group-hover/link:scale-x-100'
                        }`}
                      />
                    </>
                  )}
                </NavLink>

                <AnimatePresence>
                  {shopDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: MOTION_TOKENS.fast, ease: LUXURY_EASE }}
                      className="absolute left-0 top-full min-w-[230px] border border-hairline bg-white py-2 shadow-xl"
                    >
                      <Link
                        to="/shop"
                        className="block px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-obsidian transition-colors hover:bg-ivory focus:bg-ivory"
                      >
                        All Products
                      </Link>
                      {categories.map((c) => (
                        <Link
                          key={c.categoryId}
                          to={`/category/${encodeURIComponent(c.name)}`}
                          className="block px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748] transition-colors hover:bg-ivory hover:text-obsidian focus:bg-ivory focus:text-obsidian"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {desktopNavLink('/new-arrivals', 'NEW ARRIVALS')}
              {desktopNavLink('/best-sellers', 'BEST SELLERS')}
              {desktopNavLink('/collections', 'COLLECTIONS')}
              {desktopNavLink('/sale', 'SALE', { saleDot: true })}
              {desktopNavLink('/tracking', 'TRACK ORDER')}
            </nav>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              aria-label="Search catalogue"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((s) => !s)}
              className="flex h-10 w-10 items-center justify-center transition hover:opacity-70"
            >
              <Search className="h-[18px] w-[18px]" />
            </motion.button>

            <Link to="/wishlist" aria-label="Wishlist" className="relative flex h-10 w-10 items-center justify-center transition hover:opacity-70">
              <Heart className="h-[18px] w-[18px]" />
              <span className="absolute right-0.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-obsidian px-1 text-[9px] font-semibold text-white">
                {wish.length}
              </span>
            </Link>

            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setBagOpen(true)}
              aria-label="Shopping bag"
              className="relative flex h-10 w-10 items-center justify-center transition hover:opacity-70"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              <motion.span
                key={cartCount}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ duration: MOTION_TOKENS.fast, ease: LUXURY_EASE }}
                className="absolute right-0.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-champagne-dark px-1 text-[9px] font-bold text-white"
              >
                {cartCount}
              </motion.span>
            </motion.button>

            <span className="mx-1 hidden h-6 w-px bg-hairline md:block" />

            <Link to="/account" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-charcoal font-display text-sm text-champagne-soft ring-1 ring-hairline transition-transform duration-200 hover:scale-105">
                {acctInitial}
              </span>
              <span className="hidden md:inline">{acctLabel}</span>
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: LUXURY_EASE }}
              className="overflow-hidden border-t border-hairline bg-white"
            >
              <div className="mx-auto max-w-[1280px] px-4 py-3.5 md:px-12">
                <form onSubmit={onSearchSubmit} className="flex gap-2">
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    autoFocus
                    placeholder="Search shirts, tees, trousers…"
                    aria-label="Search"
                    className="h-11 flex-1 border border-hairline bg-ivory px-3.5 text-sm"
                  />
                  <button type="submit" className="bg-obsidian px-5 font-display text-xs tracking-[0.1em] text-white transition hover:bg-black">
                    SEARCH
                  </button>
                </form>

                {suggestions.length > 0 && (
                  <div className="mt-2.5 divide-y divide-hairline border border-hairline bg-ivory/60">
                    {suggestions.map((p) => (
                      <Link
                        key={p.productId}
                        to={`/product/${encodeURIComponent(p.productId)}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 transition hover:bg-white"
                      >
                        <img
                          src={safeImg(p.mainImageUrl)}
                          onError={(e) => { e.currentTarget.src = placeholderImg; }}
                          alt=""
                          className="h-11 w-9 shrink-0 bg-[#eee] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-display text-xs uppercase tracking-wide text-obsidian">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate">{p.category}</div>
                        </div>
                        <div className="shrink-0 text-right text-xs font-semibold text-obsidian">
                          {money(p.priceFrom)}
                          {!p.inStock && (
                            <span className="block text-[9px] uppercase tracking-wider text-crimson">
                              Sold out
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.28, ease: LUXURY_EASE }}
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-[#f7f5f0] px-6 pb-8 pt-6 lg:hidden"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[#dcd8d0] pb-4">
              <div>
                <div className="text-lg font-bold tracking-[0.08em] text-obsidian">BLACK BRAND</div>
                <div className="mt-1 text-[9px] font-medium tracking-[0.21em] text-[#887e70]">DEFINE YOUR STYLE</div>
              </div>
              <button
                ref={closeMenuBtnRef}
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ccc6bc] text-obsidian transition hover:border-obsidian"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col">
              {mobileLinks.map((item, idx) =>
                item.type === 'shop' ? (
                  <motion.div
                    key="shop"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.035 * idx, ease: LUXURY_EASE }}
                    className="border-b border-[#e2ded6]"
                  >
                    <div className="flex items-center justify-between">
                      <Link to="/shop" className="flex-1 py-4 text-xl font-medium text-obsidian">Shop</Link>
                      <button
                        type="button"
                        aria-label="Expand shop categories"
                        aria-expanded={shopExpanded}
                        onClick={() => setShopExpanded((s) => !s)}
                        className="flex h-12 w-12 items-center justify-center text-2xl font-light text-[#60594f]"
                      >
                        {shopExpanded ? '−' : '+'}
                      </button>
                    </div>
                    <AnimatePresence>
                      {shopExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: LUXURY_EASE }}
                          className="overflow-hidden pl-4"
                        >
                          <div className="space-y-1 pb-3">
                            <Link to="/shop" className="block py-2 text-xs font-medium uppercase tracking-[0.08em] text-[#6b655e]">
                              All Products
                            </Link>
                            {categories.map((c) => (
                              <Link
                                key={c.categoryId}
                                to={`/category/${encodeURIComponent(c.name)}`}
                                className="block py-2 text-xs font-medium uppercase tracking-[0.08em] text-[#6b655e]"
                              >
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.035 * idx, ease: LUXURY_EASE }}
                    className="border-b border-[#e2ded6]"
                  >
                    <Link
                      to={item.to}
                      className={`block py-4 text-xl font-medium ${
                        item.sale ? 'text-[#8f3733]' : 'text-obsidian'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                )
              )}
            </div>

            <div className="mt-auto pt-8 text-[10px] font-semibold tracking-[0.16em] text-[#8b795e]">
              <div>BLACK BRAND · SRI LANKA</div>
              <div className="mt-1 text-[11px] font-normal tracking-normal text-[#7c7771]">
                Considered style, everyday confidence.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
