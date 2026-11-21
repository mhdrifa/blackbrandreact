import React, { useEffect, useState } from 'react';
import { apiPost } from '../../services/api';
import { lsGet, lsSet, modeKey } from '../../utils/format';
import { Eyebrow } from '../../components/ui/Primitives';
import OrderSummaryBlock from '../../components/store/OrderSummaryBlock';

const KEY_LAST_ORDER = modeKey('bb_last_order');

export default function TrackingPage() {
  const last = lsGet(KEY_LAST_ORDER, {});
  const [orderId, setOrderId] = useState(last?.id || '');
  const [email, setEmail] = useState(last?.email || '');
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Track order — BLACK BRAND'; }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const o = await apiPost('trackOrder', { orderId: orderId.trim(), email: email.trim() });
      lsSet(KEY_LAST_ORDER, { id: o.orderId, email: email.trim() });
      setOrder(o);
    } catch (e2) {
      setOrder(null);
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <Eyebrow dot={false}>CONCIERGE DISPATCH</Eyebrow>
      <h1 className="mb-6 mt-1 font-display text-4xl md:text-5xl">Track Your Order</h1>

      <div className="mb-8 max-w-md border border-hairline bg-white p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">Order ID</label>
            <input
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="BB-YYMMDD-XXXXXX"
              className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
              Email used for the order
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
            />
          </div>
          {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>}
          <button type="submit" disabled={busy} className="h-12 w-full bg-obsidian font-display text-sm tracking-[0.1em] text-white">
            {busy ? 'CHECKING…' : 'TRACK'}
          </button>
        </form>
      </div>

      {order && <OrderSummaryBlock order={order} />}
    </div>
  );
}
