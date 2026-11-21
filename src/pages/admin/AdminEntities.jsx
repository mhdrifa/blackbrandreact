import React, { useCallback, useEffect, useState } from 'react';
import { DISTRICTS, PROVINCES } from '../../config/brand';
import { money } from '../../utils/format';
import { Modal, Spinner } from '../../components/ui/Primitives';
import { AdminBtn, DataTable, FormModal, StatusPill } from '../../components/admin/AdminPrimitives';

function buildEntityDefs(cats, prods, editingCategoryId = '') {
  const active = ['Active', 'Inactive'];
  const parentCatOptions = cats
    .filter((c) => !editingCategoryId || c['Category ID'] !== editingCategoryId)
    .map((c) => ({ v: c['Category ID'], l: c['Category Name'] }));

  return {
    category: {
      sheet: 'Categories',
      title: 'Categories',
      id: 'Category ID',
      cols: [
        { h: 'Name', k: 'Category Name' },
        { h: 'Slug', k: 'Slug' },
        { h: 'Order', k: 'Display Order' },
        { h: 'Status', f: (r) => <StatusPill status={r['Category Status']} /> }
      ],
      fields: [
        { n: 'Category Name', l: 'Name', req: 1 },
        { n: 'Slug', l: 'Slug', help: 'Auto-generated if blank' },
        {
          n: 'Parent Category ID',
          l: 'Parent category',
          t: 'select',
          blank: 1,
          o: parentCatOptions
        },
        { n: 'Description', l: 'Description', t: 'textarea' },
        { n: 'Category Image URL', l: 'Image URL (https)' },
        { n: 'Display Order', l: 'Display order', t: 'number', min: 0 },
        { n: 'Category Status', l: 'Status', t: 'select', o: active }
      ]
    },
    collection: {
      sheet: 'Collections',
      title: 'Collections',
      id: 'Collection ID',
      cols: [
        { h: 'Name', k: 'Collection Name' },
        { h: 'Slug', k: 'Slug' },
        { h: 'Products', f: (r) => String(r['Product IDs'] || '').split(',').filter(Boolean).length },
        { h: 'Order', k: 'Display Order' },
        { h: 'Status', f: (r) => <StatusPill status={r['Collection Status']} /> }
      ],
      fields: [
        { n: 'Collection Name', l: 'Name', req: 1 },
        { n: 'Slug', l: 'Slug' },
        { n: 'Description', l: 'Description', t: 'textarea' },
        { n: 'Banner Image URL', l: 'Banner image URL (https)' },
        {
          n: 'Product IDs',
          l: 'Products in this collection',
          t: 'products',
          o: prods.map((p) => ({ v: p['Product ID'], l: `${p['Product Name']} (${p['SKU']})` }))
        },
        { n: 'Display Order', l: 'Display order', t: 'number', min: 0 },
        { n: 'Collection Status', l: 'Status', t: 'select', o: active }
      ]
    },
    banner: {
      sheet: 'Marketing Banners',
      title: 'Homepage Banners',
      id: 'Banner ID',
      cols: [
        {
          h: 'Preview',
          f: (r) =>
            r['Desktop Image URL'] ? (
              <img src={r['Desktop Image URL']} alt="" className="h-12 w-10 bg-[#eee] object-cover" />
            ) : null
        },
        { h: 'Title', k: 'Banner Title' },
        { h: 'Button', k: 'Button Text' },
        { h: 'Starts', k: 'Start Date' },
        { h: 'Ends', k: 'End Date' },
        { h: 'Order', k: 'Display Order' },
        { h: 'Status', f: (r) => <StatusPill status={r['Banner Status']} /> }
      ],
      fields: [
        { n: 'Banner Title', l: 'Title', req: 1 },
        { n: 'Subtitle', l: 'Subtitle', t: 'textarea' },
        { n: 'Desktop Image URL', l: 'Desktop image URL (https)', req: 1 },
        { n: 'Mobile Image URL', l: 'Mobile image URL (https)' },
        { n: 'Button Text', l: 'Button text' },
        { n: 'Button URL', l: 'Button link', help: 'e.g. #/shop or #/sale or https://…' },
        { n: 'Start Date', l: 'Start date', t: 'date' },
        { n: 'End Date', l: 'End date', t: 'date' },
        { n: 'Display Order', l: 'Display order', t: 'number', min: 0 },
        { n: 'Banner Status', l: 'Status', t: 'select', o: active }
      ]
    },
    coupon: {
      sheet: 'Coupons',
      title: 'Coupons',
      id: 'Coupon ID',
      cols: [
        { h: 'Code', k: 'Coupon Code' },
        { h: 'Type', k: 'Discount Type' },
        { h: 'Value', k: 'Discount Value' },
        { h: 'Min order', k: 'Minimum Order Amount' },
        { h: 'Max discount', k: 'Maximum Discount Amount' },
        { h: 'Used / limit', f: (r) => `${r['Used Count'] ?? 0} / ${Number(r['Usage Limit']) || '∞'}` },
        { h: 'Expires', k: 'Expiry Date' },
        { h: 'Status', f: (r) => <StatusPill status={r['Coupon Status']} /> }
      ],
      fields: [
        { n: 'Coupon Code', l: 'Code', req: 1, help: 'Letters, numbers, - and _' },
        { n: 'Discount Type', l: 'Type', t: 'select', o: ['Percentage', 'Fixed'] },
        { n: 'Discount Value', l: 'Value (% or LKR)', t: 'number', step: '0.01', req: 1 },
        { n: 'Minimum Order Amount', l: 'Minimum order (LKR)', t: 'number', min: 0 },
        { n: 'Maximum Discount Amount', l: 'Max discount (LKR, 0 = none)', t: 'number', min: 0 },
        { n: 'Usage Limit', l: 'Usage limit (0 = unlimited)', t: 'number', min: 0 },
        { n: 'Start Date', l: 'Start date', t: 'date' },
        { n: 'Expiry Date', l: 'Expiry date', t: 'date' },
        { n: 'Coupon Status', l: 'Status', t: 'select', o: ['Active', 'Inactive', 'Expired'] }
      ]
    },
    shipping: {
      sheet: 'Shipping',
      title: 'Shipping rules',
      id: 'Shipping Rule ID',
      cols: [
        { h: 'District', k: 'District' },
        { h: 'Province', k: 'Province' },
        { h: 'Method', k: 'Delivery Method' },
        { h: 'Fee', f: (r) => money(r['Delivery Fee']) },
        { h: 'Estimate', k: 'Estimated Delivery Time' },
        {
          h: 'Free over',
          f: (r) => (Number(r['Free Shipping Threshold']) ? money(r['Free Shipping Threshold']) : '—')
        },
        { h: 'Status', f: (r) => <StatusPill status={r['Shipping Status']} /> }
      ],
      fields: [
        { n: 'District', l: 'District', t: 'select', o: ['All', ...DISTRICTS] },
        { n: 'Province', l: 'Province (when district = All)', t: 'select', o: ['All', ...PROVINCES] },
        { n: 'Delivery Method', l: 'Delivery method', req: 1, help: 'e.g. Standard, Express' },
        { n: 'Delivery Fee', l: 'Fee (LKR)', t: 'number', min: 0, req: 1 },
        { n: 'Estimated Delivery Time', l: 'Estimated time', help: 'e.g. 2–3 business days' },
        { n: 'Free Shipping Threshold', l: 'Free shipping over (LKR, 0 = never)', t: 'number', min: 0 },
        { n: 'Shipping Status', l: 'Status', t: 'select', o: active }
      ]
    }
  };
}

