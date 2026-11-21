import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DISTRICT_PROVINCE, DISTRICTS } from '../../config/brand';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { money } from '../../utils/format';
import { EmptyState, Eyebrow, Spinner, StatusBadge } from '../../components/ui/Primitives';
import OrderSummaryBlock from '../../components/store/OrderSummaryBlock';

export default function AccountPage({ tab = 'overview' }) {
  const { orderId } = useParams();
  const { auth, authPost, clearCustomerSession } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [detailOrder, setDetailOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.user) {
      navigate('/login?next=account', { replace: true });
      return;
    }
    let alive = true;
    setLoading(true);
    setErr('');
    Promise.all([
      authPost('myProfile'),
      tab === 'overview' || tab === 'orders' ? authPost('myOrders') : Promise.resolve([]),
      tab === 'order-detail' && orderId ? authPost('myOrder', { orderId: decodeURIComponent(orderId) }) : Promise.resolve(null)
    ])
      .then(([p, o, d]) => {
        if (!alive) return;
        setProfile(p);
        setOrders(o);
        setDetailOrder(d);
      })
      .catch((e) => {
        if (!alive) return;
        if (e.code === 'UNAUTHORIZED') {
          clearCustomerSession();
          navigate('/login?next=account', { replace: true });
        } else {
          setErr(e.message);
        }
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [auth.user, tab, orderId, authPost, clearCustomerSession, navigate]);

  const title =
    tab === 'profile'
      ? 'My Profile'
      : tab === 'addresses'
        ? 'Saved Address'
        : tab === 'orders'
          ? 'My Orders'
          : tab === 'order-detail'
            ? 'Order Details'
            : profile
              ? `Welcome, ${profile.fullName.split(' ')[0]}`
              : 'My Account';

  useEffect(() => { document.title = `${title} — BLACK BRAND`; }, [title]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload =
        tab === 'addresses'
          ? {
              address: profile.address,
              city: profile.city,
              district: profile.district,
              postalCode: profile.postalCode
            }
          : { fullName: profile.fullName, phone: profile.phone };
      const updated = await authPost('updateMyProfile', payload);
      setProfile(updated);
      toast('Saved');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    try { await authPost('custLogout'); } catch { /* ignore */ }
    clearCustomerSession();
    toast('Signed out');
    navigate('/login');
  };

  const navItems = [
    ['overview', '/account', 'Dashboard'],
    ['profile', '/account/profile', 'My Profile'],
    ['orders', '/account/orders', 'My Orders'],
    ['addresses', '/account/addresses', 'Saved Address']
  ];

  const OrdersTable = ({ rows }) =>
    rows.length ? (
      <div className="overflow-x-auto border border-hairline bg-white">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-hairline bg-ivory text-[10px] uppercase tracking-[0.1em] text-slate">
              <th className="px-3 py-2.5">Order</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Total</th>
              <th className="px-3 py-2.5">Payment</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rows.map((o) => (
              <tr key={o.orderId}>
                <td className="px-3 py-2.5 font-medium">{o.orderId}</td>
                <td className="px-3 py-2.5">{String(o.orderDate).slice(0, 10)}</td>
                <td className="px-3 py-2.5">{money(o.total)}</td>
                <td className="px-3 py-2.5"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-3 py-2.5"><StatusBadge status={o.orderStatus} /></td>
                <td className="px-3 py-2.5">
                  <Link to={`/account/orders/${encodeURIComponent(o.orderId)}`} className="text-[11px] font-semibold underline">
                    VIEW
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState title="No orders yet" body="Your orders will appear here." to="/shop" label="START SHOPPING" />
    );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-12">
      <Eyebrow dot={false}>CLIENT PORTAL</Eyebrow>
      <h1 className="mb-6 mt-1 font-display text-4xl">{title}</h1>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[220px_1fr]">
        <aside className="border border-hairline bg-white">
          {navItems.map(([k, to, label]) => (
            <Link
              key={k}
              to={to}
              className={`block border-b border-hairline px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] ${
                tab === k || (tab === 'order-detail' && k === 'orders') ? 'bg-obsidian text-white' : 'hover:bg-ivory'
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={signOut}
            className="block w-full px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] hover:bg-ivory"
          >
            Sign out
          </button>
        </aside>

        <div>
          {loading ? (
            <Spinner className="my-12" />
          ) : err && !profile ? (
            <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-sm text-[#8a1a14]">{err}</div>
          ) : tab === 'overview' && profile ? (
            <div className="space-y-6">
              <div className="border border-hairline bg-white p-6">
                <h3 className="mb-2 font-display text-xl">Account</h3>
                <p className="text-sm">
                  <b>{profile.fullName}</b><br />
                  {profile.email}<br />
                  {profile.phone}
                </p>
                <p className="mt-2 text-xs text-slate">
                  Customer ID: {profile.customerId} · Status: {profile.accountStatus}
                </p>
              </div>
              <div>
                <h3 className="mb-3 font-display text-xl">RECENT ORDERS</h3>
                <OrdersTable rows={orders.slice(0, 5)} />
              </div>
            </div>
          ) : tab === 'orders' ? (
            <OrdersTable rows={orders} />
          ) : tab === 'order-detail' && detailOrder ? (
            <div className="space-y-4">
              <OrderSummaryBlock order={detailOrder} />
              <div className="border border-hairline bg-white p-6 text-sm">
                <h3 className="mb-2 font-display text-xl">Delivery address</h3>
                <p>
                  {detailOrder.customerName}<br />
                  {detailOrder.address?.line1} {detailOrder.address?.line2}<br />
                  {detailOrder.address?.city}, {detailOrder.address?.district} {detailOrder.address?.postalCode}<br />
                  {detailOrder.phone}
                </p>
              </div>
            </div>
          ) : (tab === 'profile' || tab === 'addresses') && profile ? (
            <form onSubmit={saveProfile} className="space-y-4 border border-hairline bg-white p-6">
              <div className="text-xs text-slate">
                Customer ID: {profile.customerId} · Status: {profile.accountStatus}
              </div>
              {tab === 'profile' ? (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Full name</label>
                    <input required value={profile.fullName} onChange={(e) => setProfile((s) => ({ ...s, fullName: e.target.value }))} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Email</label>
                      <input readOnly value={profile.email} className="h-11 w-full border border-[#cfcfcd] bg-ivory px-3 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Phone</label>
                      <input required value={profile.phone} onChange={(e) => setProfile((s) => ({ ...s, phone: e.target.value }))} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Address</label>
                    <input value={profile.address} onChange={(e) => setProfile((s) => ({ ...s, address: e.target.value }))} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">City</label>
                      <input value={profile.city} onChange={(e) => setProfile((s) => ({ ...s, city: e.target.value }))} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">District</label>
                      <select
                        value={profile.district}
                        onChange={(e) =>
                          setProfile((s) => ({
                            ...s,
                            district: e.target.value,
                            province: DISTRICT_PROVINCE[e.target.value] || ''
                          }))
                        }
                        className="h-11 w-full border border-[#cfcfcd] bg-white px-3 text-sm"
                      >
                        <option value="">Select</option>
                        {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Province</label>
                      <input readOnly value={profile.province || ''} className="h-11 w-full border border-[#cfcfcd] bg-ivory px-3 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Postal code</label>
                      <input value={profile.postalCode} onChange={(e) => setProfile((s) => ({ ...s, postalCode: e.target.value }))} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
                    </div>
                  </div>
                </>
              )}
              {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>}
              <button type="submit" disabled={saving} className="bg-obsidian px-7 py-3 font-display text-xs tracking-[0.1em] text-white">
                {saving ? 'SAVING…' : 'SAVE CHANGES'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
