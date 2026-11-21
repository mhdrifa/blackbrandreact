import React from 'react';
import { money } from '../../utils/format';
import { StatusBadge } from '../ui/Primitives';

const STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function OrderSummaryBlock({ order }) {
  const idx = STEPS.indexOf(order.orderStatus);

  return (
    <div className="border border-hairline bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-slate">Order</div>
          <h3 className="mt-1 font-display text-2xl text-obsidian">{order.orderId}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} prefix="PAYMENT" />
        </div>
      </div>

      {idx < 0 ? (
        <div className="my-5 border border-[#f3c1bd] bg-[#fff1f0] px-4 py-3 text-xs text-[#8a1a14]">
          This order is <b>{order.orderStatus}</b>.
        </div>
      ) : (
        <div className="my-5 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                i <= idx ? 'border-obsidian bg-obsidian text-white' : 'border-hairline bg-white text-slate'
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {order.trackingNumber && (
        <p className="mb-2 text-sm">
          <b>Tracking number:</b> {order.trackingNumber}
        </p>
      )}
      <p className="mb-4 text-sm">
        <b>Payment method:</b> {order.paymentMethod}
      </p>

      <div className="overflow-x-auto border border-hairline">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-hairline bg-ivory text-[10px] uppercase tracking-[0.1em] text-slate">
              <th className="px-3 py-2.5">Item</th>
              <th className="px-3 py-2.5">Size</th>
              <th className="px-3 py-2.5">Colour</th>
              <th className="px-3 py-2.5">Qty</th>
              <th className="px-3 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {(order.items || []).map((it, k) => (
              <tr key={k}>
                <td className="px-3 py-2.5 font-medium">{it.name}</td>
                <td className="px-3 py-2.5">{it.size}</td>
                <td className="px-3 py-2.5">{it.color}</td>
                <td className="px-3 py-2.5">{it.quantity}</td>
                <td className="px-3 py-2.5 text-right">{money(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto mt-5 max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate">Subtotal</span>
          <span>{money(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-emerald">
            <span>Discount</span>
            <span>−{money(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate">Delivery</span>
          <span>{money(order.deliveryFee)}</span>
        </div>
        {order.tax > 0 && (
          <div className="flex justify-between">
            <span className="text-slate">Tax</span>
            <span>{money(order.tax)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-hairline pt-2 text-base font-bold">
          <span>Total</span>
          <span>{money(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
