import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CYCLE_DURATION } from '../lib/constants';

function normalizeCycle(raw) {
  if (!raw) return null;
  return {
    id:               Number(raw.id),
    startTime:        Number(raw.startTime),
    endTime:          Number(raw.endTime),
    pTarget:          Number(raw.pTarget) / 1e8,
    pFinal:           Number(raw.pFinal)  / 1e8,
    netLong:          parseFloat(ethers.formatEther(raw.netLong)),
    netShort:         parseFloat(ethers.formatEther(raw.netShort)),
    longPayoutRatio:  Number(raw.longPayoutRatio)  / 1e18,
    shortPayoutRatio: Number(raw.shortPayoutRatio) / 1e18,
    settled:          raw.settled,
  };
}

export function useCycle() {
  const { contract } = useWallet();
  const [cycle,   setCycle] = useState(null);
  const [phase,   setPhase] = useState(0);
  const [elapsed,   setElapsed]   = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchCycle = useCallback(async () => {
    if (!contract) { setLoading(false); return; }
    try {
      const [rawCycle, rawPhase, rawElapsed] = await Promise.all([
        contract.getCurrentCycle(),
        contract.getCyclePhase(),
        contract.getCycleElapsed(),
      ]);
      const current = normalizeCycle(rawCycle);
      setCycle(current);
      setPhase(Number(rawPhase));
      setElapsed(Number(rawElapsed));

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Poll contract every 10s
  useEffect(() => {
    fetchCycle();
    const id = setInterval(fetchCycle, 10_000);
    return () => clearInterval(id);
  }, [fetchCycle]);

  // Local second-level countdown tick
  useEffect(() => {
    if (!cycle) return;
    const tick = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const el  = Math.min(now - cycle.startTime, CYCLE_DURATION);
      setElapsed(el);
    }, 1000);
    return () => clearInterval(tick);
  }, [cycle]);

  const remaining = cycle
    ? Math.max(0, cycle.endTime - Math.floor(Date.now() / 1000))
    : 0;
  const progress = elapsed / CYCLE_DURATION; // 0→1

  const settle = useCallback(async () => {
    if (!contract) throw new Error('Wallet not connected');
    const tx = await contract.settleCycle();
    await tx.wait();
    fetchCycle();
  }, [contract, fetchCycle]);

  const devFastForward = useCallback(async () => {
    if (!contract) throw new Error('Wallet not connected');
    const tx = await contract.devFastForward();
    await tx.wait();
    fetchCycle();
  }, [contract, fetchCycle]);

  const devForceSettle = useCallback(async () => {
    if (!contract) throw new Error('Wallet not connected');
    const tx = await contract.devForceSettle();
    await tx.wait();
    fetchCycle();
  }, [contract, fetchCycle]);

  return { cycle, phase, elapsed, remaining, progress, loading, error, refetch: fetchCycle, settle, devFastForward, devForceSettle };
}
