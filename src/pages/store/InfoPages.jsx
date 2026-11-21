import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { money } from '../../utils/format';
import { EmptyState, Eyebrow } from '../../components/ui/Primitives';
import ProductCard from '../../components/store/ProductCard';

export function WishlistPage() {
  const { wish, findProduct } = useStore();
  useEffect(() => { document.title = 'Wishlist — BLACK BRAND'; }, []);
  const items = wish.map(findProduct).filter(Boolean);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <h1 className="mb-6 font-display text-4xl">Wishlist</h1>
      {items.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {items.map((p, idx) => <ProductCard key={p.productId} product={p} index={idx} />)}
        </div>
      ) : (
        <EmptyState
          title="Your wishlist is empty"
          body="Tap the heart on any product to save it."
          to="/shop"
          label="START BROWSING"
        />
      )}
    </div>
  );
}

export function ContactPage() {
  const { contact } = useStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    website: ''
  });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Contact — BLACK BRAND'; }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await apiPost('submitContact', form);
      setDone(true);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <Eyebrow dot={false}>CLIENT CARE</Eyebrow>
      <h1 className="mb-6 mt-1 font-display text-4xl md:text-5xl">Contact Us</h1>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="border border-hairline bg-white p-6">
          {done ? (
            <div className="border border-[#bfe3cb] bg-[#eef8f1] p-4 text-sm text-[#17542c]">
              <b>Message sent.</b> We will reply as soon as we can.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Subject *</label>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
                    className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Message *</label>
                <textarea
                  required
                  maxLength={3000}
                  value={form.message}
                  onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                  className="h-28 w-full border border-[#cfcfcd] p-3 text-sm"
                />
              </div>
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
                aria-hidden="true"
                className="hidden"
              />
              {err && (
                <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="bg-obsidian px-8 py-3 font-display text-sm tracking-[0.08em] text-white transition hover:bg-black disabled:opacity-50"
              >
                {busy ? 'SENDING…' : 'SEND MESSAGE'}
              </button>
            </form>
          )}
        </div>

        <div className="border border-hairline bg-white p-6">
          <h3 className="mb-2 font-display text-xl">Reach us directly</h3>
          <p className="text-sm font-semibold">Kalpitiya, Sri Lanka</p>
          <p className="my-2 text-sm">
            <a href={`tel:${contact.phoneTel}`} className="underline">{contact.phoneDisplay}</a>
          </p>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={contact.whatsappUrl}
            className="mt-4 flex min-h-[46px] w-full items-center justify-center bg-obsidian font-display text-sm tracking-[0.08em] text-white transition hover:bg-black"
          >
            CHAT ON WHATSAPP
          </a>
        </div>
      </div>
    </div>
  );
}

