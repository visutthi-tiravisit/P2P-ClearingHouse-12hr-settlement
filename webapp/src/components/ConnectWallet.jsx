import { useWallet } from '../context/WalletContext';

export default function ConnectWallet({ t }) {
  const { connect, connecting, error } = useWallet();

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute w-96 h-96 rounded-full bg-teal/5 blur-[120px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-long/5  blur-[100px] bottom-10 right-10  pointer-events-none" />

      <div className="glass p-10 max-w-md w-full mx-4 text-center animate-slide-up">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center glow-teal">
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#00d4aa" strokeWidth="1.5" />
            <path d="M10 20 L16 8 L22 20" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 17h8" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          P2P ClearingHouse
        </h1>
        <p className="text-xs font-mono text-teal/80 tracking-widest mb-6">
          12-HOUR LINEAR SETTLEMENT · SEPOLIA
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left">
            {error}
          </div>
        )}

        <button
          onClick={connect}
          disabled={connecting}
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
        >
          {connecting ? (
            <>
              <span className="w-4 h-4 border-2 border-[#070b12]/40 border-t-[#070b12] rounded-full animate-spin" />
              {t.connectingBtn ?? 'Connecting…'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.5 12a9.5 9.5 0 11-19 0 9.5 9.5 0 0119 0zm-9.5-5a1 1 0 00-1 1v3H8a1 1 0 000 2h3v3a1 1 0 002 0v-3h3a1 1 0 000-2h-3V8a1 1 0 00-1-1z" />
              </svg>
              {t.connectBtn ?? 'Connect MetaMask'}
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-slate-600">
          Requires MetaMask · Sepolia Testnet
        </p>
      </div>
    </div>
  );
}
