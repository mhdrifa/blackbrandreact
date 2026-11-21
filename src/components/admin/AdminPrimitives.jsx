import React, { useEffect, useRef, useState } from 'react';
import { colomboDaysAgo, colomboToday } from '../../utils/format';
import { Modal, StatusBadge } from '../ui/Primitives';

export function AdminBtn({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-semibold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-50 border';
  const sizes = size === 'sm' ? 'h-7 px-2.5 text-[10px]' : 'h-9 px-3.5 text-[11px]';
  const variants = {
    primary: 'bg-charcoal text-white border-charcoal hover:bg-black',
    outline: 'bg-white text-obsidian border-[#bdbdbb] hover:bg-ivory',
    gold: 'bg-champagne-soft text-[#261900] border-champagne-soft hover:bg-champagne',
    danger: 'bg-white text-crimson border-[#e4b1ad] hover:bg-[#fff5f5]'
  };
  return (
    <button className={`${base} ${sizes} ${variants[variant] || variants.primary} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function KpiCard({ label, value, warn = false }) {
  return (
    <div className="border border-hairline bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${warn ? 'text-crimson' : 'text-obsidian'}`}>
        {value}
      </div>
    </div>
  );
}

export function RangeBar({ range, onApply, extra = null }) {
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [quick, setQuick] = useState('');
  const [err, setErr] = useState('');

  const handleQuick = (val) => {
    setQuick(val);
    if (val === 'm') {
      setFrom(`${colomboToday().slice(0, 8)}01`);
      setTo(colomboToday());
    } else if (val) {
      setFrom(colomboDaysAgo(Number(val)));
      setTo(colomboToday());
    }
  };

  const apply = () => {
    if (!from || !to || from > to) {
      setErr('Choose a valid date range.');
      return;
    }
    setErr('');
    onApply({ from, to });
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-end gap-2.5 border border-hairline bg-white p-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setQuick(''); }}
            className="h-9 min-w-[130px] border border-[#cfcfcd] bg-white px-2 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setQuick(''); }}
            className="h-9 min-w-[130px] border border-[#cfcfcd] bg-white px-2 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Quick</label>
          <select
            value={quick}
            onChange={(e) => handleQuick(e.target.value)}
            className="h-9 min-w-[130px] border border-[#cfcfcd] bg-white px-2 text-xs"
          >
            <option value="">Custom</option>
            <option value="6">Last 7 days</option>
            <option value="29">Last 30 days</option>
            <option value="89">Last 90 days</option>
            <option value="m">This month</option>
          </select>
        </div>
        {extra}
        <AdminBtn type="button" onClick={apply}>Apply</AdminBtn>
      </div>
      {err && <div className="mt-2 text-xs text-crimson">{err}</div>}
    </div>
  );
}

export function DataTable({ cols, rows, empty = 'No records found.', max = 300 }) {
  if (!rows.length) {
    return (
      <div className="border border-hairline bg-white px-4 py-12 text-center text-xs text-slate">
        {empty}
      </div>
    );
  }
  const shown = rows.slice(0, max);

  return (
    <div>
      <div className="max-h-[70vh] overflow-auto border border-hairline bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th
                  key={i}
                  className="sticky top-0 z-10 whitespace-nowrap border-b border-hairline bg-[#fafaf8] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate"
                >
                  {c.h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efefed]">
            {shown.map((r, ri) => (
              <tr key={ri} className="transition-colors hover:bg-[#fcfbf7]">
                {cols.map((c, ci) => (
                  <td key={ci} className="px-3 py-2.5 align-top">
                    {c.f ? c.f(r) : String(r[c.k] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="my-2 text-xs text-slate">
        {rows.length > max
          ? `Showing first ${max} of ${rows.length}. Narrow the filters or export CSV.`
          : `${rows.length} record${rows.length === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  return <StatusBadge status={status} />;
}

export function FormModal({ open, title, fields, initialValues = {}, submitLabel = 'Save', onClose, onSubmit }) {
  const [vals, setVals] = useState(initialValues);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const next = {};
      fields.forEach((f) => {
        if (initialValues[f.n] !== undefined) next[f.n] = initialValues[f.n];
        else if (f.t === 'select' && f.o?.[0] && !f.blank) {
          next[f.n] = typeof f.o[0] === 'object' ? f.o[0].v : f.o[0];
        } else {
          next[f.n] = '';
        }
      });
      setVals(next);
      setErr('');
      setBusy(false);
    }
    wasOpenRef.current = open;
  }, [open, fields, initialValues]);

  const toggleProduct = (name, pid) => {
    const cur = String(vals[name] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = cur.includes(pid);
    const updated = exists ? cur.filter((x) => x !== pid) : [...cur, pid];
    setVals((prev) => ({ ...prev, [name]: updated.join(',') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await onSubmit(vals);
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <h3 className="mb-4 font-display text-xl">{title}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((f) => {
          const val = vals[f.n] ?? '';
          return (
            <div key={f.n}>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                {f.l}{f.req ? ' *' : ''}
              </label>

              {f.t === 'select' ? (
                <select
                  required={!!f.req}
                  value={val}
                  onChange={(e) => setVals((s) => ({ ...s, [f.n]: e.target.value }))}
                  className="h-10 w-full border border-[#cfcfcd] bg-white px-2.5 text-xs"
                >
                  {f.blank && <option value="" />}
                  {(f.o || []).map((o) => {
                    const ov = typeof o === 'object' ? o.v : o;
                    const ol = typeof o === 'object' ? o.l : o;
                    return <option key={String(ov)} value={ov}>{ol}</option>;
                  })}
                </select>
              ) : f.t === 'textarea' ? (
                <textarea
                  required={!!f.req}
                  value={val}
                  onChange={(e) => setVals((s) => ({ ...s, [f.n]: e.target.value }))}
                  className="h-28 w-full border border-[#cfcfcd] bg-white p-2.5 text-xs"
                />
              ) : f.t === 'products' ? (
                <div className="max-h-44 overflow-auto border border-[#cfcfcd] bg-white p-2">
                  {(f.o || []).length ? (
                    f.o.map((p) => {
                      const sel = String(val).split(',').map((s) => s.trim());
                      return (
                        <label key={p.v} className="flex cursor-pointer items-center gap-2 py-1 text-xs">
                          <input
                            type="checkbox"
                            checked={sel.includes(p.v)}
                            onChange={() => toggleProduct(f.n, p.v)}
                          />
                          <span>{p.l}</span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate">No products yet</span>
                  )}
                </div>
              ) : (
                <input
                  type={f.t || 'text'}
                  required={!!f.req}
                  readOnly={!!f.readonly}
                  step={f.step}
                  min={f.min}
                  minLength={f.minLength}
                  value={val}
                  onChange={(e) => setVals((s) => ({ ...s, [f.n]: e.target.value }))}
                  className={`h-10 w-full border border-[#cfcfcd] px-2.5 text-xs ${
                    f.readonly ? 'bg-[#f3f3f1] text-slate' : 'bg-white'
                  }`}
                />
              )}

              {f.help && <small className="mt-1 block text-[11px] text-slate">{f.help}</small>}
            </div>
          );
        })}

        {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-2.5 text-xs text-[#8a1a14]">{err}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <AdminBtn type="button" variant="outline" onClick={onClose}>Cancel</AdminBtn>
          <AdminBtn type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</AdminBtn>
        </div>
      </form>
    </Modal>
  );
}
