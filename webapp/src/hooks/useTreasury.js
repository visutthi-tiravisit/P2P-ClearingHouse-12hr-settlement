import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';

export function useTreasury() {
  const { contract, provider } = useWallet();
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!contract || !provider) return;
    try {
      const addr = await contract.treasury();
      setAddress(addr);
      const bal = await provider.getBalance(addr);
      setBalance(parseFloat(ethers.formatEther(bal)));
    } catch {}
  }, [contract, provider]);

  useEffect(() => {
    fetchBalance();
    const id = setInterval(fetchBalance, 15_000);
    return () => clearInterval(id);
  }, [fetchBalance]);

  return { address, balance, refetch: fetchBalance };
}
