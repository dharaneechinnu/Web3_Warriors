# Certificate NFT Verification Guide

## Overview

Every course completion certificate on SkillPlatform can be minted as an ERC-721 NFT on the Sepolia
testnet via the **CertificateNFT** contract.  
Contract address: `0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD`  
Explorer: [Sepolia Etherscan](https://sepolia.etherscan.io)

---

## How It Works

```
Learner completes course
        │
        ▼
Admin calls mintCertificate(learnerWallet, tokenURI)
        │
        ▼
ERC-721 token #N minted → owned by learner wallet
        │
        ▼
Learner visits /learner/certificates → "Blockchain NFT Certificates" section
        │
        ▼
Frontend reads ownerOf(tokenId) + tokenURI(tokenId) from the contract
        │
        ▼
Certificate verified ✅
```

---

## Step-by-Step: Verify a Certificate as an NFT

### 1  Connect MetaMask on Login

Log in as a learner with MetaMask connected. The app saves your wallet address
(`walletAddress:<userId>` in `localStorage`) and uses it to scan for NFTs.

---

### 2  Admin Mints the Certificate NFT

Only the **contract owner** (deployer) wallet can mint.

**Option A — via Admin UI (recommended)**

1. Log in as admin.
2. Navigate to the user's certificate record.
3. Click "Mint NFT" — this calls `mintCertificate(learnerWallet, tokenURI)` via MetaMask.

**Option B — via code**

```js
import { mintCertificate } from './web3/services/certificateNFTService';

// tokenURI should be an IPFS URI pointing to a JSON metadata file
const { tx, tokenId } = await mintCertificate(
  '0xLEARNER_WALLET',
  'ipfs://QmYour...MetadataHash'
);
console.log('Minted token #', tokenId, 'tx:', tx.transactionHash);
```

**Option C — directly via Etherscan (Sepolia)**

1. Go to: `https://sepolia.etherscan.io/address/0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD#writeContract`
2. Connect MetaMask (must be the contract owner).
3. Call `mintCertificate`:
   - `learner` → learner's wallet address
   - `tokenURI` → IPFS or HTTPS metadata URI

---

### 3  Build the NFT Metadata JSON

The `tokenURI` must point to a JSON file in this format:

```json
{
  "name": "Certificate of Completion — Solidity Fundamentals",
  "description": "Awarded to Alice for completing Solidity Fundamentals on SkillPlatform.",
  "image": "ipfs://QmImageHash...",
  "courseName": "Solidity Fundamentals",
  "learnerName": "Alice",
  "completedDate": "2026-03-10",
  "grade": "A+",
  "certificateId": "CERT-ABC123"
}
```

**Upload to IPFS (recommended):**

```bash
# Using Pinata CLI
npx pinata upload metadata.json
# Returns: ipfs://Qm...
```

---

### 4  Learner Views NFT on the Platform

1. Learner logs in and navigates to **My Certificates** (`/learner/certificates`).
2. Scroll down to the **"⛓️ Blockchain NFT Certificates"** section.
3. The app automatically calls `getCertificatesForUser(walletAddress)` which:
   - Reads `certificateCounter` from the contract.
   - Scans every token ID (1 → N), calling `ownerOf(id)`.
   - Returns tokens owned by the learner's wallet.
4. For each found token, the app fetches and parses the metadata URI to display the course name, description, and image.

---

### 5  On-Chain Verification Button

On each certificate card, click **"⛓️ Verify"** to call:

```
ownerOf(tokenId)  →  returns current owner address
tokenURI(tokenId) →  returns metadata URI
```

A green "✅ Blockchain Verified" panel appears showing the owner address.

---

### 6  Verify via Etherscan

1. Visit:  
   `https://sepolia.etherscan.io/address/0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD#readContract`
2. Expand **`ownerOf`** → enter `tokenId` → click Query.  
   Should return the learner's wallet address.
3. Expand **`tokenURI`** → enter `tokenId` → click Query.  
   Should return the IPFS/HTTPS URI.
4. Open the URI in a browser to read the JSON metadata.

---

### 7  Verify via Frontend Console (quick test)

Open your browser DevTools console on any SkillPlatform page and run:

```js
import('http://localhost:3000/static/js/main.chunk.js'); // not needed in DevTools

// Or paste directly in DevTools:
const Web3 = (await import('web3')).default;
const w3 = new Web3('https://rpc.sepolia.org');
const abi = [
  { "name": "ownerOf",   "inputs": [{"name":"tokenId","type":"uint256"}], "outputs": [{"name":"","type":"address"}], "type": "function", "stateMutability": "view" },
  { "name": "tokenURI",  "inputs": [{"name":"tokenId","type":"uint256"}], "outputs": [{"name":"","type":"string"}],  "type": "function", "stateMutability": "view" }
];
const contract = new w3.eth.Contract(abi, '0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD');

const tokenId = 1; // replace with actual token ID
console.log('Owner:', await contract.methods.ownerOf(tokenId).call());
console.log('URI:',   await contract.methods.tokenURI(tokenId).call());
```

---

### 8  Verify via Foundry / Hardhat (developer test)

```bash
# Using cast (Foundry)
cast call 0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD \
  "ownerOf(uint256)(address)" 1 \
  --rpc-url https://rpc.sepolia.org

cast call 0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD \
  "tokenURI(uint256)(string)" 1 \
  --rpc-url https://rpc.sepolia.org
```

```js
// Using Hardhat script (scripts/verifyCert.js)
const { ethers } = require('hardhat');
async function main() {
  const cert = await ethers.getContractAt(
    'CertificateNFT',
    '0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD'
  );
  const tokenId = 1;
  console.log('Owner  :', await cert.ownerOf(tokenId));
  console.log('TokenURI:', await cert.tokenURI(tokenId));
}
main();
```

```bash
npx hardhat run scripts/verifyCert.js --network sepolia
```

---

## Contract ABI (minimal — read-only)

```json
[
  { "name": "certificateCounter", "inputs": [], "outputs": [{"name":"","type":"uint256"}], "type": "function", "stateMutability": "view" },
  { "name": "ownerOf",   "inputs": [{"name":"tokenId","type":"uint256"}], "outputs": [{"name":"","type":"address"}], "type": "function", "stateMutability": "view" },
  { "name": "tokenURI",  "inputs": [{"name":"tokenId","type":"uint256"}], "outputs": [{"name":"","type":"string"}],  "type": "function", "stateMutability": "view" },
  { "name": "balanceOf", "inputs": [{"name":"owner","type":"address"}],   "outputs": [{"name":"","type":"uint256"}], "type": "function", "stateMutability": "view" },
  { "name": "mintCertificate", "inputs": [{"name":"learner","type":"address"},{"name":"tokenURI","type":"string"}], "outputs": [], "type": "function", "stateMutability": "nonpayable" }
]
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| "On-Chain" button does nothing | `nftTokenId` not stored for the cert | Ask admin to mint and link the token ID |
| NFT section shows "No NFT certificates found" | Wallet not connected or wrong wallet | Re-login and connect MetaMask |
| `ownerOf` reverts | Token not minted yet | Admin must call `mintCertificate` first |
| Metadata image not loading | IPFS gateway blocked | Open the URI in a browser or use a public gateway |
| `mintCertificate` fails | Not calling from owner wallet | Switch MetaMask to the deployer wallet |

---

## Summary of Roles

| Who | Action |
|---|---|
| **Admin** (contract owner) | Calls `mintCertificate(learnerWallet, tokenURI)` |
| **Learner** | Views NFTs at `/learner/certificates`, clicks "⛓️ Verify" |
| **Anyone** (public) | Verifies using Etherscan read functions or `cast call` |
