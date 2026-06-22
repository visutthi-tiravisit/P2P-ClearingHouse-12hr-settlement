import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';

function normalizeCycle(raw) {
  if (!raw) return null;
  return {
    id:               Number(raw.id),
    pTarget:          Number(raw.pTarget) / 1e8,
    pFinal:           Number(raw.pFinal)  / 1e8,
    netLong:          parseFloat(ethers.formatEther(raw.netLong)),
    netShort:         parseFloat(ethers.formatEther(raw.netShort)),
    longPayoutRatio:  Number(raw.longPayoutRatio)  / 1e18,
    shortPayoutRatio: Number(raw.shortPayoutRatio) / 1e18,
    settled:          raw.settled,
  };
}

// Returns { [cycleId]: normalizedCycle } for every id in the array.
// Re-fetches whenever the set of ids or the contract instance changes.
export function useCyclesById(cycleIds) {
  const { contract } = useWallet();
  const [cyclesById, setCyclesById] = useState({});

  // Serialize the id list so the effect only re-runs when the set changes.
  const key = [...cycleIds].sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (!contract || cycleIds.length === 0) { setCyclesById({}); return; }
    let cancelled = false;
    Promise.all(cycleIds.map(id => contract.getCycleById(id)))
      .then(raws => {
        if (cancelled) return;
        const map = {};
        raws.forEach((raw, i) => { if (raw) map[cycleIds[i]] = normalizeCycle(raw); });
        setCyclesById(map);
      })
      .catch(err => console.error('[useCyclesById]', err));
    return () => { cancelled = true; };
  // key captures cycleIds content; contract is the other dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, key]);

  return cyclesById;
}
