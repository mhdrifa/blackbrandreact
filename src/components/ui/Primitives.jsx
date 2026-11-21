import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LUXURY_EASE = [0.22, 1, 0.36, 1];

export const MOTION_TOKENS = {
  fast: 0.18,
  standard: 0.32,
  reveal: 0.55,
  hero: 0.76
};

export function Reveal({ children, className = '', delay = 0, y = 20 }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: MOTION_TOKENS.reveal, delay, ease: LUXURY_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TextMask({ children, delay = 0, className = '' }) {
  const reduced = useReducedMotion();
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={reduced ? false : { y: '105%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 0.58, delay, ease: LUXURY_EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function PageTransition({ routeKey, children }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={routeKey}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: LUXURY_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, light = false, dot = true }) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        light ? 'text-champagne-soft' : 'text-[#5a5853]'
      }`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-champagne-soft' : 'bg-champagne-dark'}`}
        />
      )}
      {children}
    </div>
  );
}

export function Spinner({ className = 'my-16' }) {
  return (
    <div className={`flex justify-center ${className}`} role="status" aria-label="Loading">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-hairline border-t-obsidian" />
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading dashboard">
      <div className="h-8 w-44 animate-pulse bg-[#e6e4de]" />
      <div className="h-14 w-full animate-pulse border border-hairline bg-white" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse border border-hairline bg-white p-4">
            <div className="h-2.5 w-20 bg-[#eceae4]" />
            <div className="mt-3 h-6 w-24 bg-[#e4e1d9]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse border border-hairline bg-white p-4">
            <div className="h-3 w-32 bg-[#eceae4]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, to, label }) {
  return (
    <div className="border border-hairline bg-white px-6 py-16 text-center">
      <h3 className="font-display text-2xl tracking-wide text-obsidian">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-slate">{body}</p>}
      {to && label && (
        <Link
          to={to}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center bg-obsidian px-8 font-display text-sm tracking-[0.08em] text-white transition hover:bg-black"
        >
          {label}
        </Link>
      )}
    </div>
  );
}

export function StatusBadge({ status, prefix = '' }) {
  const map = {
    Pending: 'bg-[#fff4d6] text-[#7a5a00]',
    Confirmed: 'bg-[#e3f1ff] text-[#0a4a8a]',
    Processing: 'bg-[#e3f1ff] text-[#0a4a8a]',
    Paid: 'bg-[#e3f1ff] text-[#0a4a8a]',
    Shipped: 'bg-[#efe6ff] text-[#4b2a86]',
    Delivered: 'bg-[#e3f6e8] text-[#17542c]',
    Active: 'bg-[#e3f6e8] text-[#17542c]',
    Approved: 'bg-[#e3f6e8] text-[#17542c]',
    Published: 'bg-[#e3f6e8] text-[#17542c]',
    Cancelled: 'bg-[#fde7e5] text-[#8a1a14]',
    Returned: 'bg-[#fde7e5] text-[#8a1a14]',
    Failed: 'bg-[#fde7e5] text-[#8a1a14]',
    Rejected: 'bg-[#fde7e5] text-[#8a1a14]',
    Archived: 'bg-[#fde7e5] text-[#8a1a14]'
  };
  const cls = map[status] || 'bg-[#eeeeec] text-[#3a3a3a]';
  return (
    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${cls}`}>
      {prefix ? `${prefix}: ${status}` : status}
    </span>
  );
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-3xl' }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.28, ease: LUXURY_EASE }}
            className={`relative max-h-[92dvh] w-full ${maxWidth} overflow-y-auto bg-ivory p-5 shadow-2xl md:p-8`}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center text-obsidian/70 transition hover:text-obsidian"
            >
              <X className="h-5 w-5" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
