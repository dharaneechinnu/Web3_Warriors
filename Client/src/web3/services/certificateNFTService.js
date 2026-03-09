import Web3 from "web3";
import { CERTIFICATE_NFT_ADDRESS, EXPECTED_CHAIN_ID } from "../config";
import CertificateNFTABI from "../abi/CertificateNFT.json";

// ═══════════════════════════════════════════════════════════════════
// CertificateNFT (ERC-721) — Frontend Service
//
// READ:  Anyone (no wallet needed for read-only calls).
// MINT:  onlyOwner — only admin wallet can call mintCertificate().
// ═══════════════════════════════════════════════════════════════════

function getReadContract() {
  const provider = window.ethereum || "https://rpc.sepolia.org";
  const w3 = new Web3(provider);
  return { w3, contract: new w3.eth.Contract(CertificateNFTABI, CERTIFICATE_NFT_ADDRESS) };
}

async function getSignedContract() {
  if (!window.ethereum) throw new Error("MetaMask not installed.");
  const w3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const contract = new w3.eth.Contract(CertificateNFTABI, CERTIFICATE_NFT_ADDRESS);
  return { w3, contract };
}

// ─── READ ─────────────────────────────────────────────────────────

/** Total certificates minted so far */
export async function getCertificateCounter() {
  try {
    const { contract } = getReadContract();
    return Number(await contract.methods.certificateCounter().call());
  } catch { return 0; }
}

/** Number of NFTs owned by `address` */
export async function balanceOf(address) {
  try {
    const { contract } = getReadContract();
    return Number(await contract.methods.balanceOf(address).call());
  } catch { return 0; }
}

/** Owner of a specific token */
export async function ownerOf(tokenId) {
  const { contract } = getReadContract();
  return contract.methods.ownerOf(tokenId).call();
}

/** Metadata URI of a specific token */
export async function tokenURI(tokenId) {
  const { contract } = getReadContract();
  return contract.methods.tokenURI(tokenId).call();
}

/**
 * Scan all minted tokens (1 → certificateCounter) and return
 * the ones owned by `userAddress`.
 *
 * @param {string} userAddress
 * @returns {Array<{ tokenId, uri }>}
 */
export async function getCertificatesForUser(userAddress) {
  if (!userAddress) return [];
  try {
    const { contract, w3 } = getReadContract();
    const total = Number(await contract.methods.certificateCounter().call());
    const results = [];

    // Check each tokenId in parallel (batched to avoid rate limits)
    const checks = [];
    for (let id = 1; id <= total; id++) {
      checks.push(
        contract.methods.ownerOf(id).call()
          .then(owner => {
            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              return contract.methods.tokenURI(id).call()
                .then(uri => ({ tokenId: id, uri }))
                .catch(() => ({ tokenId: id, uri: "" }));
            }
            return null;
          })
          .catch(() => null)
      );
    }

    const resolved = await Promise.all(checks);
    resolved.forEach(r => { if (r) results.push(r); });
    return results;
  } catch (err) {
    console.error("[CertificateNFT] getCertificatesForUser error:", err);
    return [];
  }
}

// ─── ADMIN-ONLY WRITE ─────────────────────────────────────────────

/**
 * Mint a certificate NFT to a learner.
 * MUST be called from the contract OWNER's MetaMask wallet.
 *
 * @param {string} learnerAddress - Recipient wallet
 * @param {string} tokenURI_      - IPFS or HTTPS metadata URI
 * @returns tx with events
 */
export async function mintCertificate(learnerAddress, tokenURI_) {
  if (!learnerAddress) throw new Error("Learner address is required.");
  if (!tokenURI_)      throw new Error("Token URI is required.");

  const { w3, contract } = await getSignedContract();

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

  const tx = await contract.methods
    .mintCertificate(learnerAddress, tokenURI_)
    .send({ from });

  const newTokenId = Number(await contract.methods.certificateCounter().call());
  console.log(`[CertificateNFT] Minted token #${newTokenId} to ${learnerAddress}`, tx.transactionHash);

  return { tx, tokenId: newTokenId };
}
