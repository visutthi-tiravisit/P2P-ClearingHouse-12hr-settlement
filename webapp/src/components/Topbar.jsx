import { useWallet } from '../context/WalletContext';

function shortenAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export default function Topbar({ t, lang, onToggleLang, darkMode, onToggleTheme, onOpenWiki }) {
  const { account, balance, isSepoliaNetwork, disconnect } = useWallet();

  return (
    <header className="h-14 shrink-0 flex items-center px-4 border-b border-[#1c2636] bg-[#0a0f1a]/80 backdrop-blur-sm z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-6">
        <div className="w-7 h-7 rounded-lg bg-teal/10 border border-teal/25 flex items-center justify-center">
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#00d4aa" strokeWidth="1.2" />
            <path d="M6 13L10 5L14 13" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 11h5" stroke="#00d4aa" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-bold text-sm text-slate-100 hidden sm:block">ClearingHouse</span>
        <span className="text-[10px] font-mono text-teal/60 border border-teal/20 rounded-full px-1.5 py-0.5 hidden md:block">
          SEPOLIA
        </span>
      </div>

      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Wiki */}
        <button
          onClick={onOpenWiki}
          className="btn-ghost text-xs flex items-center gap-1.5 px-2.5"
          title="Open Wiki / Manual"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Wiki
        </button>

        {/* Lang toggle */}
        <button
          onClick={onToggleLang}
          className="btn-ghost text-xs font-mono px-2.5"
          title="Toggle language"
        >
          {lang === 'en' ? 'TH' : 'EN'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="btn-ghost px-2.5"
          title={darkMode ? t.switchToLight : t.switchToDark}
        >
          {darkMode
            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          }
        </button>

        {/* Network badge */}
        {!isSepoliaNetwork && (
          <span className="pill pill-red text-xs">Wrong Network</span>
        )}

        {/* Wallet info */}
        {account && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#1c2636]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-mono text-slate-300">{shortenAddr(account)}</p>
              <p className="text-[10px] text-slate-500">{balance ? parseFloat(balance).toFixed(4) : '—'} ETH</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal to-long flex items-center justify-center text-[10px] font-bold text-[#070b12]">
              {account.slice(2, 4).toUpperCase()}
            </div>
            <button
              onClick={disconnect}
              className="btn-ghost px-2 text-xs text-slate-500 hover:text-red-400"
              title="Disconnect"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
