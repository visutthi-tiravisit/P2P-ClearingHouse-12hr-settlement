import { useState } from 'react';

// ─── Navigation tree ──────────────────────────────────────────────────────────

const NAV = [
  {
    section: 'Overview',
    items: [{ id: 'overview', label: 'Project Overview' }],
  },
  {
    section: 'Getting Started',
    items: [
      { id: 'uc01', label: 'UC-01 · Connect Wallet' },
      { id: 'uc02', label: 'UC-02 · Disconnect Wallet' },
    ],
  },
  {
    section: 'Interface',
    items: [
      { id: 'uc03', label: 'UC-03 · Toggle Theme' },
      { id: 'uc04', label: 'UC-04 · Toggle Language' },
    ],
  },
  {
    section: 'Market Data',
    items: [
      { id: 'uc05', label: 'UC-05 · Cycle Status' },
      { id: 'uc06', label: 'UC-06 · Price Feed' },
      { id: 'uc07', label: 'UC-07 · Liquidity Pool' },
    ],
  },
  {
    section: 'Trading',
    items: [
      { id: 'uc08', label: 'UC-08 · Open Long' },
      { id: 'uc09', label: 'UC-09 · Open Short' },
      { id: 'uc10', label: 'UC-10 · Order Summary' },
    ],
  },
  {
    section: 'Holdings',
    items: [
      { id: 'uc11', label: 'UC-11 · View Holdings' },
      { id: 'uc12', label: 'UC-12 · Payout Calculation' },
      { id: 'uc13', label: 'UC-13 · ITM / OTM Status' },
    ],
  },
  {
    section: 'Advanced',
    items: [
      { id: 'uc14', label: 'UC-14 · Master Data Table' },
      { id: 'uc15', label: 'UC-15 · Sandbox Panel' },
      { id: 'uc16', label: 'UC-16 · Premium Calculation' },
      { id: 'uc17', label: 'UC-17 · Settlement Payout' },
    ],
  },
];

// ─── Page content ─────────────────────────────────────────────────────────────

