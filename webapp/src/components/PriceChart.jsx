import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ReferenceArea, ResponsiveContainer, Tooltip,
} from 'recharts';
import { STABLE_END, WARNING_END } from '../lib/constants';

// ─── Phase zone colors ────────────────────────────────────────────────────────
const PHASE_FILL = {
  stable:   'rgba(0,212,170,0.05)',
  warning:  'rgba(245,158,11,0.08)',
  critical: 'rgba(239,68,68,0.09)',
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-[#0d1117] border border-[#1c2636] rounded-lg px-3 py-2 shadow-xl">
      <p className="font-mono text-xs text-slate-200">
        ${val?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="font-mono text-[9px] text-slate-500 mt-0.5">
        {label ? new Date(label).toLocaleTimeString() : ''}
      </p>
    </div>
  );
}

// ─── Custom active dot ────────────────────────────────────────────────────────
function ActiveDot({ cx, cy, fill }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={6}  fill={fill} opacity={0.25} />
      <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke="#0d1117" strokeWidth={1.5} />
    </g>
  );
}

// ─── Pulsing live dot at the last data point ──────────────────────────────────
function LiveDot(props) {
  const { cx, cy, index, dataLength, fill } = props;
  if (index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7}   fill={fill} opacity={0.2} />
      <circle cx={cx} cy={cy} r={4}   fill={fill} stroke="#0d1117" strokeWidth={1.5} />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PriceChart({ price, change, priceHistory, cycle, source, positions, t }) {
  const target = cycle?.pTarget ?? null;

  // ITM = price above target (relevant for LONG; inverted for SHORT)
  const isAboveTarget = price != null && target != null && price > target;
  const lineColor = target != null
    ? (isAboveTarget ? '#00d4aa' : '#ef4444')
    : '#ef8c60';

  // ── Recharts data ─────────────────────────────────────────────────────────
  const data = useMemo(
    () => priceHistory.map(p => ({ time: p.time, price: p.value })),
    [priceHistory],
  );

  // ── Y-axis domain — must include target price so the line is always visible ─
  const yDomain = useMemo(() => {
    const vals = data.map(d => d.price);
    if (target != null) vals.push(target); // always keep target in view
    if (!vals.length) return ['auto', 'auto'];
    const lo     = Math.min(...vals);
    const hi     = Math.max(...vals);
    const rng    = hi - lo;
    const center = (lo + hi) / 2;
    const pad    = Math.max(rng * 0.4, center * 0.005); // min 0.5% of price
    return [lo - pad, hi + pad];
  }, [data, target]);

  // ── X-axis domain & ticks ─────────────────────────────────────────────────
  const xDomain = data.length >= 2
    ? [data[0].time, data[data.length - 1].time]
    : ['auto', 'auto'];

  const xTicks = data.length >= 2 ? [
    data[0].time,
    Math.round((data[0].time + data[data.length - 1].time) / 2),
    data[data.length - 1].time,
  ] : [];

  const formatXTick = (val) => {
    if (data.length < 2) return '';
    const range = data[data.length - 1].time - data[0].time || 1;
    const pct   = (val - data[0].time) / range;
    if (pct <= 0.15) return '12h ago';
    if (pct >= 0.85) return 'Now';
    return '6h ago';
  };

  // ── Phase zones mapped to actual timestamps ───────────────────────────────
  const phases = useMemo(() => {
    if (!cycle?.startTime || !data.length) return null;
    const s   = cycle.startTime * 1000; // to ms
    const lo  = data[0].time;
    const hi  = data[data.length - 1].time;
    return {
      stableStart:  Math.max(s, lo),
      stableEnd:    Math.min(s + STABLE_END  * 1000, hi),
      warningStart: Math.max(s + STABLE_END  * 1000, lo),
      warningEnd:   Math.min(s + WARNING_END * 1000, hi),
      critStart:    Math.max(s + WARNING_END * 1000, lo),
      critEnd:      hi,
    };
  }, [cycle, data]);

  // ── Entry price markers from open positions ───────────────────────────────
  const entryLines = useMemo(() => {
    if (!positions?.length) return [];
    return positions
      .filter(p => !p.claimed)
      .map(p => ({ price: p.entryPrice, isLong: p.isLong, id: p.id }));
  }, [positions]);

  return (
    <div className="card overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">
              Price Feed · Live
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-600 font-mono mb-2">
            ETH / USD · {source ?? 'Binance WS'}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono font-bold text-[28px] leading-tight text-slate-100">
              ${price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
            </span>
            {change != null && change !== 0 && (
              <span
                className="font-mono text-sm font-semibold"
                style={{ color: change >= 0 ? '#00d4aa' : '#ef4444' }}
              >
                {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* P_target + ITM/OTM badge */}
        {target && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">P_Target</p>
            <p className="font-mono text-base font-bold text-amber mt-1">
              ${target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded mt-1 inline-block"
              style={isAboveTarget
                ? { color: '#00d4aa', background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)' }
                : { color: '#ef4444', background: 'rgba(239,68,68,0.12)',  border: '1px solid rgba(239,68,68,0.25)' }}
            >
              {isAboveTarget ? 'LONG ITM ▲' : 'SHORT ITM ▼'}
            </span>
          </div>
        )}
      </div>

      {/* ── Phase legend ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pb-2 shrink-0">
        {[
          { label: 'Stable (0–9h)',      color: '#00d4aa' },
          { label: 'Warning (9–10.5h)',  color: '#f59e0b' },
          { label: 'Critical (10.5–12h)',color: '#ef4444' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm opacity-70" style={{ background: color }} />
            <span className="text-[9px] text-slate-600 font-mono">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Recharts ───────────────────────────────────────────────────────── */}
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 20, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="pgUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={lineColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Phase zone backgrounds */}
            {phases && phases.stableStart < phases.stableEnd && (
              <ReferenceArea
                x1={phases.stableStart} x2={phases.stableEnd}
                fill={PHASE_FILL.stable} stroke="none"
              />
            )}
            {phases && phases.warningStart < phases.warningEnd && (
              <ReferenceArea
                x1={phases.warningStart} x2={phases.warningEnd}
                fill={PHASE_FILL.warning} stroke="none"
              />
            )}
            {phases && phases.critStart < phases.critEnd && (
              <ReferenceArea
                x1={phases.critStart} x2={phases.critEnd}
                fill={PHASE_FILL.critical} stroke="none"
              />
            )}

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1c2636"
              strokeOpacity={0.6}
              vertical={false}
            />

            <XAxis
              dataKey="time"
              type="number"
              domain={xDomain}
              scale="time"
              ticks={xTicks}
              tickFormatter={formatXTick}
              tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: '#1c2636' }}
              tickLine={false}
            />

            <YAxis
              domain={yDomain}
              tickFormatter={v => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={62}
              tickCount={5}
            />

            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: '#2d3f55', strokeWidth: 1, strokeDasharray: '3 3' }}
            />

            {/* ── Target price line ── */}
            {target && (
              <ReferenceLine
                y={target}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="7 4"
                label={{
                  value: `P_target  $${target.toFixed(2)}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                  dy: -6,
                  dx: -4,
                }}
              />
            )}

            {/* ── Entry price markers ── */}
            {entryLines.map(m => (
              <ReferenceLine
                key={m.id}
                y={m.price}
                stroke={m.isLong ? '#3b82f6' : '#a855f7'}
                strokeWidth={1}
                strokeDasharray="4 3"
                label={{
                  value: `Entry #${m.id}  $${m.price.toFixed(2)}`,
                  position: 'insideBottomLeft',
                  fill: m.isLong ? '#3b82f6' : '#a855f7',
                  fontSize: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  dy: 12,
                }}
              />
            ))}

            {/* ── Price area ── */}
            <Area
              type="monotoneX"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#pgUp)"
              dot={(props) => (
                <LiveDot {...props} dataLength={data.length} fill={lineColor} />
              )}
              activeDot={<ActiveDot fill={lineColor} />}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
