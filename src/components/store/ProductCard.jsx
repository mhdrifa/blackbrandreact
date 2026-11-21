import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { cssColor, isNewProduct, isVideoUrl, money, placeholderImg, safeImg, uniq } from '../../utils/format';
import { LUXURY_EASE, MOTION_TOKENS } from '../ui/Primitives';

export default function ProductCard({ product, index = 0 }) {
  const { wish, toggleWish, setQuickProductId } = useStore();
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef(null);

  const isWished = wish.includes(product.productId);
  const colors = uniq(product.variants.map((v) => v.color));
  const sizes = uniq(product.variants.map((v) => v.size));
  const sizeAvailable = (s) =>
    product.variants.some((v) => v.size === s && v.availableQuantity > 0);

  const secondaryImg = (product.additionalImageUrls || []).find((u) => !isVideoUrl(u));

  useEffect(() => {
    if (imgRef.current?.complete) {
      setImgLoaded(true);
    } else {
      setImgLoaded(false);
    }
  }, [product.mainImageUrl]);

  const badge = !product.inStock
    ? { label: 'SOLD OUT', sale: false }
    : product.salePrice > 0
      ? { label: `SALE −${Math.round(product.discountPercentage)}%`, sale: true }
      : isNewProduct(product)
        ? { label: 'NEW ARRIVAL', sale: false }
        : product.featured
          ? { label: 'BEST SELLER', sale: false }
          : null;

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.48, delay: Math.min(index, 4) * 0.05, ease: LUXURY_EASE }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      className="group flex flex-col border border-hairline bg-white p-2 transition duration-300 ease-luxury active:scale-[0.99] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-[#cfc9be] [@media(hover:hover)]:hover:shadow-[0_18px_36px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#eceae4]">
        <Link to={`/product/${encodeURIComponent(product.productId)}`} aria-label={product.name} className="block h-full w-full">
          <img
            ref={imgRef}
            loading="lazy"
            src={safeImg(product.mainImageUrl)}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = placeholderImg;
              setImgLoaded(true);
            }}
            alt={product.name}
            className={`h-full w-full object-cover transition-all duration-[350ms] ease-luxury [@media(hover:hover)]:group-hover:scale-[1.04] ${
              imgLoaded ? 'opacity-100' : 'opacity-90'
            }`}
          />
          {secondaryImg && (
            <img
              loading="lazy"
              src={secondaryImg}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[350ms] ease-luxury [@media(hover:hover)]:group-hover:scale-[1.04] ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </Link>

        {badge && (
          <span
            className={`absolute left-2 top-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
              badge.sale ? 'bg-crimson text-white' : 'bg-obsidian text-white'
            }`}
          >
            {badge.label}
          </span>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.86 }}
          transition={{ duration: MOTION_TOKENS.fast }}
          onClick={(e) => {
            e.preventDefault();
            toggleWish(product.productId);
          }}
          aria-label="Toggle wishlist"
          aria-pressed={isWished}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-white/90 text-obsidian transition-colors hover:bg-white"
        >
          <Heart className={`h-4 w-4 transition-transform duration-200 ${isWished ? 'scale-110 fill-crimson text-crimson' : 'text-obsidian'}`} />
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-1 pb-1 pt-2.5">
        {colors.length > 0 && (
          <div className="flex gap-1.5">
            {colors.map((c) => (
              <span
                key={c}
                title={c}
                style={{ backgroundColor: cssColor(c) }}
                className="block h-3.5 w-3.5 rounded-full border border-hairline"
              />
            ))}
          </div>
        )}

        <Link
          to={`/product/${encodeURIComponent(product.productId)}`}
          className="line-clamp-2 min-h-[38px] font-display text-[16px] uppercase tracking-[0.03em] text-obsidian transition-colors duration-200 [@media(hover:hover)]:group-hover:text-champagne-dark"
        >
          {product.name}
        </Link>

        <div className="flex flex-col gap-1">
  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
    <span className="whitespace-nowrap text-sm font-semibold text-obsidian">
      {money(product.priceFrom)}
    </span>

    {product.priceFrom < product.regularPrice && (
      <s className="whitespace-nowrap text-xs text-slate">
        {money(product.regularPrice)}
      </s>
    )}
  </div>

  <span className="text-[10px] uppercase tracking-[0.08em] text-slate">
    {product.category}
  </span>
</div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <div className="flex flex-wrap gap-1">
            {sizes.map((s) => (
              <span
                key={s}
                className={`border border-hairline px-1.5 py-0.5 text-[10px] ${
                  sizeAvailable(s) ? 'bg-white text-obsidian' : 'text-slate/50 line-through'
                }`}
              >
                {s}
              </span>
            ))}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            transition={{ duration: MOTION_TOKENS.fast }}
            onClick={() => setQuickProductId(product.productId)}
            aria-label={`Quick add ${product.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-obsidian text-obsidian transition-colors duration-200 hover:bg-obsidian hover:text-white"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
