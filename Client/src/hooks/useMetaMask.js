/**
 * useMetaMask.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook for MetaMask / EIP-1193 wallet integration using web3.js v4.
 *
 * Returns:
 *   {
 *     account,            // connected address (or null)
 *     chainId,            // current chain ID (number, or null)
 *     balance,            // ETH / MATIC balance (string, human-readable)
 *     sktBalance,         // SKT token balance (string, human-readable)
 *     isConnecting,       // true while connection is in-flight
 *     isConnected,        // shorthand: account !== null
 *     error,              // string | null
 *     connect,            // () => Promise<void>
 *     disconnect,         // () => void
 *     switchToGanache,    // () => Promise<void>
 *     switchToAmoy,       // () => Promise<void>
 *     requestApproval,    // (spender, amountSKT) => Promise<txHash|null>
 *     getSKTBalance,      // (address?) => Promise<string>
 *   }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Web3 } from 'web3';

// ── ERC-20 ABI fragments ──────────────────────────────────────────────────────
const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// ── Chain definitions ─────────────────────────────────────────────────────────
const GANACHE_CHAIN = {
  chainId         : '0x539',   // 1337
  chainName       : 'Ganache Local',
  nativeCurrency  : { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls         : ['http://127.0.0.1:7545'],
  blockExplorerUrls: [],
};

const AMOY_CHAIN = {
  chainId         : '0x13882', // 80002
  chainName       : 'Polygon Amoy Testnet',
  nativeCurrency  : { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls         : ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
};

// ── Contract addresses from env ───────────────────────────────────────────────
const SKT_ADDRESS      = process.env.REACT_APP_SKT_ADDRESS      || '';
const PLATFORM_ADDRESS = process.env.REACT_APP_PLATFORM_ADDRESS || '';

// ── Hook ──────────────────────────────────────────────────────────────────────
export default function useMetaMask() {
  const [account,      setAccount]      = useState(null);
  const [chainId,      setChainId]      = useState(null);
  const [balance,      setBalance]      = useState('0');
  const [sktBalance,   setSktBalance]   = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState(null);

  const web3Ref = useRef(null);

  function getWeb3() {
    if (!window.ethereum) throw new Error('MetaMask is not installed.');
    if (!web3Ref.current) {
      web3Ref.current = new Web3(window.ethereum);
    }
    return web3Ref.current;
  }

  // ── Fetch balances ──────────────────────────────────────────────────────────
  const fetchBalances = useCallback(async (addr) => {
    if (!addr) return;
    try {
      const web3 = getWeb3();

      // Native balance
      const weiBalance = await web3.eth.getBalance(addr);
      setBalance(web3.utils.fromWei(weiBalance, 'ether'));

      // SKT ERC-20 balance
      if (SKT_ADDRESS) {
        const skt      = new web3.eth.Contract(ERC20_ABI, SKT_ADDRESS);
        const rawBal   = await skt.methods.balanceOf(addr).call();
        const decimals = await skt.methods.decimals().call();
        const divisor  = BigInt(10) ** BigInt(Number(decimals));
        const whole    = Number(BigInt(rawBal) / divisor);
        const fraction = Number(BigInt(rawBal) % divisor) / Number(divisor);
        setSktBalance((whole + fraction).toFixed(4));
      }
    } catch (err) {
      console.warn('[useMetaMask] fetchBalances:', err.message);
    }
  }, []);

  // ── Auto-restore ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    (async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const addr = accounts[0];
          const cid  = Number(await window.ethereum.request({ method: 'eth_chainId' }));
          setAccount(addr);
          setChainId(cid);
          await fetchBalances(addr);
        }
      } catch (err) {
        console.warn('[useMetaMask] auto-restore:', err.message);
      }
    })();

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setBalance('0');
        setSktBalance('0');
      } else {
        setAccount(accounts[0]);
        fetchBalances(accounts[0]);
      }
    };

    const onChainChanged = (hexChainId) => {
      setChainId(Number(hexChainId));
      web3Ref.current = null; // reset on chain switch
      if (account) fetchBalances(account);
    };

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged',    onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged',    onChainChanged);
    };
  }, [account, fetchBalances]);

  // ── Connect ─────────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask is not installed. Please install it from metamask.io');

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr     = accounts[0];
      const cid      = Number(await window.ethereum.request({ method: 'eth_chainId' }));

      setAccount(addr);
      setChainId(cid);
      await fetchBalances(addr);
    } catch (err) {
      const msg = err.code === 4001
        ? 'Connection rejected by user.'
        : err.message || 'Failed to connect to MetaMask.';
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalances]);

  // ── Disconnect ──────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance('0');
    setSktBalance('0');
    setChainId(null);
    setError(null);
    web3Ref.current = null;
  }, []);

  // ── Switch network ──────────────────────────────────────────────────────────
  const switchToChain = useCallback(async (chainDef) => {
    setError(null);
    try {
      await window.ethereum.request({
        method : 'wallet_switchEthereumChain',
        params : [{ chainId: chainDef.chainId }],
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        try {
          await window.ethereum.request({
            method : 'wallet_addEthereumChain',
            params : [chainDef],
          });
        } catch (addErr) {
          setError(addErr.message);
          throw addErr;
        }
      } else {
        setError(switchErr.message);
        throw switchErr;
      }
    }
  }, []);

  const switchToGanache = useCallback(() => switchToChain(GANACHE_CHAIN), [switchToChain]);
  const switchToAmoy    = useCallback(() => switchToChain(AMOY_CHAIN),    [switchToChain]);

  // ── Approve SKT spending ────────────────────────────────────────────────────
  /**
   * @param {string}        spender    - Address to approve (SkillPlatform)
   * @param {string|number} amountSKT  - Whole SKT amount (e.g. 10)
   * @returns {Promise<string|null>} tx hash or null
   */
  const requestApproval = useCallback(async (spender, amountSKT) => {
    setError(null);
    try {
      if (!account)      throw new Error('Wallet not connected.');
      if (!SKT_ADDRESS)  throw new Error('SKT_ADDRESS not configured (REACT_APP_SKT_ADDRESS).');
      if (!spender)      throw new Error('spender address required.');

      const web3     = getWeb3();
      const skt      = new web3.eth.Contract(ERC20_ABI, SKT_ADDRESS);
      const decimals = await skt.methods.decimals().call();
      const amount   = BigInt(Math.floor(Number(amountSKT))) * (BigInt(10) ** BigInt(Number(decimals)));

      const tx = await skt.methods.approve(spender, amount.toString()).send({ from: account });
      console.log('[useMetaMask] SKT approved. Tx:', tx.transactionHash);
      return tx.transactionHash;
    } catch (err) {
      const msg = err.code === 4001
        ? 'Approval rejected by user.'
        : err.message || 'Approval failed.';
      setError(msg);
      return null;
    }
  }, [account]);

  // ── Get SKT balance on demand ───────────────────────────────────────────────
  const getSKTBalance = useCallback(async (addr) => {
    const target = addr || account;
    if (!target || !SKT_ADDRESS) return '0';
    try {
      const web3     = getWeb3();
      const skt      = new web3.eth.Contract(ERC20_ABI, SKT_ADDRESS);
      const rawBal   = await skt.methods.balanceOf(target).call();
      const decimals = await skt.methods.decimals().call();
      const divisor  = BigInt(10) ** BigInt(Number(decimals));
      const whole    = Number(BigInt(rawBal) / divisor);
      const fraction = Number(BigInt(rawBal) % divisor) / Number(divisor);
      return (whole + fraction).toFixed(4);
    } catch (err) {
      console.warn('[useMetaMask] getSKTBalance:', err.message);
      return '0';
    }
  }, [account]);

  return {
    account,
    chainId,
    balance,
    sktBalance,
    isConnecting,
    isConnected : account !== null,
    error,
    connect,
    disconnect,
    switchToGanache,
    switchToAmoy,
    requestApproval,
    getSKTBalance,
    platformAddress : PLATFORM_ADDRESS,
    sktAddress      : SKT_ADDRESS,
  };
}
