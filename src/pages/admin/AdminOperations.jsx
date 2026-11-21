import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { colomboDaysAgo, colomboToday, downloadFile, money, toCsv } from '../../utils/format';
import { Spinner } from '../../components/ui/Primitives';
import { AdminBtn, DataTable, FormModal, KpiCard, RangeBar, StatusPill } from '../../components/admin/AdminPrimitives';
import { EntityCrudPage } from './AdminEntities';

export function SimpleListPage({ sheet, title, subtitle, cols, list, exportSheet, extraAction = null, modalConfig = null }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await list(sheet);
      setRows(res.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [list, sheet]);

  useEffect(() => { load(); }, [load]);

  if (loading && !rows.length) return <Spinner className="my-20" />;
  if (err && !rows.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;

  const term = appliedQ.trim().toLowerCase();
  const filtered = term
    ? rows.filter((r) => Object.keys(r).some((k) => String(r[k] || '').toLowerCase().includes(term)))
    : rows;

  const finalCols = typeof cols === 'function' ? cols(load) : cols;

  return (
    <div>
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mb-4 text-xs text-slate">{subtitle}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedQ(q);
        }}
        className="mb-4 flex flex-wrap items-end gap-2 border border-hairline bg-white p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 min-w-[160px] border border-[#cfcfcd] px-2.5 text-xs"
          />
        </div>
        <AdminBtn type="submit" variant="outline">Filter</AdminBtn>
        <div className="flex-1" />
        {extraAction && extraAction(load)}
        <AdminBtn type="button" variant="outline" onClick={() => exportSheet(sheet)}>Export CSV</AdminBtn>
      </form>

      <DataTable cols={finalCols} rows={filtered} empty="No records yet." />
      {modalConfig && modalConfig(load)}
    </div>
  );
}

export function PaymentsPage({ call, list, exportSheet, toast }) {
  const [syncing, setSyncing] = useState(false);

  return (
    <SimpleListPage
      sheet="Payments"
      title="Payments"
      subtitle="Payment records. Online payments show “Verified” only after server-side confirmation from the provider."
      list={list}
      exportSheet={exportSheet}
      extraAction={(reload) => (
        <AdminBtn
          type="button"
          variant="gold"
          disabled={syncing}
          title="Make the Orders tab match the Payments tab"
          onClick={async () => {
            setSyncing(true);
            try {
              const sr = await call('syncPayments');
              toast(sr.corrected ? `${sr.corrected} order(s) updated to match Payments.` : 'Already in sync.');
              reload();
            } catch (e) {
              toast(e.message, true);
            } finally {
              setSyncing(false);
            }
          }}
        >
          {syncing ? 'Syncing…' : 'Sync payment status'}
        </AdminBtn>
      )}
      cols={[
        { h: 'Payment', k: 'Payment ID' },
        { h: 'Order', k: 'Order ID' },
        { h: 'Customer', k: 'Customer Name' },
        { h: 'Method', k: 'Payment Method' },
        { h: 'Provider', k: 'Payment Provider' },
        { h: 'Reference', k: 'Transaction Reference' },
        { h: 'Amount', f: (r) => money(r['Payment Amount']) },
        { h: 'Status', f: (r) => <StatusPill status={r['Payment Status']} /> },
        { h: 'Verification', k: 'Verification Status' },
        { h: 'Refunded', f: (r) => money(r['Refund Amount']) },
        { h: 'Date', k: 'Payment Date' }
      ]}
    />
  );
}

export function CustomersPage({ call, list, exportSheet, toast }) {
  const [editTarget, setEditTarget] = useState(null);

  return (
    <SimpleListPage
      sheet="Customers"
      title="Customers"
      subtitle="Registered customer profiles (no passwords are stored)."
      list={list}
      exportSheet={exportSheet}
      cols={() => [
        { h: 'ID', k: 'Customer ID' },
        { h: 'Name', k: 'Full Name' },
        { h: 'Email', k: 'Email' },
        { h: 'Phone', k: 'Phone Number' },
        { h: 'City', k: 'City' },
        { h: 'District', k: 'District' },
        { h: 'Status', f: (r) => <StatusPill status={r['Account Status']} /> },
        { h: 'Joined', k: 'Registration Date' },
        {
          h: '',
          f: (r) => (
            <AdminBtn
              size="sm"
              variant="outline"
              onClick={() => setEditTarget({ id: r['Customer ID'], status: r['Account Status'] })}
            >
              Status
            </AdminBtn>
          )
        }
      ]}
      modalConfig={(reload) => (
        <FormModal
          open={!!editTarget}
          title="Customer status"
          fields={[{ n: 'status', l: 'Status', t: 'select', o: ['Active', 'Suspended', 'Closed'] }]}
          initialValues={editTarget ? { status: editTarget.status } : {}}
          onClose={() => setEditTarget(null)}
          onSubmit={async (o) => {
            await call('updateCustomerStatus', { customerId: editTarget.id, status: o.status });
            toast('Updated');
            reload();
          }}
        />
      )}
    />
  );
}

