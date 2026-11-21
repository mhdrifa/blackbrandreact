import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { placeholderImg, safeImg, uniq } from '../../utils/format';
import { EmptyState, Eyebrow, Spinner } from '../../components/ui/Primitives';
import ProductCard from '../../components/store/ProductCard';

export function CollectionsPage() {
  const { catalog, catalogLoading } = useStore();
  useEffect(() => { document.title = 'Collections — BLACK BRAND'; }, []);

  if (catalogLoading && !catalog) return <Spinner className="my-24" />;
  const cols = catalog?.collections || [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <Eyebrow dot={false}>EDITORIAL LOOKBOOKS</Eyebrow>
      <h1 className="mt-1 font-display text-4xl md:text-5xl">Collections</h1>
      <div className="mt-8">
        {cols.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cols.map((c) => (
              <Link
                key={c.collectionId}
                to={`/collection/${encodeURIComponent(c.slug)}`}
                className="group relative aspect-[4/5] overflow-hidden bg-charcoal text-white"
              >
                <img
                  loading="lazy"
                  src={safeImg(c.bannerImageUrl)}
                  onError={(e) => { e.currentTarget.src = placeholderImg; }}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent 60%)' }}
                />
                <div className="absolute inset-x-6 bottom-6 z-10">
                  <h3 className="font-display text-2xl">{c.name}</h3>
                  {c.description && <p className="mt-1 text-xs text-[#c9c6c5]">{c.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No collections yet" body="New collections are on the way." to="/shop" label="SHOP ALL" />
        )}
      </div>
    </div>
  );
}

export default function CatalogPage({ mode }) {
  const { catalog, catalogLoading } = useStore();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);

  const qParam = searchParams.get('q') || '';
  const catParam = searchParams.get('cat') || '';
  const sizeParam = searchParams.get('size') || '';
  const colorParam = searchParams.get('color') || '';
  const maxParam = searchParams.get('max') || '';
  const sortParam = searchParams.get('sort') || 'new';

  const [draft, setDraft] = useState({ q: qParam, cat: catParam, size: sizeParam, color: colorParam, max: maxParam, sort: sortParam });
  useEffect(() => {
    setDraft({ q: qParam, cat: catParam, size: sizeParam, color: colorParam, max: maxParam, sort: sortParam });
  }, [qParam, catParam, sizeParam, colorParam, maxParam, sortParam]);

  const decodedParam = params.name ? decodeURIComponent(params.name) : params.slug ? decodeURIComponent(params.slug) : '';

  const collectionObj = useMemo(() => {
    if (mode !== 'collection' || !catalog) return null;
    return catalog.collections.find((c) => c.slug === decodedParam) || null;
  }, [mode, catalog, decodedParam]);

  const meta = useMemo(() => {
    if (mode === 'new') return { title: 'New Arrivals', kicker: 'NEW SEASON DROPS', sub: 'The latest additions to the atelier.', base: '/new-arrivals' };
    if (mode === 'best') return { title: 'Best Sellers', kicker: 'CLIENT FAVOURITES', sub: 'Pieces our clients reach for again and again.', base: '/best-sellers' };
    if (mode === 'sale') return { title: 'Sale', kicker: 'ARCHIVE SALE PRIVILEGES', sub: 'Reduced pieces while stocks last.', base: '/sale' };
    if (mode === 'search') return { title: 'Search', kicker: 'RESULTS', sub: qParam ? `Results for "${qParam}"` : '', base: '/search' };
    if (mode === 'category') return { title: decodedParam, kicker: 'CATEGORY', sub: '', base: `/category/${encodeURIComponent(decodedParam)}`, fixedCat: decodedParam };
    if (mode === 'collection') return { title: collectionObj?.name || 'Collection', kicker: 'COLLECTION', sub: collectionObj?.description || '', base: `/collection/${encodeURIComponent(decodedParam)}` };
    return { title: 'Shop All', kicker: 'THE COLLECTION', sub: 'Ready-to-wear, crafted for the modern gentleman.', base: '/shop' };
  }, [mode, decodedParam, qParam, collectionObj]);

  useEffect(() => { document.title = `${meta.title} — BLACK BRAND`; }, [meta.title]);

  const { preFiltered, cats, sizes, colors, filtered } = useMemo(() => {
    const all = catalog?.products || [];
    const pre = all.filter((p) => {
      if (mode === 'best') return p.featured;
      if (mode === 'sale') return p.salePrice > 0;
      if (mode === 'collection' && collectionObj) {
        return collectionObj.productIds.includes(p.productId) || p.collection === collectionObj.name;
      }
      return true;
    });

    const activeCat = meta.fixedCat || catParam;
    const maxNum = Number(maxParam) || 0;
    const term = qParam.trim().toLowerCase();

    const list = pre.filter((p) => {
      if (activeCat && p.category !== activeCat) return false;
      if (sizeParam && !p.variants.some((v) => v.size === sizeParam)) return false;
      if (colorParam && !p.variants.some((v) => v.color === colorParam)) return false;
      if (maxNum && p.priceFrom > maxNum) return false;
      if (term) {
        const hay = `${p.name} ${p.category} ${p.subcategory} ${p.description} ${p.sku}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortParam === 'low') return a.priceFrom - b.priceFrom;
      if (sortParam === 'high') return b.priceFrom - a.priceFrom;
      if (sortParam === 'name') return a.name.localeCompare(b.name);
      return String(b.createdDate).localeCompare(String(a.createdDate));
    });

    return {
      preFiltered: pre,
      cats: uniq(pre.map((p) => p.category)),
      sizes: uniq(pre.flatMap((p) => p.variants.map((v) => v.size))),
      colors: uniq(pre.flatMap((p) => p.variants.map((v) => v.color))),
      filtered: list
    };
  }, [catalog, mode, collectionObj, meta.fixedCat, catParam, sizeParam, colorParam, maxParam, qParam, sortParam]);

  if (catalogLoading && !catalog) return <Spinner className="my-24" />;
  if (mode === 'collection' && !collectionObj) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
        <EmptyState title="Collection not found" to="/collections" label="ALL COLLECTIONS" />
      </div>
    );
  }

  const applyFilters = (e) => {
    e.preventDefault();
    const next = {};
    Object.entries(draft).forEach(([k, v]) => {
      if (v && !(k === 'sort' && v === 'new')) next[k] = v;
    });
    setSearchParams(next);
    setMobileFilters(false);
  };

  const resetFilters = () => {
    setSearchParams({});
    setMobileFilters(false);
  };

  const FilterForm = (
    <form onSubmit={applyFilters} className="space-y-4 border border-hairline bg-white p-5">
      <div className="flex items-center justify-between lg:hidden">
        <span className="font-display text-sm tracking-widest">FILTERS</span>
        <button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]">Search</label>
        <input
          type="search"
          value={draft.q}
          onChange={(e) => setDraft((s) => ({ ...s, q: e.target.value }))}
          placeholder="Search…"
          className="h-10 w-full border border-hairline bg-ivory px-3 text-sm"
        />
      </div>

      {!meta.fixedCat && (
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]">Category</label>
          <select
            value={draft.cat}
            onChange={(e) => setDraft((s) => ({ ...s, cat: e.target.value }))}
            className="h-10 w-full border border-hairline bg-ivory px-2.5 text-sm"
          >
            <option value="">All</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]">Size</label>
        <select
          value={draft.size}
          onChange={(e) => setDraft((s) => ({ ...s, size: e.target.value }))}
          className="h-10 w-full border border-hairline bg-ivory px-2.5 text-sm"
        >
          <option value="">All</option>
          {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]">Colour</label>
        <select
          value={draft.color}
          onChange={(e) => setDraft((s) => ({ ...s, color: e.target.value }))}
          className="h-10 w-full border border-hairline bg-ivory px-2.5 text-sm"
        >
          <option value="">All</option>
          {colors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]">Max Price (LKR)</label>
        <input
          type="number"
          min="0"
          step="100"
          value={draft.max}
          onChange={(e) => setDraft((s) => ({ ...s, max: e.target.value }))}
          placeholder="No limit"
          className="h-10 w-full border border-hairline bg-ivory px-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]">Sort</label>
        <select
          value={draft.sort}
          onChange={(e) => setDraft((s) => ({ ...s, sort: e.target.value }))}
          className="h-10 w-full border border-hairline bg-ivory px-2.5 text-sm"
        >
          <option value="new">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <button type="submit" className="h-11 w-full bg-obsidian font-display text-xs tracking-[0.12em] text-white transition hover:bg-black">
        APPLY
      </button>
      <button type="button" onClick={resetFilters} className="block text-[11px] font-semibold uppercase tracking-[0.12em] underline">
        RESET
      </button>
    </form>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <div className="mb-4 text-[11px] uppercase tracking-[0.1em] text-slate">
        <Link to="/" className="hover:text-obsidian">Home</Link> / {meta.title}
      </div>
      <Eyebrow>{meta.kicker}</Eyebrow>
      <h1 className="mt-1 font-display text-4xl md:text-5xl">{meta.title}</h1>
      {meta.sub && <p className="mt-2 text-sm text-slate">{meta.sub}</p>}

      <div className="mt-7 grid grid-cols-1 items-start gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:sticky lg:top-28 lg:block">{FilterForm}</aside>

        {mobileFilters && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-ivory p-4 lg:hidden">
            {FilterForm}
          </div>
        )}

        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-xs text-slate">
              {filtered.length} item{filtered.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => setMobileFilters(true)}
              className="inline-flex items-center gap-2 border border-obsidian px-4 py-2 font-display text-xs tracking-[0.1em] lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> FILTERS
            </button>
          </div>

          {filtered.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
              {filtered.map((p, idx) => <ProductCard key={p.productId} product={p} index={idx} />)}
            </div>
          ) : (
            <EmptyState
              title="No products found"
              body={preFiltered.length ? 'Try adjusting your filters.' : 'Check back soon for new drops.'}
              to="/shop"
              label="BROWSE ALL"
            />
          )}
        </div>
      </div>
    </div>
  );
}
