/**
 * WalletConnect.js
 * ─────────────────────────────────────────────────────────────────────────────
 * MetaMask wallet connection UI component.
 *
 * Props:
 *   onConnected(account)  — optional callback when wallet connects
 *   compact               — if true, render as a small button (for navbars)
 *
 * Usage:
 *   import WalletConnect from '../components/WalletConnect';
 *   <WalletConnect onConnected={(addr) => console.log(addr)} />
 *   <WalletConnect compact />
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import useMetaMask from '../hooks/useMetaMask';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;
const pulse  = keyframes`0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); } 70% { box-shadow: 0 0 0 10px rgba(139,92,246,0); }`;
const spin   = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// ── Styled components ─────────────────────────────────────────────────────────
const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const ConnectBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ $compact }) => $compact ? '6px 14px' : '10px 20px'};
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: ${({ $compact }) => $compact ? '13px' : '14px'};
  font-weight: 600;
  cursor: pointer;
  transition: opacity .2s, transform .15s;
  animation: ${pulse} 2s infinite;

  &:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  &:disabled { opacity: .55; cursor: not-allowed; animation: none; }
`;

const ConnectedCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${({ $compact }) => $compact ? '5px 12px' : '8px 16px'};
  background: rgba(16,185,129,.12);
  border: 1px solid rgba(16,185,129,.35);
  border-radius: 10px;
  animation: ${fadeIn} .3s ease;
  cursor: pointer;
  position: relative;

  &:hover > div[data-dropdown] { display: block; }
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
`;

const AddressText = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #a7f3d0;
  font-family: monospace;
`;

const BalanceText = styled.span`
  font-size: 11px;
  color: #6ee7b7;
`;

const Dropdown = styled.div`
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  background: #1a1a2e;
  border: 1px solid rgba(139,92,246,.3);
  border-radius: 10px;
  padding: 8px 0;
  z-index: 200;
  box-shadow: 0 8px 30px rgba(0,0,0,.5);
`;

const DropItem = styled.button`
  display: block;
  width: 100%;
  padding: 9px 16px;
  background: none;
  border: none;
  color: #c4c4d4;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background .15s;

  &:hover { background: rgba(139,92,246,.15); color: #fff; }
`;

const DropDivider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255,255,255,.07);
  margin: 4px 0;
`;

const DropLabel = styled.div`
  padding: 4px 16px;
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .06em;
`;

const ErrorBadge = styled.div`
  margin-top: 6px;
  padding: 6px 12px;
  background: rgba(239,68,68,.12);
  border: 1px solid rgba(239,68,68,.35);
  border-radius: 8px;
  font-size: 12px;
  color: #fca5a5;
  max-width: 300px;
`;

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: ${spin} .7s linear infinite;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const shortAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

const CHAIN_NAMES = {
  1337  : 'Ganache',
  80002 : 'Amoy',
  1     : 'Mainnet',
  137   : 'Polygon',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function WalletConnect({ onConnected, compact = false }) {
  const {
    account, chainId, balance, sktBalance,
    isConnecting, isConnected, error,
    connect, disconnect, switchToGanache, switchToAmoy,
  } = useMetaMask();

  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    await connect();
    if (onConnected && account) onConnected(account);
  };

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const chainLabel = chainId ? (CHAIN_NAMES[chainId] || `Chain ${chainId}`) : '';

  if (!isConnected) {
    return (
      <Wrapper>
        <ConnectBtn
          onClick={handleConnect}
          disabled={isConnecting}
          $compact={compact}
          title="Connect MetaMask wallet"
        >
          {isConnecting ? <Spinner /> : '🦊'}
          {isConnecting ? 'Connecting…' : 'Connect Wallet'}
        </ConnectBtn>
        {error && <ErrorBadge>{error}</ErrorBadge>}
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <ConnectedCard $compact={compact} title="Click to see wallet options">
        <StatusDot />
        <div>
          <AddressText>{shortAddress(account)}</AddressText>
          {!compact && (
            <div>
              <BalanceText>
                {parseFloat(sktBalance).toFixed(2)} SKT
                {chainLabel ? ` · ${chainLabel}` : ''}
              </BalanceText>
            </div>
          )}
        </div>

        <Dropdown data-dropdown>
          <DropLabel>Wallet</DropLabel>
          <DropItem onClick={copyAddress}>
            {copied ? '✓ Copied!' : `Copy Address`}
          </DropItem>
          <DropDivider />

          <DropLabel>Balances</DropLabel>
          <DropItem style={{ cursor: 'default', pointerEvents: 'none' }}>
            {parseFloat(balance).toFixed(4)} ETH/MATIC
          </DropItem>
          <DropItem style={{ cursor: 'default', pointerEvents: 'none' }}>
            {parseFloat(sktBalance).toFixed(2)} SKT
          </DropItem>
          <DropDivider />

          <DropLabel>Switch Network</DropLabel>
          <DropItem onClick={switchToGanache}>🔧 Ganache (local)</DropItem>
          <DropItem onClick={switchToAmoy}>🔷 Polygon Amoy</DropItem>
          <DropDivider />

          <DropItem onClick={disconnect} style={{ color: '#f87171' }}>
            Disconnect
          </DropItem>
        </Dropdown>
      </ConnectedCard>
      {error && <ErrorBadge>{error}</ErrorBadge>}
    </Wrapper>
  );
}
