import React, { useState } from 'react';
import { motion } from 'motion/react';
import { money } from '../../utils/format';
import { LUXURY_EASE } from '../ui/Primitives';

const PALETTE = [
  '#1c1b1b',
  '#e4c280',
  '#745b23',
  '#8a8d8d',
  '#ba1a1a',
  '#1b6b3a',
  '#4a6fa5',
  '#b08d57'
];

function ChartShell({ title, subtitle, empty, children, legend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: LUXURY_EASE }}
      className="border border-hairline bg-white p-4"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-obsidian">{title}</h3>
        {subtitle && <span className="text-[10px] text-slate">{subtitle}</span>}
      </div>
      <div className="relative h-56">
        {empty ? (
          <div className="grid h-full place-items-center text-xs text-slate">
            No data in this range
          </div>
        ) : (
          children
        )}
      </div>
      {!empty && legend && (
        <div className="mt-2.5 flex flex-wrap justify-center gap-x-4 gap-y-1">{legend}</div>
      )}
    </motion.div>
  );
}

function SvgLineChart({ labels, series, formatVal = money }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const w = 440;
  const h = 190;
  const padL = 52;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const cw = w - padL - padR;
  const ch = h - padT - padB;

  const allVals = series.flatMap((s) => s.data);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(1, ...allVals);
  const span = Math.max(1, maxVal - minVal);
  const count = Math.max(1, labels.length);
  const xAt = (i) => padL + (count === 1 ? cw / 2 : (i / (count - 1)) * cw);
  const yAt = (v) => padT + ch - ((v - minVal) / span) * ch;
  const zeroY = yAt(0);

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible">
        {[0, 0.5, 1].map((t) => {
          const val = minVal + span * t;
          const y = padT + ch * (1 - t);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#efefed" strokeWidth="1" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#747878">
                {Math.round(val).toLocaleString()}
              </text>
            </g>
          );
        })}

        {minVal < 0 && (
          <line x1={padL} y1={zeroY} x2={w - padR} y2={zeroY} stroke="#d0cec8" strokeDasharray="2 2" />
        )}

        {series.map((s) => {
          if (!s.data.length) return null;
          const pts = s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
          const area = `${xAt(0)},${zeroY} ${pts} ${xAt(s.data.length - 1)},${zeroY}`;
          return (
            <g key={s.label}>
              {s.fill && s.data.length > 1 && (
                <polygon points={area} fill={s.color} fillOpacity="0.08" />
              )}
              <polyline fill="none" stroke={s.color} strokeWidth="2" points={pts} />
              {s.data.length === 1 && (
                <circle cx={xAt(0)} cy={yAt(s.data[0])} r="3.5" fill={s.color} />
              )}
            </g>
          );
        })}

        {labels.map((lbl, i) => {
          const step = Math.max(1, Math.ceil(labels.length / 6));
          return (
            <g key={i}>
              {i % step === 0 && (
                <text x={xAt(i)} y={h - 6} textAnchor="middle" fontSize="9" fill="#747878">
                  {lbl}
                </text>
              )}
              <rect
                x={xAt(i) - cw / count / 2}
                y={padT}
                width={Math.max(8, cw / count)}
                height={ch}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            </g>
          );
        })}

        {hoverIdx !== null && (
          <line
            x1={xAt(hoverIdx)}
            y1={padT}
            x2={xAt(hoverIdx)}
            y2={padT + ch}
            stroke="#c8a96a"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hoverIdx !== null && (
        <div className="pointer-events-none absolute right-2 top-1 border border-hairline bg-white/95 px-2.5 py-1.5 text-[10px] shadow">
          <div className="font-semibold">{labels[hoverIdx]}</div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span>
                {s.label}: {formatVal(s.data[hoverIdx])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SvgBarChart({ labels, data, color, horizontal = false }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (horizontal) {
    const maxVal = Math.max(1, ...data);
    return (
      <div className="flex h-full flex-col justify-center gap-1.5 overflow-y-auto pr-1 text-[10px]">
        {labels.slice(0, 8).map((lbl, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr_76px] items-center gap-2">
            <span className="truncate text-obsidian" title={lbl}>
              {lbl}
            </span>
            <div className="h-3.5 bg-[#f3f3f1]">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.max(2, (Math.max(0, data[i]) / maxVal) * 100)}%`,
                  background: color
                }}
              />
            </div>
            <span className="text-right font-medium text-slate">{money(data[i])}</span>
          </div>
        ))}
      </div>
    );
  }

  const w = 440;
  const h = 190;
  const padL = 52;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const cw = w - padL - padR;
  const ch = h - padT - padB;
  const minVal = Math.min(0, ...data);
  const maxVal = Math.max(1, ...data);
  const span = Math.max(1, maxVal - minVal);
  const yAt = (v) => padT + ch - ((v - minVal) / span) * ch;
  const zeroY = yAt(0);
  const bw = Math.max(6, Math.min(36, (cw / Math.max(1, data.length)) * 0.65));

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
        {[0, 0.5, 1].map((t) => {
          const val = minVal + span * t;
          const y = padT + ch * (1 - t);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#efefed" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#747878">
                {Math.round(val).toLocaleString()}
              </text>
            </g>
          );
        })}
        {minVal < 0 && (
          <line x1={padL} y1={zeroY} x2={w - padR} y2={zeroY} stroke="#d0cec8" strokeDasharray="2 2" />
        )}
        {data.map((v, i) => {
          const cx = padL + ((i + 0.5) / Math.max(1, data.length)) * cw;
          const valY = yAt(v);
          const barY = v >= 0 ? valY : zeroY;
          const bh = Math.max(1, Math.abs(valY - zeroY));
          const step = Math.max(1, Math.ceil(labels.length / 6));
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <rect
                x={cx - bw / 2}
                y={barY}
                width={bw}
                height={bh}
                fill={v < 0 ? '#ba1a1a' : color}
                opacity={hoverIdx === i ? 0.8 : 1}
              />
              {i % step === 0 && (
                <text x={cx} y={h - 6} textAnchor="middle" fontSize="9" fill="#747878">
                  {labels[i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hoverIdx !== null && (
        <div className="pointer-events-none absolute right-2 top-1 border border-hairline bg-white/95 px-2.5 py-1 text-[10px] shadow">
          <b>{labels[hoverIdx]}</b>: {money(data[hoverIdx])}
        </div>
      )}
    </div>
  );
}

function SvgDoughnut({ items }) {
  const total = items.reduce((a, b) => a + Math.max(0, b.value), 0) || 1;
  let acc = 0;
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex h-full items-center justify-center gap-4">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
        {items.map((it, i) => {
          const frac = Math.max(0, it.value) / total;
          const dash = frac * circ;
          const offset = -acc * circ;
          acc += frac;
          return (
            <circle
              key={it.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth="24"
              strokeDasharray={`${dash} ${Math.max(0, circ - dash)}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      <div className="max-h-44 space-y-1.5 overflow-y-auto text-[11px]">
        {items.map((it, i) => (
          <div key={it.label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="truncate">
              {it.label}: <b>{it.display}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminCharts({ analytics }) {
  const a = analytics || {};
  const none = !!a.isEmpty;
  const daily = a.daily || [];
  const weekly = a.weekly || [];
  const monthly = a.monthly || [];

  let cum = 0;
  const cumSeries = daily.map((x) => {
    cum += Number(x.net || 0);
    return Math.round(cum * 100) / 100;
  });

  const ordStatus = (a.orderStatus || []).filter((x) => x.count > 0);
  const payMethods = a.paymentMethods || [];

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
      <ChartShell
        title="Daily sales"
        empty={none}
        legend={
          <>
            <span className="flex items-center gap-1 text-[10px]">
              <i className="inline-block h-2 w-2 bg-[#1c1b1b]" />
              Net
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <i className="inline-block h-2 w-2 bg-[#e4c280]" />
              Gross
            </span>
          </>
        }
      >
        <SvgLineChart
          labels={daily.map((x) => x.date.slice(5))}
          series={[
            { label: 'Net', data: daily.map((x) => x.net), color: '#1c1b1b', fill: true },
            { label: 'Gross', data: daily.map((x) => x.gross), color: '#e4c280', fill: false }
          ]}
        />
      </ChartShell>

      <ChartShell title="Weekly sales" empty={none}>
        <SvgBarChart
          labels={weekly.map((x) => x.period.slice(5))}
          data={weekly.map((x) => x.net)}
          color="#1c1b1b"
        />
      </ChartShell>

      <ChartShell title="Monthly sales" empty={none}>
        <SvgBarChart
          labels={monthly.map((x) => x.period)}
          data={monthly.map((x) => x.net)}
          color="#745b23"
        />
      </ChartShell>

      <ChartShell title="Revenue trend" subtitle="Cumulative net" empty={none}>
        <SvgLineChart
          labels={daily.map((x) => x.date.slice(5))}
          series={[
            { label: 'Cumulative net revenue', data: cumSeries, color: '#1b6b3a', fill: false }
          ]}
        />
      </ChartShell>

      <ChartShell title="Best selling products" empty={!a.topProducts?.length}>
        <SvgBarChart
          horizontal
          labels={(a.topProducts || []).map((x) => x.label)}
          data={(a.topProducts || []).map((x) => x.revenue)}
          color="#e4c280"
        />
      </ChartShell>

      <ChartShell title="Sales by category" empty={!a.byCategory?.length}>
        <SvgDoughnut
          items={(a.byCategory || []).map((x) => ({
            label: x.label,
            value: x.revenue,
            display: money(x.revenue)
          }))}
        />
      </ChartShell>

      <ChartShell title="Payment method breakdown" empty={!payMethods.length}>
        <SvgDoughnut
          items={payMethods.map((x) => ({
            label: x.method,
            value: x.orders,
            display: `${x.orders} (${money(x.paidAmount)})`
          }))}
        />
      </ChartShell>

      <ChartShell title="Order status distribution" empty={!ordStatus.length}>
        <SvgDoughnut
          items={ordStatus.map((x) => ({
            label: x.status,
            value: x.count,
            display: `${x.count}`
          }))}
        />
      </ChartShell>
    </div>
  );
}
