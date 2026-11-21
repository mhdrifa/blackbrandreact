import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { colomboDaysAgo, colomboToday, downloadFile, money, toCsv } from '../../utils/format';
import { AdminSkeleton } from '../../components/ui/Primitives';
import {
  AdminBtn,
  DataTable,
  KpiCard,
  RangeBar,
  StatusPill
} from '../../components/admin/AdminPrimitives';
import AdminCharts from '../../components/admin/AdminCharts';

export function DashboardPage({ call }) {
  const [range, setRange] = useState({ from: colomboDaysAgo(29), to: colomboToday() });
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockRows, setLowStockRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(
    async (r) => {
      setLoading(true);
      setErr('');
      try {
        const [dash, ordRes, invRes] = await Promise.all([
          call('dashboard', r),
          call('list', { sheet: 'Orders', limit: 8 }).catch(() => ({ rows: [] })),
          call('list', { sheet: 'Inventory', limit: 1000 }).catch(() => ({ rows: [] }))
        ]);
        setData(dash);
        setRecentOrders(ordRes.rows || []);
        setLowStockRows(
          (invRes.rows || []).filter(
            (x) => x['Stock Status'] === 'Low Stock' || x['Stock Status'] === 'Out of Stock'
          )
        );
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    },
    [call]
  );

  useEffect(() => {
    load(range);
  }, [load, range]);

  if (loading && !data) return <AdminSkeleton />;
  if (err && !data) {
    return (
      <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>
    );
  }
  if (!data) return null;

  const k = data.kpis;
  const a = data.analytics;
  const payMethods = a.paymentMethods || [];

  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <p className="mb-4 text-xs text-slate">
        Business overview · all figures are calculated from recorded orders and verified payments.
      </p>

      <RangeBar range={range} onApply={(r) => setRange(r)} />

      {err && (
        <div className="mb-4 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
          {err}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Today's sales" value={money(k.todaysSales)} />
        <KpiCard label="Total revenue" value={money(k.totalRevenue)} />
        <KpiCard label="Total orders" value={k.totalOrders} />
        <KpiCard label="Pending orders" value={k.pendingOrders} />
        <KpiCard label="Completed orders" value={k.completedOrders} />
        <KpiCard label="Cancelled orders" value={k.cancelledOrders} />
        <KpiCard label="Total products" value={k.totalProducts} />
        <KpiCard label="Total customers" value={k.totalCustomers} />
        <KpiCard
          label="Low stock variants"
          value={k.lowStockProducts}
          warn={k.lowStockProducts > 0}
        />
        <KpiCard label="Avg order value" value={money(k.averageOrderValue)} />
      </div>

      {a.isEmpty && (
        <div className="mb-4 border border-dashed border-hairline bg-white p-3 text-xs text-[#444748]">
          No sales recorded in this date range yet. Charts fill in as orders are confirmed and paid.
        </div>
      )}

      <AdminCharts analytics={a} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-hairline bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base">Recent orders</h3>
            <Link to="/orders" className="text-[11px] font-semibold uppercase tracking-wider underline">
              View all
            </Link>
          </div>
          <DataTable
            max={8}
            empty="No orders recorded yet."
            rows={recentOrders}
            cols={[
              { h: 'Order', f: (r) => <b>{r['Order ID']}</b> },
              { h: 'Customer', k: 'Customer Name' },
              { h: 'Total', f: (r) => money(r['Final Total']) },
              { h: 'Payment', f: (r) => <StatusPill status={r['Payment Status']} /> },
              { h: 'Status', f: (r) => <StatusPill status={r['Order Status']} /> }
            ]}
          />
        </div>

        <div className="space-y-4">
          <div className="border border-hairline bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base">Inventory alerts</h3>
              <Link to="/inventory" className="text-[11px] font-semibold uppercase tracking-wider underline">
                Manage stock
              </Link>
            </div>
            <DataTable
              max={6}
              empty="All variants are sufficiently stocked."
              rows={lowStockRows}
              cols={[
                { h: 'Product', k: 'Product Name' },
                { h: 'Variant', f: (r) => `${r['Size']} / ${r['Color']}` },
                { h: 'Avail', k: 'Available Stock' },
                {
                  h: 'Alert',
                  f: (r) => (
                    <StatusPill
                      status={r['Stock Status'] === 'Low Stock' ? 'Pending' : 'Cancelled'}
                    />
                  )
                }
              ]}
            />
          </div>

          <div className="border border-hairline bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base">Payment summary (selected range)</h3>
              <Link to="/payments" className="text-[11px] font-semibold uppercase tracking-wider underline">
                Payments
              </Link>
            </div>
            <DataTable
              max={10}
              empty="No payments in this range."
              rows={payMethods}
              cols={[
                { h: 'Method', k: 'method' },
                { h: 'Orders', k: 'orders' },
                { h: 'Verified / Paid', f: (r) => money(r.paidAmount) }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsPage({ call, list }) {
  const [range, setRange] = useState({ from: colomboDaysAgo(29), to: colomboToday() });
  const [category, setCategory] = useState('');
  const [productId, setProductId] = useState('');
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      list('Categories').catch(() => ({ rows: [] })),
      list('Products').catch(() => ({ rows: [] }))
    ]).then(([c, p]) => {
      setCats(c.rows || []);
      setProds(p.rows || []);
    });
  }, [list]);

  const load = useCallback(
    async (r, cat, pid) => {
      setLoading(true);
      setErr('');
      try {
        setA(await call('analytics', { ...r, category: cat, productId: pid }));
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    },
    [call]
  );

  useEffect(() => {
    load(range, category, productId);
  }, [load, range, category, productId]);

  const exportCsv = () => {
    if (!a) return;
    const rows = [];
    Object.keys(a.summary).forEach((k) => rows.push(['Summary', k, a.summary[k]]));
    [
      ['Top product', a.topProducts],
      ['Category', a.byCategory],
      ['Size', a.bySize],
      ['Colour', a.byColor]
    ].forEach(([grp, listItems]) => {
      (listItems || []).forEach((x) =>
        rows.push([grp, x.label, `${x.quantity} units / ${x.revenue}`])
      );
    });
    (a.daily || []).forEach((x) =>
      rows.push([
        'Daily',
        x.date,
        `orders ${x.orders} · gross ${x.gross} · discounts ${x.discounts} · net ${x.net}`
      ])
    );
    downloadFile(
      `blackbrand-analytics-${a.range.from}_${a.range.to}.csv`,
      toCsv(['Section', 'Name', 'Value'], rows)
    );
  };

  if (loading && !a) return <AdminSkeleton />;
  if (err && !a) {
    return (
      <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>
    );
  }
  if (!a) return null;

  const s = a.summary;
  const miniCols = [
    { h: 'Item', k: 'label' },
    { h: 'Units', k: 'quantity' },
    { h: 'Revenue', f: (r) => money(r.revenue) }
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Sales Analytics</h1>
      <p className="mb-4 text-xs text-slate">
        Revenue counts only orders whose payment is verified/recorded as paid. Category/product filters apply to sales figures.
      </p>

      <RangeBar
        range={range}
        onApply={(r) => setRange(r)}
        extra={
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 min-w-[130px] border border-[#cfcfcd] bg-white px-2 text-xs"
              >
                <option value="">All</option>
                {cats.map((c) => (
                  <option key={c['Category ID']}>{c['Category Name']}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">
                Product
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-9 min-w-[130px] border border-[#cfcfcd] bg-white px-2 text-xs"
              >
                <option value="">All</option>
                {prods.map((p) => (
                  <option key={p['Product ID']} value={p['Product ID']}>
                    {p['Product Name']}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1" />
            <AdminBtn type="button" variant="outline" onClick={exportCsv}>
              Export CSV
            </AdminBtn>
            <AdminBtn type="button" variant="outline" onClick={() => window.print()}>
              Export PDF
            </AdminBtn>
          </>
        }
      />

      {err && (
        <div className="mb-4 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
          {err}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Total revenue (net)" value={money(s.netRevenue)} />
        <KpiCard label="Gross revenue" value={money(s.grossRevenue)} />
        <KpiCard label="Total orders" value={s.totalOrders} />
        <KpiCard label="Completed orders" value={s.completedOrders} />
        <KpiCard label="Cancelled orders" value={s.cancelledOrders} />
        <KpiCard label="Products sold" value={s.productsSold} />
        <KpiCard label="Average order value" value={money(s.averageOrderValue)} />
        <KpiCard label="Refunds" value={money(s.refunds)} />
        <KpiCard label="Discounts" value={money(s.totalDiscounts)} />
        <KpiCard
          label="Pending payments"
          value={`${s.pendingPayments} · ${money(s.pendingPaymentsAmount)}`}
        />
        <KpiCard label="New / returning" value={`${s.newCustomers} / ${s.returningCustomers}`} />
      </div>

      {a.isEmpty && (
        <div className="mb-4 border border-dashed border-hairline bg-white p-3 text-xs text-[#444748]">
          No sales records in this range.
        </div>
      )}

      <AdminCharts analytics={a} />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border border-hairline bg-white p-4">
          <h3 className="mb-2 font-display text-base">Sales by size</h3>
          <DataTable cols={miniCols} rows={a.bySize || []} empty="No data in this range" />
        </div>
        <div className="border border-hairline bg-white p-4">
          <h3 className="mb-2 font-display text-base">Sales by colour</h3>
          <DataTable cols={miniCols} rows={a.byColor || []} empty="No data in this range" />
        </div>
      </div>

      <div className="border border-hairline bg-white p-4">
        <h3 className="mb-2 font-display text-base">Top selling products</h3>
        <DataTable cols={miniCols} rows={a.topProducts || []} empty="No data in this range" />
      </div>
    </div>
  );
}