export function EntityCrudPage({ entityKey, call, list, toast, embedded = false }) {
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [cRes, pRes] = await Promise.all([
        entityKey === 'category' ? list('Categories').catch(() => ({ rows: [] })) : Promise.resolve({ rows: [] }),
        entityKey === 'collection' ? list('Products').catch(() => ({ rows: [] })) : Promise.resolve({ rows: [] })
      ]);
      const cRows = cRes.rows || [];
      const pRows = pRes.rows || [];
      setCats(cRows);
      setProds(pRows);
      const d = buildEntityDefs(cRows, pRows)[entityKey];
      const res = await list(d.sheet);
      setRows(res.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [entityKey, list]);

  useEffect(() => { load(); }, [load]);

  const defs = buildEntityDefs(cats, prods, editing?.row?.['Category ID'] || '')[entityKey];

  if (loading && !rows.length && !err) return <Spinner className="my-12" />;
  if (err && !rows.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;
  if (!defs) return null;

  return (
    <div>
      {!embedded && (
        <>
          <h1 className="font-display text-3xl">{defs.title}</h1>
          <p className="mb-4 text-xs text-slate">
            Changes appear on the storefront within about two minutes.
          </p>
        </>
      )}

      <div className="mb-4 flex items-center justify-end border border-hairline bg-white p-3">
        <AdminBtn onClick={() => setEditing({ row: null })}>+ Add</AdminBtn>
      </div>

      <DataTable
        empty="Nothing here yet — click “Add”."
        rows={rows}
        cols={[
          ...defs.cols,
          {
            h: '',
            f: (r) => (
              <AdminBtn size="sm" variant="outline" onClick={() => setEditing({ row: r })}>
                Edit
              </AdminBtn>
            )
          }
        ]}
      />

      <FormModal
        open={!!editing}
        title={`${editing?.row ? 'Edit ' : 'Add '}${defs.title.replace(/s$/, '')}`}
        fields={defs.fields}
        initialValues={editing?.row || {}}
        onClose={() => setEditing(null)}
        onSubmit={async (o) => {
          const rec = { ...o };
          if (editing?.row) rec.id = editing.row[defs.id];
          await call('saveEntity', { entity: entityKey, record: rec });
          toast('Saved');
          load();
        }}
      />
    </div>
  );
}

export function InventoryPage({ call, list, exportSheet, role = 'staff', toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState({ q: '', status: '' });

  const [stockModal, setStockModal] = useState(null);
  const [thrModal, setThrModal] = useState(null);
  const [histModal, setHistModal] = useState(null);

  const canManageThreshold = role === 'owner' || role === 'manager';

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await list('Inventory');
      setRows(res.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => { load(); }, [load]);

  const openHistory = async (variantId) => {
    setHistModal({ loading: true, rows: [] });
    try {
      const h = await list('Stock History', { where: { 'Variant ID': variantId } });
      setHistModal({ loading: false, rows: h.rows || [] });
    } catch (e) {
      toast(e.message, true);
      setHistModal(null);
    }
  };

  if (loading && !rows.length) return <Spinner className="my-20" />;
  if (err && !rows.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;

  const term = applied.q.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (applied.status && r['Stock Status'] !== applied.status) return false;
    if (!term) return true;
    return ['Product Name', 'SKU', 'Size', 'Color'].some((k) =>
      String(r[k] || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Inventory</h1>
      <p className="mb-4 text-xs text-slate">
        Reserved stock is held for pending orders. All movements are recorded in Stock History.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ q, status });
        }}
        className="mb-4 flex flex-wrap items-end gap-2 border border-hairline bg-white p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 min-w-[150px] border border-[#cfcfcd] px-2.5 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Stock status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 min-w-[130px] border border-[#cfcfcd] bg-white px-2 text-xs"
          >
            <option value="">All</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
        <AdminBtn type="submit" variant="outline">Filter</AdminBtn>
        <AdminBtn
          type="button"
          variant="outline"
          onClick={() => { setStatus('Low Stock'); setApplied({ q, status: 'Low Stock' }); }}
        >
          Low stock
        </AdminBtn>
        <AdminBtn
          type="button"
          variant="outline"
          onClick={() => { setStatus('Out of Stock'); setApplied({ q, status: 'Out of Stock' }); }}
        >
          Out of stock
        </AdminBtn>
        <div className="flex-1" />
        <AdminBtn type="button" variant="outline" onClick={() => exportSheet('Inventory')}>Export CSV</AdminBtn>
      </form>

      <DataTable
        empty="No inventory yet — add a product with variants first."
        rows={filtered}
        cols={[
          { h: 'Product', k: 'Product Name' },
          { h: 'SKU', k: 'SKU' },
          { h: 'Size', k: 'Size' },
          { h: 'Colour', k: 'Color' },
          { h: 'Total', k: 'Total Stock' },
          { h: 'Reserved', k: 'Reserved Stock' },
          { h: 'Available', k: 'Available Stock' },
          { h: 'Threshold', k: 'Low Stock Threshold' },
          {
            h: 'Status',
            f: (r) => (
              <StatusPill
                status={
                  r['Stock Status'] === 'In Stock'
                    ? 'Delivered'
                    : r['Stock Status'] === 'Low Stock'
                      ? 'Pending'
                      : 'Cancelled'
                }
              />
            )
          },
          {
            h: '',
            f: (r) => {
              const v = r['Variant ID'];
              return (
                <div className="flex flex-wrap gap-1">
                  <AdminBtn size="sm" variant="outline" onClick={() => setStockModal({ mode: 'add', variantId: v, total: '' })}>
                    + Add
                  </AdminBtn>
                  <AdminBtn size="sm" variant="outline" onClick={() => setStockModal({ mode: 'reduce', variantId: v, total: '' })}>
                    − Reduce
                  </AdminBtn>
                  <AdminBtn size="sm" variant="outline" onClick={() => setStockModal({ mode: 'adjust', variantId: v, total: r['Total Stock'] })}>
                    Adjust
                  </AdminBtn>
                  <AdminBtn size="sm" variant="outline" onClick={() => openHistory(v)}>
                    History
                  </AdminBtn>
                  {canManageThreshold && (
                    <AdminBtn size="sm" variant="outline" onClick={() => setThrModal({ variantId: v, threshold: r['Low Stock Threshold'] })}>
                      Threshold
                    </AdminBtn>
                  )}
                </div>
              );
            }
          }
        ]}
      />

      <FormModal
        open={!!stockModal}
        title={
          stockModal
            ? { add: 'Add stock', reduce: 'Reduce stock', adjust: 'Adjust stock (set total)' }[stockModal.mode]
            : ''
        }
        fields={
          stockModal
            ? [
                {
                  n: 'quantity',
                  l: stockModal.mode === 'adjust' ? 'New total quantity' : 'Quantity',
                  t: 'number',
                  min: 0,
                  req: 1
                },
                { n: 'reason', l: 'Reason', req: 1, help: 'Recorded in Stock History' }
              ]
            : []
        }
        initialValues={stockModal ? { quantity: stockModal.total } : {}}
        onClose={() => setStockModal(null)}
        onSubmit={async (o) => {
          await call('adjustStock', {
            variantId: stockModal.variantId,
            mode: stockModal.mode,
            quantity: Number(o.quantity),
            reason: o.reason
          });
          toast('Stock updated');
          load();
        }}
      />

      <FormModal
        open={!!thrModal}
        title="Low-stock threshold"
        fields={[{ n: 'threshold', l: 'Alert when available ≤', t: 'number', min: 0, req: 1 }]}
        initialValues={thrModal ? { threshold: thrModal.threshold } : {}}
        onClose={() => setThrModal(null)}
        onSubmit={async (o) => {
          await call('setLowStockThreshold', {
            variantId: thrModal.variantId,
            threshold: Number(o.threshold)
          });
          toast('Saved');
          load();
        }}
      />

      <Modal open={!!histModal} onClose={() => setHistModal(null)} maxWidth="max-w-4xl">
        <h3 className="mb-3 font-display text-xl">Stock history</h3>
        {histModal?.loading ? (
          <Spinner className="my-8" />
        ) : (
          <DataTable
            max={100}
            empty="No movements yet."
            rows={histModal?.rows || []}
            cols={[
              { h: 'Time', k: 'Timestamp' },
              { h: 'Type', k: 'Movement Type' },
              { h: 'Change', k: 'Quantity Changed' },
              { h: 'Before', k: 'Previous Stock' },
              { h: 'After', k: 'Updated Stock' },
              { h: 'Reason', k: 'Reason' },
              { h: 'Order', k: 'Related Order ID' },
              { h: 'By', k: 'Updated By' }
            ]}
          />
        )}
      </Modal>
    </div>
  );
}