const PAGES = {
  overview: {
    title: 'P2P ClearingHouse',
    badge: 'Project Overview',
    sections: [
      {
        heading: 'What is P2P ClearingHouse?',
        body: 'P2P ClearingHouse is a decentralised on-chain settlement protocol deployed on the Ethereum Sepolia testnet. Traders take directional positions (Long or Short) on the ETH/USD price movement within discrete 12-hour cycles. Payouts are funded purely by the opposing side — no market-maker or LP required.',
      },
      {
        heading: 'How Cycles Work',
        body: 'Each settlement cycle has a fixed target price (the Chainlink oracle price at cycle start) and records each trader\'s entry price at the time their transaction is mined. At cycle end the final oracle price determines which side is in-the-money (ITM). ITM positions receive a proportional share of the opposing pool; OTM positions receive their net capital back.',
      },
      {
        heading: 'Premium System',
        body: 'Every position pays a composite premium deducted from collateral before entering the pool: Base Premium (0.10% flat) + Skew Premium (pool-imbalance multiplier 0.5× / 1× / 2×) + Time Premium (0% stable / 2% warning / 5–10% critical phase) + Price Surcharge (capped at 70% of ΔP when the market has already moved in your favour).',
      },
      {
        heading: 'Technology Stack',
        body: 'Solidity smart contracts · Ethereum Sepolia · Chainlink ETH/USD price feed · React 18 + Vite · Ethers.js v6 · Tailwind CSS v3',
      },
      {
        heading: 'This Wiki',
        body: 'This document covers 17 use cases (UC-01 – UC-17) for the CI7103 course submission. Each page describes the preconditions, step-by-step flow, and postconditions for one user interaction.',
      },
    ],
  },

  uc01: {
    title: 'UC-01: Connect Wallet',
    badge: 'Getting Started',
    sections: [
      {
        heading: 'Description',
        body: 'The user connects their MetaMask wallet to gain access to the trading dashboard.',
      },
      {
        heading: 'Preconditions',
        body: '• MetaMask browser extension is installed and unlocked.\n• User has an account funded with Sepolia testnet ETH.\n• Application is open in a supported browser (Chrome / Brave / Firefox).',
      },
      {
        heading: 'Steps',
        body: '1. Open the application URL.\n2. Click the "Connect MetaMask" button on the landing screen.\n3. Approve the connection request in the MetaMask popup.\n4. If the active network is not Sepolia, MetaMask will prompt a network switch — accept it.',
      },
      {
        heading: 'Postconditions',
        body: 'The wallet address (shortened) and ETH balance appear in the top-right corner of the Topbar. The Dashboard becomes visible.',
      },
    ],
  },

  uc02: {
    title: 'UC-02: Disconnect Wallet',
    badge: 'Getting Started',
    sections: [
      {
        heading: 'Description',
        body: 'The user disconnects their MetaMask wallet and returns to the landing screen.',
      },
      {
        heading: 'Preconditions',
        body: 'A wallet is already connected.',
      },
      {
        heading: 'Steps',
        body: '1. Locate the disconnect icon (arrow-out) in the top-right wallet section of the Topbar.\n2. Click the button.\n3. The session is cleared and the ConnectWallet screen is shown.',
      },
      {
        heading: 'Postconditions',
        body: 'No wallet address is displayed. All wallet-dependent data is hidden. The user can reconnect at any time.',
      },
    ],
  },

  uc03: {
    title: 'UC-03: Toggle Theme',
    badge: 'Interface',
    sections: [
      {
        heading: 'Description',
        body: 'The user switches between dark mode (default) and light mode.',
      },
      {
        heading: 'Preconditions',
        body: 'Application is loaded (wallet connection not required).',
      },
      {
        heading: 'Steps',
        body: '1. Click the sun/moon icon in the Topbar controls.\n2. The application background, card surfaces, and text colours update immediately.',
      },
      {
        heading: 'Postconditions',
        body: 'The selected theme persists for the current session. Dark mode is the default on first load.',
      },
    ],
  },

  uc04: {
    title: 'UC-04: Toggle Language',
    badge: 'Interface',
    sections: [
      {
        heading: 'Description',
        body: 'The user switches the UI language between English (EN) and Thai (TH).',
      },
      {
        heading: 'Preconditions',
        body: 'Application is loaded.',
      },
      {
        heading: 'Steps',
        body: '1. Click the "TH" / "EN" text button in the Topbar.\n2. All UI labels, column headers, and status strings update to the selected language.',
      },
      {
        heading: 'Postconditions',
        body: 'The chosen language is applied for the session. Numeric values and addresses are not translated.',
      },
    ],
  },

  uc05: {
    title: 'UC-05: View Cycle Status',
    badge: 'Market Data',
    sections: [
      {
        heading: 'Description',
        body: 'The user views the active settlement cycle information including cycle ID, start/end time, and countdown.',
      },
      {
        heading: 'Preconditions',
        body: 'Wallet is connected and on Sepolia network.',
      },
      {
        heading: 'Steps',
        body: '1. Navigate to the Dashboard.\n2. Locate the Cycle Status card in the top-left area.\n3. The card shows: Cycle ID, start timestamp, end timestamp, time remaining, and current phase (Stable / Warning / Critical).',
      },
      {
        heading: 'Postconditions',
        body: 'The countdown updates every second in real time. Phase transitions are reflected immediately.',
      },
    ],
  },

  uc06: {
    title: 'UC-06: View Price Feed',
    badge: 'Market Data',
    sections: [
      {
        heading: 'Description',
        body: 'The user views the live Chainlink ETH/USD oracle price and historical price chart for the current cycle.',
      },
      {
        heading: 'Preconditions',
        body: 'Wallet is connected.',
      },
      {
        heading: 'Steps',
        body: '1. The PriceChart component is visible on the Dashboard.\n2. The current oracle price is displayed at the top of the chart.\n3. The target price (cycle strike) is shown as a reference line.',
      },
      {
        heading: 'Postconditions',
        body: 'Price updates on every new oracle round. The chart plots price history over the current cycle window.',
      },
    ],
  },

  uc07: {
    title: 'UC-07: View Liquidity Pool',
    badge: 'Market Data',
    sections: [
      {
        heading: 'Description',
        body: 'The user views the real-time breakdown of collateral in the Long pool and Short pool.',
      },
      {
        heading: 'Preconditions',
        body: 'Wallet is connected.',
      },
      {
        heading: 'Steps',
        body: '1. Locate the Pool Meter component on the Dashboard.\n2. It displays Long ETH vs Short ETH with a visual balance bar.\n3. The skew factor (0.5× / 1× / 2×) is derived from the ratio and shown as a badge.',
      },
      {
        heading: 'Postconditions',
        body: 'Pool totals update in real time after each new position is opened.',
      },
    ],
  },

  uc08: {
    title: 'UC-08: Open Long Position',
    badge: 'Trading',
    sections: [
      {
        heading: 'Description',
        body: 'The user opens a Long position, betting that the ETH/USD price will be higher at cycle end than the target price.',
      },
      {
        heading: 'Preconditions',
        body: 'Wallet is connected with sufficient Sepolia ETH. An active cycle exists. The user is not a treasury wallet.',
      },
      {
        heading: 'Steps',
        body: '1. Click "Long" in the TradePanel side selector.\n2. Enter a collateral amount (minimum 0.001 ETH).\n3. Review the Order Summary (premium tiers, net position, estimated payout).\n4. Click "Open Long" and confirm the MetaMask transaction.',
      },
      {
        heading: 'Postconditions',
        body: 'Transaction is mined. The position appears in the Holdings table under the current cycle.',
      },
    ],
  },

  uc09: {
    title: 'UC-09: Open Short Position',
    badge: 'Trading',
    sections: [
      {
        heading: 'Description',
        body: 'The user opens a Short position, betting that the ETH/USD price will be lower at cycle end than the target price.',
      },
      {
        heading: 'Preconditions',
        body: 'Wallet is connected with sufficient Sepolia ETH. An active cycle exists.',
      },
      {
        heading: 'Steps',
        body: '1. Click "Short" in the TradePanel side selector.\n2. Enter a collateral amount.\n3. Review the Order Summary.\n4. Click "Open Short" and confirm the MetaMask transaction.',
      },
      {
        heading: 'Postconditions',
        body: 'Transaction is mined. The position appears in Holdings with Side = Short.',
      },
    ],
  },

  uc10: {
    title: 'UC-10: Order Summary',
    badge: 'Trading',
    sections: [
      {
        heading: 'Description',
        body: 'Before submitting a trade the user can inspect a detailed breakdown of all fees and the resulting possible profit.',
      },
      {
        heading: 'Preconditions',
        body: 'TradePanel has a valid collateral amount entered.',
      },
      {
        heading: 'Steps',
        body: '1. Fill in the collateral field in the TradePanel.\n2. The Order Summary section updates live showing: Base Premium, Skew Premium, Time Premium, Price Surcharge, Total Premium %, Net Position, and Possible Profit.\n3. Expand the breakdown accordion for per-field explanations.',
      },
      {
        heading: 'Postconditions',
        body: 'All values are estimates based on the current oracle price and pool state. Actual values may differ slightly at transaction mine time.',
      },
    ],
  },

  uc11: {
    title: 'UC-11: View Holdings',
    badge: 'Holdings',
    sections: [
      {
        heading: 'Description',
        body: 'The user views all their open positions for the current and past cycles.',
      },
      {
        heading: 'Preconditions',
        body: 'Wallet is connected. At least one position has been opened.',
      },
      {
        heading: 'Steps',
        body: '1. Scroll to the HoldingsTable section of the Dashboard.\n2. The table lists each position with: Cycle ID, Side, Entry Price, Target Price, Collateral, Status (ITM / OTM), and Est. Payout.\n3. Settled positions show the on-chain payout amount.',
      },
      {
        heading: 'Postconditions',
        body: 'The table refreshes automatically after each block.',
      },
    ],
  },

  uc12: {
    title: 'UC-12: Payout Calculation',
    badge: 'Holdings',
    sections: [
      {
        heading: 'Description',
        body: 'The system calculates the expected payout for each open position based on the current oracle price.',
      },
      {
        heading: 'Formula',
        body: 'Net Position N = Collateral × (1 − Total Premium %)\nIf ITM: Payout = N × (1 + ΔP) where ΔP = |P_entry − P_target| / P_target\nIf OTM: Payout = N (capital return only)',
      },
      {
        heading: 'Notes',
        body: 'The displayed payout in Holdings reflects the on-chain claimable amount after the cycle settles. Before settlement it is an estimate. The settlement contract uses pool proportions, not the formula directly.',
      },
    ],
  },

  uc13: {
    title: 'UC-13: ITM / OTM Status',
    badge: 'Holdings',
    sections: [
      {
        heading: 'Description',
        body: 'Each position shows whether it is currently In The Money (ITM) or Out of The Money (OTM) based on live price.',
      },
      {
        heading: 'Rules',
        body: 'Long position is ITM when P_current > P_target.\nShort position is ITM when P_current < P_target.',
      },
      {
        heading: 'Display',
        body: 'ITM positions show a green "ITM" badge. OTM positions show a muted "OTM" badge. Status updates on every oracle price update.',
      },
    ],
  },

  uc14: {
    title: 'UC-14: Master Data Table',
    badge: 'Advanced',
    sections: [
      {
        heading: 'Description',
        body: 'A raw data view showing all positions across all cycles stored in the smart contract.',
      },
      {
        heading: 'Preconditions',
        body: 'Wallet connected. Accessible from the Dashboard.',
      },
      {
        heading: 'Steps',
        body: '1. Scroll to the MasterDataTable section.\n2. The table fetches all Position events from the contract and displays them with full detail including block number and transaction hash.',
      },
      {
        heading: 'Use Case',
        body: 'Useful for auditing, debugging, and academic demonstration of on-chain transparency.',
      },
    ],
  },

  uc15: {
    title: 'UC-15: Sandbox Panel',
    badge: 'Advanced',
    sections: [
      {
        heading: 'Description',
        body: 'A developer/admin panel for triggering contract admin functions such as force-settling a cycle.',
      },
      {
        heading: 'Preconditions',
        body: 'Connected wallet must be the contract owner (treasury wallet). The SandboxPanel is hidden for non-admin wallets.',
      },
      {
        heading: 'Steps',
        body: '1. Connect with the treasury wallet.\n2. The Sandbox panel appears in the Dashboard.\n3. Use the available buttons to trigger admin operations (e.g., start new cycle, force settle).',
      },
      {
        heading: 'Warning',
        body: 'Admin actions are irreversible on-chain. Use with caution on any network with real funds.',
      },
    ],
  },

  uc16: {
    title: 'UC-16: Premium Calculation',
    badge: 'Advanced',
    sections: [
      {
        heading: 'Description',
        body: 'Understanding how the multi-tier premium is computed before a position is accepted.',
      },
      {
        heading: 'Components',
        body: 'R_base = 0.001 (0.10% of collateral)\nS_factor = 0.5 if long pool > 2× short; 2.0 if short pool > 2× long; else 1.0\nR_skew = R_base × S_factor\nR_time = 0% (stable) / 2% (warning) / 5–10% (critical, interpolated)\nR_dist = min(0.7 × ΔP, 0.7) when ΔP > 0 and position is already favoured\nΠ_total = R_skew + R_time + R_dist',
      },
      {
        heading: 'Application',
        body: 'Net Position N = C × (1 − Π_total). Π_total is capped to prevent N from going negative.',
      },
    ],
  },

  uc17: {
    title: 'UC-17: Settlement Payout',
    badge: 'Advanced',
    sections: [
      {
        heading: 'Description',
        body: 'At the end of each 12-hour cycle the contract distributes the ITM pool to winning positions proportionally.',
      },
      {
        heading: 'Settlement Logic',
        body: '1. The oracle final price is recorded.\n2. All positions are classified ITM or OTM.\n3. OTM net positions are moved to the ITM payout pool.\n4. Each ITM position receives: (its net position / total ITM net) × total payout pool.',
      },
      {
        heading: 'Claiming',
        body: 'After settlement, payout amounts are claimable on-chain. The Holdings table shows the exact ETH amount each settled position can claim.',
      },
    ],
  },
};

