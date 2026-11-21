import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { apiPost } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { money, placeholderImg, safeImg } from '../../utils/format';
import { EmptyState, Spinner } from '../../components/ui/Primitives';

export default function CartPage() {
  const {
    catalog,
    catalogLoading,
    cart,
    findProduct,
    coupon,
    setCoupon,
    updateCartQty,
    removeFromCart
  } = useStore();
  const [couponInput, setCouponInput] = useState(coupon);
  const [quote, setQuote] = useState(null);
  const [quoteErr, setQuoteErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Bag — BLACK BRAND'; }, []);

  useEffect(() => {
    if (!cart.length) { setQuote(null); return; }
    let alive = true;
    setLoading(true);
    setQuoteErr('');
    apiPost('quote', { items: cart, couponCode: coupon })
      .then((q) => { if (alive) setQuote(q); })
      .catch((e) => { if (alive) setQuoteErr(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [cart, coupon]);

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
        <h1 className="mb-6 font-display text-4xl">Shopping Bag</h1>
        <EmptyState title="Your bag is empty" body="Add something you love." to="/shop" label="CONTINUE SHOPPING" />
      </div>
    );
  }

  if (catalogLoading && !catalog) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
        <h1 className="mb-6 font-display text-4xl">Shopping Bag</h1>
        <Spinner className="my-20" />
      </div>
    );
  }

  const issues = {};
  (quote?.issues || []).forEach((i) => { issues[i.variantId] = i; });
  const blocked = Boolean(quote?.issues?.length);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <h1 className="mb-6 font-display text-4xl">Shopping Bag</h1>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="divide-y divide-hairline border border-hairline bg-white p-5 md:p-6">
          {cart.map((it) => {
            const p = findProduct(it.productId);
            const v = p?.variants?.find((x) => x.variantId === it.variantId);
            const bad = issues[it.variantId] || (!p || !v ? { message: 'No longer available.' } : null);
            if (!p || !v) {
              return (
                <div key={it.variantId} className="py-4">
                  <div className="font-display text-base">Unavailable item</div>
                  <div className="my-2 border border-[#f3c1bd] bg-[#fff1f0] p-2.5 text-xs text-[#8a1a14]">{bad.message}</div>
                  <button type="button" onClick={() => removeFromCart(it.variantId)} className="text-xs text-crimson underline">
                    Remove
                  </button>
                </div>
              );
            }
            return (
              <div key={it.variantId} className="grid grid-cols-[80px_1fr_auto] items-start gap-4 py-4">
                <Link to={`/product/${encodeURIComponent(p.productId)}`}>
                  <img
                    src={safeImg(v.imageUrl || p.mainImageUrl)}
                    onError={(e) => { e.currentTarget.src = placeholderImg; }}
                    alt={p.name}
                    className="aspect-[3/4] w-20 bg-[#eee] object-cover"
                  />
                </Link>
                <div>
                  <Link to={`/product/${encodeURIComponent(p.productId)}`} className="font-display text-base uppercase">
                    {p.name}
                  </Link>
                  <div className="mt-0.5 text-xs text-slate">
                    {v.color} · {v.size} · {money(v.price)}
                  </div>
                  {bad && (
                    <div className="my-2 border border-[#f3c1bd] bg-[#fff1f0] p-2 text-xs text-[#8a1a14]">
                      {bad.message}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="inline-flex border border-hairline bg-white">
                      <button type="button" aria-label="Decrease" onClick={() => updateCartQty(it.variantId, -1)} className="flex h-9 w-9 items-center justify-center">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex w-9 items-center justify-center text-xs font-semibold">{it.quantity}</span>
                      <button type="button" aria-label="Increase" onClick={() => updateCartQty(it.variantId, 1)} className="flex h-9 w-9 items-center justify-center">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(it.variantId)} className="text-xs text-crimson underline">
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-sm font-bold">{money(v.price * it.quantity)}</div>
              </div>
            );
          })}
        </div>

        <div className="border border-hairline bg-white p-6">
          <h3 className="mb-4 font-display text-xl">Order Summary</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCoupon(couponInput.trim().toUpperCase());
            }}
            className="mb-4 flex gap-1.5"
          >
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="COUPON CODE"
              aria-label="Coupon code"
              className="h-11 flex-1 border border-[#cfcfcd] px-3 text-xs uppercase"
            />
            <button type="submit" className="bg-obsidian px-4 font-display text-xs tracking-[0.1em] text-white">
              APPLY
            </button>
          </form>

          {quote?.couponError && (
            <div className="mb-3 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{quote.couponError}</div>
          )}
          {quoteErr && (
            <div className="mb-3 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{quoteErr}</div>
          )}

          {loading && !quote ? (
            <Spinner className="my-6" />
          ) : quote ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{money(quote.subtotal)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald">
                  <span>
                    Discount ({quote.couponApplied}){' '}
                    <button
                      type="button"
                      onClick={() => { setCoupon(''); setCouponInput(''); }}
                      className="ml-1 text-[11px] text-crimson underline"
                    >
                      remove
                    </button>
                  </span>
                  <span>−{money(quote.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-slate">Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-3 text-base font-bold">
                <span>Estimated total</span>
                <span>{money(quote.total)}</span>
              </div>
            </div>
          ) : null}

          <Link
            to={blocked ? '#' : '/checkout'}
            onClick={(e) => { if (blocked) e.preventDefault(); }}
            className={`mt-5 flex min-h-[48px] w-full items-center justify-center bg-obsidian font-display text-base tracking-[0.08em] text-white transition hover:bg-black ${
              blocked ? 'pointer-events-none opacity-45' : ''
            }`}
          >
            PROCEED TO CHECKOUT
          </Link>
          {blocked && <p className="mt-2 text-xs text-slate">Fix the highlighted items to continue.</p>}
          <Link to="/shop" className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] underline">
            ← CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  );
}
