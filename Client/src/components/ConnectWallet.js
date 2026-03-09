import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { EXPECTED_CHAIN_ID, NETWORK_NAME } from '../web3/config';
import api from '../services/api';
import { getBalance } from '../web3/services/skillTokenService';
import { useAuth } from '../contexts/AuthContext';

const Btn = styled.button`
  padding: 0.5rem 0.9rem;
  background: linear-gradient(135deg,#06b6d4,#d946ef);
  color: white;
  border-radius: 0.6rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
`;

const Addr = styled.span`
  font-family: monospace;
  background: rgba(255,255,255,0.04);
  padding: 0.25rem 0.5rem;
  border-radius: 0.45rem;
  color: #e6eef8;
`;

export default function ConnectWallet({ compact }) {
  const { user, token } = useAuth();
  const storageKey = user && user._id ? `walletAddress:${user._id}` : 'walletAddress';
  const [address, setAddress] = useState(localStorage.getItem(storageKey) || '');
  const [ptkn, setPtkn] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) fetchBalance(address);
  }, [address]);

  // Keep address in sync when user context changes (use per-user key)
  useEffect(() => {
    const key = user && user._id ? `walletAddress:${user._id}` : 'walletAddress';
    const addr = localStorage.getItem(key) || '';
    setAddress(addr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user && user._id]);

  const fetchBalance = async (addr) => {
    try {
      const b = await getBalance(addr);
      setPtkn(b);
    } catch (e) {
      console.warn('getBalance failed', e.message);
    }
  };

  const connect = async () => {
    if (!window.ethereum) return alert('Please install MetaMask or another web3 wallet');
    setLoading(true);
    try {
      const w3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await w3.eth.getAccounts();
      const addr = accounts[0];
      if (!addr) throw new Error('No account');

      // If EXPECTED_CHAIN_ID is configured, ensure MetaMask is on the correct network
      try {
        if (typeof EXPECTED_CHAIN_ID !== 'undefined' && EXPECTED_CHAIN_ID !== null) {
          const chainId = Number(await w3.eth.getChainId());
          if (chainId !== EXPECTED_CHAIN_ID) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: Web3.utils.toHex(EXPECTED_CHAIN_ID) }],
              });
            } catch (switchErr) {
              // If the chain is not added to MetaMask, ask user to add it (4902)
              if (switchErr.code === 4902) {
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: Web3.utils.toHex(EXPECTED_CHAIN_ID),
                      chainName: NETWORK_NAME || 'Testnet',
                      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                      rpcUrls: ['https://rpc.sepolia.org'],
                      blockExplorerUrls: ['https://sepolia.etherscan.io']
                    }]
                  });
                } catch (addErr) {
                  console.warn('Failed to add network to MetaMask', addErr.message || addErr);
                  alert(`Please switch MetaMask to ${NETWORK_NAME || 'the expected testnet'} and try again.`);
                  setLoading(false);
                  return;
                }
              } else {
                throw switchErr;
              }
            }
          }
        }
      } catch (netErr) {
        console.warn('Network switch/check failed', netErr.message || netErr);
      }

      // persist in user-specific key when available
      const key = user && user._id ? `walletAddress:${user._id}` : 'walletAddress';
      localStorage.setItem(key, addr);
      setAddress(addr);

      // persist to backend if logged in
      if (user && user._id && token) {
        await api.put(`/User/profile/${user._id}`, { UserWalletAddress: addr }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }

      fetchBalance(addr);
    } catch (err) {
      console.warn('Connect wallet failed', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    const key = user && user._id ? `walletAddress:${user._id}` : 'walletAddress';
    localStorage.removeItem(key);
    setAddress('');
    setPtkn(null);
  };

  if (address) {
    const short = `${address.slice(0,6)}...${address.slice(-4)}`;
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Addr title={address}>{short}</Addr>
        {ptkn != null && <div style={{ color: '#c7baff', fontSize: '0.9rem' }}>{ptkn} PTKN</div>}
        <Btn onClick={disconnect}>Disconnect</Btn>
      </div>
    );
  }

  return (
    <div>
      <Btn onClick={connect} disabled={loading}>{loading ? 'Connecting…' : (compact ? 'Connect' : 'Connect Wallet')}</Btn>
    </div>
  );
}