export function StaticPage({ kind }) {
  const { catalog, contact } = useStore();
  const shippingRows = catalog?.shipping || [];

  const titleMap = {
    about: ['About Us', 'THE ATELIER'],
    faq: ['Client Care & FAQ', 'FREQUENTLY ASKED'],
    'size-guide': ['Architectural Size Guide', 'FIND YOUR FIT'],
    shipping: ['Shipping & Islandwide Returns', 'DELIVERY'],
    returns: ['Returns & Exchanges', 'SEAMLESS SIZE EXCHANGE'],
    privacy: ['Privacy Policy', 'LEGAL'],
    terms: ['Terms & Conditions', 'LEGAL']
  };
  const [title, kicker] = titleMap[kind] || ['Information', 'BLACK BRAND'];
  useEffect(() => { document.title = `${title} — BLACK BRAND`; }, [title]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <div className="mb-4 text-[11px] uppercase tracking-[0.1em] text-slate">
        <Link to="/" className="hover:text-obsidian">Home</Link> / {title}
      </div>
      <Eyebrow dot={false}>{kicker}</Eyebrow>
      <h1 className="mb-6 mt-1 font-display text-4xl md:text-5xl">{title}</h1>

      <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-[#444748]">
        {kind === 'about' && (
          <>
            <p>
              <b>BLACK BRAND</b> is a premium men&apos;s fashion label based in Kalpitiya, Sri Lanka. Our tagline says it best:{' '}
              <b>Define your style.</b>
            </p>
            <p>
              We design for men aged 16–40 who want structural purity, effortless poise and presence — heavyweight cottons, breathable linens and clean tailoring built for tropical warmth.
            </p>
            <p>
              Every order is handled personally from Kalpitiya, with island-wide delivery and WhatsApp concierge support on{' '}
              <a href={`tel:${contact.phoneTel}`} className="underline">{contact.phoneDisplay}</a>.
            </p>
          </>
        )}

        {kind === 'faq' && (
          <div className="space-y-2.5">
            {[
              [
                'How long does delivery take?',
                'We dispatch Colombo Metro orders the same day and deliver island-wide, typically within 48 hours. See the Shipping page for current delivery options and fees.'
              ],
              [
                'What payment methods do you accept?',
                'Cash on Delivery, Bank Transfer and secure online payment via Cashfree (when enabled). Online payments are confirmed only after the payment provider verifies them.'
              ],
              [
                'Can I exchange the size?',
                'Yes — we offer 7-day doorstep size exchanges. See Returns & Exchanges.'
              ],
              [
                'How do I track my order?',
                'Use Track Order with your order ID and the email used at checkout, or view it in your account.'
              ],
              [
                'Do I need an account to order?',
                'No. Guest checkout is available. An account gives you order history and faster checkout.'
              ],
              [
                'How do I find my size?',
                'See our Size Guide, or message us on WhatsApp for personal sizing help.'
              ]
            ].map(([q, a]) => (
              <details key={q} className="border border-hairline bg-white p-4">
                <summary className="cursor-pointer font-semibold text-obsidian">{q}</summary>
                <p className="mt-2">{a}</p>
              </details>
            ))}
          </div>
        )}

        {kind === 'size-guide' && (
          <>
            <p>Approximate garment measurements in centimetres. For a precise fit recommendation message us on WhatsApp.</p>
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
            <div className="border border-dashed border-hairline bg-white px-4 py-3 text-xs text-[#444748]">
              Template values — replace with your confirmed measurements before launch.
            </div>
          </>
        )}

        {kind === 'shipping' && (
          <>
            <p>We deliver across all 25 districts of Sri Lanka. Colombo Metro orders are dispatched the same day.</p>
            <h2 className="pt-3 font-display text-2xl text-obsidian">Delivery rates</h2>
            {shippingRows.length ? (
              <div className="overflow-x-auto border border-hairline bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-ivory text-[10px] uppercase tracking-[0.1em] text-slate">
                      <th className="px-3 py-2.5">Area</th>
                      <th className="px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5">Fee</th>
                      <th className="px-3 py-2.5">Estimate</th>
                      <th className="px-3 py-2.5">Free over</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {shippingRows.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2.5">
                          {r.district === 'All'
                            ? r.province === 'All'
                              ? 'All districts'
                              : `${r.province} Province`
                            : r.district}
                        </td>
                        <td className="px-3 py-2.5">{r.method}</td>
                        <td className="px-3 py-2.5">{money(r.fee)}</td>
                        <td className="px-3 py-2.5">{r.estimatedTime}</td>
                        <td className="px-3 py-2.5">
                          {r.freeShippingThreshold ? money(r.freeShippingThreshold) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate">Delivery rates will be listed here shortly.</p>
            )}
          </>
        )}

        {kind === 'returns' && (
          <>
            <p>Effortless 7-day doorstep size exchanges arranged via our private courier fleet.</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Items must be unworn, unwashed, with tags attached.</li>
              <li>Contact us on WhatsApp or via the Contact page with your order ID within 7 days of delivery.</li>
              <li>Exchanges are subject to stock availability in the requested size.</li>
            </ul>
            <div className="border border-dashed border-hairline bg-white px-4 py-3 text-xs text-[#444748]">
              Template policy — confirm the details (refund eligibility, return shipping) with your business rules.
            </div>
          </>
        )}

        {kind === 'privacy' && (
          <>
            <p>
              We collect only what we need to fulfil your order and support you: name, email, phone, delivery address and order details.
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                We never store passwords or card details in our order database. Account sign-in is handled by a dedicated authentication service; card payments are processed by the payment provider.
              </li>
              <li>Your details are used to process orders, arrange delivery and respond to your messages.</li>
              <li>You can unsubscribe from marketing emails at any time.</li>
            </ul>
            <p>
              Questions? Contact us on{' '}
              <a href={`tel:${contact.phoneTel}`} className="underline">{contact.phoneDisplay}</a>.
            </p>
            <div className="border border-dashed border-hairline bg-white px-4 py-3 text-xs text-[#444748]">
              Template — have this reviewed against Sri Lanka&apos;s Personal Data Protection Act before launch.
            </div>
          </>
        )}

        {kind === 'terms' && (
          <>
            <p>By placing an order with BLACK BRAND you agree to these terms.</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>All prices are in Sri Lankan Rupees (LKR).</li>
              <li>
                Orders are confirmed after stock and payment checks. Online payments are confirmed only after verification by the payment provider.
              </li>
              <li>We may cancel orders that cannot be fulfilled and will refund any verified payment.</li>
              <li>Delivery estimates are indicative.</li>
            </ul>
            <div className="border border-dashed border-hairline bg-white px-4 py-3 text-xs text-[#444748]">
              Template — replace with your reviewed terms before launch.
            </div>
          </>
        )}
      </div>
    </div>
  );
}