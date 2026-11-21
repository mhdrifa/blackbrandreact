import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { apiPost } from '../../services/api';

export default function Footer() {
  const { contact } = useStore();
  const toast = useToast();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);

  const hideFloatingWa =
    location.pathname.startsWith('/cart') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/order-confirmation');

  const onSubscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await apiPost('subscribeNewsletter', { email, website });
      toast(
        r.alreadySubscribed
          ? 'You are already subscribed.'
          : r.voucherCode
            ? `Subscribed! Your voucher code: ${r.voucherCode}`
            : 'Subscribed — welcome to the atelier.'
      );
      setEmail('');
    } catch (err) {
      toast(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <footer className="mt-16 bg-black text-[#c9c6c5]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 md:px-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="font-display text-2xl tracking-[0.06em] text-white">BLACK BRAND</div>
            <div className="my-2.5 font-display text-sm tracking-[0.06em] text-champagne-soft">
              DEFINE YOUR STYLE. BUILT FOR CONFIDENCE. DESIGNED FOR STYLE.
            </div>
            <p className="mb-3 text-xs leading-relaxed">
              Premium men&apos;s clothing crafted for the modern gentleman — island-wide delivery across Sri Lanka.
            </p>
            <ul className="space-y-1.5 text-xs">
              <li>Kalpitiya, Sri Lanka</li>
              <li>
                <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-champagne-soft">
                  WhatsApp: {contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`tel:${contact.phoneTel}`} className="hover:text-champagne-soft">
                  Call: {contact.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 border-b border-[#2a2a2a] pb-1.5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-white">
              The Collection
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/shop" className="hover:text-champagne-soft">Shop All Ready-to-Wear</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-champagne-soft">New Season Drops</Link></li>
              <li><Link to="/best-sellers" className="hover:text-champagne-soft">Best Sellers Matrix</Link></li>
              <li><Link to="/collections" className="hover:text-champagne-soft">Editorial Lookbooks</Link></li>
              <li><Link to="/sale" className="hover:text-champagne-soft">Archive Sale Privileges</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 border-b border-[#2a2a2a] pb-1.5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-white">
              Client Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/size-guide" className="hover:text-champagne-soft">Architectural Size Guide</Link></li>
              <li><Link to="/shipping" className="hover:text-champagne-soft">Shipping &amp; Islandwide Returns</Link></li>
              <li><Link to="/tracking" className="hover:text-champagne-soft">Track Concierge Dispatch</Link></li>
              <li><Link to="/faq" className="hover:text-champagne-soft">Client Care &amp; FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 border-b border-[#2a2a2a] pb-1.5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-white">
              Join The Atelier
            </h4>
            <p className="text-xs leading-relaxed">
              Receive private capsule preview access and invitations to private runway showings.
            </p>
            <form onSubmit={onSubscribe} className="my-3 flex">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER YOUR EMAIL"
                aria-label="Email"
                className="h-11 min-w-0 flex-1 border border-[#333] bg-[#111] px-2.5 text-xs text-white"
              />
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                aria-hidden="true"
                className="hidden"
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-champagne-soft px-4 text-xs font-semibold tracking-wider text-[#261900] transition hover:bg-champagne"
              >
                {busy ? '…' : 'JOIN'}
              </button>
            </form>
            <div className="text-[11px] text-slate">
              By joining, you accept BLACK BRAND client terms &amp; privacy charter.
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['COD', 'BANK TRANSFER', 'CASHFREE'].map((m) => (
                <span key={m} className="border border-[#333] px-2 py-1 text-[10px] tracking-[0.08em] text-[#9a9a9a]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 border-t border-[#222] px-4 py-4 pb-20 text-[11px] text-slate md:px-12 md:pb-4">
          <span>© {new Date().getFullYear()} BLACK BRAND. Kalpitiya, Sri Lanka. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/about" className="hover:text-white">About Us</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms &amp; Conditions</Link>
            <Link to="/returns" className="hover:text-white">Returns &amp; Exchanges</Link>
          </div>
        </div>
      </footer>

      {!hideFloatingWa && (
        <a
          href={contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-white px-3.5 py-2.5 text-[11px] font-semibold tracking-[0.06em] text-obsidian shadow-xl transition hover:-translate-y-0.5 md:bottom-6 md:left-6"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#25d366]" />
          <span className="hidden sm:inline">WHATSAPP CONCIERGE · {contact.phoneDisplay}</span>
        </a>
      )}
    </>
  );
}
