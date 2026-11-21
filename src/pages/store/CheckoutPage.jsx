/* global __ALLOW_MOCK__ */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_MODE, DISTRICT_PROVINCE, DISTRICTS } from '../../config/brand';
import { apiPost } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { EMAIL_RE, lsGet, lsSet, modeKey, money, PHONE_RE } from '../../utils/format';
import { Spinner } from '../../components/ui/Primitives';

const KEY_CHECKOUT = modeKey('bb_checkout');
const KEY_LAST_ORDER = modeKey('bb_last_order');
const KEY_PAY_MSG = modeKey('bb_pay_msg');
const KEY_IDEM = modeKey('bb_idem');

export async function launchCashfree(pay, orderId, navigate) {
  const target = `/order-confirmation/${encodeURIComponent(orderId)}`;
  if (__ALLOW_MOCK__ && (APP_MODE === 'mock' || pay.mockSandboxPayment)) {
    navigate(target);
    return;
  }
  navigate(target, { state: { skipAutoVerify: true } });
  try {
    await new Promise((res, rej) => {
      if (window.Cashfree) return res();
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.onload = res;
      s.onerror = () => rej(new Error('Could not load the payment window. Please click PAY NOW below to retry.'));
      document.head.appendChild(s);
    });
    const cf = window.Cashfree({ mode: pay.environment === 'production' ? 'production' : 'sandbox' });
    setTimeout(() => {
      cf.checkout({ paymentSessionId: pay.paymentSessionId, redirectTarget: '_self' });
    }, 300);
  } catch (e) {
    lsSet(KEY_PAY_MSG, e.message);
  }
}

function getIdemKey() {
  let k = sessionStorage.getItem(KEY_IDEM);
  if (!k) {
    k = `${crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random().toString(16).slice(2)}-bb`;
    sessionStorage.setItem(KEY_IDEM, k);
  }
  return k;
}