export function ReviewsPage({ call, list, exportSheet, toast }) {
  const [busyId, setBusyId] = useState('');

  return (
    <SimpleListPage
      sheet="Reviews"
      title="Reviews"
      subtitle="Approve reviews before they appear on product pages."
      list={list}
      exportSheet={exportSheet}
      cols={(reload) => [
        { h: 'Product', k: 'Product ID' },
        { h: 'Customer', k: 'Customer Name' },
        { h: 'Rating', f: (r) => '★'.repeat(Number(r['Rating'])) },
        { h: 'Review', k: 'Review Text' },
        { h: 'Verified', k: 'Verification Status' },
        { h: 'Status', f: (r) => <StatusPill status={r['Review Status']} /> },
        {
          h: '',
          f: (r) => {
            const rid = r['Review ID'];
            const isBusy = busyId === rid;
            return (
              <div className="flex gap-1">
                <AdminBtn
                  size="sm"
                  variant="gold"
                  disabled={isBusy}
                  onClick={async () => {
                    setBusyId(rid);
                    try {
                      await call('setReviewStatus', { reviewId: rid, status: 'Approved' });
                      toast('Review approved');
                      reload();
                    } catch (e) {
                      toast(e.message, true);
                    } finally {
                      setBusyId('');
                    }
                  }}
                >
                  Approve
                </AdminBtn>
                <AdminBtn
                  size="sm"
                  variant="danger"
                  disabled={isBusy}
                  onClick={async () => {
                    setBusyId(rid);
                    try {
                      await call('setReviewStatus', { reviewId: rid, status: 'Rejected' });
                      toast('Review rejected');
                      reload();
                    } catch (e) {
                      toast(e.message, true);
                    } finally {
                      setBusyId('');
                    }
                  }}
                >
                  Reject
                </AdminBtn>
              </div>
            );
          }
        }
      ]}
    />
  );
}

export function MessagesPage({ call, list, exportSheet, toast }) {
  const [target, setTarget] = useState(null);

  return (
    <SimpleListPage
      sheet="Customers Messages"
      title="Customer Messages"
      subtitle="Messages from the contact form."
      list={list}
      exportSheet={exportSheet}
      cols={() => [
        { h: 'Date', k: 'Timestamp' },
        { h: 'Name', k: 'Customer Name' },
        { h: 'Email', k: 'Email' },
        { h: 'Phone', k: 'Phone Number' },
        { h: 'Subject', k: 'Subject' },
        { h: 'Message', k: 'Message' },
        { h: 'Status', k: 'Message Status' },
        { h: 'Assigned', k: 'Assigned Staff' },
        {
          h: '',
          f: (r) => (
            <AdminBtn
              size="sm"
              variant="outline"
              onClick={() =>
                setTarget({
                  id: r['Message ID'],
                  status: r['Message Status'],
                  assignedStaff: r['Assigned Staff']
                })
              }
            >
              Update
            </AdminBtn>
          )
        }
      ]}
      modalConfig={(reload) => (
        <FormModal
          open={!!target}
          title="Update message"
          fields={[
            { n: 'status', l: 'Status', t: 'select', o: ['New', 'In Progress', 'Resolved', 'Closed'] },
            { n: 'assignedStaff', l: 'Assigned to' }
          ]}
          initialValues={target || {}}
          onClose={() => setTarget(null)}
          onSubmit={async (o) => {
            await call('updateMessage', {
              messageId: target.id,
              status: o.status,
              assignedStaff: o.assignedStaff
            });
            toast('Updated');
            reload();
          }}
        />
      )}
    />
  );
}

export function ActivityPage({ list, exportSheet }) {
  return (
    <SimpleListPage
      sheet="Admin Activity"
      title="Activity Logs"
      subtitle="Every admin action is recorded here."
      list={list}
      exportSheet={exportSheet}
      cols={[
        { h: 'Time', k: 'Timestamp' },
        { h: 'Admin', k: 'Admin Name' },
        { h: 'Action', k: 'Action' },
        { h: 'Module', k: 'Module' },
        { h: 'Record', k: 'Record ID' },
        { h: 'Description', k: 'Description' },
        {
          h: 'Status',
          f: (r) => <StatusPill status={r['Status'] === 'Success' ? 'Delivered' : 'Failed'} />
        }
      ]}
    />
  );
}

