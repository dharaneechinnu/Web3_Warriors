import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import PlatformTokenABI from '../web3/abi/SkillToken.json';
import { SKILL_TOKEN_ADDRESS } from '../web3/config';

// ═══════════════════════════════════════════════════════════════════
// useWalletOwner
//
// Single source of truth: is the connected MetaMask wallet the
// PlatformToken contract owner?
//
// Returns:
//   isOwner         {boolean} — true if connected wallet == contract owner
//   ownerAddress    {string}  — contract owner address (read from chain)
//   connectedAddress {string} — currently connected MetaMask address
//   checking        {boolean} — true while the async check is in flight
// ═══════════════════════════════════════════════════════════════════

export function useWalletOwner() {
  const [isOwner,          setIsOwner]          = useState(false);
  const [ownerAddress,     setOwnerAddress]     = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [checking,         setChecking]         = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      if (!window.ethereum) {
        setIsOwner(false);
        return;
      }

      const w3       = new Web3(window.ethereum);
      const accounts = await w3.eth.getAccounts();
      const connected = accounts[0] || '';
      setConnectedAddress(connected);

      if (!connected) {
        setIsOwner(false);
        setOwnerAddress('');
        return;
      }

      const contract = new w3.eth.Contract(PlatformTokenABI, SKILL_TOKEN_ADDRESS);
      const owner    = await contract.methods.owner().call();
      setOwnerAddress(owner);
      setIsOwner(connected.toLowerCase() === owner.toLowerCase());
    } catch (err) {
      console.log('[useWalletOwner] owner check failed:', err.message);
      setIsOwner(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();

    if (!window.ethereum) return;
    // Re-check whenever MetaMask account changes
    window.ethereum.on('accountsChanged', check);
    return () => window.ethereum.removeListener('accountsChanged', check);
  }, [check]);

  return { isOwner, ownerAddress, connectedAddress, checking };
}
