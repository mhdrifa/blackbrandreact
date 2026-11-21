import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Minus, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { money, uniq } from '../../utils/format';
import { LUXURY_EASE } from '../ui/Primitives';

export default function VariantPicker({ product, onDone }) {
  const { addToCart } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const colors = useMemo(() => uniq(product.variants.map((v) => v.color)), [product]);
  const sizes = useMemo(() => uniq(product.variants.map((v) => v.size)), [product]);

  const [color, setColor] = useState(() => (colors.length === 1 ? colors[0] : ''));
  const [size, setSize] = useState(() => (sizes.length === 1 ? sizes[0] : ''));
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setColor(colors.length === 1 ? colors[0] : '');
    setSize(sizes.length === 1 ? sizes[0] : '');
    setQty(1);
    setAddedFeedback(false);
  }, [product.productId, colors, sizes]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const selected = useMemo(
    () =>
      color && size
        ? product.variants.find((v) => v.color === color && v.size === size) || null
        : null,
    [product.variants, color, size]
  );

  const maxQty = selected ? Math.min(selected.availableQuantity, 20) : 20;

  const pickColor = (c) => {
    setColor(c);
    if (
      size &&
      !product.variants.some((v) => v.color === c && v.size === size && v.availableQuantity > 0)
    ) {
      setSize('');
    }
    setQty(1);
  };

  const handleAction = (buyNow) => {
    if (!selected) {
      toast('Choose colour and size first.', true);
      return;
    }
    const ok = addToCart(product, selected, qty, !buyNow);
    if (ok) {
      if (buyNow) {
        if (onDone) onDone();
        navigate('/checkout');
      } else {
        setAddedFeedback(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setAddedFeedback(false);
          if (onDone) onDone();
        }, 550);
        toast('Added to your bag');
      }
    }
  };

  const stockKey = selected
    ? `${selected.variantId}-${selected.availableQuantity}`
    : `${color}-${size}`;

  const stockText = selected
    ? selected.availableQuantity <= 0
      ? 'Sold out'
      : selected.availableQuantity <= 3
        ? `Only ${selected.availableQuantity} left`
        : 'In stock'
    : color && size
      ? `Size ${size} is not available in ${color} — please choose another size or colour`
      : 'Select colour and size';

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-obsidian">
          Colour{color ? `: ${color}` : ''}
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <motion.button
              key={c}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => pickColor(c)}
              className={`min-h-[42px] border px-4 text-xs font-semibold tracking-wide transition-colors ${
                color === c
                  ? 'border-obsidian bg-obsidian text-white'
                  : 'border-hairline bg-white text-obsidian hover:border-obsidian'
              }`}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-obsidian">
          Size{size ? `: ${size}` : ''}
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const v = color ? product.variants.find((x) => x.color === color && x.size === s) : null;
            const ok = color
              ? v && v.availableQuantity > 0
              : product.variants.some((x) => x.size === s && x.availableQuantity > 0);
            return (
              <motion.button
                key={s}
                type="button"
                whileTap={ok ? { scale: 0.95 } : undefined}
                disabled={!ok}
                onClick={() => {
                  setSize(s);
                  setQty(1);
                }}
                className={`min-h-[42px] min-w-[46px] border px-3.5 text-xs font-semibold transition-colors ${
                  size === s
                    ? 'border-obsidian bg-obsidian text-white'
                    : 'border-hairline bg-white text-obsidian hover:border-obsidian'
                } disabled:cursor-not-allowed disabled:text-slate/50 disabled:line-through`}
              >
                {s}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-obsidian">
          <span>Quantity</span>
          <AnimatePresence mode="wait">
            {selected && (
              <motion.span
                key={selected.variantId}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.18, ease: LUXURY_EASE }}
                className="text-slate"
              >
                {money(selected.price)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="inline-flex border border-hairline bg-white">
          <button
            type="button"
            aria-label="Decrease"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center transition hover:bg-ivory"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="flex w-11 items-center justify-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            aria-label="Increase"
            onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
            className="flex h-11 w-11 items-center justify-center transition hover:bg-ivory"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={stockKey}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: LUXURY_EASE }}
            className={`mt-2 text-xs ${
              selected && selected.availableQuantity <= 3 ? 'font-medium text-crimson' : 'text-slate'
            }`}
          >
            {stockText}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          disabled={!selected || maxQty <= 0}
          onClick={() => handleAction(false)}
          className="relative min-h-[48px] flex-1 overflow-hidden bg-obsidian px-6 font-display text-base tracking-[0.08em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
        >
          <AnimatePresence mode="wait" initial={false}>
            {addedFeedback ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: LUXURY_EASE }}
                className="inline-flex items-center justify-center gap-1.5 text-champagne-soft"
              >
                <Check className="h-4 w-4" /> ADDED TO BAG
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: LUXURY_EASE }}
                className="inline-block"
              >
                ADD TO BAG
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          disabled={!selected || maxQty <= 0}
          onClick={() => handleAction(true)}
          className="min-h-[48px] flex-1 border border-obsidian bg-transparent px-6 font-display text-base tracking-[0.08em] text-obsidian transition hover:bg-obsidian hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          BUY NOW
        </motion.button>
      </div>
    </div>
  );
}
