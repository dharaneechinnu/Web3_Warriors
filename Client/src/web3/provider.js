import Web3 from "web3";
import { EXPECTED_CHAIN_ID, NETWORK_NAME } from "./config";

let _web3 = null;

// Reset cached instance when MetaMask account changes so getAccount()
// always returns the current wallet (not a stale one from a previous session).
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('accountsChanged', () => { _web3 = null; });
}

/**
 * Get a Web3 instance connected to MetaMask.
 * Prompts the user to connect if not already connected.
 */
export async function getWeb3() {
  if (_web3) return _web3;

  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to use blockchain features.");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });
  _web3 = new Web3(window.ethereum);
  return _web3;
}

/**
 * Get the currently connected wallet address (first account).
 */
export async function getAccount() {
  const web3 = await getWeb3();
  const accounts = await web3.eth.getAccounts();
  if (!accounts.length) throw new Error("No MetaMask account connected.");
  return accounts[0];
}

/**
 * Ensure MetaMask is on the expected network.
 * Returns true if correct, throws otherwise.
 */
export async function ensureCorrectNetwork() {
  const web3 = await getWeb3();
  const chainId = Number(await web3.eth.getChainId());

  // Only enforce network if EXPECTED_CHAIN_ID is configured
  if (typeof EXPECTED_CHAIN_ID !== 'undefined' && EXPECTED_CHAIN_ID !== null) {
    if (chainId !== EXPECTED_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: Web3.utils.toHex(EXPECTED_CHAIN_ID) }],
        });
      } catch (err) {
        throw new Error(
          `Please switch MetaMask to ${NETWORK_NAME || 'the expected network'} (chainId ${EXPECTED_CHAIN_ID}). Current chainId: ${chainId}`
        );
      }
    }
  }

  return true;
}

/**
 * Listen for account / chain changes and reload.
 */
export function listenForWalletEvents(onAccountChange, onChainChange) {
  if (!window.ethereum) return;

  if (onAccountChange) {
    window.ethereum.on("accountsChanged", (accounts) => {
      onAccountChange(accounts[0] || null);
    });
  }

  if (onChainChange) {
    window.ethereum.on("chainChanged", (chainIdHex) => {
      onChainChange(Number(chainIdHex));
    });
  }
}
