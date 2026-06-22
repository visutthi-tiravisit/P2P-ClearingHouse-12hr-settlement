import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';

function normalizePosition(raw) {
  return {
    id:          Number(raw.id),
    owner:       raw.owner,
    cycleId:     Number(raw.cycleId),
    isLong:      raw.isLong,
    collateral:  parseFloat(ethers.formatEther(raw.collateral)),
    netPosition: parseFloat(ethers.formatEther(raw.netPosition)),
    entryPrice:  Number(raw.entryPrice) / 1e8,
    premiumBps:  Number(raw.premiumBps),
    openedAt:    Number(raw.openedAt),
    claimed:     raw.claimed,
  };
}

function receiptsKey(account) {
  return `eth_option_receipts_${account?.toLowerCase()}`;
}

export function usePositions() {
  const { contract, account } = useWallet();
  const [positions,     setPositions]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [claiming,      setClaiming]      = useState(null);
  // keyed by positionId → { txHash, blockNumber, settledAmount, gasCostEth }
  const [claimReceipts, setClaimReceipts] = useState(() => {
    // Hydrate from localStorage on first render — no account yet, loaded below
    return {};
  });

  // Load receipts from localStorage when account is available
  useEffect(() => {
    if (!account) { setClaimReceipts({}); return; }
    try {
      const saved = localStorage.getItem(receiptsKey(account));
      if (saved) setClaimReceipts(JSON.parse(saved));
    } catch {}
  }, [account]);

  // Persist receipts whenever they change
  useEffect(() => {
    if (!account || Object.keys(claimReceipts).length === 0) return;
    try {
      localStorage.setItem(receiptsKey(account), JSON.stringify(claimReceipts));
    } catch {}
  }, [account, claimReceipts]);

  const fetchPositions = useCallback(async () => {
    if (!contract || !account) { setPositions([]); return; }
    setLoading(true);
    setError(null);
    try {
      const idsRaw  = await contract.getUserPositionIds(account);
      const ids     = Array.from(idsRaw);

      console.debug('[usePositions] account:', account, '| ids:', ids);

      if (ids.length === 0) {
        setPositions([]);
        return;
      }

      const rawPositions = await contract.getPositionsBatch(ids);
      setPositions(Array.from(rawPositions).map(normalizePosition));
    } catch (err) {
      console.error('[usePositions] fetch error:', err);
      setError(err.reason ?? err.message ?? 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchPositions();
    const id = setInterval(fetchPositions, 15_000);
    return () => clearInterval(id);
  }, [fetchPositions]);

  // estimatedPayout: the live-computed payout value at the moment the user clicks Claim.
  // It is frozen into the receipt so the UI shows a stable confirmed amount post-tx.
  const claim = useCallback(async (positionId, estimatedPayout) => {
    if (!contract) return;
    setClaiming(positionId);
    try {
      const tx      = await contract.claimPayout(positionId);
      const receipt = await tx.wait();

      // Gas cost in ETH: gasUsed × gasPrice (effectiveGasPrice for EIP-1559 chains)
      const gasPrice   = receipt.gasPrice ?? receipt.effectiveGasPrice ?? 0n;
      const gasCostWei = receipt.gasUsed * gasPrice;
      const gasCostEth = parseFloat(ethers.formatEther(gasCostWei));

      // Parse exact payout from the PayoutClaimed event so the UI shows what the
      // contract actually transferred, not a UI estimate minus gas.
      let payout = estimatedPayout ?? 0;
      try {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
            if (parsed?.name === 'PayoutClaimed' && Number(parsed.args.positionId) === positionId) {
              payout = parseFloat(ethers.formatEther(parsed.args.payout));
              break;
            }
          } catch {}
        }
      } catch {}

      setClaimReceipts(prev => ({
        ...prev,
        [positionId]: {
          txHash:      receipt.hash,
          blockNumber: receipt.blockNumber,
          gasCostEth,
          payout,                                    // exact on-chain transfer amount
          settledAmount: Math.max(0, payout - gasCostEth), // kept for old-receipt compat
        },
      }));

      await fetchPositions();
    } catch (err) {
      console.error('[usePositions] claim error:', err);
    } finally {
      setClaiming(null);
    }
  }, [contract, fetchPositions]);

  const totalCollateral = positions.reduce((s, p) => s + p.collateral, 0);
  const totalNet        = positions.reduce((s, p) => s + p.netPosition, 0);
  const openCount       = positions.filter(p => !p.claimed).length;

  return {
    positions, loading, error, claiming, claimReceipts,
    refetch: fetchPositions, claim,
    totalCollateral, totalNet, openCount,
  };
}
