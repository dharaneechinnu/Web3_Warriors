import Web3 from "web3";
import { SKILL_TOKEN_ADDRESS, EXPECTED_CHAIN_ID } from "../config";
import PlatformTokenABI from "../abi/SkillToken.json";

// ═══════════════════════════════════════════════════════════════════
// PlatformToken (ERC-20, PTKN) — Frontend Service
//
// READ functions: anyone can call (no MetaMask needed).
// WRITE functions (reward / registerReward): onlyOwner (admin wallet).
// ═══════════════════════════════════════════════════════════════════

async function getWeb3AndContract() {
  if (!window.ethereum) throw new Error("MetaMask not installed.");
  const w3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const contract = new w3.eth.Contract(PlatformTokenABI, SKILL_TOKEN_ADDRESS);
  return { w3, contract };
}

async function getReadOnlyWeb3() {
  // For read-only calls, use whatever provider is available
  if (window.ethereum) {
    return { w3: new Web3(window.ethereum), contract: new Web3(window.ethereum).eth.Contract(PlatformTokenABI, SKILL_TOKEN_ADDRESS) };
  }
  throw new Error("No Web3 provider found.");
}

// ─── READ ─────────────────────────────────────────────────────────

/** Get PTKN balance of any address (human-readable, e.g. "10") */
export async function getBalance(address) {
  if (!address) return "0";
  try {
    const w3 = new Web3(window.ethereum || "https://rpc.sepolia.org");
    const contract = new w3.eth.Contract(PlatformTokenABI, SKILL_TOKEN_ADDRESS);
    const raw = await contract.methods.balanceOf(address).call();
    return w3.utils.fromWei(raw.toString(), "ether");
  } catch {
    return "0";
  }
}

/** Get PTKN balance of the currently connected MetaMask wallet */
export async function getMyBalance() {
  if (!window.ethereum) return "0";
  const w3 = new Web3(window.ethereum);
  const accounts = await w3.eth.getAccounts();
  if (!accounts[0]) return "0";
  return getBalance(accounts[0]);
}

/** Get token name → "PlatformToken" */
export async function getName() {
  const { contract } = await getReadOnlyWeb3();
  return contract.methods.name().call();
}

/** Get token symbol → "PTKN" */
export async function getSymbol() {
  const { contract } = await getReadOnlyWeb3();
  return contract.methods.symbol().call();
}

/** Get total supply (raw wei BigInt) */
export async function getTotalSupply() {
  const { contract } = await getReadOnlyWeb3();
  return contract.methods.totalSupply().call();
}

/** Get allowance for a spender */
export async function getAllowance(ownerAddr, spenderAddr) {
  const w3 = new Web3(window.ethereum || "https://rpc.sepolia.org");
  const contract = new w3.eth.Contract(PlatformTokenABI, SKILL_TOKEN_ADDRESS);
  const raw = await contract.methods.allowance(ownerAddr, spenderAddr).call();
  return w3.utils.fromWei(raw.toString(), "ether");
}

// ─── ADMIN-ONLY WRITES (onlyOwner) ───────────────────────────────

/**
 * Send registration reward (10 PTKN) to a new user.
 * Must be called by the contract OWNER wallet.
 *
 * @param {string} userAddress  - New user's wallet address
 * @param {string|number} amount - Amount in PTKN (default "10")
 */
export async function sendRegisterReward(userAddress, amount = "10") {
  const { w3, contract } = await getWeb3AndContract();

  // Ensure correct network
  const chainId = Number(await w3.eth.getChainId());
  if (typeof EXPECTED_CHAIN_ID !== 'undefined' && EXPECTED_CHAIN_ID !== null) {
    if (chainId !== EXPECTED_CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: Web3.utils.toHex(EXPECTED_CHAIN_ID) }],
      });
    }
  }

  const accounts = await w3.eth.getAccounts();
  const from = accounts[0];
  if (!from) throw new Error("No MetaMask account connected.");

  const weiAmount = w3.utils.toWei(String(amount), "ether");

  const tx = await contract.methods
    .registerReward(userAddress, weiAmount)
    .send({ from });

  console.log(`[PlatformToken] registerReward sent ${amount} PTKN to ${userAddress}`, tx.transactionHash);
  return tx;
}

/**
 * Send a general reward (e.g. course completion) to a user.
 * Must be called by the contract OWNER wallet.
 *
 * @param {string} userAddress
 * @param {string|number} amount - Amount in PTKN
 */
export async function sendReward(userAddress, amount) {
  const { w3, contract } = await getWeb3AndContract();

  const chainId = Number(await w3.eth.getChainId());
  if (typeof EXPECTED_CHAIN_ID !== 'undefined' && EXPECTED_CHAIN_ID !== null) {
    if (chainId !== EXPECTED_CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: Web3.utils.toHex(EXPECTED_CHAIN_ID) }],
      });
    }
  }

  const accounts = await w3.eth.getAccounts();
  const from = accounts[0];
  const weiAmount = w3.utils.toWei(String(amount), "ether");

  const tx = await contract.methods
    .reward(userAddress, weiAmount)
    .send({ from });

  console.log(`[PlatformToken] reward sent ${amount} PTKN to ${userAddress}`, tx.transactionHash);
  return tx;
}

// ─── USER WRITE ───────────────────────────────────────────────────

/**
 * Transfer PTKN from connected wallet to another address.
 * Called by the token holder (no onlyOwner restriction).
 */
export async function transfer(to, amount) {
  const { w3, contract } = await getWeb3AndContract();
  const accounts = await w3.eth.getAccounts();
  const from = accounts[0];
  const weiAmount = w3.utils.toWei(String(amount), "ether");

  const tx = await contract.methods.transfer(to, weiAmount).send({ from });
  return tx;
}

/**
 * Approve `spender` to use `amount` PTKN on your behalf.
 */
export async function approve(spender, amount) {
  const { w3, contract } = await getWeb3AndContract();
  const accounts = await w3.eth.getAccounts();
  const from = accounts[0];
  const weiAmount = w3.utils.toWei(String(amount), "ether");

  const tx = await contract.methods.approve(spender, weiAmount).send({ from });
  return tx;
}
