import { useState, useMemo } from 'react';
import CountdownRing   from '../components/CountdownRing';
import PriceChart      from '../components/PriceChart';
import PoolMeter       from '../components/PoolMeter';
import TradePanel      from '../components/TradePanel';
import HoldingsTable   from '../components/HoldingsTable';
import SandboxPanel    from '../components/SandboxPanel';
import { useCycle }       from '../hooks/useCycle';
import { useCyclesById }  from '../hooks/useCyclesById';
import { usePriceFeed }   from '../hooks/usePriceFeed';
import { usePositions }   from '../hooks/usePositions';
import { useTreasury }  from '../hooks/useTreasury';
import { useWallet }    from '../context/WalletContext';
import { CYCLE_DURATION, STABLE_END, WARNING_END } from '../lib/constants';

export default function Dashboard({ t }) {
  const { isTreasury } = useWallet();
  const { cycle, phase, elapsed, remaining, progress, settle, devFastForward, devForceSettle } = useCycle();
  const { price, priceHistory, change, source, lastUpdated } = usePriceFeed();
  const { positions, loading: posLoading, error: posError, claiming, claimReceipts, claim, refetch } = usePositions();

  // Load the exact cycle data for every finalized position by its own cycleId.
  const finalisedCycleIds = useMemo(
    () => [...new Set(positions.filter(p => p.cycleId !== cycle?.id).map(p => p.cycleId))],
    [positions, cycle?.id],
  );
  const cyclesById = useCyclesById(finalisedCycleIds);
  const treasury = useTreasury();

  // ── Sandbox overrides (timer only) ───────────────────────────────────────
  const [sandboxElapsed, setSandboxElapsed] = useState(null); // null = live

  // Derive effective values — sandbox wins when set
  const effectiveElapsed = sandboxElapsed ?? elapsed;
  const effectiveRemaining = sandboxElapsed !== null
    ? Math.max(0, CYCLE_DURATION - sandboxElapsed)
    : remaining;
  const effectiveProgress = effectiveElapsed / CYCLE_DURATION;
  const effectivePhase = useMemo(() => {
    if (sandboxElapsed === null) return phase;
    if (sandboxElapsed >= WARNING_END) return 2;
    if (sandboxElapsed >= STABLE_END)  return 1;
    return 0;
  }, [sandboxElapsed, phase]);

  const isTimerMock = sandboxElapsed !== null;

  const canSettle = cycle && !cycle.settled &&
    Math.floor(Date.now() / 1000) >= cycle.endTime;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 scroll-smooth">

      {/* Top metrics row: Countdown | Price | Pool */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_220px] gap-4 items-start">
        <CountdownRing
          cycle={cycle}
          phase={effectivePhase}
          elapsed={effectiveElapsed}
          remaining={effectiveRemaining}
          progress={effectiveProgress}
          t={t}
        />
        <PriceChart
          price={price}
          change={change}
          priceHistory={priceHistory}
          cycle={cycle}
          source={source}
          positions={positions}
          t={t}
        />
        <PoolMeter cycle={cycle} t={t} />
      </div>

      {/* Settle notice — treasury only */}
      {isTreasury && canSettle && (
        <div className="card px-4 py-3 flex items-center justify-between border-amber/30 bg-amber/5">
          <div>
            <p className="text-sm font-semibold text-amber">Cycle #{cycle.id} ready to settle</p>
            <p className="text-xs text-slate-400">Chainlink oracle will be read. Anyone can trigger settlement.</p>
          </div>
          <button onClick={settle} className="btn-primary" style={{ background: '#f59e0b', color: '#070b12' }}>
            Settle Cycle
          </button>
        </div>
      )}

      {/* Price feed source badge */}
      {lastUpdated && (
        <div className="flex items-center justify-end gap-2 text-[10px] text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          <span>Live via {source} · {new Date(lastUpdated).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Trade Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
        <TradePanel
          cycle={cycle}
          price={price}
          elapsed={effectiveElapsed}
          t={t}
          onTraded={refetch}
        />

        {/* Sandbox + Holdings stacked in the right column */}
        <div className="flex flex-col gap-4">
          {isTreasury && (
            <SandboxPanel
              cycle={cycle}
              effectivePhase={effectivePhase}
              effectiveRemaining={effectiveRemaining}
              isTimerMock={isTimerMock}
              onFastForwardCritical={() => setSandboxElapsed(CYCLE_DURATION - 60)}
              onFastForwardWarning={() => setSandboxElapsed(STABLE_END)}
              onResetTimer={() => setSandboxElapsed(null)}
              settle={settle}
              devFastForward={devFastForward}
              devForceSettle={devForceSettle}
              treasury={treasury}
            />
          )}
          <HoldingsTable
            positions={positions}
            cycle={cycle}
            cyclesById={cyclesById}
            price={price}
            loading={posLoading}
            error={posError}
            claiming={claiming}
            claimReceipts={claimReceipts}
            onClaim={claim}
            onRefetch={refetch}
            t={t}
          />
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
