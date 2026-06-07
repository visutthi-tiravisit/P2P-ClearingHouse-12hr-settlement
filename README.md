# P2P ClearingHouse · 12-Hour Linear Settlement

A peer-to-peer ETH options protocol with dynamic premiums and Chainlink oracle settlement, built as part of an IS thesis at ETH/university.

---

## Project Structure

```
ETH-OPTION/
├── ClearingHouse App.html      # Original HTML prototype (standalone, no build step)
├── components/                 # Shared JS components used by the HTML prototype
├── webapp/                     # Production React/Vite app (this is the main deliverable)
│   ├── contracts/
│   │   └── ClearingHouse.sol   # Solidity contract — deploy via Remix
│   ├── src/
│   │   ├── abis/               # Contract ABI for ethers.js
│   │   ├── lib/                # constants.js, premium.js (off-chain math)
│   │   ├── context/            # WalletContext (ethers.js v6 + MetaMask)
│   │   ├── hooks/              # usePriceFeed, useCycle, usePositions
│   │   ├── components/         # UI components
│   │   └── pages/              # Dashboard page
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## Protocol Summary

| Step | Description |
|------|-------------|
| **Deposit** | User sends ETH as collateral `C` and chooses Long or Short |
| **Premium** | `Π = R_skew + R_time + R_dist` is deducted; Net Position `N = C − (C × Π)` |
| **Settlement** | At 12h, anyone calls `settleCycle()` — Chainlink ETH/USD price is read |
| **Payout (ITM)** | `N × (1 + ΔP)` funded by the opposing pool |
| **Payout (OTM)** | Residual `N` after covering ITM gains |

**Price Surcharge cap:** `R_dist ≤ 70% × ΔP` — guarantees ≈30% profit margin even at maximum surcharge.

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
   - Make sure MetaMask is connected to **Sepolia Testnet**
   - Get Sepolia ETH from a faucet if needed (e.g. [sepoliafaucet.com](https://sepoliafaucet.com))
5. Fill in constructor arguments:
   - `_priceFeed`: `0x694AA1769357215DE4FAC081bf1f309aDC325306` (Chainlink ETH/USD on Sepolia)
   - `_treasury`: your own wallet address
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

## Running the HTML Prototype (No Build)

The original prototype runs directly in a browser without any build step:

```bash
# From the repo root — just open the file
open "ClearingHouse App.html"
```

Or drag `ClearingHouse App.html` into your browser. It includes MetaMask connection, the full dashboard, trade panel, Master Data Declaration Table, and EN/TH + dark/light toggles.

---

## Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool / dev server |
| Tailwind CSS | 3 | Utility-first styling (Liquid Glass aesthetic) |
| ethers.js | 6 | MetaMask + contract interaction |
| Chainlink | — | On-chain ETH/USD oracle (Sepolia) |
| CoinGecko API | — | Fallback price feed when wallet not connected |

---

## Contract Reference

**Network:** Sepolia Testnet  
**Chainlink ETH/USD feed:** `0x694AA1769357215DE4FAC081bf1f309aDC325306`

### Key Functions

| Function | Description |
|----------|-------------|
| `openPosition(bool isLong)` | Deposit ETH and open a Long/Short position (payable) |
| `computePremium(bool isLong, uint256 collateral)` | View full premium breakdown before signing |
| `settleCycle()` | Read Chainlink oracle and settle current cycle (callable by anyone after 12h) |
| `claimPayout(uint256 positionId)` | Claim ETH payout for a settled position |
| `getCurrentCycle()` | Returns full Cycle struct (id, pTarget, pools, payout ratios) |
| `getUserPositionIds(address)` | Returns array of position IDs for an address |
| `getPositionsBatch(uint256[])` | Batch-fetch positions in one call |

### Premium Formula

```
Π  = R_skew + R_time + R_dist

R_skew = BASE_RATE_BPS × S_factor      (S_factor: 0.5× / 1× / 2× by pool ratio)
R_time = 0 bps (Stable 0–9h)
       = 200 bps (Warning 9–10.5h)
       = 500–1000 bps linear (Critical 10.5–12h)
R_dist = |ΔP| × BPS_DIVISOR / P_target  [capped at 70% of ΔP when ITM]

N = C − (C × Π / BPS_DIVISOR)
```

---

## Development Notes

- After changing `CONTRACT_ADDRESS` in `constants.js`, no restart is needed — just save and Vite hot-reloads.
- `src/lib/premium.js` mirrors the Solidity `computePremium()` logic exactly. If you modify the contract's fee formula, update this file too so the UI preview stays accurate.
- The `settleCycle()` button appears automatically in the dashboard when `block.timestamp >= cycle.endTime`.
- Language (EN/TH) and dark/light theme toggles are in the top-right corner of the app.
