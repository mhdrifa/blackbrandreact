import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { money, placeholderImg, safeImg } from '../../utils/format';
import { LUXURY_EASE } from '../ui/Primitives';

export default function CartDrawer() {
  const { bagOpen, setBagOpen, cart, findProduct, updateCartQty, removeFromCart } = useStore();
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!bagOpen) return;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtnRef.current?.focus());
    const onKey = (e) => { if (e.key === 'Escape') setBagOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [bagOpen, setBagOpen]);

  const subtotal = cart.reduce((sum, it) => {
    const p = findProduct(it.productId);
    const v = p?.variants?.find((x) => x.variantId === it.variantId);
    return sum + (v ? v.price * it.quantity : 0);
  }, 0);

  return (
    <AnimatePresence>
      {bagOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={() => setBagOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.34, ease: LUXURY_EASE }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
              <div>
                <h2 className="font-display text-xl tracking-[0.06em]">Shopping Bag</h2>
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate">
                  {cart.reduce((a, i) => a + i.quantity, 0)} item(s)
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label="Close bag"
                onClick={() => setBagOpen(false)}
                className="flex h-10 w-10 items-center justify-center border border-hairline transition hover:border-obsidian"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!cart.length ? (
                <div className="py-16 text-center">
                  <p className="font-display text-lg uppercase text-obsidian">Your bag is empty</p>
                  <p className="mt-1 text-xs text-slate">Explore new arrivals and timeless tailoring.</p>
                  <Link
                    to="/shop"
                    onClick={() => setBagOpen(false)}
                    className="mt-6 inline-flex min-h-[44px] items-center bg-obsidian px-6 font-display text-xs tracking-[0.1em] text-white transition hover:bg-black"
                  >
                    BROWSE COLLECTION
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  <AnimatePresence initial={false}>
                    {cart.map((it) => {
                      const p = findProduct(it.productId);
                      const v = p?.variants?.find((x) => x.variantId === it.variantId);
                      if (!p || !v) return null;
                      return (
                        <motion.div
                          key={it.variantId}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{ duration: 0.24, ease: LUXURY_EASE }}
                          className="flex gap-4 py-4"
                        >
                          <Link
                            to={`/product/${encodeURIComponent(p.productId)}`}
                            onClick={() => setBagOpen(false)}
                            className="h-24 w-20 shrink-0 overflow-hidden bg-white"
                          >
                            <img
                              src={safeImg(v.imageUrl || p.mainImageUrl)}
                              onError={(e) => { e.currentTarget.src = placeholderImg; }}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          </Link>
                          <div className="flex flex-1 flex-col">
                            <Link
                              to={`/product/${encodeURIComponent(p.productId)}`}
                              onClick={() => setBagOpen(false)}
                              className="font-display text-sm uppercase tracking-wide text-obsidian transition-colors hover:text-champagne-dark"
                            >
                              {p.name}
                            </Link>
                            <span className="text-xs text-slate">
                              {v.color} · {v.size} · {money(v.price)}
                            </span>
                            <div className="mt-auto flex items-center justify-between pt-2">
                              <div className="inline-flex border border-hairline bg-white">
                                <button
                                  type="button"
                                  aria-label="Decrease"
                                  onClick={() => updateCartQty(it.variantId, -1)}
                                  className="flex h-7 w-7 items-center justify-center transition hover:bg-ivory"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <motion.span
                                  key={it.quantity}
                                  initial={{ scale: 0.85, opacity: 0.6 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.16 }}
                                  className="flex w-7 items-center justify-center text-xs font-semibold"
                                >
                                  {it.quantity}
                                </motion.span>
                                <button
                                  type="button"
                                  aria-label="Increase"
                                  onClick={() => updateCartQty(it.variantId, 1)}
                                  className="flex h-7 w-7 items-center justify-center transition hover:bg-ivory"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(it.variantId)}
                                aria-label="Remove item"
                                className="text-slate transition hover:text-crimson"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-hairline bg-white p-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.12em] text-slate">Subtotal</span>
                  <motion.span
                    key={subtotal}
                    initial={{ opacity: 0.6, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-base font-bold text-obsidian"
                  >
                    {money(subtotal)}
                  </motion.span>
                </div>
                <p className="mt-1 text-[11px] text-slate">Delivery &amp; coupons calculated at checkout.</p>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <Link
                    to="/cart"
                    onClick={() => setBagOpen(false)}
                    className="flex min-h-[46px] items-center justify-center border border-obsidian font-display text-sm tracking-[0.08em] text-obsidian transition hover:bg-ivory"
                  >
                    VIEW BAG
                  </Link>
                  <Link
                    to="/checkout"
                    onClick={() => setBagOpen(false)}
                    className="flex min-h-[46px] items-center justify-center bg-obsidian font-display text-sm tracking-[0.08em] text-white transition hover:bg-black"
                  >
                    CHECKOUT
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
