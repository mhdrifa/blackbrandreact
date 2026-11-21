import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, Ruler } from 'lucide-react';
import { apiGet } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { isVideoUrl, money, placeholderImg, safeImg } from '../../utils/format';
import { EmptyState, Modal, Spinner } from '../../components/ui/Primitives';
import VariantPicker from '../../components/store/VariantPicker';
import ProductCard from '../../components/store/ProductCard';

export default function ProductPage() {
  const { id } = useParams();
  const productId = decodeURIComponent(id || '');
  const {
    catalog,
    findProduct,
    upsertProduct,
    wish,
    toggleWish,
    recentlyViewed,
    recordViewed,
    contact,
    auth,
    authPost
  } = useStore();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [err, setErr] = useState('');
  const [activeMedia, setActiveMedia] = useState('');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const initializedPidRef = useRef('');

  const [reviews, setReviews] = useState(null);
  const [rating, setRating] = useState(5);
  const [revText, setRevText] = useState('');
  const [revDone, setRevDone] = useState('');
  const [revBusy, setRevBusy] = useState(false);

  const product = findProduct(productId);

  useEffect(() => {
    let alive = true;
    setNotFound(false);
    setErr('');
    if (!product) setLoading(true);
    apiGet('product', { id: productId })
      .then((fresh) => {
        if (!alive) return;
        upsertProduct(fresh);
      })
      .catch((e) => {
        if (!alive) return;
        if (e.code === 'NOT_FOUND') setNotFound(true);
        else if (!product) setErr(e.message);
      })
      .finally(() => { if (alive) setLoading(false); });

    apiGet('reviews', { productId })
      .then((r) => { if (alive) setReviews(r); })
      .catch(() => { if (alive) setReviews([]); });

    return () => { alive = false; };
  }, [productId, upsertProduct]);

  const media = useMemo(() => {
    if (!product) return [];
    return [product.mainImageUrl, ...(product.additionalImageUrls || [])].filter(Boolean);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} — BLACK BRAND`;
    recordViewed(product.productId);
    if (initializedPidRef.current !== product.productId) {
      initializedPidRef.current = product.productId;
      setActiveMedia(media[0] || '');
    }
  }, [product, media, recordViewed]);

  if (loading && !product) return <Spinner className="my-28" />;
  if (notFound) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-14 md:px-12">
        <EmptyState title="Product unavailable" body="This product is no longer available." to="/shop" label="CONTINUE SHOPPING" />
      </div>
    );
  }
  if (err && !product) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-14 md:px-12">
        <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-sm text-[#8a1a14]">{err}</div>
      </div>
    );
  }
  if (!product) return null;

  const isWished = wish.includes(productId);
  const related = (catalog?.products || [])
    .filter((x) => x.category === product.category && x.productId !== productId)
    .slice(0, 4);
  const recentOthers = recentlyViewed
    .filter((rid) => rid !== productId)
    .map(findProduct)
    .filter(Boolean)
    .slice(0, 4);

  const avgRating =
    reviews && reviews.length
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;
  const stars = (n) => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));

  const submitReview = async (e) => {
    e.preventDefault();
    setRevBusy(true);
    try {
      const res = await authPost('submitReview', { productId, rating: Number(rating), text: revText });
      setRevDone(res.message);
    } catch (e2) {
      toast(e2.message, true);
    } finally {
      setRevBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <div className="mb-5 text-[11px] uppercase tracking-[0.1em] text-slate">
        <Link to="/" className="hover:text-obsidian">Home</Link> /{' '}
        <Link to="/shop" className="hover:text-obsidian">Shop</Link> /{' '}
        <Link to={`/category/${encodeURIComponent(product.category)}`} className="hover:text-obsidian">
          {product.category}
        </Link>{' '}
        / {product.name}
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <div className="aspect-[4/5] overflow-hidden bg-[#eceae4]">
            {isVideoUrl(activeMedia) ? (
              <video src={activeMedia} controls playsInline className="h-full w-full object-cover" />
            ) : (
              <img
                src={safeImg(activeMedia)}
                onError={(e) => { e.currentTarget.src = placeholderImg; }}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {media.length > 1 && (
            <div className="mt-2.5 grid grid-cols-5 gap-2">
              {media.map((u, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMedia(u)}
                  aria-label={`View media ${idx + 1}`}
                  className={`aspect-square overflow-hidden border bg-[#eceae4] ${
                    activeMedia === u ? 'border-obsidian' : 'border-hairline'
                  }`}
                >
                  {isVideoUrl(u) ? (
                    <span className="grid h-full place-items-center text-sm">▶</span>
                  ) : (
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-slate">
            SKU {product.sku}
            {product.collection ? ` • ${product.collection}` : ''}
          </div>
          <h1 className="mt-1.5 font-display text-3xl md:text-[42px]">{product.name}</h1>

          <div className="my-4 flex flex-wrap items-baseline gap-3 text-2xl font-semibold">
            <span>
              {product.priceTo > product.priceFrom ? 'from ' : ''}
              {money(product.priceFrom)}
              {product.priceTo > product.priceFrom ? ` – ${money(product.priceTo)}` : ''}
            </span>
            {product.priceFrom < product.regularPrice && product.priceTo <= product.priceFrom && (
              <>
                <s className="text-base font-normal text-slate">{money(product.regularPrice)}</s>
                <span className="bg-crimson px-2 py-0.5 text-[11px] tracking-[0.08em] text-white">
                  −{Math.round(((product.regularPrice - product.priceFrom) / product.regularPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748] underline transition hover:text-obsidian"
            >
              <Ruler className="h-3.5 w-3.5" /> Architectural Size Guide
            </button>
          </div>

          <VariantPicker product={product} />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => toggleWish(productId)}
              className="inline-flex min-h-[40px] items-center gap-2 border border-obsidian px-4 font-display text-xs tracking-[0.1em] transition hover:bg-obsidian hover:text-white"
            >
              <Heart className={`h-3.5 w-3.5 ${isWished ? 'fill-crimson text-crimson' : ''}`} />
              {isWished ? 'SAVED TO WISHLIST' : 'SAVE TO WISHLIST'}
            </button>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(
                `Hi BLACK BRAND, I have a question about ${product.name} (${product.sku})`
              )}`}
              className="inline-flex min-h-[40px] items-center border border-obsidian px-4 font-display text-xs tracking-[0.1em] transition hover:bg-obsidian hover:text-white"
            >
              ASK ON WHATSAPP
            </a>
          </div>

          <div className="mt-7 divide-y divide-hairline border-y border-hairline">
            <details open className="py-3.5">
              <summary className="cursor-pointer font-display text-base tracking-[0.05em]">Description</summary>
              <p className="mt-2 whitespace-pre-line text-sm text-[#444748]">
                {product.description || 'No description yet.'}
              </p>
            </details>
            {product.fabric && (
              <details className="py-3.5">
                <summary className="cursor-pointer font-display text-base tracking-[0.05em]">Fabric</summary>
                <p className="mt-2 whitespace-pre-line text-sm text-[#444748]">{product.fabric}</p>
              </details>
            )}
            {product.careInstructions && (
              <details className="py-3.5">
                <summary className="cursor-pointer font-display text-base tracking-[0.05em]">Care instructions</summary>
                <p className="mt-2 whitespace-pre-line text-sm text-[#444748]">{product.careInstructions}</p>
              </details>
            )}
            <details className="py-3.5">
              <summary className="cursor-pointer font-display text-base tracking-[0.05em]">Delivery &amp; exchanges</summary>
              <p className="mt-2 text-sm text-[#444748]">
                Island-wide delivery. 7-day size exchange. See{' '}
                <Link to="/shipping" className="underline">Shipping</Link> and{' '}
                <Link to="/returns" className="underline">Returns</Link>.
              </p>
            </details>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="mb-4 font-display text-2xl md:text-3xl">
          CLIENT REVIEWS{' '}
          {reviews && reviews.length > 0 && (
            <span className="ml-2 text-lg font-normal text-champagne-dark">
              {stars(avgRating)} <small className="text-slate">{avgRating.toFixed(1)} ({reviews.length})</small>
            </span>
          )}
        </h2>

        {reviews === null ? (
          <Spinner className="my-6" />
        ) : (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.reviewId} className="border border-hairline bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tracking-widest text-champagne-dark">{stars(r.rating)}</span>
                    <b className="text-sm">{r.name}</b>
                    {r.verified && (
                      <span className="bg-[#e3f6e8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#17542c]">
                        VERIFIED PURCHASE
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-[#444748]">{r.text}</p>
                  <small className="text-xs text-slate">{r.date}</small>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-5 border border-hairline bg-white p-6">
          <h3 className="mb-2 font-display text-lg">WRITE A REVIEW</h3>
          {revDone ? (
            <div className="border border-[#bfe3cb] bg-[#eef8f1] p-4 text-sm text-[#17542c]">{revDone}</div>
          ) : (
            <form onSubmit={submitReview} className="space-y-3">
              {!auth.user && (
                <p className="text-xs text-slate">
                  Please <Link to="/login" className="underline">sign in</Link> to review.
                </p>
              )}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="h-11 w-full border border-[#cfcfcd] bg-white px-3 text-sm"
                >
                  <option value={5}>5 — Excellent</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                  Your review
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  value={revText}
                  onChange={(e) => setRevText(e.target.value)}
                  className="h-24 w-full border border-[#cfcfcd] bg-white p-3 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={revBusy}
                className="bg-obsidian px-6 py-2.5 font-display text-xs tracking-[0.1em] text-white transition hover:bg-black disabled:opacity-50"
              >
                {revBusy ? 'SENDING…' : 'SUBMIT REVIEW'}
              </button>
            </form>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl md:text-3xl">YOU MAY ALSO LIKE</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:gap-4">
            {related.map((p, idx) => <ProductCard key={p.productId} product={p} index={idx} />)}
          </div>
        </section>
      )}

      {recentOthers.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl md:text-3xl">RECENTLY VIEWED</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:gap-4">
            {recentOthers.map((p, idx) => <ProductCard key={p.productId} product={p} index={idx} />)}
          </div>
        </section>
      )}

      <Modal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} maxWidth="max-w-lg">
        <h3 className="mb-2 font-display text-2xl">Architectural Size Guide</h3>
        <p className="mb-4 text-xs text-[#444748]">
          Approximate garment measurements in centimetres. For a precise fit recommendation message us on WhatsApp.
        </p>
        <div className="overflow-x-auto border border-hairline bg-white">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-hairline bg-ivory text-[10px] uppercase tracking-[0.1em] text-slate">
                <th className="px-3 py-2.5">Size</th>
                <th className="px-3 py-2.5">Chest</th>
                <th className="px-3 py-2.5">Length</th>
                <th className="px-3 py-2.5">Shoulder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {[
                ['S', '96–101', '68', '43'],
                ['M', '102–107', '70', '45'],
                ['L', '108–113', '72', '47'],
                ['XL', '114–119', '74', '49'],
                ['XXL', '120–125', '76', '51']
              ].map(([sz, ch, len, sh]) => (
                <tr key={sz}>
                  <td className="px-3 py-2.5 font-semibold text-obsidian">{sz}</td>
                  <td className="px-3 py-2.5">{ch}</td>
                  <td className="px-3 py-2.5">{len}</td>
                  <td className="px-3 py-2.5">{sh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 border border-dashed border-hairline bg-white px-3 py-2.5 text-[11px] text-slate">
          Template values — replace with your confirmed measurements before launch.
        </div>
      </Modal>
    </div>
  );
}