export default function CheckoutPage() {
  const { catalog, cart, coupon, auth, authPost, clearCartAfterOrder } = useStore();
  const navigate = useNavigate();
  const orderPlacedRef = useRef(false);

  const saved = lsGet(KEY_CHECKOUT, {});
  const methods = catalog?.settings?.payment_methods || [];
  const bankInstructions = String(catalog?.settings?.bank_transfer_instructions || '').trim();

  const [form, setForm] = useState({
    name: saved.name || '',
    phone: saved.phone || '',
    email: saved.email || '',
    address1: saved.address1 || '',
    address2: saved.address2 || '',
    city: saved.city || '',
    district: saved.district || '',
    postalCode: saved.postalCode || '',
    instructions: saved.instructions || ''
  });
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(methods[0] || '');
  const [quote, setQuote] = useState(null);
  const [quoteErr, setQuoteErr] = useState('');
  const [quoteBump, setQuoteBump] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitErr, setSubmitErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Checkout — BLACK BRAND';
    if (!cart.length && !orderPlacedRef.current) {
      navigate('/cart', { replace: true });
    }
    getIdemKey();
  }, [cart.length, navigate]);

  useEffect(() => {
    if (methods.length && !methods.includes(paymentMethod)) {
      setPaymentMethod(methods[0]);
    } else if (!methods.length && paymentMethod) {
      setPaymentMethod('');
    }
  }, [methods, paymentMethod]);

  useEffect(() => {
    if (!auth.user) return;
    authPost('myProfile')
      .then((prof) => {
        setForm((prev) => ({
          ...prev,
          name: prev.name || prof.fullName || '',
          phone: prev.phone || prof.phone || '',
          email: prev.email || prof.email || '',
          address1: prev.address1 || prof.address || '',
          city: prev.city || prof.city || '',
          district: prev.district || prof.district || '',
          postalCode: prev.postalCode || prof.postalCode || ''
        }));
      })
      .catch(() => {});
  }, [auth.user, authPost]);

  useEffect(() => {
    if (!cart.length) return;
    let alive = true;
    setQuoteErr('');
    apiPost('quote', {
      items: cart,
      couponCode: coupon,
      district: form.district || '',
      deliveryMethod
    })
      .then((q) => {
        if (!alive) return;
        setQuote(q);
        if (form.district && !deliveryMethod && q.deliveryOptions.length === 1) {
          setDeliveryMethod(q.deliveryOptions[0].method);
        }
      })
      .catch((e) => { if (alive) setQuoteErr(e.message); });
    return () => { alive = false; };
  }, [cart, coupon, form.district, deliveryMethod, quoteBump]);

  const fieldError = (key, val) => {
    if (key === 'name' && !val.trim()) return 'Enter your full name.';
    if (key === 'phone' && !PHONE_RE.test(val.trim())) return 'Enter a valid phone number.';
    if (key === 'email' && !EMAIL_RE.test(val.trim())) return 'Enter a valid email.';
    if (key === 'address1' && !val.trim()) return 'Required.';
    if (key === 'city' && !val.trim()) return 'Required.';
    if (key === 'district' && !val) return 'Select your district.';
    if (key === 'postalCode' && val.trim().length < 3) return 'Enter your postal code.';
    return '';
  };

  const validate = () => {
    const next = {};
    ['name', 'phone', 'email', 'address1', 'city', 'district', 'postalCode'].forEach((k) => {
      const m = fieldError(k, form[k]);
      if (m) next[k] = m;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr('');
    if (!validate()) {
      setSubmitErr('Please correct the highlighted fields.');
      return;
    }
    if (!deliveryMethod) {
      setSubmitErr('Choose a delivery method.');
      return;
    }
    if (!paymentMethod || !methods.includes(paymentMethod)) {
      setSubmitErr('Choose a valid payment method.');
      return;
    }

    setSubmitting(true);
    const payload = {
      idempotencyKey: getIdemKey(),
      customer: { name: form.name, email: form.email, phone: form.phone },
      shipping: {
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        district: form.district,
        postalCode: form.postalCode,
        instructions: form.instructions
      },
      items: cart.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      couponCode: coupon,
      deliveryMethod,
      paymentMethod,
      expectedTotal: quote?.total
    };

    lsSet(KEY_CHECKOUT, {
      name: form.name, email: form.email, phone: form.phone,
      address1: form.address1, address2: form.address2, city: form.city,
      district: form.district, postalCode: form.postalCode
    });

    try {
      const authArg = auth.token ? { idToken: auth.token } : {};
      const r = await apiPost('createOrder', payload, authArg);
      lsSet(KEY_LAST_ORDER, { id: r.order.orderId, email: form.email });
      lsSet(KEY_PAY_MSG, r.payment?.error || '');

      orderPlacedRef.current = true;
      clearCartAfterOrder();

      if (r.payment?.paymentSessionId || (__ALLOW_MOCK__ && r.payment?.mockSandboxPayment)) {
        await launchCashfree(r.payment, r.order.orderId, navigate);
        return;
      }
      navigate(`/order-confirmation/${encodeURIComponent(r.order.orderId)}`);
    } catch (err) {
      setSubmitting(false);
      if (err.code === 'TOTAL_CHANGED') {
        setSubmitErr(
          `Prices or fees changed — your total is now ${money(err.details?.total)}. Please review and place the order again.`
        );
        setQuoteBump((n) => n + 1);
      } else if (err.code === 'ITEM_UNAVAILABLE') {
        setSubmitErr((err.details || []).map((i) => i.message).join(' '));
      } else {
        setSubmitErr(err.message);
      }
    }
  };

  const fld = (label, key, type = 'text', extra = {}) => (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => {
          const val = e.target.value;
          setForm((s) => ({ ...s, [key]: val }));
          if (errors[key]) setErrors((er) => ({ ...er, [key]: fieldError(key, val) }));
        }}
        onBlur={(e) => {
          const m = fieldError(key, e.target.value);
          if (m || errors[key]) setErrors((er) => ({ ...er, [key]: m }));
        }}
        className={`h-11 w-full border bg-white px-3 text-sm ${errors[key] ? 'border-crimson' : 'border-[#cfcfcd]'}`}
        {...extra}
      />
      {errors[key] && <span className="mt-1 block text-xs text-crimson">{errors[key]}</span>}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="border border-hairline bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em]">1 BAG</span>
        <span className="border border-obsidian bg-obsidian px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] text-white">2 CHECKOUT</span>
        <span className="border border-hairline bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em]">3 CONFIRMATION</span>
      </div>

      <h1 className="mb-4 font-display text-4xl">Secure Checkout</h1>

      {__ALLOW_MOCK__ && APP_MODE === 'mock' && (
        <div className="mb-5 border border-champagne bg-[#faf7ef] px-4 py-3 text-xs text-[#5a4316]">
          <b>Sandbox checkout:</b> Orders placed here are stored locally in your browser only. No live orders, inventory changes, or real Cashfree charges occur.
        </div>
      )}

      {!auth.user && (
        <div className="mb-5 border border-dashed border-hairline bg-white px-4 py-3 text-xs text-[#444748]">
          Have an account? <Link to="/login?next=checkout" className="underline">Sign in</Link> for faster checkout and order history — or continue as guest below.
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <div className="border border-hairline bg-white p-6">
            <h3 className="mb-4 font-display text-xl">Customer</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fld('Customer name *', 'name', 'text', { autoComplete: 'name' })}
              {fld('Phone *', 'phone', 'tel', { autoComplete: 'tel', placeholder: '+94 7X XXX XXXX' })}
            </div>
            <div className="mt-3">{fld('Email *', 'email', 'email', { autoComplete: 'email' })}</div>
          </div>

          <div className="space-y-3 border border-hairline bg-white p-6">
            <h3 className="mb-2 font-display text-xl">Shipping address</h3>
            {fld('Address line 1 *', 'address1', 'text', { autoComplete: 'address-line1' })}
            {fld('Address line 2', 'address2', 'text', { autoComplete: 'address-line2' })}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fld('City *', 'city', 'text', { autoComplete: 'address-level2' })}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                  District *
                </label>
                <select
                  value={form.district}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((s) => ({ ...s, district: val }));
                    setErrors((er) => ({ ...er, district: fieldError('district', val) }));
                    setDeliveryMethod('');
                  }}
                  className={`h-11 w-full border bg-white px-3 text-sm ${errors.district ? 'border-crimson' : 'border-[#cfcfcd]'}`}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <span className="mt-1 block text-xs text-crimson">{errors.district}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                  Province
                </label>
                <input
                  readOnly
                  value={DISTRICT_PROVINCE[form.district] || ''}
                  className="h-11 w-full border border-[#cfcfcd] bg-ivory px-3 text-sm"
                />
              </div>
              {fld('Postal code *', 'postalCode', 'text', { autoComplete: 'postal-code' })}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                Delivery instructions
              </label>
              <textarea
                maxLength={300}
                value={form.instructions}
                onChange={(e) => setForm((s) => ({ ...s, instructions: e.target.value }))}
                className="h-20 w-full border border-[#cfcfcd] p-3 text-sm"
              />
            </div>
          </div>

          <div className="border border-hairline bg-white p-6">
            <h3 className="mb-3 font-display text-xl">Delivery method</h3>
            {!form.district ? (
              <p className="text-sm text-slate">Select your district to see delivery options.</p>
            ) : quote?.deliveryOptions?.length ? (
              <div className="space-y-2">
                {quote.deliveryOptions.map((o) => (
                  <label
                    key={o.method}
                    className={`flex cursor-pointer items-start gap-3 border p-3.5 ${
                      deliveryMethod === o.method ? 'border-obsidian bg-[#faf7ef]' : 'border-hairline bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryMethod === o.method}
                      onChange={() => setDeliveryMethod(o.method)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <b>{o.method} — {o.free ? 'FREE' : money(o.fee)}</b>
                      {o.estimatedTime && <small className="block text-xs text-slate">{o.estimatedTime}</small>}
                    </div>
                  </label>
                ))}
              </div>
            ) : quote ? (
              <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
                Delivery to {form.district} is not available yet. Please contact us on WhatsApp.
              </div>
            ) : (
              <Spinner className="my-4" />
            )}
          </div>

          <div className="border border-hairline bg-white p-6">
            <h3 className="mb-3 font-display text-xl">Payment method</h3>
            {methods.length ? (
              <div className="space-y-2">
                {methods.map((m) => (
                  <label
                    key={m}
                    className={`flex cursor-pointer items-start gap-3 border p-3.5 ${
                      paymentMethod === m ? 'border-obsidian bg-[#faf7ef]' : 'border-hairline bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === m}
                      onChange={() => setPaymentMethod(m)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <b>{m}</b>
                      <small className="block text-xs text-slate">
                        {m === 'Cash on Delivery'
                          ? 'Pay in cash when your order arrives.'
                          : m === 'Bank Transfer'
                            ? 'Order is confirmed after we verify your transfer.'
                            : __ALLOW_MOCK__ && APP_MODE === 'mock'
                              ? 'Simulated Cashfree sandbox verification (no real charge).'
                              : 'Secure online card/bank payment via Cashfree. Confirmed only after server-side verification.'}
                      </small>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
                No payment methods are currently enabled. Please contact us on WhatsApp.
              </div>
            )}

            {paymentMethod === 'Bank Transfer' && (
              <div className="mt-4 border border-[#e9dcbc] bg-[#faf7ef] p-4 text-xs">
                <b>Bank transfer details</b>
                <div className="my-2 whitespace-pre-line border border-hairline bg-white p-3 font-mono">
                  {bankInstructions || 'Bank details will be sent to you on WhatsApp after you place the order.'}
                </div>
                {quote && <div className="mt-1">Amount to transfer: <b>{money(quote.total)}</b></div>}
                <div className="mt-1 text-[#444748]">
                  After you place the order, use your <b>order number</b> as the transfer reference. Your order is confirmed once we receive the payment.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border border-hairline bg-white p-6 lg:sticky lg:top-28">
          <h3 className="mb-4 font-display text-xl">Order Summary</h3>
          {quoteErr ? (
            <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{quoteErr}</div>
          ) : !quote ? (
            <Spinner className="my-6" />
          ) : (
            <div className="space-y-2 text-sm">
              {quote.items.map((i) => (
                <div key={i.variantId} className="flex justify-between gap-2 text-xs">
                  <span>
                    {i.name} <small className="text-slate">({i.size}/{i.color}) ×{i.quantity}</small>
                  </span>
                  <span className="shrink-0">{money(i.lineTotal + i.discount)}</span>
                </div>
              ))}
              {quote.issues.length > 0 && (
                <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
                  {quote.issues.map((i, idx) => <div key={idx}>{i.message}</div>)}
                  <Link to="/cart" className="underline">Review bag</Link>
                </div>
              )}
              <div className="flex justify-between border-t border-hairline pt-2">
                <span>Subtotal</span>
                <span>{money(quote.subtotal)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald">
                  <span>Discount ({quote.couponApplied})</span>
                  <span>−{money(quote.discount)}</span>
                </div>
              )}
              {quote.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{money(quote.tax)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{quote.deliveryCalculated ? (quote.deliveryFee ? money(quote.deliveryFee) : 'FREE') : '—'}</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-3 text-base font-bold">
                <span>Total</span>
                <span>{money(quote.total)}</span>
              </div>
            </div>
          )}

          {submitErr && (
            <div className="mt-3 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{submitErr}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !quote || quote.issues.length > 0 || !quote.deliveryCalculated}
            className="mt-5 flex min-h-[48px] w-full items-center justify-center bg-obsidian font-display text-base tracking-[0.08em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? 'PLACING ORDER…' : 'PLACE ORDER'}
          </button>
          <p className="mt-2 text-[11px] text-slate">
            Final totals are calculated by our server when you place the order.
          </p>
        </div>
      </form>
    </div>
  );
}
