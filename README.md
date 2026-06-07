# P2P ClearingHouse · 12-Hour Linear Settlement

> **Academic Project** — Master of Science in Computer Science and Information Systems  
> National Institute of Development Administration (NIDA), Bangkok, Thailand  
> Course: **CI7103 Blockchain**

A peer-to-peer ETH options clearing protocol with dynamic premiums, 12-hour settlement cycles, and Chainlink oracle pricing — built end-to-end as a course project, from Solidity contract to a full React/Vite frontend.

---

## Table of Contents

- [Overview](#overview)
- [Protocol Design](#protocol-design)
- [Project Structure](#project-structure)
- [Deployment Guide](#deployment-guide)
- [Frontend Stack](#frontend-stack)
- [Contract Reference](#contract-reference)
- [Development Notes](#development-notes)

---

## Overview

This project implements a trustless, on-chain clearing house for peer-to-peer ETH/USD options. Two counterparties — a **Long** (ETH rises) and a **Short** (ETH falls) — deposit ETH collateral into the contract. At the end of each 12-hour settlement cycle, the Chainlink ETH/USD oracle is read and profits are distributed automatically with no intermediary.

Key design goals:
- **Trustless settlement** — `settleCycle()` is permissionless; anyone can trigger it after the cycle ends
- **Dynamic premium** — entry cost adjusts for pool imbalance, time-to-expiry, and current price drift
- **Treasury fee** — a configurable fee is forwarded on-chain to the treasury address at settlement
- **On-chain transparency** — all premium components are viewable before signing

---

## Protocol Design

### Settlement Flow

| Step | Description |
|------|-------------|
| **Deposit** | User sends ETH as collateral `C` and chooses Long or Short |
| **Premium** | `Π = R_skew + R_time + R_dist` is deducted; Net Position `N = C − (C × Π)` |
| **Settlement** | At 12 h, anyone calls `settleCycle()` — Chainlink ETH/USD price is read |
| **Payout (ITM)** | `N × (1 + ΔP)` funded by the opposing pool |
| **Payout (OTM)** | Residual `N` after covering ITM gains |

### Premium Formula

```
Π  = R_skew + R_time + R_dist

R_skew = BASE_RATE_BPS × S_factor      (S_factor: 0.5× balanced / 1× moderate / 2× skewed)
R_time = 0 bps        (Stable   0 – 9 h)
       = 200 bps      (Warning  9 – 10.5 h)
       = 500–1000 bps (Critical 10.5 – 12 h, linear)
R_dist = |ΔP| × BPS_DIVISOR / P_target  [capped at 70% of ΔP when ITM]

N = C − (C × Π / BPS_DIVISOR)
```

**Price Surcharge cap:** `R_dist ≤ 70% × ΔP` — guarantees ≈30% profit margin even at maximum surcharge.

---

## Project Structure

```
P2P-ClearingHouse-12hr-settlement/
├── webapp/
│   ├── contracts/
│   │   └── ClearingHouse.sol         # Solidity smart contract — deploy via Remix
│   ├── src/
│   │   ├── abis/
│   │   │   └── ClearingHouse.json    # Contract ABI for ethers.js
│   │   ├── lib/
│   │   │   ├── constants.js          # CONTRACT_ADDRESS + chain config
│   │   │   └── premium.js            # Off-chain mirror of on-chain premium formula
│   │   ├── context/
│   │   │   └── WalletContext.jsx     # ethers.js v6 + MetaMask provider
│   │   ├── hooks/
│   │   │   ├── usePriceFeed.js       # Chainlink + CoinGecko fallback price
│   │   │   ├── useCycle.js           # Active cycle state & countdown
│   │   │   ├── usePositions.js       # User position fetching & polling
│   │   │   └── useTreasury.js        # Treasury balance & fee display
│   │   ├── components/               # UI components (TradePanel, HoldingsTable, etc.)
│   │   └── pages/
│   │       └── Dashboard.jsx         # Main app page
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## Deployment Guide

### Step 1 — Deploy the Smart Contract (Remix + Sepolia)

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create a new file and paste the contents of `webapp/contracts/ClearingHouse.sol`
3. In the **Solidity Compiler** tab:
   - Select compiler version `0.8.20` or higher
   - Click **Compile ClearingHouse.sol**
4. In the **Deploy & Run Transactions** tab:
   - Environment: **Injected Provider — MetaMask**
   - Connect MetaMask to **Sepolia Testnet**
   - Get Sepolia ETH from a faucet if needed (e.g. [sepoliafaucet.com](https://sepoliafaucet.com))
5. Fill in constructor arguments:
   - `_priceFeed`: `0x694AA1769357215DE4FAC081bf1f309aDC325306` *(Chainlink ETH/USD on Sepolia)*
   - `_treasury`: your own wallet address *(receives protocol fees)*
6. Click **Deploy** and confirm the MetaMask transaction
7. Copy the deployed contract address from the Remix console

### Step 2 — Configure the Frontend

Open `webapp/src/lib/constants.js` and replace the placeholder address:

```js
// Before
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// After — paste your Remix-deployed address here
export const CONTRACT_ADDRESS = '0xYourDeployedAddressHere';
```

### Step 3 — Run the Frontend

```bash
cd webapp
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 4 — Connect MetaMask

1. Click **Connect MetaMask** in the app
2. The app will prompt you to switch to Sepolia if you are on the wrong network
3. Once connected, the live Chainlink oracle price feeds into the UI automatically

---

## Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool / dev server |
| Tailwind CSS | 3 | Utility-first styling |
| ethers.js | 6 | MetaMask + contract interaction |
| Chainlink | — | On-chain ETH/USD oracle (Sepolia) |
| CoinGecko API | — | Fallback price feed when wallet is not connected |

---

## Contract Reference

**Network:** Sepolia Testnet  
**Chainlink ETH/USD feed:** `0x694AA1769357215DE4FAC081bf1f309aDC325306`

### Key Functions

| Function | Description |
|----------|-------------|
| `openPosition(bool isLong)` | Deposit ETH and open a Long/Short position (payable) |
| `computePremium(bool isLong, uint256 collateral)` | View full premium breakdown before signing |
| `settleCycle()` | Read Chainlink oracle and settle the current cycle (permissionless after 12 h) |
| `claimPayout(uint256 positionId)` | Claim ETH payout for a settled position |
| `getCurrentCycle()` | Returns full Cycle struct (id, pTarget, pool sizes, payout ratios) |
| `getUserPositionIds(address)` | Returns array of position IDs for an address |
| `getPositionsBatch(uint256[])` | Batch-fetch multiple positions in one call |

---

## Development Notes

- After updating `CONTRACT_ADDRESS` in `constants.js`, no restart is needed — Vite hot-reloads automatically.
- `src/lib/premium.js` mirrors the Solidity `computePremium()` logic exactly. If you modify the contract's fee formula, update this file too so the UI preview stays accurate.
- The **Settle Cycle** button appears automatically once `block.timestamp >= cycle.endTime`.
- Language (EN/TH) and dark/light theme toggles are in the top-right corner of the app.
- The **Sandbox** panel (visible to the treasury address only) provides dev functions for testing settlement without waiting 12 hours.

---

*Submitted as a course project for CI7103 Blockchain — NIDA, 2025*
