import { BASE_RATE_BPS, BPS_DIVISOR } from '../lib/constants';

const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io/tx';

function shortHash(hash) {
  if (!hash) return '—';
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export default function HoldingsTable({
  positions, cycle, prevCycle, price, loading, error,
  claiming, claimReceipts, onClaim, onRefetch, t,
}) {
  const currentCycleId = cycle?.id;

  if (loading) {
    return (
      <div className="card p-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
        <span className="w-4 h-4 border-2 border-slate-600 border-t-teal rounded-full animate-spin" />
        Loading positions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 flex flex-col gap-2">
        <p className="text-xs text-red-400 font-mono break-all">Error: {error}</p>
        <button onClick={onRefetch} className="btn-primary text-xs py-1.5 px-3 self-start">
          Retry
        </button>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="card p-6 flex flex-col items-center gap-2">
        <p className="text-slate-500 text-sm">{t?.noPositions ?? 'No open positions this cycle.'}</p>
        <button onClick={onRefetch} className="text-[10px] text-teal/60 hover:text-teal transition-colors">
          ↻ Refresh
        </button>
      </div>
    );
  }

  const COLS = '80px 105px 90px 110px 120px 60px 70px 110px';

  const headers = [
    t?.hPosition    ?? 'Position',
    t?.hEntryTarget ?? 'Entry / Target',
    t?.hCollateral  ?? 'Collateral',
    t?.hPosnStatus  ?? 'P&L Status',
    'Payout',
    t?.hOpened      ?? 'Opened',
    'Action',
    'Tx Proof',
  ];

  const totalNet = positions.reduce((s, p) => s + p.netPosition, 0);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1c2636] flex items-center justify-between">
        <p className="section-label mb-0">{t?.myHoldings ?? 'My Holdings'}</p>
        <span className="text-xs text-slate-500">
          {positions.length} position{positions.length !== 1 ? 's' : ''}
          {' · '}
          <span className="text-slate-300 font-mono">{totalNet.toFixed(4)} ETH</span> net
        </span>
      </div>

      {/* Header row */}
      <div className="grid px-4 py-2 border-b border-[#1c2636] bg-white/[0.015]"
           style={{ gridTemplateColumns: COLS }}>
        {headers.map(h => (
          <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</span>
        ))}
      </div>

      {/* Data rows */}
      {positions.map(pos => {
        const isCurrentCycle  = pos.cycleId === currentCycleId;
        const isFinalizedCycle = !isCurrentCycle;

        // For finalized-cycle positions, use prevCycle's frozen settlement data.
        // For active-cycle positions, use the live price and current cycle.
        const refCycle = isFinalizedCycle ? prevCycle : cycle;

        const targetPrice  = refCycle?.pTarget ?? 0;
        const currentPrice = isFinalizedCycle
          ? (refCycle?.pFinal ?? pos.entryPrice)   // frozen at settlement
          : (price ?? pos.entryPrice);             // live oracle

        const deltaPercent = targetPrice > 0
          ? Math.abs(currentPrice - targetPrice) / targetPrice
          : 0;
        const itm = targetPrice > 0
          ? (pos.isLong ? currentPrice > targetPrice : currentPrice < targetPrice)
          : false;

        // Payout estimate: use settled payout ratios for finalized cycles
        const N = pos.netPosition;
        let liveEst;
        if (isFinalizedCycle && refCycle?.settled) {
          const ratio = pos.isLong ? refCycle.longPayoutRatio : refCycle.shortPayoutRatio;
          liveEst = N * ratio; // ratio is already normalized (e.g. 1.05)
        } else {
          const liveProfit = itm ? N * deltaPercent : 0;
          liveEst = N + liveProfit;
        }

        // Post-claim: rely on on-chain pos.claimed as the truth (not requiring a receipt)
        const receipt   = claimReceipts?.[pos.id];
        const isSettled = pos.claimed;

        // Net received = payout - gas; if no receipt, show best estimate without gas
        const finalPayout = receipt
          ? receipt.settledAmount                  // = estimatedPayout - gasCostEth
          : liveEst;

        const canClaim   = isFinalizedCycle && !pos.claimed;
        const isClaiming = claiming === pos.id;

        const openedDate = new Date(pos.openedAt * 1000);
        const timeStr = openedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return (
          <div
            key={pos.id}
            className={`grid px-4 py-3 border-b border-[#1c2636] last:border-0 items-center transition-colors ${
              isSettled
                ? 'bg-slate-900/40 opacity-60 hover:opacity-80'
                : 'hover:bg-white/[0.015]'
            }`}
            style={{ gridTemplateColumns: COLS }}
          >
            {/* Position side */}
            <div className="flex flex-col gap-1">
              <span className={pos.isLong ? 'pill-long' : 'pill-short'}>
                {pos.isLong ? '▲ LONG' : '▼ SHORT'}
              </span>
              <span className="font-mono text-[10px] text-slate-500">#{pos.id}</span>
            </div>

            {/* Entry / Target */}
            <div>
              <p className="font-mono text-xs text-slate-300">
                ${pos.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
              <p className="font-mono text-[10px] text-amber">
                T: ${targetPrice > 0 ? targetPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
              </p>
            </div>

            {/* Collateral */}
            <div>
              <p className="font-mono text-xs text-slate-300">{pos.collateral.toFixed(4)} ETH</p>
              <p className="font-mono text-[10px] text-slate-500">
                N: {pos.netPosition.toFixed(4)}
              </p>
              <p className="font-mono text-[9px] text-teal/50">
                fee: {(pos.collateral * BASE_RATE_BPS / BPS_DIVISOR).toFixed(6)}
              </p>
            </div>

            {/* P&L Status */}
            <div className="flex flex-col gap-1">
              {isSettled ? (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none"
                  style={{ color: '#64748b', background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.20)' }}
                >
                  ✓ SETTLED
                </span>
              ) : !targetPrice ? (
                <span className="text-[10px] text-slate-500">—</span>
              ) : itm ? (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none"
                  style={{ color: '#00d4aa', background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)' }}
                >
                  ITM · Profit Zone
                </span>
              ) : (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none"
                  style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  OTM · Protected
                </span>
              )}
              {/* ΔP: frozen for finalized cycles, live for active */}
              {!isSettled && targetPrice > 0 && (
                <span className="text-[10px] font-mono text-slate-500">
                  ΔP {(deltaPercent * 100).toFixed(2)}%
                  {isFinalizedCycle && refCycle?.settled && (
                    <span className="text-slate-700"> ·final</span>
                  )}
                </span>
              )}
            </div>

            {/* Payout */}
            <div>
              {isSettled ? (
                <>
                  <p className="font-mono text-xs font-semibold text-slate-300">
                    {finalPayout.toFixed(6)} ETH
                  </p>
                  {receipt ? (
                    <p className="text-[10px] text-slate-500 font-mono">
                      −{receipt.gasCostEth.toFixed(6)} gas · Net Received
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-600 font-mono">Final Payout</p>
                  )}
                </>
              ) : isFinalizedCycle && refCycle?.settled ? (
                <>
                  <p className={`font-mono text-xs font-semibold ${itm ? 'text-teal' : 'text-amber'}`}>
                    {liveEst.toFixed(6)} ETH
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Est. Payout · Claimable
                  </p>
                </>
              ) : (
                <>
                  <p className={`font-mono text-xs font-semibold ${itm ? 'text-teal' : 'text-amber'}`}>
                    {liveEst.toFixed(6)} ETH
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {itm ? 'N + N×ΔP' : 'N (capital back)'}
                  </p>
                </>
              )}
            </div>

            {/* Opened */}
            <div className="text-xs text-slate-500 font-mono">{timeStr}</div>

            {/* Action */}
            <div>
              {canClaim ? (
                <button
                  onClick={() => onClaim(pos.id, liveEst)}
                  disabled={isClaiming}
                  className="btn-primary px-3 py-1 text-xs"
                >
                  {isClaiming ? (
                    <span className="w-3 h-3 border border-[#070b12]/40 border-t-[#070b12] rounded-full animate-spin inline-block" />
                  ) : 'Claim'}
                </button>
              ) : isCurrentCycle ? (
                <span className="text-[10px] text-slate-600">Active</span>
              ) : isSettled ? (
                <span className="text-[10px] text-slate-700">—</span>
              ) : (
                <span className="text-[10px] text-slate-600">Awaiting</span>
              )}
            </div>

            {/* Tx Proof */}
            <div>
              {receipt?.txHash ? (
                <div className="flex flex-col gap-0.5">
                  <a
                    href={`${SEPOLIA_EXPLORER}/${receipt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-teal/70 hover:text-teal transition-colors underline underline-offset-2"
                  >
                    {shortHash(receipt.txHash)}
                  </a>
                  <span className="font-mono text-[9px] text-slate-600">
                    #{receipt.blockNumber}
                  </span>
                </div>
              ) : isSettled ? (
                <span className="text-[10px] text-slate-700">on-chain ✓</span>
              ) : (
                <span className="text-[10px] text-slate-700">—</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="px-4 py-2 bg-white/[0.015] border-t border-[#1c2636] flex justify-between text-xs text-slate-500">
        <span>{t?.p2pNote ?? 'P2P settlement — payouts funded by opposing pool'}</span>
        <span className="font-mono">
          {t?.hTotal ?? 'Total'}: {totalNet.toFixed(6)} ETH
        </span>
      </div>
    </div>
  );
}
