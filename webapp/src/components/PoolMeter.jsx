export default function PoolMeter({ cycle, t }) {
  const netLong  = cycle?.netLong  ?? 0;
  const netShort = cycle?.netShort ?? 0;
  const total    = netLong + netShort;
  const longPct  = total > 0 ? (netLong  / total) * 100 : 50;
  const shortPct = total > 0 ? (netShort / total) * 100 : 50;

  const skew = total > 0
    ? longPct > 60 ? 'Long-heavy'
    : shortPct > 60 ? 'Short-heavy'
    : 'Balanced'
    : 'Empty';

  const skewColor = skew === 'Long-heavy' ? '#3b82f6'
    : skew === 'Short-heavy' ? '#a855f7'
    : '#00d4aa';

  return (
    <div className="card p-4 flex flex-col gap-3">
      <p className="section-label">{t?.liquidityPool ?? 'Liquidity Pool'}</p>

      {/* Pool bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-[#1c2636]">
        <div
          className="h-full bg-long transition-all duration-500 rounded-l-full"
          style={{ width: `${longPct}%` }}
        />
        <div
          className="h-full bg-short transition-all duration-500 rounded-r-full"
          style={{ width: `${shortPct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-long" />
          <span className="text-slate-400">Long</span>
          <span className="font-mono text-long font-semibold">{netLong.toFixed(3)}</span>
          <span className="text-slate-600 font-mono">ETH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-mono">{netShort.toFixed(3)} ETH</span>
          <span className="font-mono text-short font-semibold">Short</span>
          <span className="w-2 h-2 rounded-full bg-short" />
        </div>
      </div>

      {/* Skew badge + total */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Market Skew</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full border"
            style={{ color: skewColor, borderColor: `${skewColor}40`, background: `${skewColor}12` }}
          >
            {skew}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">Total TVL</span>
          <span className="font-mono text-sm text-slate-200 font-semibold">
            {total.toFixed(4)} ETH
          </span>
        </div>
      </div>

      {/* Ratio breakdown */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1c2636]">
        <div className="text-center">
          <p className="text-[9px] text-slate-600 mb-0.5">LONG</p>
          <p className="font-mono text-sm font-bold text-long">{longPct.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-slate-600 mb-0.5">SHORT</p>
          <p className="font-mono text-sm font-bold text-short">{shortPct.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
