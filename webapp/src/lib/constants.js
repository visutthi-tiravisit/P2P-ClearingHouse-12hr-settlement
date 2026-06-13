// ─── Roles ────────────────────────────────────────────────────────────────────
export const TREASURY_ADDRESS = '0x00B75a4087b59D763918394F0eF34BE1Ff03B759';

// ─── Network ──────────────────────────────────────────────────────────────────
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX_CHAIN_ID = '0xaa36a7';

// ─── Contract ─────────────────────────────────────────────────────────────────
// Replace with deployed address after running in Remix + Sepolia
export const CONTRACT_ADDRESS = '0x111Dc5a9D306493b9C51ebF63EE19b001B8082cb';

// Chainlink ETH/USD price feed on Sepolia
export const CHAINLINK_ETH_USD_SEPOLIA = '0x694AA1769357215DE4FAC081bf1f309aDC325306';

// ─── Protocol constants (mirrors ClearingHouse.sol) ──────────────────────────
export const CYCLE_DURATION = 43200;   // 12 hours
export const STABLE_END     = 32400;   // 9 hours
export const WARNING_END    = 37800;   // 10.5 hours
export const BASE_RATE_BPS  = 10;
export const BPS_DIVISOR    = 10_000;
export const MIN_COLLATERAL_ETH = 0.001;

// ─── Phase labels ─────────────────────────────────────────────────────────────
export const PHASE_META = [
  { label: 'Stable',   color: '#00d4aa', glow: '#00d4aa33' },  // 0–9h
  { label: 'Warning',  color: '#f59e0b', glow: '#f59e0b33' },  // 9–10.5h
  { label: 'Critical', color: '#ef4444', glow: '#ef444433' },  // 10.5–12h
];
