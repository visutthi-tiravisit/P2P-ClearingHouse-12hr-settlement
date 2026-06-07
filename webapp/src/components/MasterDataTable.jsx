import { computePremium } from '../lib/premium';
import { BASE_RATE_BPS, BPS_DIVISOR } from '../lib/constants';

// Serif style for math symbols (italic, Georgia)
const SER = { fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' };

function MathSym({ children, sub, sup, small }) {
  return (
    <span style={{ ...SER, fontSize: small ? 11 : 13 }}>
      {children}
      {sub && <sub style={{ fontSize: 9 }}>{sub}</sub>}
      {sup && <sup style={{ fontSize: 9 }}>{sup}</sup>}
    </span>
  );
}

function Row({ cols, alt, COLS }) {
  return (
    <div
      className="grid items-center px-3 py-2.5 border-b border-[#1c2636] last:border-0 hover:bg-white/[0.02] transition-colors"
      style={{ gridTemplateColumns: COLS, background: alt ? 'rgba(255,255,255,0.012)' : undefined }}
    >
      {cols.map((cell, i) => (
        <div key={i} className={i === 0 ? 'text-sm text-slate-300 font-medium' : i === 1 ? 'flex justify-center' : i === 2 ? 'text-xs text-slate-500 pr-2' : 'font-mono text-xs text-teal text-right'}>
          {cell}
        </div>
      ))}
    </div>
  );
}

export default function MasterDataTable({ price, cycle, collateralEth = 0.1, isLong = true, elapsed = 0, t }) {
  const targetPrice = cycle?.pTarget ?? price ?? 0;
  const netLong     = cycle?.netLong  ?? 0;
  const netShort    = cycle?.netShort ?? 0;

  const pm = computePremium({
    isLong,
    collateralEth,
    currentPrice: price ?? targetPrice,
    targetPrice,
    elapsedSeconds: elapsed,
    netLongEth: netLong,
    netShortEth: netShort,
  });

  const deltaAbsUsd  = Math.abs((price ?? targetPrice) - targetPrice);
  const deltaPercent = targetPrice > 0 ? deltaAbsUsd / targetPrice : 0;
  const itm          = isLong ? (price ?? targetPrice) > targetPrice : (price ?? targetPrice) < targetPrice;

  const COLS = '150px 96px 1fr 155px';

  const HEADER = (
    <div className="grid px-3 py-2 border-b border-[#1c2636]" style={{ gridTemplateColumns: COLS }}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Variable</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-center">Symbol</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Description</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-right">Live Value</span>
    </div>
  );

  const rows = [
    {
      name: t?.rowCollateral ?? 'Collateral',
      sym: <MathSym>C</MathSym>,
      desc: t?.descCollateral ?? 'Initial ETH deposited by the trader',
      val: `${collateralEth.toFixed(4)} ETH`,
    },
    {
      name: t?.rowTargetPrice ?? 'Target Price',
      sym: <MathSym sub="target">P</MathSym>,
      desc: t?.descTargetPrice ?? 'Oracle price at cycle start (P_final of previous cycle)',
      val: targetPrice ? `$${targetPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—',
    },
    {
      name: t?.rowEntryPrice ?? 'Entry Price',
      sym: <MathSym sub="entry">P</MathSym>,
      desc: t?.descEntryPrice ?? 'The Oracle price at the time of transaction',
      val: price ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—',
    },
    {
      name: t?.rowBasePremium ?? 'Base Premium',
      sym: <MathSym sub="base">R</MathSym>,
      desc: t?.descBasePremium ?? `Flat protocol fee: ${BASE_RATE_BPS / 100}% of collateral`,
      val: `${BASE_RATE_BPS} bps`,
    },
    {
      name: t?.rowSkewFactor ?? 'Skew Factor',
      sym: <MathSym sub="factor">S</MathSym>,
      desc: t?.descSkewFactor ?? 'Multiplier based on pool imbalance (0.5× / 1× / 2×)',
      val: (() => {
        const total = netLong + netShort;
        if (total === 0) return '1.0×';
        const pool = isLong ? netLong : netShort;
        const r = (pool / total) * 100;
        return r > 60 ? '2.0× (crowded)' : r < 40 ? '0.5× (incentive)' : '1.0× (balanced)';
      })(),
    },
    {
      name: t?.rowSkewPremium ?? 'Skew Premium',
      sym: <MathSym sub="skew">R</MathSym>,
      desc: t?.descSkewPremium ?? 'R_base × S_factor — dynamic supply/demand cost',
      val: `${pm.skewBps} bps (${(pm.skewBps / 100).toFixed(2)}%)`,
    },
    {
      name: t?.rowTimePremium ?? 'Time Premium',
      sym: <MathSym sub="time">R</MathSym>,
      desc: t?.descTimePremium ?? 'Phase-based urgency fee (0% stable / 2% warning / 5–10% critical)',
      val: `${pm.timeBps} bps (${(pm.timeBps / 100).toFixed(2)}%)`,
    },
    {
      name: t?.rowDeltaP ?? 'Price Delta',
      sym: <span style={SER}>Δ<i>P</i></span>,
      desc: t?.descDeltaP ?? '|P_entry − P_target| / P_target — relative move from strike',
      val: `${(deltaPercent * 100).toFixed(3)}% (${itm ? 'ITM' : 'OTM'})`,
    },
    {
      name: t?.rowPriceSurcharge ?? 'Price Surcharge',
      sym: <MathSym sub="dist">R</MathSym>,
      desc: t?.descPriceSurcharge ?? 'Risk adjustment based on price advantage (Capped at 70% of ΔP)',
      val: pm.isCapped
        ? `${pm.distBps} bps ⚠ capped`
        : `${pm.distBps} bps`,
    },
    {
      name: t?.rowTotalPremium ?? 'Total Premium',
      sym: <span style={{ ...SER, fontSize: 14 }}>Π</span>,
      desc: t?.descTotalPremium ?? 'Total risk fees (R_skew + R_time + R_dist)',
      val: `${pm.totalBps} bps (${(pm.totalBps / 100).toFixed(3)}%)`,
    },
    {
      name: t?.rowNetPosition ?? 'Net Position',
      sym: <MathSym>N</MathSym>,
      desc: t?.descNetPosition ?? 'Effective trading capital after premium deduction (N = C − C × Π)',
      val: `${pm.netPositionEth.toFixed(6)} ETH`,
    },
    {
      name: t?.rowEstPayout ?? 'Est. Payout',
      sym: (
        <span className="flex flex-col items-center gap-0.5">
          <span style={{ ...SER, fontSize: 11 }}>
            <i>Payout</i><sub style={{ fontSize: 8 }}>est</sub>
          </span>
          <div className="w-px h-2 bg-slate-600" />
          <span style={{ ...SER, fontSize: 9, color: '#00d4aa' }}>
            <i>N</i> × (1 + Δ<i>P</i>)
          </span>
        </span>
      ),
      desc: t?.descEstPayout ?? (
        <span>
          <span className="text-teal font-semibold">If ITM:</span>{' N × (1 + ΔP)'}<br />
          <span className="text-amber font-semibold">If OTM:</span>{' N (capital returned)'}
        </span>
      ),
      val: (
        <span className="flex flex-col items-end gap-0.5">
          <span className="text-teal font-semibold">{pm.estPayoutITM.toFixed(6)} ETH</span>
          <span className="text-slate-500 text-[10px]">ITM</span>
        </span>
      ),
    },
    {
      name: t?.rowITMThreshold ?? 'ITM Threshold',
      sym: (
        <span style={SER}>
          <i>P</i><sub style={{ fontSize: 8 }}>final</sub>{' vs '}
          <i>P</i><sub style={{ fontSize: 8 }}>t</sub>
        </span>
      ),
      desc: t?.descITMThreshold ?? 'Long ITM if P_final > P_target; Short ITM if P_final < P_target',
      val: isLong
        ? `> $${targetPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : `< $${targetPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    },
    {
      name: t?.rowPnL ?? 'Est. P&L',
      sym: (
        <span style={{ ...SER, color: itm ? '#00d4aa' : '#f59e0b' }}>
          <i>P</i>&amp;<i>L</i>
        </span>
      ),
      desc: t?.descPnL ?? 'Net gain/loss vs original collateral',
      val: (
        <span className={itm ? 'text-teal font-semibold' : 'text-amber'}>
          {itm
            ? `+${(pm.estPayoutITM - collateralEth).toFixed(6)} ETH`
            : `-${(collateralEth - pm.estPayoutOTM).toFixed(6)} ETH`}
        </span>
      ),
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-3 py-3 border-b border-[#1c2636] flex items-center justify-between">
        <p className="section-label mb-0">{t?.masterDataTable ?? 'Master Data Declaration Table'}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="font-mono">{isLong ? 'LONG' : 'SHORT'}</span>
          <span>·</span>
          <span className="font-mono">{collateralEth.toFixed(3)} ETH</span>
        </div>
      </div>
      {HEADER}
      <div>
        {rows.map((r, i) => (
          <Row key={i} alt={i % 2 === 1} COLS={COLS} cols={[r.name, r.sym, r.desc, r.val]} />
        ))}
      </div>
    </div>
  );
}
