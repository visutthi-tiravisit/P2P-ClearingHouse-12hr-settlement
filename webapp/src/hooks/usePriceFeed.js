import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';

const BINANCE_WS  = 'wss://stream.binance.com:9443/ws/ethusdt@trade';
const BINANCE_REST = 'https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=6m&limit=120';
const COINGECKO   = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

export function usePriceFeed() {
  const { contract } = useWallet();
  const [price,        setPrice]        = useState(null);
  const [prevPrice,    setPrevPrice]    = useState(null);
  const [priceHistory, setPriceHistory] = useState([]); // [{time: ms, value: usd}]
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [source,       setSource]       = useState('—');
  const [lastUpdated,  setLastUpdated]  = useState(null);

  const wsRef       = useRef(null);
  const contractRef = useRef(contract);
  contractRef.current = contract;

  // ── 1. Seed 12h history from Binance klines (6-min candles × 120 = 12h) ───
  useEffect(() => {
    fetch(BINANCE_REST)
      .then(r => r.json())
      .then(klines => {
        // klines[i] = [openTime, open, high, low, close, ...]
        const pts = klines.map(k => ({ time: k[0], value: parseFloat(k[4]) }));
        setPriceHistory(pts);
        const last = pts[pts.length - 1]?.value;
        if (last) { setPrice(last); setPrevPrice(last); }
        setSource('Binance WS');
        setLoading(false);
      })
      .catch(() => {
        // Binance REST failed — fall through to WebSocket + CoinGecko fallback
      });
  }, []);

  // ── 2. WebSocket live feed ──────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      const ws = new WebSocket(BINANCE_WS);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const p = parseFloat(data.p); // trade price
        if (!isFinite(p)) return;
        setPrice(prev => { setPrevPrice(prev); return p; });
        setPriceHistory(h => [...h.slice(-119), { time: data.T, value: p }]);
        setLastUpdated(Date.now());
        setSource('Binance WS');
        setLoading(false);
        setError(null);
      };

      ws.onerror = () => setError('WebSocket error');
      ws.onclose = () => {
        if (!destroyed) setTimeout(connect, 3_000); // auto-reconnect
      };
    };

    connect();
    return () => {
      destroyed = true;
      wsRef.current?.close();
    };
  }, []);

  // ── 3. On-chain oracle (reads Chainlink, overrides if wallet connected) ────
  const fetchOnChain = useCallback(async () => {
    if (!contractRef.current) return;
    try {
      const raw = await contractRef.current.getOraclePrice();
      const p   = Number(raw) / 1e8;
      setPrice(prev => { setPrevPrice(prev); return p; });
    } catch {
      // ignore — Binance WS is primary
    }
  }, []);

  useEffect(() => {
    fetchOnChain();
    const id = setInterval(fetchOnChain, 30_000);
    return () => clearInterval(id);
  }, [fetchOnChain]);

  // ── 4. CoinGecko fallback if WS never connected ────────────────────────────
  useEffect(() => {
    const id = setTimeout(async () => {
      if (price !== null) return; // WS already gave us a price
      try {
        const res = await fetch(COINGECKO);
        const data = await res.json();
        const p = data.ethereum.usd;
        setPrice(p); setPrevPrice(p);
        setPriceHistory([{ time: Date.now(), value: p }]);
        setSource('CoinGecko');
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 5_000);
    return () => clearTimeout(id);
  }, [price]);

  const priceUp = price !== null && prevPrice !== null ? price >= prevPrice : true;
  const change  = price !== null && prevPrice !== null ? price - prevPrice : 0;

  return {
    price, prevPrice, priceHistory, priceUp, change,
    loading, error, source, lastUpdated,
  };
}
