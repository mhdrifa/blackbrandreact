import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { lsGet, lsSet, modeKey, money } from '../../utils/format';
import { Spinner } from '../../components/ui/Primitives';
import OrderSummaryBlock from '../../components/store/OrderSummaryBlock';
import { launchCashfree } from './CheckoutPage';

const KEY_LAST_ORDER = modeKey('bb_last_order');
const KEY_PAY_MSG = modeKey('bb_pay_msg');

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const orderId = decodeURIComponent(id || '');
  const { contact } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const skipAutoVerify = Boolean(location.state?.skipAutoVerify);

  const last = lsGet(KEY_LAST_ORDER, {});
  const [email, setEmail] = useState(last.id === orderId ? last.email : '');
  const [emailInput, setEmailInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadOrder = useCallback(async (em, allowAutoVerify = true) => {
    if (!em) return;
    setLoading(true);
    setErr('');
    try {
      let o = await apiPost('trackOrder', { orderId, email: em });
      if (allowAutoVerify && o.paymentMethod === 'Cashfree' && o.paymentStatus === 'Pending') {
        try {
          await apiPost('verifyPayment', { orderId, email: em });
          o = await apiPost('trackOrder', { orderId, email: em });
        } catch { /* stay pending */ }
      }
      if (o.paymentStatus === 'Paid') {
        try { localStorage.removeItem(KEY_PAY_MSG); } catch { /* ignore */ }
      }
      setOrder(o);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    document.title = `Order ${orderId} — BLACK BRAND`;
    if (email) loadOrder(email, !skipAutoVerify);
  }, [orderId, email, skipAutoVerify, loadOrder]);

  const confirmEmail = (e) => {
    e.preventDefault();
    const em = emailInput.trim();
    lsSet(KEY_LAST_ORDER, { id: orderId, email: em });
    setEmail(em);
  };

  const retryPay = async () => {
    setBusy(true);
    try {
      const r = await apiPost('initiatePayment', { orderId, email });
      if (r.paymentSessionId || r.mockSandboxPayment) {
        await launchCashfree(r, orderId, navigate);
      } else {
        toast(`Payment status: ${r.status || 'unknown'}`);
      }
    } catch (e) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  if (!email) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
        <h1 className="mb-6 font-display text-4xl">Order {orderId}</h1>
        <div className="mx-auto max-w-md border border-hairline bg-white p-7">
          <h3 className="mb-4 font-display text-xl">Confirm your email</h3>
          <form onSubmit={confirmEmail} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                Email used for this order
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
              />
            </div>
            <button type="submit" className="h-12 w-full bg-obsidian font-display text-sm tracking-[0.1em] text-white">
              VIEW ORDER
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !order) return <Spinner className="my-24" />;
  if (err && !order) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
        <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-sm text-[#8a1a14]">{err}</div>
        <button type="button" onClick={() => loadOrder(email, true)} className="mt-4 border border-obsidian px-6 py-2.5 font-display text-xs tracking-widest">
          TRY AGAIN
        </button>
      </div>
    );
  }
  if (!order) return null;

  const pm = lsGet(KEY_PAY_MSG, '');

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="border border-hairline bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em]">1 BAG</span>
        <span className="border border-hairline bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em]">2 CHECKOUT</span>
        <span className="border border-obsidian bg-obsidian px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] text-white">3 CONFIRMATION</span>
      </div>

      <h1 className="mb-5 font-display text-3xl md:text-5xl">
        {order.paymentStatus === 'Paid' ? 'Payment received — thank you' : 'Order received — thank you'}
      </h1>

      {order.paymentMethod === 'Cashfree' && order.paymentStatus === 'Pending' && (
        <div className="mb-5 border border-dashed border-hairline bg-white p-4 text-xs text-[#444748]">
          <b>Payment not confirmed yet.</b> We mark an online payment as paid only after verifying it with the payment provider.{' '}
          {pm && <span>{pm} </span>}If you just paid, wait a moment and re-check.
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={loading} onClick={() => loadOrder(email, true)} className="bg-obsidian px-4 py-2 font-display text-xs tracking-wider text-white">
              CHECK PAYMENT STATUS
            </button>
            <button type="button" disabled={busy} onClick={retryPay} className="border border-obsidian px-4 py-2 font-display text-xs tracking-wider">
              PAY NOW
            </button>
          </div>
        </div>
      )}

      {order.paymentMethod === 'Bank Transfer' && order.paymentStatus !== 'Paid' && (
        <div className="mb-5 border border-[#e9dcbc] bg-[#faf7ef] p-4 text-xs">
          <b>Bank transfer:</b> please pay <b>{money(order.total)}</b> to the account below and use{' '}
          <b>{order.paymentReference || orderId}</b> as the reference.
          <div className="my-2 whitespace-pre-line border border-hairline bg-white p-3 font-mono">
            {order.paymentInstructions || 'Our team will send you the bank details on WhatsApp.'}
          </div>
          <div>We confirm your order as soon as the payment arrives.</div>
        </div>
      )}

      {order.paymentMethod === 'Cash on Delivery' && (
        <div className="mb-5 border border-dashed border-hairline bg-white p-4 text-xs text-[#444748]">
          Pay in cash when your order arrives.
        </div>
      )}

      <OrderSummaryBlock order={order} />

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/tracking" className="border border-obsidian px-6 py-3 font-display text-sm tracking-[0.08em] transition hover:bg-obsidian hover:text-white">
          TRACK ORDER
        </Link>
        <Link to="/shop" className="bg-obsidian px-6 py-3 font-display text-sm tracking-[0.08em] text-white transition hover:bg-black">
          CONTINUE SHOPPING
        </Link>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(`Hi BLACK BRAND, about my order ${orderId}`)}`}
          className="border border-obsidian px-6 py-3 font-display text-sm tracking-[0.08em] transition hover:bg-obsidian hover:text-white"
        >
          WHATSAPP US
        </a>
      </div>
    </div>
  );
}