const NEXT_LABEL = {
  Confirmed: 'Confirm Order',
  Processing: 'Process Order',
  Shipped: 'Mark Shipped',
  Delivered: 'Mark Delivered',
  Cancelled: 'Cancel Order',
  Returned: 'Mark Returned'
};

export function OrdersPage({ call, list, exportSheet, role = 'staff', toast }) {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState({ q: '', status: '', pay: '', from: '', to: '' });
  const [appliedClient, setAppliedClient] = useState({ q: '', status: '', pay: '' });
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' });

  const [detail, setDetail] = useState(null);
  const [busyStatus, setBusyStatus] = useState(false);
  const [shipPrompt, setShipPrompt] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [refundModal, setRefundModal] = useState(null);

  const canRecordMoney = role === 'owner' || role === 'manager';

  const load = useCallback(async (dates = appliedDates) => {
    setLoading(true);
    setErr('');
    try {
      const ex = { dateColumn: 'Order Date' };
      if (dates.from) ex.from = dates.from;
      if (dates.to) ex.to = dates.to;
      const [os, items] = await Promise.all([list('Orders', ex), list('Order Items')]);
      setOrders(os.rows || []);
      setOrderItems(items.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [list, appliedDates]);

  useEffect(() => { load(appliedDates); }, [load, appliedDates]);

  const applyFilter = (e) => {
    e.preventDefault();
    setAppliedClient({ q: draft.q, status: draft.status, pay: draft.pay });
    if (draft.from !== appliedDates.from || draft.to !== appliedDates.to) {
      setAppliedDates({ from: draft.from, to: draft.to });
    }
  };

  const openOrder = async (orderId) => {
    setDetail({ loading: true, error: '', data: null });
    try {
      const d = await call('getOrder', { orderId });
      setDetail({ loading: false, error: '', data: d });
    } catch (e) {
      setDetail({ loading: false, error: e.message, data: null });
    }
  };

  const changeStatus = async (orderId, s, trackingNumber) => {
    if ((s === 'Cancelled' || s === 'Returned') && !window.confirm(`Mark order ${orderId} as ${s}? Stock will be released/restocked.`)) {
      return;
    }
    if (s === 'Shipped' && !trackingNumber) {
      setShipPrompt(orderId);
      return;
    }
    setBusyStatus(true);
    try {
      const r = await call('updateOrderStatus', { orderId, status: s, trackingNumber });
      toast(`Order ${s.toLowerCase()}`);
      if (r.refundDue > 0) {
        toast(`Refund due to customer: ${money(r.refundDue)} — record it after refunding.`);
      }
      await openOrder(orderId);
      load(appliedDates);
    } catch (e) {
      toast(e.message, true);
    } finally {
      setBusyStatus(false);
    }
  };

  const printInvoice = async (orderId) => {
    try {
      const d = await call('invoice', { orderId });
      const o = d.order;
      const w = window.open('', '_blank');
      if (!w) {
        toast('Allow pop-ups to print the invoice.', true);
        return;
      }
      const escHtml = (s) =>
        String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      w.document.write(
        `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(d.invoiceNumber)}</title>` +
          `<style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{letter-spacing:.1em}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:13px}.r{text-align:right}</style></head><body>` +
          `<h1>${escHtml(d.store.name)}</h1><p>${escHtml(d.store.location)} · ${escHtml(d.store.phone)}</p>` +
          `<h2>INVOICE ${escHtml(d.invoiceNumber)}</h2>` +
          `<p>Date: ${escHtml(o.orderDate)}<br>Order: ${escHtml(o.orderId)}<br>Payment: ${escHtml(o.paymentMethod)} (${escHtml(o.paymentStatus)})</p>` +
          `<p><b>Bill to:</b><br>${escHtml(o.customerName)}<br>${escHtml(o.address.line1)} ${escHtml(o.address.line2)}<br>${escHtml(o.address.city)}, ${escHtml(o.address.district)} ${escHtml(o.address.postalCode)}<br>${escHtml(o.phone)}</p>` +
          `<table><tr><th>Item</th><th>Size</th><th>Colour</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Total</th></tr>` +
          o.items
            .map(
              (i) =>
                `<tr><td>${escHtml(i.name)}<br><small>${escHtml(i.sku)}</small></td><td>${escHtml(i.size)}</td><td>${escHtml(i.color)}</td><td class="r">${i.quantity}</td><td class="r">${money(i.unitPrice)}</td><td class="r">${money(i.lineTotal)}</td></tr>`
            )
            .join('') +
          `</table><p class="r">Subtotal ${money(o.subtotal)}<br>Discount −${money(o.discount)}<br>Delivery ${money(o.deliveryFee)}<br>Tax ${money(o.tax)}<br><b>Total ${money(o.total)}</b></p></body></html>`
      );
      w.document.close();
      setTimeout(() => {
        try { w.print(); } catch { /* ignore */ }
      }, 400);
    } catch (e) {
      toast(e.message, true);
    }
  };

  if (loading && !orders.length) return <Spinner className="my-20" />;
  if (err && !orders.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;

  const byOrder = {};
  orderItems.forEach((i) => {
    (byOrder[i['Order ID']] = byOrder[i['Order ID']] || []).push(i);
  });

  const term = appliedClient.q.trim().toLowerCase();
  const rows = orders.filter((o) => {
    if (appliedClient.status && o['Order Status'] !== appliedClient.status) return false;
    if (appliedClient.pay && o['Payment Status'] !== appliedClient.pay) return false;
    if (!term) return true;
    return ['Order ID', 'Customer Name', 'Email', 'Phone Number'].some((k) =>
      String(o[k] || '').toLowerCase().includes(term)
    );
  });

  const oData = detail?.data;
  const o = oData?.order;
  const p = oData?.payment;
  const cleanPhone = String(o?.phone || '').replace(/[^\d+]/g, '');

  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>
      <p className="mb-4 text-xs text-slate">Order status and payment status are tracked separately.</p>

      <form
        onSubmit={applyFilter}
        className="mb-4 flex flex-wrap items-end gap-2 border border-hairline bg-white p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Search</label>
          <input
            value={draft.q}
            onChange={(e) => setDraft((s) => ({ ...s, q: e.target.value }))}
            placeholder="Order, name, phone, email"
            className="h-9 min-w-[160px] border border-[#cfcfcd] px-2.5 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Order status</label>
          <select
            value={draft.status}
            onChange={(e) => setDraft((s) => ({ ...s, status: e.target.value }))}
            className="h-9 min-w-[120px] border border-[#cfcfcd] bg-white px-2 text-xs"
          >
            <option value="">All</option>
            {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Payment</label>
          <select
            value={draft.pay}
            onChange={(e) => setDraft((s) => ({ ...s, pay: e.target.value }))}
            className="h-9 min-w-[120px] border border-[#cfcfcd] bg-white px-2 text-xs"
          >
            <option value="">All</option>
            {['Pending', 'Paid', 'Failed', 'Cancelled', 'Partially Refunded', 'Refunded'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">From</label>
          <input
            type="date"
            value={draft.from}
            onChange={(e) => setDraft((s) => ({ ...s, from: e.target.value }))}
            className="h-9 border border-[#cfcfcd] px-2 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">To</label>
          <input
            type="date"
            value={draft.to}
            onChange={(e) => setDraft((s) => ({ ...s, to: e.target.value }))}
            className="h-9 border border-[#cfcfcd] px-2 text-xs"
          />
        </div>
        <AdminBtn type="submit" variant="outline">Filter</AdminBtn>
        <div className="flex-1" />
        <AdminBtn type="button" variant="outline" onClick={() => exportSheet('Orders')}>Export CSV</AdminBtn>
      </form>

      <DataTable
        empty="No orders match."
        rows={rows}
        cols={[
          { h: 'Order', f: (r) => <b>{r['Order ID']}</b> },
          { h: 'Customer', k: 'Customer Name' },
          { h: 'Phone', k: 'Phone Number' },
          { h: 'Email', k: 'Email' },
          {
            h: 'Items',
            f: (r) => (
              <div className="space-y-0.5">
                {(byOrder[r['Order ID']] || []).map((i, idx) => (
                  <div key={idx}>
                    {i['Quantity']}× {i['Product Name']}{' '}
                    <span className="text-slate">({i['Size']}/{i['Color']})</span>
                  </div>
                ))}
              </div>
            )
          },
          {
            h: 'Qty',
            f: (r) => (byOrder[r['Order ID']] || []).reduce((a, i) => a + Number(i['Quantity']), 0)
          },
          { h: 'Total', f: (r) => money(r['Final Total']) },
          { h: 'Method', k: 'Payment Method' },
          { h: 'Payment', f: (r) => <StatusPill status={r['Payment Status']} /> },
          { h: 'Status', f: (r) => <StatusPill status={r['Order Status']} /> },
          { h: 'Date', f: (r) => String(r['Order Date'] || '').slice(0, 16) },
          {
            h: '',
            f: (r) => (
              <AdminBtn size="sm" onClick={() => openOrder(r['Order ID'])}>View</AdminBtn>
            )
          }
        ]}
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} maxWidth="max-w-4xl">
        {detail?.loading ? (
          <Spinner className="my-10" />
        ) : detail?.error ? (
          <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{detail.error}</div>
        ) : o ? (
          <div className="space-y-4 text-xs">
            {o.paymentMethod === 'Bank Transfer' && o.paymentStatus !== 'Paid' && o.orderStatus === 'Pending' && (
              <div className="border border-[#e9dcbc] bg-[#faf7ef] p-3 text-[#5a4316]">
                <b>Waiting for bank transfer.</b> Check your bank for LKR{' '}
                {Number(o.total).toLocaleString('en-LK')} with reference <b>{o.orderId}</b>, then click{' '}
                <b>Record Payment</b> with the bank reference. The order can be confirmed after that.
              </div>
            )}

            <div>
              <h3 className="font-display text-2xl">{o.orderId}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusPill status={o.orderStatus} />
                <StatusPill status={o.paymentStatus} />
                <span className="text-slate">{o.paymentMethod} · {o.orderDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border border-hairline bg-white p-4">
                <h4 className="mb-1.5 font-display text-sm">Customer</h4>
                <p>
                  <b>{o.customerName}</b><br />
                  {o.phone}<br />
                  {o.email}
                </p>
                <h4 className="mb-1 mt-3 font-display text-sm">Ship to</h4>
                <p>
                  {o.address.line1} {o.address.line2}<br />
                  {o.address.city}, {o.address.district}, {o.address.province} {o.address.postalCode}
                </p>
                {o.deliveryInstructions && (
                  <p className="mt-1 text-slate">Note: {o.deliveryInstructions}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <a href={`tel:${cleanPhone}`} className="border border-[#bdbdbb] px-2.5 py-1 text-[10px] font-semibold uppercase">Call</a>
                  <a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${cleanPhone.replace('+', '')}`} className="border border-[#bdbdbb] px-2.5 py-1 text-[10px] font-semibold uppercase">WhatsApp</a>
                  <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your BLACK BRAND order ${o.orderId}`)}`} className="border border-[#bdbdbb] px-2.5 py-1 text-[10px] font-semibold uppercase">Email</a>
                </div>
              </div>

              <div className="border border-hairline bg-white p-4">
                <h4 className="mb-1.5 font-display text-sm">Payment</h4>
                {p && (
                  <div className="space-y-1">
                    <div>Status: <StatusPill status={p['Payment Status']} /></div>
                    <div>Verification: <b>{p['Verification Status']}</b></div>
                    <div>Provider: {p['Payment Provider']}</div>
                    <div>Reference: {p['Transaction Reference'] || '—'}</div>
                    <div>Refunded: {money(p['Refund Amount'])}</div>
                  </div>
                )}
                <p className="mt-2 text-slate">Tracking: {o.trackingNumber || '—'}</p>
              </div>
            </div>

            <div className="border border-hairline bg-white p-4">
              <h4 className="mb-2 font-display text-sm">Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline text-[10px] uppercase text-slate">
                      <th className="py-1.5">Item</th>
                      <th className="py-1.5">SKU</th>
                      <th className="py-1.5">Size</th>
                      <th className="py-1.5">Colour</th>
                      <th className="py-1.5">Qty</th>
                      <th className="py-1.5">Unit</th>
                      <th className="py-1.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {o.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5">{i.name}</td>
                        <td className="py-1.5">{i.sku}</td>
                        <td className="py-1.5">{i.size}</td>
                        <td className="py-1.5">{i.color}</td>
                        <td className="py-1.5">{i.quantity}</td>
                        <td className="py-1.5">{money(i.unitPrice)}</td>
                        <td className="py-1.5 text-right">{money(i.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-right">
                Subtotal {money(o.subtotal)}
                {o.discount ? ` · Discount −${money(o.discount)}` : ''} · Delivery {money(o.deliveryFee)}
                {o.tax ? ` · Tax ${money(o.tax)}` : ''}
                <br />
                <b className="text-sm">Total {money(o.total)}</b>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(oData.allowedNextStatuses || [])
                .filter((s) => !(s === 'Confirmed' && o.paymentMethod === 'Bank Transfer' && o.paymentStatus !== 'Paid'))
                .map((s) => (
                  <AdminBtn
                    key={s}
                    disabled={busyStatus}
                    variant={s === 'Cancelled' || s === 'Returned' ? 'danger' : 'gold'}
                    onClick={() => changeStatus(o.orderId, s)}
                  >
                    {NEXT_LABEL[s]}
                  </AdminBtn>
                ))}

              {canRecordMoney && p && ['Pending', 'Failed'].includes(p['Payment Status']) && o.paymentMethod !== 'Cashfree' && !['Cancelled', 'Returned'].includes(o.orderStatus) && (
                <AdminBtn disabled={busyStatus} onClick={() => setPayModal({ orderId: o.orderId, total: o.total })}>
                  Record Payment
                </AdminBtn>
              )}

              {canRecordMoney && p && ['Paid', 'Partially Refunded'].includes(p['Payment Status']) && (
                <AdminBtn
                  disabled={busyStatus}
                  variant="outline"
                  onClick={() =>
                    setRefundModal({
                      orderId: o.orderId,
                      max: Number(p['Payment Amount']) - Number(p['Refund Amount'])
                    })
                  }
                >
                  Record Refund
                </AdminBtn>
              )}

              <AdminBtn variant="outline" onClick={() => printInvoice(o.orderId)}>Print Invoice</AdminBtn>
            </div>

            {o.paymentMethod === 'Cashfree' && o.paymentStatus === 'Pending' && (
              <p className="text-slate">
                Online payments are marked Paid automatically only after Cashfree confirms them server-side.
              </p>
            )}
          </div>
        ) : null}
      </Modal>

      <FormModal
        open={!!shipPrompt}
        title="Mark shipped"
        submitLabel="Mark shipped"
        fields={[{ n: 'tracking', l: 'Tracking number / courier reference', req: 1 }]}
        onClose={() => setShipPrompt(null)}
        onSubmit={(vals) => changeStatus(shipPrompt, 'Shipped', vals.tracking)}
      />

      <FormModal
        open={!!payModal}
        title="Record payment received"
        fields={[
          { n: 'amount', l: 'Amount received (LKR)', t: 'number', step: '0.01', req: 1 },
          { n: 'reference', l: 'Bank / receipt reference', help: 'Required for bank transfers' }
        ]}
        initialValues={payModal ? { amount: payModal.total } : {}}
        onClose={() => setPayModal(null)}
        onSubmit={async (vals) => {
          await call('recordPayment', {
            orderId: payModal.orderId,
            amount: Number(vals.amount),
            reference: vals.reference
          });
          toast('Payment recorded');
          openOrder(payModal.orderId);
          load(appliedDates);
        }}
      />

      <FormModal
        open={!!refundModal}
        title="Record refund"
        fields={
          refundModal
            ? [
                {
                  n: 'amount',
                  l: `Refund amount (LKR, max ${refundModal.max})`,
                  t: 'number',
                  step: '0.01',
                  req: 1
                },
                {
                  n: 'reason',
                  l: 'Reason',
                  req: 1,
                  help: 'This only RECORDS the refund — send the money via your gateway/bank first.'
                }
              ]
            : []
        }
        initialValues={refundModal ? { amount: refundModal.max } : {}}
        onClose={() => setRefundModal(null)}
        onSubmit={async (vals) => {
          await call('recordRefund', {
            orderId: refundModal.orderId,
            amount: Number(vals.amount),
            reason: vals.reason
          });
          toast('Refund recorded');
          openOrder(refundModal.orderId);
          load(appliedDates);
        }}
      />
    </div>
  );
}
