import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { apiPost } from '../../services/api';
import { isVideoUrl, placeholderImg, safeImg } from '../../utils/format';
import { EmptyState, Eyebrow, LUXURY_EASE, MOTION_TOKENS, Reveal, Spinner, TextMask } from '../../components/ui/Primitives';
import ProductCard from '../../components/store/ProductCard';
import OrderSummaryBlock from '../../components/store/OrderSummaryBlock';

function useDesktopFlag() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

function HeroSection({ banner, isDesktop }) {
  const heroRef = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const enableParallax = isDesktop && !reduced;
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', enableParallax ? '10%' : '0%']);

  const heroImg = banner?.desktopImageUrl;
  const rawHref = String(banner?.buttonUrl || '/shop').replace(/^#/, '').trim();
  const bannerHref = /^(https:\/\/|\/)/i.test(rawHref) ? rawHref : '/shop';

  const ctaBaseCls =
    'group inline-flex min-h-[48px] items-center gap-2 bg-charcoal px-7 font-display text-base tracking-[0.06em] text-white transition-all duration-200 hover:bg-black active:scale-[0.985]';

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[540px] items-stretch overflow-hidden bg-black text-white md:min-h-[650px]"
    >
      <motion.div
        style={{
          y: enableParallax ? bgY : 0,
          background: 'radial-gradient(circle at 75% 40%, #5a4526 0, #1b1612 45%, #000 80%)'
        }}
        className="absolute inset-0 will-change-transform"
      >
        {heroImg && (
          <motion.img
            initial={reduced ? false : { scale: 1.04, opacity: 0.45 }}
            animate={{ scale: 1, opacity: 0.68 }}
            transition={{ duration: MOTION_TOKENS.hero, ease: LUXURY_EASE }}
            src={heroImg}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </motion.div>

      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.72) 52%, rgba(0,0,0,0.12) 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-36"
        style={{ background: 'linear-gradient(0deg, #f8f7f4 0%, rgba(248,247,244,0) 100%)' }}
      />

      <div className="relative z-[2] mx-auto flex w-full max-w-[1280px] flex-col justify-between px-4 pb-10 pt-16 md:px-12 md:pt-28">
        <div>
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: LUXURY_EASE }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-champagne-soft"
          >
            <span className="h-2 w-2 rounded-full bg-champagne-soft" />
            CEYLON COUTURE ATELIER
          </motion.span>

          <h1 className="max-w-3xl font-display text-[44px] font-bold leading-[0.98] tracking-tight sm:text-6xl md:text-[78px]">
            {banner?.title?.trim().toUpperCase() === 'DEFINE YOUR STYLE.' ? (
              <>
                <TextMask delay={0.08}>DEFINE</TextMask>
                <TextMask delay={0.16}>
                  <span className="font-editorial italic font-medium text-champagne">YOUR STYLE.</span>
                </TextMask>
              </>
            ) : banner?.title ? (
              <TextMask delay={0.08}>{banner.title}</TextMask>
            ) : (
              <>
                <TextMask delay={0.08}>DEFINE</TextMask>
                <TextMask delay={0.16}>
                  <span className="font-editorial italic font-medium text-champagne">YOUR STYLE.</span>
                </TextMask>
              </>
            )}
          </h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22, ease: LUXURY_EASE }}
            className="my-5 max-w-xl text-sm leading-relaxed text-[#d1cecb] md:text-base"
          >
            {banner?.subtitle ||
              "Discover the New Era of Men's Fashion. Crafted in Sri Lanka for the modern gentleman who demands structural purity, effortless poise, and unyielding presence."}
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: LUXURY_EASE }}
            className="flex flex-wrap gap-3.5"
          >
            {/^https:\/\//i.test(bannerHref) ? (
              <a href={bannerHref} className={ctaBaseCls}>
                <span>{banner?.buttonText || 'SHOP COLLECTION'}</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>
            ) : (
              <Link to={bannerHref} className={ctaBaseCls}>
                <span>{banner?.buttonText || 'SHOP COLLECTION'}</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            )}
            <Link
              to="/new-arrivals"
              className="inline-flex min-h-[48px] items-center border border-white/30 bg-white/10 px-7 font-display text-base tracking-[0.06em] text-white transition-all duration-200 hover:border-white hover:bg-white/20 active:scale-[0.985] md:backdrop-blur-sm"
            >
              EXPLORE NEW ARRIVALS
            </Link>
          </motion.div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4 pt-6">
          <span className="inline-block bg-black/65 px-4 py-2 text-[11px] font-semibold tracking-[0.08em] text-white md:backdrop-blur-sm">
            BLACK BRAND • KALPITIYA • SRI LANKA
          </span>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.42, ease: LUXURY_EASE }}
            className="hidden items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 sm:flex"
          >
            <span>SCROLL</span>
            <span className="block h-5 w-px bg-champagne-soft/80" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CampaignSection({ isDesktop }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const enableParallax = isDesktop && !reduced;
  const bgScale = useTransform(scrollYProgress, [0, 1], [enableParallax ? 1.05 : 1, 1]);

  return (
    <section
      ref={ref}
      className="relative my-10 flex min-h-[460px] items-center overflow-hidden bg-[#111] text-white md:min-h-[520px]"
    >
      <motion.div
        style={{
          scale: bgScale,
          background: 'radial-gradient(circle at 80% 50%, #4d3b20, #0c0a08 70%)'
        }}
        className="absolute inset-0 will-change-transform"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.88), rgba(0,0,0,0.2))' }}
      />
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-16 md:px-12">
        <Reveal className="max-w-3xl">
          <Eyebrow light>THE CAMPAIGN</Eyebrow>
          <h2 className="my-4 font-display text-3xl leading-[1.04] md:text-[56px]">
            MORE THAN FASHION. CONFIDENCE BEGINS WITH WHAT YOU WEAR.
          </h2>
          <p className="mb-7 max-w-2xl text-sm leading-relaxed text-[#c9c6c5] md:text-base">
            Every BLACK BRAND garment is cut to carry you from the boardroom to the coastline — with presence.
          </p>
          <Link
            to="/collections"
            className="group inline-flex min-h-[48px] items-center gap-2 bg-champagne-soft px-7 font-display text-base tracking-[0.06em] text-[#261900] transition-all duration-200 hover:bg-champagne active:scale-[0.985]"
          >
            <span>EXPLORE THE LOOKBOOK</span>
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { catalog, catalogLoading, catalogError, loadCatalog, contact, recentlyViewed, findProduct } = useStore();
  const toast = useToast();
  const isDesktop = useDesktopFlag();
  const reduced = useReducedMotion();
  const carRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [selectedCat, setSelectedCat] = useState('ALL');

  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [trackBusy, setTrackBusy] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);

  const [newsEmail, setNewsEmail] = useState('');
  const [newsWebsite, setNewsWebsite] = useState('');
  const [newsBusy, setNewsBusy] = useState(false);

  useEffect(() => {
    document.title = 'Define Your Style — BLACK BRAND';
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const el = carRef.current;
      if (
        !el ||
        paused ||
        document.hidden ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const firstCard = el.querySelector('article');
      if (!firstCard) return;
      const step = firstCard.getBoundingClientRect().width + 16;
      if (el.scrollLeft >= max - 5) el.scrollTo({ left: 0, behavior: 'smooth' });
      else el.scrollBy({ left: step, behavior: 'smooth' });
    }, 3500);
    return () => clearInterval(timer);
  }, [paused]);

  const d = catalog || { products: [], categories: [], collections: [], banners: [] };

  const displayedNewOrCat = useMemo(() => {
    const sorted = d.products
      .slice()
      .sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate)));
    if (selectedCat === 'ALL') return sorted.slice(0, 4);
    return sorted.filter((p) => p.category === selectedCat).slice(0, 8);
  }, [d.products, selectedCat]);

  if (catalogLoading && !catalog) return <Spinner className="my-28" />;
  if (catalogError && !catalog) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-12">
        <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-sm text-[#8a1a14]">
          {catalogError.message}
        </div>
        <button
          type="button"
          onClick={() => loadCatalog(true)}
          className="mt-4 border border-obsidian px-6 py-3 font-display text-sm tracking-widest"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  const featured = d.products.filter((p) => p.featured);
  const best = featured.length ? featured : d.products.slice(0, 8);
  const banner = d.banners?.[0];
  const recentProducts = recentlyViewed.map(findProduct).filter(Boolean).slice(0, 4);

  const looks = (d.collections || [])
    .filter((c) => c.bannerImageUrl)
    .map((c) => ({ u: c.bannerImageUrl, to: `/collection/${encodeURIComponent(c.slug)}` }));
  d.products.forEach((p) => {
    if (looks.length < 6 && p.additionalImageUrls?.[0] && !isVideoUrl(p.additionalImageUrls[0])) {
      looks.push({ u: p.additionalImageUrls[0], to: `/product/${encodeURIComponent(p.productId)}` });
    }
  });

  const propsList = [
    ['ISLANDWIDE DELIVERY', 'See the Shipping page for available delivery methods, fees and estimates.', 'SRI LANKA', '✈'],
    ['FIND YOUR FIT', 'Browse our size guide and contact us for sizing advice.', 'SIZE GUIDANCE', '✂'],
    ['KALPITIYA CONCIERGE', `Contact BLACK BRAND for sizing and orders on ${contact.phoneDisplay}.`, contact.phoneDisplay, '☎'],
    ['EXCHANGE ENQUIRIES', 'Contact us before returning an item to confirm eligibility and arrangements.', 'CONTACT SUPPORT', '⇄']
  ];

  const onTrackSubmit = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackBusy(true);
    try {
      const order = await apiPost('trackOrder', {
        orderId: trackOrderId.trim(),
        email: trackEmail.trim()
      });
      setTrackedOrder(order);
    } catch (err) {
      setTrackError(err.message);
    } finally {
      setTrackBusy(false);
    }
  };

  const onNewsletter = async (e) => {
    e.preventDefault();
    setNewsBusy(true);
    try {
      const r = await apiPost('subscribeNewsletter', { email: newsEmail, website: newsWebsite });
      toast(
        r.alreadySubscribed
          ? 'You are already subscribed.'
          : r.voucherCode
            ? `Subscribed! Your voucher code: ${r.voucherCode}`
            : 'Subscribed — welcome to the atelier.'
      );
      setNewsEmail('');
    } catch (err) {
      toast(err.message, true);
    } finally {
      setNewsBusy(false);
    }
  };

  return (
    <div>
      <HeroSection banner={banner} isDesktop={isDesktop} />

      {/* Shop By Category */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
        <Reveal>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow dot={false}>SHOP BY CATEGORY</Eyebrow>
              <h2 className="mt-1 font-display text-3xl md:text-[44px]">CURATED FOR EVERY OCCASION</h2>
            </div>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-1 border-b border-transparent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-obsidian"
            >
              <span>VIEW ALL CATEGORIES</span>
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {d.categories.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {d.categories.slice(0, 6).map((c, i) => (
                <motion.div
                  key={c.categoryId}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 'some' }}
                  transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.05, ease: LUXURY_EASE }}
                >
                  <Link
                    to={`/category/${encodeURIComponent(c.name)}`}
                    className="group relative block aspect-[4/5] overflow-hidden bg-charcoal text-white active:scale-[0.99]"
                  >
                    <img
                      loading="lazy"
                      src={safeImg(c.imageUrl)}
                      onError={(e) => { e.currentTarget.src = placeholderImg; }}
                      alt={c.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-luxury [@media(hover:hover)]:group-hover:scale-[1.04]"
                    />
                    <div
                      className="absolute inset-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-90"
                      style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.86) 0%, transparent 60%)' }}
                    />
                    <div className="absolute inset-x-3 bottom-3 z-10 transition-transform duration-300 ease-luxury [@media(hover:hover)]:group-hover:-translate-y-1 md:inset-x-6 md:bottom-6">
                      <small className="text-[10px] font-semibold uppercase tracking-[0.12em] text-champagne-soft">
                        COLLECTION 0{i + 1}
                      </small>
                      <h3 className="mt-1 font-display text-lg md:text-2xl">{c.name}</h3>
                      {c.description && (
                        <p className="mt-1 hidden text-xs text-[#c9c6c5] md:line-clamp-2">{c.description}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState title="Categories coming soon" body="Our team is curating the collection." to="/shop" label="BROWSE ALL" />
          )}
        </Reveal>
      </section>

      {/* New Arrivals + Interactive Category Selection */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
        <Reveal>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>NEW ARRIVALS</Eyebrow>
              <h2 className="mt-1 font-display text-3xl md:text-[44px]">THE LATEST DROPS</h2>
            </div>
            <Link
              to={selectedCat === 'ALL' ? '/new-arrivals' : `/category/${encodeURIComponent(selectedCat)}`}
              className="group inline-flex items-center gap-1 border-b border-transparent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-obsidian"
            >
              <span>{selectedCat === 'ALL' ? 'VIEW ALL NEW ARRIVALS' : `VIEW ALL ${selectedCat.toUpperCase()}`}</span>
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {d.categories.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter homepage products by category"
              className="lux-scroll mb-6 flex gap-2 overflow-x-auto pb-1.5"
            >
              {['ALL', ...d.categories.map((c) => c.name)].map((catName) => {
                const active = selectedCat === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCat(catName)}
                    className={`relative shrink-0 whitespace-nowrap border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 active:scale-[0.98] ${
                      active
                        ? 'border-obsidian bg-obsidian text-white'
                        : 'border-hairline bg-white text-obsidian hover:border-obsidian'
                    }`}
                  >
                    <span>{catName === 'ALL' ? 'All Drops' : catName}</span>
                    {active && (
                      <motion.span
                        layoutId="home-cat-underline"
                        transition={{ duration: 0.25, ease: LUXURY_EASE }}
                        className="absolute inset-x-0 -bottom-px h-[2px] bg-champagne"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCat}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: LUXURY_EASE }}
            >
              {displayedNewOrCat.length ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                  {displayedNewOrCat.map((p, idx) => (
                    <ProductCard key={p.productId} product={p} index={idx} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No products in this category yet"
                  body="Explore our full collection for available pieces."
                  to="/shop"
                  label="BROWSE ALL"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Reveal>
      </section>

      <CampaignSection isDesktop={isDesktop} />

      {/* Best Sellers */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
        <Reveal>
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <Eyebrow dot={false}>BEST SELLERS</Eyebrow>
              <h2 className="mt-1 font-display text-3xl md:text-[44px]">CLIENT FAVOURITES</h2>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => carRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
                className="flex h-10 w-10 items-center justify-center border border-obsidian transition-colors duration-200 hover:bg-obsidian hover:text-white active:scale-[0.95]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => carRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                className="flex h-10 w-10 items-center justify-center border border-obsidian transition-colors duration-200 hover:bg-obsidian hover:text-white active:scale-[0.95]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {best.length ? (
            <div
              ref={carRef}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              className="lux-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"
            >
              {best.map((p, idx) => (
                <div key={p.productId} className="w-[74vw] shrink-0 snap-start sm:w-[290px] md:w-[305px]">
                  <ProductCard product={p} index={idx} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Best sellers coming soon" body="Mark products as Featured in the admin to list them here." />
          )}
        </Reveal>
      </section>

      {/* Monochrome Edit */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
        <Reveal>
          <div
            className="flex min-h-[380px] items-center px-6 py-12 text-white md:px-12"
            style={{ background: 'linear-gradient(90deg, #000000 0%, #222222 100%)' }}
          >
            <div className="max-w-2xl">
              <span className="inline-block bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                LIMITED EDITION
              </span>
              <h2 className="mt-3 font-display text-3xl md:text-[44px]">THE MONOCHROME EDIT 2025</h2>
              <p className="mt-3 font-display text-lg uppercase tracking-[0.04em] text-white">
                MADE TO STAND OUT. LIMITED RUN TAILORING ENGINEERED FOR TROPICAL WARMTH AND EFFORTLESS PRESTIGE.
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-[#c9c6c5]">
                Only 150 pieces produced per style to maintain client exclusivity across the island. Discover seamless architectural lines crafted specifically for Colombo&apos;s corporate elite and coastal connoisseurs.
              </p>
              <Link
                to="/sale"
                className="group mt-6 inline-flex min-h-[48px] items-center gap-2 bg-champagne-soft px-7 font-display text-base tracking-[0.06em] text-[#261900] transition-all duration-200 hover:bg-champagne active:scale-[0.985]"
              >
                <span>SHOP THE EDIT</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Standard Props */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
        <Reveal>
          <div className="mb-7 text-center">
            <div className="flex justify-center">
              <Eyebrow dot={false}>WHY SHOP BLACK BRAND</Eyebrow>
            </div>
            <h2 className="mt-1 font-display text-3xl md:text-[44px]">THE BLACK BRAND STANDARD</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {propsList.map(([title, body, foot, icon]) => (
              <div key={title} className="flex min-h-[230px] flex-col gap-3 border border-hairline bg-white p-6 transition-colors duration-200 hover:border-[#d5d0c5]">
                <div className="flex h-12 w-12 items-center justify-center bg-charcoal font-display text-xl text-champagne-soft">
                  {icon}
                </div>
                <h3 className="font-display text-lg">{title}</h3>
                <p className="text-xs leading-relaxed text-[#444748]">{body}</p>
                <small className="mt-auto text-[11px] font-semibold uppercase tracking-[0.12em] text-champagne-dark">
                  {foot}
                </small>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Lifestyle Lookbook */}
      {looks.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
          <Reveal>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow dot={false}>LIFESTYLE LOOKBOOK</Eyebrow>
                <h2 className="mt-1 font-display text-3xl md:text-[44px]">STYLED IN SRI LANKA</h2>
              </div>
              <Link
                to="/collections"
                className="group inline-flex items-center gap-1 border-b border-transparent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-obsidian"
              >
                <span>VIEW THE FULL LOOKBOOK</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {looks.slice(0, 6).map((l, idx) => (
                <Link key={idx} to={l.to} className="group aspect-[3/4] overflow-hidden bg-charcoal">
                  <img
                    loading="lazy"
                    src={l.u}
                    alt="Lookbook"
                    className="h-full w-full object-cover transition-transform duration-500 ease-luxury [@media(hover:hover)]:group-hover:scale-[1.04]"
                  />
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
          <Reveal>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow dot={false}>YOUR SELECTION</Eyebrow>
                <h2 className="mt-1 font-display text-3xl md:text-[40px]">RECENTLY VIEWED</h2>
              </div>
              <Link
                to="/shop"
                className="group inline-flex items-center gap-1 border-b border-transparent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-obsidian"
              >
                <span>EXPLORE MORE</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
              {recentProducts.map((p, idx) => <ProductCard key={p.productId} product={p} index={idx} />)}
            </div>
          </Reveal>
        </section>
      )}

      {/* Inline Order Tracking */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
        <Reveal>
          <div className="border border-hairline bg-white p-6 md:p-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>ORDER TRACKING</Eyebrow>
                <h2 className="mt-1 font-display text-3xl md:text-[34px]">TRACK YOUR ORDER</h2>
                <p className="mt-1 max-w-xl text-sm text-slate">
                  Enter the order number from your confirmation and the email you used at checkout.
                </p>
              </div>
              <Link
                to="/tracking"
                className="group inline-flex items-center gap-1 border-b border-transparent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-obsidian"
              >
                <span>FULL TRACKING PAGE</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>

            <form onSubmit={onTrackSubmit} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                  Order number
                </label>
                <input
                  required
                  value={trackOrderId}
                  onChange={(e) => setTrackOrderId(e.target.value)}
                  placeholder="BB-YYMMDD-XXXXXX"
                  className="h-12 w-full border border-[#cfcfcd] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                  Email used at checkout
                </label>
                <input
                  type="email"
                  required
                  value={trackEmail}
                  onChange={(e) => setTrackEmail(e.target.value)}
                  className="h-12 w-full border border-[#cfcfcd] bg-white px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={trackBusy}
                className="h-12 bg-obsidian px-8 font-display text-base tracking-[0.06em] text-white transition hover:bg-black active:scale-[0.985] disabled:opacity-50"
              >
                {trackBusy ? 'CHECKING…' : 'CHECK STATUS'}
              </button>
            </form>

            {trackError && (
              <div className="mt-3 border border-[#f3c1bd] bg-[#fff1f0] px-4 py-3 text-xs text-[#8a1a14]">
                {trackError}
              </div>
            )}
            {trackedOrder && (
              <div className="mt-5">
                <OrderSummaryBlock order={trackedOrder} />
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-8 bg-charcoal p-7 text-white shadow-xl md:p-10 lg:grid-cols-[1fr_448px]">
            <div>
              <Eyebrow light dot={false}>INSTANT VOUCHER</Eyebrow>
              <h3 className="mt-2 font-display text-2xl md:text-[34px]">
                JOIN THE ATELIER. UNLOCK YOUR WELCOME VOUCHER.
              </h3>
              <p className="mt-2 text-xs text-[#c9c6c5]">
                Subscribe for curated collection dispatches and early access to new drops.
              </p>
            </div>
            <div>
              <form onSubmit={onNewsletter} className="flex flex-wrap gap-1.5 sm:flex-nowrap">
                <input
                  type="email"
                  required
                  value={newsEmail}
                  onChange={(e) => setNewsEmail(e.target.value)}
                  placeholder="YOUR EMAIL ADDRESS"
                  aria-label="Email address"
                  className="h-12 min-w-0 flex-1 border border-white/20 bg-white/10 px-4 text-xs text-white placeholder:text-white/50"
                />
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={newsWebsite}
                  onChange={(e) => setNewsWebsite(e.target.value)}
                  aria-hidden="true"
                  className="hidden"
                />
                <button
                  type="submit"
                  disabled={newsBusy}
                  className="h-12 w-full bg-champagne-soft px-7 font-display text-sm font-semibold tracking-[0.08em] text-[#261900] transition hover:bg-champagne active:scale-[0.985] sm:w-auto"
                >
                  {newsBusy ? '…' : 'SUBSCRIBE'}
                </button>
              </form>
              <p className="mt-2 text-[11px] text-slate">
                By joining, you consent to receive curated collection dispatches. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
