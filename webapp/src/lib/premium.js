// Off-chain mirror of ClearingHouse.sol computePremium()
// All inputs use regular JS numbers (ETH as floats, prices as USD floats).

import { BASE_RATE_BPS, BPS_DIVISOR, CYCLE_DURATION, STABLE_END, WARNING_END } from './constants';

export function getTimePremiumBps(elapsedSeconds) {
  if (elapsedSeconds < STABLE_END) return 0;
  if (elapsedSeconds < WARNING_END) return 200; // 2%
  const critElapsed  = Math.max(0, elapsedSeconds - WARNING_END);
  const critDuration = CYCLE_DURATION - WARNING_END; // 5400s
  return 500 + Math.floor((critElapsed * 500) / critDuration); // 500–1000 bps
}

export function getSkewBps(isLong, netLongEth, netShortEth) {
  const total = netLongEth + netShortEth;
  let skewFactor = 100; // 1.0× (× 100 scale)
  if (total > 0) {
    const pool     = isLong ? netLongEth : netShortEth;
    const ratioBps = Math.floor((pool * BPS_DIVISOR) / total);
    if (ratioBps > 6000) skewFactor = 200; // overcrowded → 2×
    else if (ratioBps < 4000) skewFactor = 50; // underfilled → 0.5×
  }
  return Math.floor((BASE_RATE_BPS * skewFactor) / 100);
}

/**
 * Full premium breakdown.
 * Returns both raw bps values and human-readable percentage/ETH values
 * for the two-column Order Summary UI.
 */
export function computePremium({
  isLong, collateralEth, currentPrice, targetPrice,
  elapsedSeconds, netLongEth, netShortEth,
}) {
  const skewBps = getSkewBps(isLong, netLongEth, netShortEth);
  const timeBps = getTimePremiumBps(elapsedSeconds);

  const longITM  = isLong  && currentPrice > targetPrice;
  const shortITM = !isLong && currentPrice < targetPrice;
  const isITM    = longITM || shortITM;

  let distBps        = 0;
  let totalBps       = skewBps + timeBps;
  let isCapped       = false;
  let deltaPercent   = 0;
  let uncappedTotalBps = skewBps + timeBps;

  if (isITM && targetPrice > 0) {
    const absDelta  = Math.abs(currentPrice - targetPrice);
    deltaPercent    = absDelta / targetPrice;
    const deltaBps  = Math.floor(deltaPercent * BPS_DIVISOR);
    uncappedTotalBps = skewBps + timeBps + deltaBps;
    const cap       = Math.floor((deltaBps * 70) / 100); // 70% of ΔP cap

    if (uncappedTotalBps > cap && cap > 0) {
      isCapped    = true;
      const baseFees = skewBps + timeBps;
      distBps     = cap > baseFees ? cap - baseFees : 0;
      totalBps    = cap;
    } else {
      distBps  = deltaBps;
      totalBps = uncappedTotalBps;
    }
  }

  const premiumCostEth = (collateralEth * totalBps) / BPS_DIVISOR;
  const netPositionEth = collateralEth - premiumCostEth;
  const baseFeeEth     = (collateralEth * BASE_RATE_BPS) / BPS_DIVISOR;

  const estPayoutITM = netPositionEth * (1 + deltaPercent);
  const estPayoutOTM = netPositionEth;

  // ─ skewFactor for display (0.5×, 1.0×, or 2.0×) ─────────────────────────
  const skewFactor = BASE_RATE_BPS > 0 ? skewBps / BASE_RATE_BPS : 1;

  return {
    // Raw bps
    skewBps, timeBps, distBps, totalBps, uncappedTotalBps,
    // Display percentages (divide bps by 100)
    baseSkewPct:       skewBps / 100,
    timePremiumPct:    timeBps / 100,
    priceDistancePct:  distBps / 100,
    uncappedTotalPct:  uncappedTotalBps / 100,
    totalPct:          totalBps / 100,
    // Other display values
    skewFactor,
    isCapped,
    isITM,
    deltaPercent,
    actualDeltaPct: deltaPercent * 100,
    // ETH amounts
    premiumCostEth,
    netPositionEth,
    baseFeeEth,
    // Payout estimates
    estPayoutITM,
    estPayoutOTM,
  };
}
