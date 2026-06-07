import { PHASE_META, CYCLE_DURATION } from '../lib/constants';

const R  = 46;
const CX = 56;
const CY = 56;
const CIRCUMFERENCE = 2 * Math.PI * R;

function fmt(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const PHASE_NAMES = ['Stable', 'Warning', 'Critical'];

export default function CountdownRing({ cycle, phase, elapsed, remaining, progress, t }) {
  const meta = PHASE_META[phase] ?? PHASE_META[0];

  // Arc is drawn from top (−90°); progress fills clockwise
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(progress, 1));

  const totalEth = cycle ? (cycle.netLong + cycle.netShort).toFixed(3) : '—';

  return (
    <div className="card p-4 flex flex-col items-center gap-3">
      <p className="section-label self-start">{t?.cycleStatus ?? 'Cycle Status'}</p>

      {/* Ring SVG */}
      <div className="relative">
        <svg width={112} height={112} className="rotate-[-90deg]">
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1c2636" strokeWidth={6} />
          {/* Progress arc */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={meta.color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${meta.color}88)` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-base font-bold tabular-nums text-slate-100" style={{ color: meta.color }}>
            {remaining !== null ? fmt(remaining) : '—:—:—'}
          </span>
          <span className="text-[9px] text-slate-500 mt-0.5">remaining</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="w-full grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Phase</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: meta.color }}>
            {PHASE_NAMES[phase]}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Cycle</p>
          <p className="text-xs font-semibold text-slate-300 mt-0.5 font-mono">
            #{cycle?.id ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">TVL</p>
          <p className="text-xs font-semibold text-slate-300 mt-0.5 font-mono">
            {totalEth} <span className="text-slate-500">ETH</span>
          </p>
        </div>
      </div>

      {/* Phase progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-[9px] text-slate-600 mb-1">
          <span>0h</span>
          <span className="text-amber/70">9h</span>
          <span className="text-amber/70">10.5h</span>
          <span>12h</span>
        </div>
        <div className="h-1.5 bg-[#1c2636] rounded-full overflow-hidden relative">
          {/* Stable zone */}
          <div className="absolute left-0 top-0 h-full bg-teal/30 rounded-full" style={{ width: '75%' }} />
          {/* Warning zone */}
          <div className="absolute top-0 h-full bg-amber/30" style={{ left: '75%', width: '12.5%' }} />
          {/* Critical zone */}
          <div className="absolute top-0 h-full bg-red-500/30 rounded-r-full" style={{ left: '87.5%', width: '12.5%' }} />
          {/* Indicator */}
          <div
            className="absolute top-0 w-0.5 h-full bg-white rounded-full"
            style={{ left: `${Math.min(progress * 100, 99.5)}%`, transition: 'left 1s linear' }}
          />
        </div>
      </div>
    </div>
  );
}
