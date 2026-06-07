import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_HEX_CHAIN_ID } from '../lib/constants';
import ClearingHouseABI from '../abis/ClearingHouse.json';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [provider, setProvider]   = useState(null);
  const [signer,   setSigner]     = useState(null);
  const [account,  setAccount]    = useState(null);
  const [balance,  setBalance]    = useState(null);
  const [chainId,  setChainId]    = useState(null);
  const [contract, setContract]   = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error,    setError]      = useState(null);

  const isConnected     = !!account;
  const isSepoliaNetwork = chainId === SEPOLIA_CHAIN_ID;

  const _buildInstances = useCallback(async (ethereum) => {
    const _provider = new ethers.BrowserProvider(ethereum);
    const _signer   = await _provider.getSigner();
    const _account  = await _signer.getAddress();
    const _network  = await _provider.getNetwork();
    const _balance  = await _provider.getBalance(_account);
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, ClearingHouseABI, _signer);

    setProvider(_provider);
    setSigner(_signer);
    setAccount(_account);
    setChainId(Number(_network.chainId));
    setBalance(ethers.formatEther(_balance));
    setContract(_contract);
    return { account: _account };
  }, []);

  const switchToSepolia = useCallback(async (ethereum) => {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_HEX_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } else {
        throw switchErr;
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to continue.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const tempProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await tempProvider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia(window.ethereum);
      }
      await _buildInstances(window.ethereum);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, [_buildInstances, switchToSepolia]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setContract(null);
  }, []);

  // Wallet event listeners
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (account && accounts[0].toLowerCase() !== account.toLowerCase()) {
        window.location.reload();
      }
    };
    const onChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, [account, disconnect]);

  // Refresh balance every 15s
  useEffect(() => {
    if (!provider || !account) return;
    const refresh = async () => {
      try {
        const bal = await provider.getBalance(account);
        setBalance(ethers.formatEther(bal));
      } catch {
        // ignore
      }
    };
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [provider, account]);

  return (
    <WalletContext.Provider value={{
      provider, signer, account, balance, chainId, contract,
      isConnected, isSepoliaNetwork, connecting, error,
      connect, disconnect,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
