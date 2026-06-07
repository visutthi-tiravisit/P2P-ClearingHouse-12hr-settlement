import { useState } from 'react';

const NAV = [
  {
    id: 'dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    id: 'system',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
];

export default function Sidebar({ t, activePage, onNavigate, cycle }) {
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const remaining = cycle
    ? Math.max(0, cycle.endTime - Math.floor(Date.now() / 1000))
    : null;

  return (
    <aside className="w-14 shrink-0 flex flex-col border-r border-[#1c2636] bg-[#0a0f1a]/60 z-10 py-2">
      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1 px-1 pt-1">
        {NAV.map(({ id, icon }) => {
          const label = id === 'dashboard' ? (t.dashboard ?? 'Dashboard') : (t.systemDesign ?? 'System Design');
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150
                ${active
                  ? 'bg-teal/15 text-teal border border-teal/25'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
            >
              {icon}
            </button>
          );
        })}
      </nav>

      {/* Bottom: cycle info */}
      {cycle && (
        <div className="px-1 pb-2 flex flex-col items-center gap-1">
          <div className="w-px h-6 bg-[#1c2636]" />
          <div
            className="w-10 flex flex-col items-center gap-0.5 rounded-xl bg-white/[0.03] border border-white/5 py-2 px-1"
            title={`Cycle #${cycle.id}`}
          >
            <span className="text-[8px] text-slate-600 font-mono leading-none">C#{cycle.id}</span>
            <span className="text-[9px] font-mono text-teal/80 leading-none tabular-nums">
              {remaining !== null ? formatTime(remaining) : '—'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