export function MarketingPage({ list, exportSheet }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    list('Newsletter')
      .then((r) => setSubs(r.rows || []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [list]);

  if (loading && !subs.length) return <Spinner className="my-20" />;
  if (err && !subs.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;

  const activeCount = subs.filter((s) => s['Subscription Status'] === 'Subscribed').length;

  return (
    <div>
      <h1 className="font-display text-3xl">Marketing</h1>
      <p className="mb-4 text-xs text-slate">Newsletter audience and promotions.</p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <KpiCard label="Subscribers" value={activeCount} />
        <KpiCard label="Unsubscribed" value={subs.length - activeCount} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/banners" className="inline-flex h-9 items-center bg-charcoal px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
          Homepage banners
        </Link>
        <Link to="/coupons" className="inline-flex h-9 items-center border border-[#bdbdbb] bg-white px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
          Coupons
        </Link>
        <AdminBtn variant="outline" onClick={() => exportSheet('Newsletter')}>
          Export subscribers CSV
        </AdminBtn>
      </div>

      <DataTable
        empty="No subscribers yet."
        rows={subs}
        cols={[
          { h: 'Email', k: 'Email' },
          { h: 'Status', f: (r) => <StatusPill status={r['Subscription Status']} /> },
          { h: 'Since', k: 'Subscription Date' }
        ]}
      />
    </div>
  );
}

const EXPORT_SHEETS = [
  'Orders', 'Order Items', 'Payments', 'Sales', 'Inventory', 'Stock History',
  'Customers', 'Products', 'Product Variants', 'Coupons', 'Reviews',
  'Customers Messages', 'Newsletter', 'Analytics', 'Admin Activity'
];

export function ReportsPage({ call, exportSheet, toast }) {
  const [range, setRange] = useState({ from: colomboDaysAgo(29), to: colomboToday() });
  const [sheet, setSheet] = useState('Orders');
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      setReport(await call('analytics', range));
    } catch (e) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const exportReportCsv = () => {
    if (!report) return;
    const rows = [];
    Object.keys(report.summary).forEach((k) => rows.push(['Summary', k, report.summary[k]]));
    [
      ['Top product', report.topProducts],
      ['Category', report.byCategory],
      ['Size', report.bySize],
      ['Colour', report.byColor]
    ].forEach(([grp, items]) => {
      (items || []).forEach((x) => rows.push([grp, x.label, `${x.quantity} units / ${x.revenue}`]));
    });
    (report.daily || []).forEach((x) =>
      rows.push(['Daily', x.date, `orders ${x.orders} · gross ${x.gross} · discounts ${x.discounts} · net ${x.net}`])
    );
    downloadFile(
      `blackbrand-analytics-${report.range.from}_${report.range.to}.csv`,
      toCsv(['Section', 'Name', 'Value'], rows)
    );
  };

  const miniCols = [
    { h: 'Item', k: 'label' },
    { h: 'Units', k: 'quantity' },
    { h: 'Revenue', f: (r) => money(r.revenue) }
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Reports</h1>
      <p className="mb-4 text-xs text-slate">
        Export recorded data. PDF export uses your browser’s “Save as PDF” print dialog.
      </p>

      <RangeBar range={range} onApply={(r) => setRange(r)} />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border border-hairline bg-white p-5">
          <h3 className="font-display text-base">Sales report</h3>
          <p className="mb-3 mt-1 text-xs text-slate">Summary for the selected date range.</p>
          <AdminBtn disabled={busy} onClick={generate}>
            {busy ? 'Generating…' : 'Generate sales report'}
          </AdminBtn>
        </div>

        <div className="border border-hairline bg-white p-5">
          <h3 className="mb-2 font-display text-base">Data export (CSV)</h3>
          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">Sheet</label>
            <select
              value={sheet}
              onChange={(e) => setSheet(e.target.value)}
              className="h-10 w-full border border-[#cfcfcd] bg-white px-2.5 text-xs"
            >
              {EXPORT_SHEETS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <AdminBtn onClick={() => exportSheet(sheet)}>Download CSV</AdminBtn>
        </div>
      </div>

      {report && (
        <div className="space-y-4 border border-hairline bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg">
              Sales report · {report.range.from} → {report.range.to}
            </h3>
            <div className="flex gap-2">
              <AdminBtn size="sm" variant="outline" onClick={exportReportCsv}>Export CSV</AdminBtn>
              <AdminBtn size="sm" variant="outline" onClick={() => window.print()}>Export PDF</AdminBtn>
            </div>
          </div>

          {report.isEmpty && <p className="text-xs text-slate">No sales recorded in this range.</p>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Gross revenue" value={money(report.summary.grossRevenue)} />
            <KpiCard label="Discounts" value={money(report.summary.totalDiscounts)} />
            <KpiCard label="Refunds" value={money(report.summary.refunds)} />
            <KpiCard label="Net revenue" value={money(report.summary.netRevenue)} />
            <KpiCard label="Orders" value={report.summary.totalOrders} />
            <KpiCard label="Units sold" value={report.summary.productsSold} />
            <KpiCard label="Avg order value" value={money(report.summary.averageOrderValue)} />
          </div>

          <div>
            <h4 className="mb-2 font-display text-sm">Top products</h4>
            <DataTable cols={miniCols} rows={report.topProducts || []} empty="No data in this range" />
          </div>
          <div>
            <h4 className="mb-2 font-display text-sm">By category</h4>
            <DataTable cols={miniCols} rows={report.byCategory || []} empty="No data in this range" />
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffPage({ call, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [newModal, setNewModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [pwTarget, setPwTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      setRows((await call('listStaff')) || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  if (loading && !rows.length) return <Spinner className="my-20" />;
  if (err && !rows.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;

  return (
    <div>
      <h1 className="font-display text-3xl">Staff Management</h1>
      <p className="mb-4 text-xs text-slate">
        Owner only. Roles: owner (everything), manager (catalog, orders, reports), staff (orders, inventory, messages).
      </p>

      <div className="mb-4 flex justify-end border border-hairline bg-white p-3">
        <AdminBtn onClick={() => setNewModal(true)}>+ Add staff</AdminBtn>
      </div>

      <DataTable
        empty="No staff."
        rows={rows}
        cols={[
          { h: 'Name', k: 'name' },
          { h: 'Email', k: 'email' },
          { h: 'Role', k: 'role' },
          { h: 'Status', f: (r) => <StatusPill status={r.status === 'Active' ? 'Delivered' : 'Cancelled'} /> },
          { h: '2FA', f: (r) => (r.totpEnabled ? 'On' : 'Not set') },
          {
            h: '',
            f: (r) => (
              <div className="flex gap-1">
                <AdminBtn size="sm" variant="outline" onClick={() => setEditTarget(r)}>Edit</AdminBtn>
                <AdminBtn size="sm" variant="outline" onClick={() => setPwTarget(r)}>Reset password</AdminBtn>
              </div>
            )
          }
        ]}
      />

      <FormModal
        open={newModal}
        title="Add staff"
        fields={[
          { n: 'name', l: 'Name', req: 1 },
          { n: 'email', l: 'Email', t: 'email', req: 1 },
          { n: 'role', l: 'Role', t: 'select', o: ['staff', 'manager', 'owner'] },
          { n: 'password', l: 'Temporary password (12+ chars)', t: 'password', minLength: 12, req: 1 }
        ]}
        onClose={() => setNewModal(false)}
        onSubmit={async (o) => {
          if (String(o.password || '').length < 12) {
            throw new Error('Password must be at least 12 characters.');
          }
          await call('createStaff', o);
          toast('Staff added — they must set up 2FA at first login.');
          load();
        }}
      />

      <FormModal
        open={!!editTarget}
        title="Edit staff"
        fields={[
          { n: 'name', l: 'Name', req: 1 },
          { n: 'role', l: 'Role', t: 'select', o: ['staff', 'manager', 'owner'] },
          { n: 'status', l: 'Status', t: 'select', o: ['Active', 'Disabled'] }
        ]}
        initialValues={editTarget ? { name: editTarget.name, role: editTarget.role, status: editTarget.status } : {}}
        onClose={() => setEditTarget(null)}
        onSubmit={async (o) => {
          await call('updateStaff', { id: editTarget.id, name: o.name, role: o.role, status: o.status });
          toast('Updated');
          load();
        }}
      />

      <FormModal
        open={!!pwTarget}
        title="Reset staff password"
        fields={[
          { n: 'password', l: 'New password (12+ chars)', t: 'password', minLength: 12, req: 1 },
          { n: 'reset2fa', l: 'Also reset 2FA?', t: 'select', o: [{ v: '', l: 'No' }, { v: 'true', l: 'Yes' }] }
        ]}
        onClose={() => setPwTarget(null)}
        onSubmit={async (o) => {
          if (String(o.password || '').length < 12) {
            throw new Error('Password must be at least 12 characters.');
          }
          await call('resetStaffPassword', { id: pwTarget.id, password: o.password, reset2fa: o.reset2fa });
          toast('Password reset');
          load();
        }}
      />
    </div>
  );
}

export function SettingsPage({ call, list, staff, onTokenUpdated, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editSet, setEditSet] = useState(null);
  const [chpwOpen, setChpwOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      setRows((await list('Store Settings')).rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => { load(); }, [load]);

  if (loading && !rows.length) return <Spinner className="my-20" />;
  if (err && !rows.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;

  const bankSet = rows.some(
    (r) => r['Setting Name'] === 'public.bank_transfer_instructions' && String(r['Setting Value']).trim()
  );
  const isMultilineSetting =
    editSet?.values?.name === 'public.bank_transfer_instructions' ||
    String(editSet?.values?.value || '').includes('\n');

  return (
    <div>
      <h1 className="font-display text-3xl">Store Settings</h1>
      {!bankSet && (
        <div className="my-3 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
          <b>Bank Transfer is hidden from customers.</b> Add your bank account details to{' '}
          <code>public.bank_transfer_instructions</code> below to offer it at checkout.
        </div>
      )}
      <p className="mb-4 text-xs text-slate">
        Settings starting with <code>public.</code> are exposed to the storefront. Never store secrets here.
      </p>

      <div className="mb-4 flex justify-end border border-hairline bg-white p-3">
        <AdminBtn onClick={() => setEditSet({ isNew: true, values: {} })}>+ Add setting</AdminBtn>
      </div>

      <DataTable
        empty="No settings."
        rows={rows}
        cols={[
          { h: 'Setting', k: 'Setting Name' },
          {
            h: 'Value',
            f: (r) => <span className="whitespace-pre-line">{String(r['Setting Value'] ?? '')}</span>
          },
          { h: 'Description', k: 'Description' },
          {
            h: '',
            f: (r) => (
              <AdminBtn
                size="sm"
                variant="outline"
                onClick={() =>
                  setEditSet({
                    isNew: false,
                    values: {
                      name: r['Setting Name'],
                      value: r['Setting Value'],
                      description: r['Description']
                    }
                  })
                }
              >
                Edit
              </AdminBtn>
            )
          }
        ]}
      />

      <h2 className="mb-2 mt-7 font-display text-2xl">Delivery rules</h2>
      <EntityCrudPage entityKey="shipping" call={call} list={list} toast={toast} embedded />

      <div className="mt-6 border border-hairline bg-white p-5">
        <h3 className="font-display text-base">My account security</h3>
        <p className="my-2 text-xs text-slate">
          2-step verification: {staff.totpEnabled === false ? 'Not enabled' : 'Enabled'}
        </p>
        <AdminBtn variant="outline" onClick={() => setChpwOpen(true)}>Change my password</AdminBtn>
      </div>

      <FormModal
        open={!!editSet}
        title={editSet?.isNew ? 'Add setting' : 'Edit setting'}
        fields={[
          { n: 'name', l: 'Name', req: 1, readonly: !editSet?.isNew },
          {
            n: 'value',
            l: 'Value',
            t: isMultilineSetting || editSet?.isNew ? 'textarea' : 'text'
          },
          { n: 'description', l: 'Description' }
        ]}
        initialValues={editSet?.values || {}}
        onClose={() => setEditSet(null)}
        onSubmit={async (o) => {
          await call('saveSetting', o);
          const check = await list('Store Settings');
          const saved = (check.rows || []).some(
            (r) => r['Setting Name'] === o.name && String(r['Setting Value']) === String(o.value)
          );
          if (!saved) {
            throw new Error(
              'Server accepted the setting, but the value was not found after reloading. Check your Apps Script deployment and the connected Google Sheet.'
            );
          }
          toast('Saved and verified');
          load();
        }}
      />

      <FormModal
        open={chpwOpen}
        title="Change password"
        fields={[
          { n: 'currentPassword', l: 'Current password', t: 'password', req: 1 },
          { n: 'newPassword', l: 'New password (12+ chars)', t: 'password', minLength: 12, req: 1 }
        ]}
        onClose={() => setChpwOpen(false)}
        onSubmit={async (o) => {
          if (String(o.newPassword || '').length < 12) {
            throw new Error('New password must be at least 12 characters.');
          }
          const s = await call('adminChangePassword', o);
          onTokenUpdated(s);
          toast('Password changed');
        }}
      />
    </div>
  );
}
