import { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { computePremium } from '../lib/premium';
import { MIN_COLLATERAL_ETH } from '../lib/constants';

// ── PossibleProfit section (right sub-column) ─────────────────────────────────
function PossibleProfit({ isLong, netPositionEth, collateral, pEntry, targetPrice }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showTooltip,   setShowTooltip]   = useState(false);

  const net = netPositionEth || 0;
  const col = collateral || 0;

  const longITM  = isLong  && pEntry > targetPrice;
  const shortITM = !isLong && pEntry < targetPrice;
  const isITM    = longITM || shortITM;

  const priceDistance = targetPrice > 0 ? Math.abs(pEntry - targetPrice) : 0;
  const deltaP        = isITM && targetPrice > 0 ? priceDistance / targetPrice : 0;

  // ITM scenario (current price holds)
  const grossPayout = net + net * deltaP;
  const netProfit   = grossPayout - col;
  const roi         = col > 0 ? (netProfit / col) * 100 : 0;

  // OTM scenario (profit if price reverses to target)
  const distToTarget = targetPrice > 0 ? priceDistance / targetPrice : 0;
  const otmPayout    = net + net * distToTarget;
  const otmNetProfit = otmPayout - col;
  const otmRoi       = col > 0 ? (otmNetProfit / col) * 100 : 0;

  const barPct = Math.min(100, (priceDistance / (targetPrice * 0.1)) * 100);

  return (
    <div>
      {/* Section header */}
      <div className="px-3 py-1.5 flex items-center justify-between border-y border-[#1c2636]"
           style={{ background: isLong ? 'rgba(59,130,246,0.06)' : 'rgba(168,85,247,0.06)' }}>
        <span className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: isLong ? '#3b82f6' : '#a855f7' }}>
          {isITM ? 'Possible Profit · If Price Holds' : 'Profit Scenarios'}
        </span>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded"
          style={isITM
            ? { color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }
            : { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          {isITM ? 'ITM ✓' : 'OTM · Contrarian'}
        </span>
      </div>

      {isITM ? (
        <>
          {/* Gross Payout */}
          <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636]">
            <div>
              <p className="text-xs font-semibold text-slate-300">Possible Payout</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Net + (Net × ΔP) · total returned</p>
            </div>
            <span className="font-mono text-sm font-bold text-slate-100">
              {grossPayout.toFixed(4)} ETH
            </span>
          </div>

          {/* Net Profit */}
          <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636]"
               style={{ background: netProfit >= 0 ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)' }}>
            <div>
              <p className="text-xs font-semibold text-slate-300">Estimated Net Profit</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Payout − Collateral</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold" style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(4)} ETH
              </p>
              <p className="font-mono text-[10px] font-semibold" style={{ color: roi >= 0 ? '#22c55e' : '#ef4444' }}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}% ROI
              </p>
            </div>
          </div>

          {/* ΔP bar */}
          <div className="px-3 py-2 border-b border-[#1c2636]">
            <div className="flex justify-between mb-1.5">
              <span className="text-[9px] text-slate-500">Price Gap (ΔP)</span>
              <span className="font-mono text-[9px] text-green-400">
                ${priceDistance.toFixed(2)} · +{(deltaP * 100).toFixed(2)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-[#1c2636] overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-400"
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>

          {/* Disclaimer */}
          <div className="px-3 py-2">
            <p className="text-[9px] text-slate-600 italic leading-relaxed">
              Estimated based on current price. Actual payout varies with P_final at settlement.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* OTM contrarian badge */}
          <div className="px-3 py-2 border-b border-[#1c2636]">
            <div className="rounded bg-green-500/8 border border-green-500/20 px-2.5 py-1.5">
              <p className="text-[10px] text-green-400 font-semibold">
                ✅ Trading Against Trend: 0% Price Surcharge Applied
              </p>
            </div>
          </div>

          {/* Profit if price reverses to target */}
          <div className="px-3 py-2 border-b border-[#1c2636]">
            <p className="text-[9px] font-bold text-teal uppercase tracking-wider mb-2">
              Possible Profit · If Price Reverses to Target
            </p>

            <div className="rounded-lg border border-teal/25 bg-teal/5 p-2.5 mb-2">
              {/* Payout + tooltip */}
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-teal font-bold">Contrarian Outcome at Target</span>
                  <div className="relative"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}>
                    <span className="text-[10px] text-slate-500 cursor-help w-3.5 h-3.5 rounded-full border border-slate-500 inline-flex items-center justify-center text-[8px]">ⓘ</span>
                    {showTooltip && (
                      <div className="absolute bottom-full right-0 mb-1 w-48 bg-[#111720] border border-[#1c2636] rounded-lg p-2 z-50 shadow-xl text-[9px] text-slate-300 leading-relaxed whitespace-nowrap">
                        Payout = Net + Net × ({priceDistance.toFixed(0)} / {targetPrice.toFixed(0)})<br />
                        Net Profit = Payout − Collateral<br />
                        <span className="text-slate-500">Distance: ${priceDistance.toFixed(2)} · {(distToTarget * 100).toFixed(2)}% needed</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-teal">{otmPayout.toFixed(4)} ETH</span>
              </div>
              <p className="text-[9px] text-slate-500 mb-2">Total payout returned to wallet</p>

              <div className="h-px bg-teal/20 mb-2" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] text-slate-500 mb-0.5">Net Profit at Target</p>
                  <p className="font-mono text-xs font-bold" style={{ color: otmNetProfit >= 0 ? '#00d4aa' : '#ef4444' }}>
                    {otmNetProfit >= 0 ? '+' : ''}{otmNetProfit.toFixed(4)} ETH
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="font-mono text-2xl font-black leading-none"
                    style={{ color: otmRoi >= 0 ? '#00d4aa' : '#ef4444', filter: otmRoi >= 0 ? 'drop-shadow(0 0 8px rgba(0,212,170,0.5))' : 'none' }}
                  >
                    {otmRoi >= 0 ? '+' : ''}{otmRoi.toFixed(2)}%
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">ROI at target</p>
                </div>
              </div>
            </div>

            {/* Breakdown accordion */}
            <button
              onClick={() => setShowBreakdown(s => !s)}
              className="w-full text-[9px] text-slate-500 border border-[#1c2636] rounded py-1 px-2 flex justify-between items-center hover:border-teal/30 hover:text-slate-300 transition-colors"
            >
              <span>{showBreakdown ? 'Hide' : 'Show'} Breakdown</span>
              <span>{showBreakdown ? '▲' : '▼'}</span>
            </button>

            {showBreakdown && (
              <div className="mt-1.5 p-2 rounded bg-white/[0.02] border border-[#1c2636] space-y-1">
                {[
                  ['Formula', `Net + Net × (${priceDistance.toFixed(0)} / ${targetPrice.toFixed(0)})`],
                  ['Distance to P_target', `$${priceDistance.toFixed(2)} · ${(distToTarget * 100).toFixed(2)}% needed`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500">{k}</span>
                    <span className="font-mono text-[9px] text-teal">{v}</span>
                  </div>
                ))}
                <div className="h-1 rounded-full bg-[#1c2636] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${barPct}%`, background: 'linear-gradient(90deg,#f59e0b,#00d4aa)' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-3 py-2">
            <p className="text-[9px] text-slate-600 italic leading-relaxed">
              Estimated based on current price. Actual payout varies with P_final at settlement.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── TradePanel ────────────────────────────────────────────────────────────────
export default function TradePanel({ cycle, price, elapsed, t, onTraded }) {
  const { contract, balance } = useWallet();
  const [isLong,    setIsLong]    = useState(true);
  const [colInput,  setColInput]  = useState('0.05');
  const [txPending, setTxPending] = useState(false);
  const [txHash,    setTxHash]    = useState(null);
  const [txError,   setTxError]   = useState(null);

  const collateralEth = Math.max(0, parseFloat(colInput) || 0);
  const targetPrice   = cycle?.pTarget ?? price ?? 0;
  const pEntry        = price ?? targetPrice;
  const netLong       = cycle?.netLong  ?? 0;
  const netShort      = cycle?.netShort ?? 0;

  const pm = useMemo(() => computePremium({
    isLong,
    collateralEth,
    currentPrice: pEntry,
    targetPrice,
    elapsedSeconds: elapsed,
    netLongEth: netLong,
    netShortEth: netShort,
  }), [isLong, collateralEth, pEntry, targetPrice, elapsed, netLong, netShort]);

  const validInput = collateralEth >= MIN_COLLATERAL_ETH &&
    collateralEth <= parseFloat(balance ?? 0);

  const handleOpen = async () => {
    if (!contract || !validInput) return;
    setTxPending(true); setTxError(null); setTxHash(null);
    try {
      const value = ethers.parseEther(collateralEth.toFixed(18));
      const tx    = await contract.openPosition(isLong, { value });
      setTxHash(tx.hash);
      await tx.wait();
      onTraded?.();
      setColInput('0.05');
    } catch (err) {
      setTxError(err.reason ?? err.message ?? 'Transaction failed');
    } finally {
      setTxPending(false);
    }
  };

  const sideColor = isLong ? '#3b82f6' : '#a855f7';

  return (
    <div className="card flex flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1c2636]">
        <p className="section-label mb-0">{t?.openPosition ?? 'Open Position'}</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* LONG / SHORT selector */}
        <div>
          <p className="text-xs text-slate-500 mb-2">{t?.selectSide ?? 'Select Side'}</p>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map(long => (
              <button
                key={String(long)}
                onClick={() => setIsLong(long)}
                className="py-3 rounded-xl font-bold text-sm transition-all duration-150 border"
                style={isLong === long
                  ? { background: `${long ? '#3b82f6' : '#a855f7'}20`, borderColor: `${long ? '#3b82f6' : '#a855f7'}70`, color: long ? '#3b82f6' : '#a855f7', boxShadow: `0 0 16px ${long ? '#3b82f6' : '#a855f7'}20` }
                  : { background: 'rgba(255,255,255,0.02)', borderColor: '#1c2636', color: '#64748b' }}
              >
                {long ? '▲ LONG' : '▼ SHORT'}
              </button>
            ))}
          </div>
        </div>

        {/* Collateral input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">{t?.collateralLabel ?? 'Collateral (ETH)'}</p>
            <button className="text-[10px] text-teal/70 hover:text-teal"
              onClick={() => balance && setColInput((parseFloat(balance) * 0.9).toFixed(4))}>
              MAX {balance ? parseFloat(balance).toFixed(4) : '—'} ETH
            </button>
          </div>
          <div className="flex items-center gap-2 bg-[#0a0f1a] border border-[#1c2636] rounded-xl px-3 py-3 focus-within:border-teal/40 transition-colors">
            <span className="text-slate-500 text-lg">Ξ</span>
            <input
              type="number" value={colInput}
              onChange={e => setColInput(e.target.value)}
              min={MIN_COLLATERAL_ETH} step="0.001"
              className="flex-1 bg-transparent outline-none font-mono text-xl font-bold text-slate-200 placeholder:text-slate-600"
              placeholder="0.000"
            />
            <div className="text-right">
              <p className="text-[9px] text-slate-500">Balance</p>
              <p className="font-mono text-xs text-slate-400">{balance ? parseFloat(balance).toFixed(3) : '—'}</p>
            </div>
          </div>
          {/* Preset amounts */}
          <div className="flex gap-1.5 mt-2">
            {[0.05, 0.1, 0.25, 0.5, 1.0].map(p => (
              <button key={p} onClick={() => setColInput(p.toString())}
                className="flex-1 py-1 rounded bg-[#1c2636] text-slate-500 text-[10px] font-mono hover:bg-[#243048] hover:text-slate-300 transition-colors">
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Time premium tiers */}
        <div>
          <p className="text-xs text-slate-500 mb-2">{t?.timePremierTier ?? 'Time Premium Tier'}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Stable',   rate: '0%',    phase: 0, color: '#22c55e' },
              { label: 'Warning',  rate: '2%',    phase: 1, color: '#f59e0b' },
              { label: 'Critical', rate: '5–10%', phase: 2, color: '#ef4444' },
            ].map(({ label, rate, phase, color }) => {
              const timePct = pm.timePremiumPct;
              const active  = phase === (timePct === 0 ? 0 : timePct === 2 ? 1 : 2);
              return (
                <div key={label} className="rounded-lg border px-2 py-2 text-center transition-all"
                     style={active
                       ? { borderColor: `${color}60`, background: `${color}14`, boxShadow: `0 0 12px ${color}18` }
                       : { borderColor: '#1c2636', background: 'transparent', opacity: 0.4 }}>
                  <p className="text-[9px] font-bold" style={{ color }}>{label}</p>
                  <p className="font-mono text-base font-bold mt-0.5" style={{ color: active ? color : '#64748b' }}>{rate}</p>
                  {active && <span className="inline-block w-1.5 h-1.5 rounded-full mt-0.5 animate-pulse" style={{ background: color }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ORDER SUMMARY ── two-column layout */}
      <div className="border-t border-[#1c2636]">
        <div className="px-4 py-2 bg-white/[0.02]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {t?.orderSummary ?? 'Order Summary'}
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[#1c2636]">
          {/* Sub-col A: COST & FEES */}
          <div>
            <div className="px-3 py-1.5 bg-[#0a0f1a] border-b border-[#1c2636]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {t?.costFees ?? 'Cost & Fees'}
              </span>
            </div>

            {/* Collateral */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636]">
              <span className="text-[9px] text-slate-500">Collateral</span>
              <span className="font-mono text-xs font-semibold text-slate-300">
                {collateralEth.toFixed(4)} ETH
              </span>
            </div>

            {/* Time Premium */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636]">
              <div>
                <p className="text-[9px] text-slate-500">Time Premium</p>
                <p className="text-[9px] text-slate-600">
                  {pm.timePremiumPct === 0 ? 'Stable' : pm.timePremiumPct <= 2 ? 'Warning' : 'Critical'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-semibold"
                   style={{ color: pm.timePremiumPct === 0 ? '#22c55e' : pm.timePremiumPct <= 2 ? '#f59e0b' : '#ef4444' }}>
                  +{pm.timePremiumPct.toFixed(2)}%
                </p>
                <p className="font-mono text-[9px] text-slate-500">
                  {(collateralEth * pm.timePremiumPct / 100).toFixed(4)} ETH
                </p>
              </div>
            </div>

            {/* Skew */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636]">
              <div>
                <p className="text-[9px] text-slate-500">Skew</p>
                <p className="text-[9px] text-slate-600">×{pm.skewFactor.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-semibold"
                   style={{ color: pm.skewFactor > 1 ? '#f59e0b' : pm.skewFactor < 1 ? '#22c55e' : '#94a3b8' }}>
                  {pm.skewFactor < 1 ? '' : '+'}{pm.baseSkewPct.toFixed(3)}%
                </p>
                <p className="font-mono text-[9px] text-slate-500">
                  {(collateralEth * pm.baseSkewPct / 100).toFixed(4)} ETH
                </p>
              </div>
            </div>

            {/* Price Surcharge */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636]"
                 style={{ background: pm.priceDistancePct > 5 && !pm.isCapped ? 'rgba(239,68,68,0.04)' : 'none' }}>
              <div>
                <p className="text-[9px] text-slate-500">Price Surcharge</p>
                {pm.priceDistancePct > 5 && !pm.isCapped &&
                  <p className="text-[9px] font-bold text-red-400">HIGH ⚠</p>}
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-semibold"
                   style={{ color: pm.priceDistancePct > 5 && !pm.isCapped ? '#ef4444' : pm.priceDistancePct > 0 ? '#f59e0b' : '#475569' }}>
                  {pm.priceDistancePct > 0 ? '+' : ''}{pm.priceDistancePct.toFixed(3)}%
                </p>
                <p className="font-mono text-[9px] text-slate-500">
                  {(collateralEth * pm.priceDistancePct / 100).toFixed(4)} ETH
                </p>
              </div>
            </div>

            {/* Total Premium */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636] bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold text-slate-300">Total Premium</span>
                  {pm.isCapped && (
                    <span className="text-[8px] font-bold px-1 py-px rounded"
                          style={{ color: '#00d4aa', background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)' }}>
                      CAP ✓
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {pm.isCapped
                    ? `≤70% of ΔP · saved ${(pm.uncappedTotalPct - pm.totalPct).toFixed(3)}%`
                    : `${pm.totalPct.toFixed(3)}% of collateral`}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-red-400">
                −{pm.premiumCostEth.toFixed(4)} ETH
              </span>
            </div>

            {/* Platform Gas Fund (treasury fee breakdown) */}
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-[#1c2636]"
                 style={{ background: 'rgba(0,212,170,0.025)' }}>
              <div>
                <p className="text-[9px] text-teal/70 font-semibold">Platform Gas Fund</p>
                <p className="text-[9px] text-slate-600">BASE_RATE 0.1% → Treasury</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] font-semibold text-teal/70">
                  {pm.baseFeeEth.toFixed(6)} ETH
                </p>
                <p className="font-mono text-[9px] text-slate-600">of total premium</p>
              </div>
            </div>

            {/* Net Position */}
            <div className="flex justify-between items-center px-3 py-3"
                 style={{ background: `${sideColor}12` }}>
              <div>
                <p className="text-xs font-bold text-slate-100">Net Position</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Collateral − Premium</p>
              </div>
              <span className="font-mono text-base font-bold" style={{ color: sideColor }}>
                {pm.netPositionEth.toFixed(4)} ETH
              </span>
            </div>
          </div>

          {/* Sub-col B: PRICE & PROFIT */}
          <div>
            <div className="px-3 py-1.5 bg-[#0a0f1a] border-b border-[#1c2636]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {t?.priceProfit ?? 'Price & Profit'}
              </span>
            </div>

            {/* Entry Price */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636]">
              <div>
                <p className="text-[9px] text-slate-500">Entry Price</p>
                <p className="text-[9px] text-slate-600">P_oracle · fair</p>
              </div>
              <span className="font-mono text-sm font-bold" style={{ color: sideColor }}>
                ${pEntry.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Strike Target */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-[#1c2636] bg-white/[0.02]">
              <p className="text-[9px] text-slate-500">Strike Target</p>
              <span className="font-mono text-xs font-semibold text-amber">
                ${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Possible profit inline */}
            <PossibleProfit
              isLong={isLong}
              netPositionEth={pm.netPositionEth}
              collateral={collateralEth}
              pEntry={pEntry}
              targetPrice={targetPrice}
            />
          </div>
        </div>
      </div>

      {/* Tx feedback */}
      <div className="px-4 py-3 border-t border-[#1c2636] flex flex-col gap-2">
        {txHash && (
          <div className="text-xs text-teal/80 bg-teal/5 border border-teal/20 rounded-xl px-3 py-2 font-mono break-all">
            ✓ Tx: {txHash.slice(0, 10)}…{txHash.slice(-8)}
          </div>
        )}
        {txError && (
          <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2">
            {txError}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleOpen}
          disabled={!contract || !validInput || txPending || cycle?.settled}
          className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: sideColor, color: '#fff', boxShadow: `0 4px 20px ${sideColor}40` }}
        >
          {txPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t?.broadcasting ?? 'Broadcasting Tx…'}
            </>
          ) : (
            `Open Position ${isLong ? 'LONG' : 'SHORT'} · ${collateralEth.toFixed(3)} ETH`
          )}
        </button>

        {!contract && (
          <p className="text-[10px] text-center text-slate-600">Connect wallet to trade</p>
        )}
      </div>
    </div>
  );
}