// ─── Content renderer ─────────────────────────────────────────────────────────

function PageContent({ pageId }) {
  const page = PAGES[pageId] ?? PAGES.overview;

  return (
    <article className="max-w-2xl mx-auto px-8 py-10">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#1c2636]">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-teal/70 mb-2 block">
          {page.badge}
        </span>
        <h1 className="text-2xl font-bold text-slate-100">{page.title}</h1>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {page.sections.map((sec, i) => (
          <section key={i}>
            <h2 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-teal/60 inline-block" />
              {sec.heading}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
              {sec.body}
            </p>
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-14 pt-6 border-t border-[#1c2636] text-[11px] text-slate-600 font-mono">
        P2P ClearingHouse · CI7103 Submission · Sepolia Testnet
      </div>
    </article>
  );
}

// ─── Main WikiPage ────────────────────────────────────────────────────────────

export default function WikiPage({ onClose }) {
  const [activePage, setActivePage] = useState('overview');

  return (
    <div className="h-screen flex flex-col bg-[#070b12] text-slate-100 overflow-hidden">

      {/* Top bar */}
      <header className="h-14 shrink-0 flex items-center px-4 border-b border-[#1c2636] bg-[#0a0f1a]/80 backdrop-blur-sm z-20 gap-4">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal/10 border border-teal/25 flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#00d4aa" strokeWidth="1.2" />
              <path d="M6 13L10 5L14 13" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 11h5" stroke="#00d4aa" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-sm text-slate-100">ClearingHouse</span>
          <span className="text-[10px] font-semibold text-teal/60 tracking-widest uppercase">/ Wiki</span>
        </div>

        <div className="flex-1" />

        {/* Close */}
        <button
          onClick={onClose}
          className="btn-ghost flex items-center gap-1.5 text-xs"
          title="Back to app"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to App
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="w-56 shrink-0 border-r border-[#1c2636] bg-[#0a0f1a]/60 overflow-y-auto py-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-600 px-4 mb-3">
            Contents
          </p>

          {NAV.map(({ section, items }) => (
            <div key={section} className="mb-4">
              <p className="text-[11px] font-semibold text-slate-400 px-4 mb-1">{section}</p>
              {items.map(({ id, label }) => {
                const active = activePage === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActivePage(id)}
                    className={`w-full text-left text-xs px-4 py-1.5 flex items-center gap-2 transition-colors duration-100
                      ${active
                        ? 'text-teal bg-teal/8'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                      }`}
                  >
                    {active && (
                      <span className="w-1 h-1 rounded-full bg-teal shrink-0" />
                    )}
                    {!active && <span className="w-1 h-1 shrink-0" />}
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <PageContent pageId={activePage} />
        </main>
      </div>
    </div>
  );
}
