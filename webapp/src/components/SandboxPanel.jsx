import { useState } from 'react';
import { PHASE_META } from '../lib/constants';

function fmtTime(s) {
  const secs = Math.max(0, Math.round(s));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const sc = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
}

export default function SandboxPanel({
  cycle,
  effectivePhase,
  effectiveRemaining,
  isTimerMock,
  onFastForwardCritical,
  onFastForwardWarning,
  onResetTimer,
  settle,
  devFastForward,
  devForceSettle,
  treasury,
}) {
  const [settling,    setSettling]    = useState(false);
  const [settleError, setSettleError] = useState(null);
  const [ffwding,     setFfwding]     = useState(false);
  const [ffwdError,   setFfwdError]   = useState(null);

  const phaseLabel = PHASE_META[effectivePhase]?.label ?? 'Unknown';
  const phaseColor = PHASE_META[effectivePhase]?.color ?? '#94a3b8';

  const handleSettle = async () => {
    setSettling(true);
    setSettleError(null);
    try {
      await (devForceSettle ?? settle)();
    } catch (err) {
      const msg = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Transaction failed';
      setSettleError(msg);
    } finally {
      setSettling(false);
    }
  };

  const handleFastForwardCritical = async () => {
    setFfwding(true);
    setFfwdError(null);
    try {
      if (devFastForward) await devFastForward();
      onFastForwardCritical?.();
    } catch (err) {
      const msg = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Transaction failed';
      setFfwdError(msg);
    } finally {
      setFfwding(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-amber/40 bg-amber/[0.025] px-4 py-3">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
        <span className="font-mono text-[11px] font-bold tracking-widest text-amber/80">
          [SYSTEM_TESTING_SANDBOX]
        </span>
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded font-mono"
          style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)' }}
        >
          DEV
        </span>
        <span className="font-mono text-[9px] text-slate-600 ml-auto">
          timer overrides are UI-only · Force Settle writes on-chain
        </span>
      </div>

      {/* ── Two panels ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* ── 1. Timer Control ─────────────────────────────────────────────── */}
        <div className="rounded-lg border border-dashed border-amber/20 bg-[#070b12]/50 px-3 py-2.5 flex flex-col gap-2">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-amber/50">
            // TIMER_CONTROL
          </p>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500">phase →</span>
            <span className="font-mono text-[10px] font-bold" style={{ color: phaseColor }}>
              {phaseLabel.toUpperCase()}
            </span>
            {isTimerMock && (
              <span className="font-mono text-[8px] px-1 py-0.5 rounded" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.15)' }}>
                MOCK
              </span>
            )}
          </div>

          <p className="font-mono text-xl font-bold text-slate-200 tabular-nums leading-none">
            {fmtTime(effectiveRemaining)}
          </p>

          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={handleFastForwardCritical}
              disabled={ffwding || cycle?.settled}
              className="font-mono text-[10px] px-2 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
            >
              {ffwding ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                  Setting on-chain…
                </span>
              ) : '⚡ Fast-Forward → Critical (1 min left)'}
            </button>
            {ffwdError && (
              <p className="font-mono text-[9px] text-red-400/80 break-all leading-relaxed">
                ✕ {ffwdError}
              </p>
            )}
            <button
              onClick={onFastForwardWarning}
              className="font-mono text-[10px] px-2 py-1.5 rounded border border-amber/25 bg-amber/10 text-amber/80 hover:bg-amber/20 transition-colors text-left"
            >
              ⚡ Fast-Forward → Warning Phase (UI only)
            </button>
            {isTimerMock && (
              <button
                onClick={onResetTimer}
                className="font-mono text-[10px] px-2 py-1.5 rounded border border-slate-600/40 bg-slate-800/40 text-slate-400 hover:bg-slate-700/40 transition-colors text-left"
              >
                ↺ Reset to Live Timer
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Force Settlement ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-dashed border-red-500/25 bg-[#070b12]/50 px-3 py-2.5 flex flex-col gap-2">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-red-400/50">
            // FORCE_SETTLE
          </p>

          <div className="font-mono text-[10px] text-slate-500 leading-relaxed space-y-0.5">
            <p>→ Calls settleCycle() on-chain</p>
            <p>→ Reads Chainlink oracle at that block</p>
            <p>→ Freezes P_final for all positions</p>
            <p className="text-red-400/60">→ Requires cycle past endTime</p>
          </div>

          {cycle && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-slate-600">cycle #{cycle.id}</span>
              <span
                className="font-mono text-[8px] px-1 py-0.5 rounded font-bold"
                style={cycle.settled
                  ? { color: '#94a3b8', background: 'rgba(148,163,184,0.12)' }
                  : { color: '#00d4aa', background: 'rgba(0,212,170,0.12)' }}
              >
                {cycle.settled ? 'SETTLED' : 'ACTIVE'}
              </span>
            </div>
          )}

          <button
            onClick={handleSettle}
            disabled={settling || !cycle || cycle.settled}
            className="font-mono text-[10px] px-3 py-2 rounded border border-red-500/35 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-auto"
          >
            {settling ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                Settling…
              </span>
            ) : cycle?.settled ? (
              '✓ Cycle Already Settled'
            ) : (
              '⚡ Force Settle Now'
            )}
          </button>

          {settleError && (
            <p className="font-mono text-[9px] text-red-400/80 break-all leading-relaxed">
              ✕ {settleError}
            </p>
          )}
        </div>

      </div>

      {/* ── Treasury Monitor ────────────────────────────────────────────────── */}
      <div className="mt-3 rounded-lg border border-dashed border-teal/20 bg-[#070b12]/50 px-3 py-2.5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-teal/50 mb-2">
          // PLATFORM_TREASURY
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1.5">
          <div>
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">Address</p>
            <p className="font-mono text-[10px] text-slate-400 truncate">
              {treasury?.address
                ? `${treasury.address.slice(0, 8)}…${treasury.address.slice(-6)}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">Balance</p>
            <p className="font-mono text-[10px] font-bold text-teal">
              {treasury?.balance != null
                ? `${treasury.balance.toFixed(6)} ETH`
                : '—'}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">Source</p>
            <p className="font-mono text-[10px] text-slate-400">
              BASE_RATE 0.1% × each C
            </p>
          </div>
        </div>
        <p className="font-mono text-[9px] text-slate-700 mt-2 leading-relaxed">
          → Risk-neutral: treasury holds no directional exposure · funded purely by service fee
        </p>
      </div>
    </div>
  );
}
