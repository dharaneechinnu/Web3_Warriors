# Web3 Integration Implementation Plan

## Blockchain-Based Community Learning and Credentialing Platform for Trusted Skill Verification

**Document Type:** Technical Architecture & Integration Plan  
**Project Type:** Final Year Major Project  
**Date:** March 2026

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Component Responsibilities](#2-component-responsibilities)
3. [Smart Contract Architecture](#3-smart-contract-architecture)
4. [Deployment Architecture](#4-deployment-architecture)
5. [Token Flow Design](#5-token-flow-design)
6. [NFT Certificate Flow](#6-nft-certificate-flow)
7. [Frontend Blockchain Interaction](#7-frontend-blockchain-interaction)
8. [Backend Integration Strategy](#8-backend-integration-strategy)
9. [User Transaction Flow](#9-user-transaction-flow)
10. [Development Workflow](#10-development-workflow)
11. [Security and Best Practices](#11-security-and-best-practices)

---

## 1. System Architecture

### 1.1 Hybrid Web2 + Web3 Architecture Overview

The platform employs a **hybrid architecture** where the existing MERN (MongoDB, Express, React, Node.js) stack handles application logic, user management, and data persistence, while the Ethereum blockchain handles trustless token transfers, immutable credential issuance, and transparent reward distribution.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React.js)                      │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────────────┐   │
│  │  MetaMask    │  │  Web3.js v4   │  │  Axios / Socket.IO       │   │
│  │  Wallet      │  │  Contract     │  │  REST API Client         │   │
│  │  Provider    │  │  Interaction  │  │  Real-time Events        │   │
│  └──────┬───────┘  └───────┬───────┘  └────────────┬─────────────┘   │
│         │                  │                       │                 │
└─────────┼──────────────────┼───────────────────────┼─────────────────┘
          │                  │                       │
          │ (User signs tx)  │ (Read/Write calls)    │ (HTTP/WebSocket)
          │                  │                       │
┌─────────┼──────────────────┼───────┐   ┌───────────┼─────────────────┐
│         ▼                  ▼       │   │           ▼                 │
│  ┌──────────────────────────────┐  │   │  ┌─────────────────────┐   │
│  │   Ethereum Blockchain        │  │   │  │  Express.js Server  │   │
│  │   (Sepolia Testnet)          │  │   │  │  (Node.js Backend)  │   │
│  │                              │  │   │  │                     │   │
│  │  ┌────────────────────────┐  │  │   │  │  ┌───────────────┐  │   │
│  │  │  SkillToken (ERC-20)   │  │  │   │  │  │  Web3 Service │  │   │
│  │  ├────────────────────────┤  │  │   │  │  │  Layer        │  │   │
│  │  │  CertificateNFT (721) │  │  │   │  │  ├───────────────┤  │   │
│  │  ├────────────────────────┤  │  │   │  │  │  Controllers  │  │   │
│  │  │  SkillPlatform (Core)  │  │  │   │  │  ├───────────────┤  │   │
│  │  └────────────────────────┘  │  │   │  │  │  Middleware    │  │   │
│  └──────────────────────────────┘  │   │  │  └───────┬───────┘  │   │
│      BLOCKCHAIN LAYER              │   │  │          │          │   │
└────────────────────────────────────┘   │  └──────────┼──────────┘   │
                                         │             │              │
                                         │  ┌──────────▼──────────┐   │
                                         │  │   MongoDB           │   │
                                         │  │   (Off-chain Data)  │   │
                                         │  └─────────────────────┘   │
                                         │     SERVER LAYER           │
                                         └────────────────────────────┘
```

### 1.2 Design Principle: Off-Chain First, On-Chain for Trust

The architecture follows a pragmatic hybrid model:

- **Off-chain (MongoDB):** User profiles, course content, session scheduling, chat history, file uploads, curriculum data, progress tracking, notifications. These operations require low latency, high throughput, and complex querying that blockchains cannot efficiently provide.

- **On-chain (Ethereum):** Token minting and transfers (SKT), NFT certificate issuance, challenge reward distribution, mentorship payment escrow, and certificate verification. These operations require trustlessness, immutability, and public verifiability.

- **Synchronisation layer (Node.js backend):** The Express server acts as the bridge. It listens for blockchain events, updates MongoDB records with on-chain references (`txHash`, `tokenId`, `onChainBookingId`), and triggers blockchain transactions when Web2 workflows reach finality (e.g., course completion triggers NFT minting).

### 1.3 Current State vs. Target State

| Aspect | Current State | Target State |
|---|---|---|
| Token economy | Off-chain `tokenBalance` field in UserModel | On-chain ERC-20 SkillToken (SKT) |
| Certificate issuance | MongoDB CertificationModel only | On-chain ERC-721 CertificateNFT + MongoDB record |
| Session payments | Database debit/credit of coins | On-chain escrow via SkillPlatform contract |
| Challenge rewards | Backend distributes coins in DB | On-chain SKT transfer to winners |
| User wallets | Server-generated Ethereum addresses (private key on server) | User-owned MetaMask wallets (self-custody) |
| Contract architecture | Single SkillPlatform.sol (ERC-721 only) | Three contracts: SkillToken, CertificateNFT, SkillPlatform |

---

## 2. Component Responsibilities

### 2.1 Frontend (React.js)

| Responsibility | Description |
|---|---|
| Wallet connection | Prompt MetaMask connection, detect chain (Sepolia), handle account changes |
| Transaction signing | User signs all token transfers and session bookings via MetaMask popup |
| Contract reads | Read token balances, certificate data, and session prices directly from blockchain |
| Transaction status | Display pending/confirmed/failed state for blockchain operations |
| ABI management | Store compiled contract ABIs in `Client/src/web3/abi/` for direct contract calls |
| Fallback display | Show off-chain balances alongside on-chain balances during migration period |

**Key files involved:**
- `Client/src/components/WalletConnect.js` — MetaMask connection UI
- `Client/src/services/web3ContractService.js` — Contract call wrappers
- `Client/src/services/contractAddress.js` — Deployed contract addresses
- `Client/src/web3/abi/` — Contract ABI JSON files
- `Client/src/contexts/AuthContext.js` — Stores wallet address alongside JWT user data

### 2.2 Backend (Node.js + Express)

| Responsibility | Description |
|---|---|
| Transaction verification | Verify `txHash` from frontend before updating database (never trust client claims) |
| Admin-initiated minting | Backend holds an admin wallet to mint tokens on registration and certificates on course completion |
| Event listening | Subscribe to contract events (`Transfer`, `CertificateMinted`, `SessionBooked`) to sync on-chain state to MongoDB |
| Wallet mapping | Map MongoDB `userId` ↔ Ethereum wallet address stored in `UserModel.UserWalletAddress` |
| Gas management | Admin wallet pays gas for platform-initiated transactions (minting, initial token distribution) |
| Hybrid fallback | Maintain off-chain `tokenBalance` as a cache/fallback when blockchain is unreachable |

**Key files involved:**
- `Server/web3/web3Provider.js` — Singleton Web3 instance + admin wallet
- `Server/web3/tokenContract.js` — ERC-20 SKT interactions (currently a stub, to be implemented)
- `Server/web3/nftContract.js` — Certificate minting and verification
- `Server/web3/platformContract.js` — Session booking and challenge management
- `Server/services/web3Service.js` — High-level orchestration layer
- `Server/Controller/web3Controller.js` — API endpoints for blockchain operations

### 2.3 Blockchain (Ethereum / Sepolia Testnet)

| Responsibility | Description |
|---|---|
| Token state | Authoritative record of SKT balances across all wallets |
| Certificate registry | Immutable store of all issued course-completion NFTs |
| Payment escrow | Hold mentorship session payments until session confirmation |
| Reward distribution | Trustless transfer of challenge prize pools to winners |
| Access control | Owner-only and minter-role functions for controlled minting |
| Public verification | Anyone can verify a certificate's authenticity without needing platform access |

---

## 3. Smart Contract Architecture

### 3.1 Contract Overview

The system requires three interrelated smart contracts, each with a distinct purpose:

```
┌─────────────────────────────────────────────────────────────┐
│                    SkillPlatform.sol                         │
│                    (Core Orchestrator)                       │
│                                                             │
│  • Learner registration (triggers SKT mint)                 │
│  • Course purchase (SKT transfer: learner → mentor)         │
│  • Challenge management (entry + reward distribution)       │
│  • Mentorship payment escrow                                │
│  • Certificate mint trigger (calls CertificateNFT)          │
│                                                             │
│         ┌────────────┐          ┌─────────────────┐         │
│         │ depends on │          │  depends on     │         │
│         ▼            │          ▼                 │         │
│  ┌──────────────┐    │   ┌──────────────────┐     │         │
│  │ SkillToken   │    │   │ CertificateNFT   │     │         │
│  │ (ERC-20)     │    │   │ (ERC-721)        │     │         │
│  │              │    │   │                  │     │         │
│  │ • mint()     │    │   │ • mintCert()     │     │         │
│  │ • transfer() │    │   │ • verifyCert()   │     │         │
│  │ • approve()  │    │   │ • tokenURI()     │     │         │
│  │ • balanceOf()│    │   │ • soulbound      │     │         │
│  └──────────────┘    │   └──────────────────┘     │         │
└──────────────────────┴────────────────────────────┘─────────┘
```

### 3.2 Contract 1: SkillToken (ERC-20)

**Standard:** ERC-20 (OpenZeppelin `ERC20`, `Ownable`)

**Purpose:** Fungible utility token for the platform economy.

**State Variables:**
- Inherited ERC-20 state: `_balances`, `_allowances`, `_totalSupply`
- `owner` — Platform deployer address, has exclusive minting authority
- `minterRole` — Mapping of addresses authorised to mint (SkillPlatform contract address)

**Key Functions:**

| Function | Access | Description |
|---|---|---|
| `mint(address to, uint256 amount)` | Owner or authorised minter | Create new tokens. Called on learner registration (10 SKT) and challenge funding |
| `transfer(address to, uint256 amount)` | Token holder | Standard ERC-20 transfer. Used for course purchase and mentorship payments |
| `approve(address spender, uint256 amount)` | Token holder | Authorise SkillPlatform contract to spend tokens on behalf of the user |
| `transferFrom(address from, address to, uint256 amount)` | Approved spender | SkillPlatform pulls tokens during course purchase or session booking |
| `balanceOf(address account)` | Public (view) | Query SKT balance for any wallet |
| `setMinter(address minter, bool status)` | Owner only | Grant or revoke minting permission to the SkillPlatform contract |

**Events:**
- `Transfer(address indexed from, address indexed to, uint256 value)` — Standard ERC-20
- `Approval(address indexed owner, address indexed spender, uint256 value)` — Standard ERC-20
- `MinterUpdated(address indexed minter, bool status)` — Custom

**Design Notes:**
- Total supply is uncapped (inflationary model — new tokens minted per registration and as challenge rewards).
- No burn mechanism is required for the current use case. The token is non-deflationary.
- The `decimals()` should return `18` to follow Ethereum convention, but the platform UI should display whole-number amounts (e.g., "10 SKT" not "10000000000000000000 SKT").

### 3.3 Contract 2: CertificateNFT (ERC-721)

**Standard:** ERC-721 (OpenZeppelin `ERC721URIStorage`, `Ownable`)

**Purpose:** Non-fungible tokens representing course completion credentials.

**State Variables:**
- `_tokenIdCounter` — Auto-incrementing certificate ID
- `certificates` mapping: `tokenId → CertificateData` struct containing `learner`, `courseId`, `courseName`, `mentorName`, `issuedAt`
- `minter` — Address authorised to mint (SkillPlatform contract)
- `learnerCertificates` mapping: `address → tokenId[]` — Index of certificates per learner

**Key Functions:**

| Function | Access | Description |
|---|---|---|
| `mintCertificate(address learner, string courseId, string courseName, string mentorName, string metadataURI)` | Minter only | Mint a soulbound NFT to the learner's wallet |
| `verifyCertificate(uint256 tokenId)` | Public (view) | Return course name, learner address, mentor name, issue date, and metadata URI |
| `getCertificatesByLearner(address learner)` | Public (view) | Return all token IDs for a learner |
| `tokenURI(uint256 tokenId)` | Public (view) | Return the IPFS/HTTP metadata URI |
| `setMinter(address newMinter)` | Owner only | Update minter address (for contract upgrades) |

**Soulbound Design:**
The NFT is soulbound — it cannot be transferred after minting. This is achieved by overriding the `_update` function (OpenZeppelin v5) or `_beforeTokenTransfer` (v4) to revert on any transfer where `from != address(0)` (i.e., only minting is allowed, not subsequent transfers). This ensures credentials cannot be sold or traded.

**Events:**
- `CertificateMinted(uint256 indexed tokenId, address indexed learner, string courseId, string courseName, uint256 issuedAt)` — Custom
- `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)` — Standard ERC-721 (only from `address(0)` on mint)

**Metadata Standard (ERC-721 tokenURI):**
The metadata JSON stored at the `tokenURI` location follows the OpenSea metadata standard:
```json
{
    "name": "Course Completion: Introduction to Solidity",
    "description": "Awarded to 0xABC... for completing 'Introduction to Solidity' on SkillPlatform",
    "image": "ipfs://Qm.../certificate-image.png",
    "attributes": [
        { "trait_type": "Course", "value": "Introduction to Solidity" },
        { "trait_type": "Mentor", "value": "John Doe" },
        { "trait_type": "Issued Date", "value": "2026-03-09" },
        { "trait_type": "Grade", "value": "A" },
        { "trait_type": "Platform", "value": "SkillPlatform" }
    ]
}
```

### 3.4 Contract 3: SkillPlatform (Core Orchestrator)

**Inherits:** `Ownable`, `ReentrancyGuard`

**Purpose:** Central business logic contract that coordinates token and NFT operations.

**Dependencies:** Holds references to SkillToken and CertificateNFT contract addresses.

**State Variables:**
- `skillToken` — Address of the deployed SkillToken contract
- `certificateNFT` — Address of the deployed CertificateNFT contract
- `registeredLearners` mapping: `address → bool`
- `sessions` mapping: `bytes32 (sessionKey) → Session` struct
- `bookings` mapping: `uint256 (bookingId) → Booking` struct
- `challenges` mapping: `uint256 (challengeId) → Challenge` struct
- `bookingCounter`, `challengeCounter` — Auto-incrementing IDs

**Key Functions:**

| Function | Access | Description |
|---|---|---|
| `registerLearner(address learner)` | Owner | Register a new learner and mint 10 SKT to their wallet |
| `purchaseCourse(address learner, address mentor, uint256 price)` | Owner | Transfer SKT from learner to mentor for course enrolment |
| `createSession(string mongoSessionId, address mentor, uint256 priceWei)` | Owner | Register a mentorship session on-chain with its price |
| `bookSession(bytes32 sessionKey, uint256 sessionTime)` | Learner (payable) | Book a session; ETH/SKT held in escrow |
| `confirmSession(uint256 bookingId)` | Owner | Release escrow to mentor after session completion |
| `cancelBooking(uint256 bookingId)` | Owner or Learner | Refund escrow to learner |
| `createChallenge(uint256 rewardPool)` | Owner | Create a challenge with a locked token prize pool |
| `joinChallenge(uint256 challengeId)` | Learner | Pay entry fee (SKT) to join a challenge |
| `declareWinners(uint256 challengeId, address gold, address silver, address bronze)` | Owner | Distribute prize pool: 50% / 30% / 20% |
| `mintCertificate(address learner, string courseId, string courseName, string mentorName, string metadataURI)` | Owner | Call CertificateNFT to mint a soulbound credential |

**Events:**
- `LearnerRegistered(address indexed learner, uint256 tokensAwarded)`
- `CoursePurchased(address indexed learner, address indexed mentor, uint256 amount)`
- `SessionBooked(uint256 bookingId, bytes32 sessionKey, address indexed learner, address mentor, uint256 amountPaid)`
- `SessionConfirmed(uint256 bookingId, address mentor, uint256 amountReleased)`
- `BookingCancelled(uint256 bookingId, address learner, uint256 refundAmount)`
- `ChallengeCreated(uint256 challengeId, uint256 rewardPool)`
- `WinnersDeclared(uint256 challengeId, address gold, address silver, address bronze)`
- `CertificateMinted(uint256 tokenId, address indexed learner, string courseId)`

### 3.5 Contract Interaction Diagram

```
    Learner Wallet                  Mentor Wallet
         │                               │
         │ approve(SkillPlatform, amt)    │
         ├──────────► SkillToken ◄────────┘  (balanceOf, transfer)
         │               ▲
         │               │ transferFrom()
         │               │ mint()
         │               │
         ├──────────► SkillPlatform ──────────► CertificateNFT
         │           (Core Logic)               (mintCertificate)
         │
         │ bookSession()
         │ joinChallenge()
         │
    [MetaMask signs tx]
```

### 3.6 Dependency Relationships

```
SkillToken (ERC-20)
    └── No dependencies (standalone token)

CertificateNFT (ERC-721)
    └── No dependencies (standalone NFT, but only minter can mint)

SkillPlatform (Core)
    ├── depends on SkillToken (calls mint, transferFrom)
    └── depends on CertificateNFT (calls mintCertificate)
```

The SkillPlatform contract stores the addresses of both SkillToken and CertificateNFT. After deployment, the SkillPlatform address must be registered as an authorised `minter` on both the SkillToken and CertificateNFT contracts.

---

## 4. Deployment Architecture

### 4.1 Toolchain

| Tool | Purpose |
|---|---|
| **Truffle v5.11** | Contract compilation, migration, testing, and deployment |
| **Ganache** | Local Ethereum blockchain for development and testing |
| **Sepolia Testnet** | Public Ethereum test network for staging and demonstration |
| **MetaMask** | Browser wallet for user-facing transaction signing on Sepolia |
| **Infura / Alchemy** | JSON-RPC provider for Sepolia (since no local node is running) |
| **OpenZeppelin v4.9.6** | Audited base contract library (ERC-20, ERC-721, Ownable, ReentrancyGuard) |

### 4.2 Deployment Order (Critical)

The contracts must be deployed in a specific sequence because of their dependency relationships:

```
Step 1: Deploy SkillToken
         │
         ▼ (get SkillToken address)
Step 2: Deploy CertificateNFT
         │
         ▼ (get CertificateNFT address)
Step 3: Deploy SkillPlatform
         │  (pass SkillToken address + CertificateNFT address
         │   as constructor arguments)
         │
         ▼ (get SkillPlatform address)
Step 4: Post-Deployment Configuration
         ├── Call SkillToken.setMinter(SkillPlatform.address, true)
         └── Call CertificateNFT.setMinter(SkillPlatform.address)
```

**Why this order matters:**
- SkillPlatform's constructor needs the addresses of both SkillToken and CertificateNFT.
- After SkillPlatform is deployed, its address must be registered as an authorised minter on both child contracts.
- If you deploy SkillPlatform first, you would not have the token/NFT addresses to pass to its constructor.

### 4.3 Truffle Migration Script Structure

The Truffle migration file (`migrations/2_deploy_all_contracts.js`) should execute all four steps in sequence:

1. Deploy `SkillToken` with token name `"SkillToken"` and symbol `"SKT"`.
2. Deploy `CertificateNFT` with name `"SkillPlatform Certificate"` and symbol `"SPCERT"`.
3. Deploy `SkillPlatform` passing `SkillToken.address` and `CertificateNFT.address`.
4. Call `SkillToken.setMinter(SkillPlatform.address, true)`.
5. Call `CertificateNFT.setMinter(SkillPlatform.address)`.

### 4.4 Truffle Network Configuration

The `truffle-config.js` should define at minimum two networks:

- **development** — Ganache local at `127.0.0.1:7545`, network ID `5777`, no gas cost concern.
- **sepolia** — Sepolia testnet via Infura/Alchemy. Requires `@truffle/hdwallet-provider` with a mnemonic or private key. Gas price should be set dynamically or use a reasonable default. Chain ID `11155111`.

### 4.5 Sepolia Deployment Prerequisites

1. **Obtain Sepolia ETH**: Use a Sepolia faucet (e.g., Infura Sepolia faucet, Alchemy Sepolia faucet) to fund the deployer wallet with at least 0.5 Sepolia ETH.
2. **Configure Infura/Alchemy**: Create a project on Infura or Alchemy, obtain the Sepolia RPC URL, and set it in `truffle-config.js`.
3. **Secure the deployer private key**: Store the deploying wallet's mnemonic or private key in a `.env` file (never committed to version control). Use `@truffle/hdwallet-provider` to load it.
4. **Verify contracts (optional)**: After deployment, verify source code on Sepolia Etherscan using `truffle run verify` with the `truffle-plugin-verify` plugin. This enables public ABI inspection and trust.

### 4.6 MetaMask Configuration for Users

For end users (learners and mentors) to interact with the platform:

1. Install MetaMask browser extension.
2. Add the Sepolia test network (MetaMask includes it by default, but may need to enable "Show test networks").
3. Obtain Sepolia ETH from a faucet (for gas fees).
4. Connect wallet to the platform via the WalletConnect component.
5. Import SKT token address into MetaMask as a custom token to view balances.

### 4.7 Post-Deployment Checklist

| Step | Action | Verification |
|---|---|---|
| 1 | Record all three deployed contract addresses | Store in `.env` and `contractAddress.js` |
| 2 | Verify SkillPlatform is an authorised minter on SkillToken | Call `SkillToken.isMinter(SkillPlatform.address)` |
| 3 | Verify SkillPlatform is the minter on CertificateNFT | Call `CertificateNFT.minter()` |
| 4 | Update `Server/.env` with new addresses | `SKILL_PLATFORM_ADDRESS`, `SKT_TOKEN_ADDRESS`, `CERTIFICATE_NFT_ADDRESS` |
| 5 | Update `Client/src/services/contractAddress.js` | All three addresses |
| 6 | Copy compiled ABIs to `Client/src/web3/abi/` | `SkillToken.json`, `CertificateNFT.json`, `SkillPlatform.json` |
| 7 | Test a registration + mint flow end-to-end | Register a learner, verify 10 SKT received |

---

## 5. Token Flow Design

### 5.1 Token Lifecycle

```
                          ┌─────────────┐
                          │  SkillToken  │
                          │  Contract    │
                          │  (Minting)   │
                          └──────┬───────┘
                                 │
                    mint(learner, 10 SKT)
                    on registration
                                 │
                                 ▼
                          ┌─────────────┐
                          │  Learner    │
                          │  Wallet     │
                          │  (10 SKT)   │
                          └──────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    Course Purchase      Session Booking     Challenge Entry
    (1 SKT → Mentor)    (N SKT → Escrow)    (10 SKT → Pool)
              │                  │                  │
              ▼                  ▼                  ▼
       ┌──────────┐      ┌──────────┐      ┌───────────┐
       │  Mentor  │      │ Platform │      │ Challenge │
       │  Wallet  │      │ Contract │      │ Prize Pool│
       └──────────┘      │ (Escrow) │      └─────┬─────┘
                         └─────┬────┘            │
                               │            declareWinners()
                     confirmSession()            │
                               │           ┌─────┴─────┐
                               ▼           ▼           ▼
                        ┌──────────┐  ┌────────┐  ┌────────┐
                        │  Mentor  │  │ Gold   │  │Silver/ │
                        │  Wallet  │  │ Winner │  │Bronze  │
                        └──────────┘  │ (50%)  │  │(30/20%)│
                                      └────────┘  └────────┘
```

### 5.2 Token Movement Rules

| Event | From | To | Amount | Mechanism |
|---|---|---|---|---|
| Learner registration | SkillToken contract (mint) | Learner wallet | 10 SKT | `SkillPlatform.registerLearner()` calls `SkillToken.mint()` |
| Course purchase | Learner wallet | Mentor wallet | 1 SKT | Learner calls `approve()` on SkillToken, then `SkillPlatform.purchaseCourse()` calls `transferFrom()` |
| Mentorship session booking | Learner wallet | SkillPlatform contract (escrow) | N SKT (configurable per session) | Learner approves, `bookSession()` pulls tokens into contract |
| Session confirmation | SkillPlatform contract | Mentor wallet | N SKT | Backend calls `confirmSession()` after session completion |
| Session cancellation | SkillPlatform contract | Learner wallet (refund) | N SKT | `cancelBooking()` returns tokens to learner |
| Challenge entry | Learner wallet | Challenge prize pool (in contract) | 10 SKT | `joinChallenge()` pulls tokens |
| Challenge reward — Gold | Challenge pool | Winner wallet | 50% of pool | `declareWinners()` distributes |
| Challenge reward — Silver | Challenge pool | Winner wallet | 30% of pool | `declareWinners()` distributes |
| Challenge reward — Bronze | Challenge pool | Winner wallet | 20% of pool | `declareWinners()` distributes |

### 5.3 Approval Pattern (Critical)

The ERC-20 `approve` → `transferFrom` pattern is essential for the SkillPlatform contract to move tokens on behalf of users:

1. **Learner calls `SkillToken.approve(SkillPlatform.address, amount)`** via MetaMask — this authorises the SkillPlatform contract to spend up to `amount` SKT from the learner's wallet.
2. **Learner calls `SkillPlatform.purchaseCourse(...)` or `bookSession(...)`** — the SkillPlatform contract internally calls `SkillToken.transferFrom(learner, recipient, amount)`.
3. If the learner has not approved sufficient tokens, the `transferFrom` call reverts and the entire transaction fails.

This two-step process is standard in Ethereum DeFi and ensures the user explicitly consents to each spend.

### 5.4 Synchronisation with Off-Chain Balance

During the migration period (and for redundancy), both on-chain and off-chain balances exist:

- **On-chain**: `SkillToken.balanceOf(walletAddress)` — source of truth.
- **Off-chain**: `UserModel.tokenBalance` — fast-access cache.

The backend should update the off-chain balance whenever an on-chain event is detected. If the blockchain is unreachable, the off-chain balance serves as a fallback for display purposes. Critical operations (purchases, rewards) should always verify on-chain before proceeding.

---

## 6. NFT Certificate Flow

### 6.1 End-to-End Certificate Lifecycle

```
┌──────────────────────────────────────────────────────────────────────┐
│                     COURSE COMPLETION FLOW                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Learner completes all lectures in a course                       │
│              │                                                       │
│              ▼                                                       │
│  2. Frontend calls POST /courses/:id/complete                        │
│              │                                                       │
│              ▼                                                       │
│  3. Backend (CourseController.completeCourse):                       │
│     a. Verify all lectures marked complete in MongoDB                │
│     b. Create CertificationModel record (off-chain)                 │
│     c. Generate certificate metadata JSON                            │
│     d. Upload metadata to IPFS (or use placeholder URI)             │
│              │                                                       │
│              ▼                                                       │
│  4. Backend calls nftContract.mintCourseNFT():                       │
│     a. Admin wallet signs the mint transaction                       │
│     b. SkillPlatform.mintCertificate() is called on-chain           │
│     c. SkillPlatform calls CertificateNFT.mintCertificate()         │
│     d. NFT minted to learner's wallet (soulbound)                   │
│              │                                                       │
│              ▼                                                       │
│  5. On-chain event CertificateMinted emitted:                        │
│     { tokenId, learner, courseId, courseName, issuedAt }             │
│              │                                                       │
│              ▼                                                       │
│  6. Backend updates CertificationModel:                              │
│     a. Store nftTokenId from event                                   │
│     b. Store txHash from receipt                                     │
│              │                                                       │
│              ▼                                                       │
│  7. Learner views certificate in MyCertificates page:                │
│     a. Shows course name, mentor, date, grade                        │
│     b. Shows NFT token ID and transaction hash                       │
│     c. Link to Sepolia Etherscan for on-chain proof                  │
│              │                                                       │
│              ▼                                                       │
│  8. Third-party verification via CertificateVerify page:             │
│     a. Enter token ID                                                │
│     b. Frontend calls CertificateNFT.verifyCertificate(tokenId)     │
│     c. Returns learner address, course, mentor, date                 │
│     d. No platform account required to verify                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Soulbound Property

The CertificateNFT is **soulbound** — once minted to a learner's address, it cannot be transferred, sold, or traded. This is critical because:

- Course completion credentials should not be transferable (a certificate proves *this specific person* completed the course).
- Prevents a fraud marketplace for fake credentials.
- Employers verifying a certificate can trust that the wallet owner is the course completer.

The soulbound property is enforced in the smart contract by overriding the transfer function to revert on any non-mint transfer.

### 6.3 Metadata Storage

Certificate metadata is stored off-chain (on IPFS or a hosted endpoint) and referenced by the on-chain `tokenURI`. The metadata includes course details, a certificate image, and trait attributes.

For the project, a practical approach is:
- **Development/Demo**: Use hosted placeholder URIs (e.g., `https://api.skillplatform.com/certificates/{tokenId}/metadata`).
- **Production-ready**: Upload to IPFS via Pinata or nft.storage and store the `ipfs://` URI on-chain.

The `Server/services/ipfsService.js` (currently a placeholder) would handle IPFS uploads.

### 6.4 Certificate Verification (Public)

Anyone can verify a certificate by calling `CertificateNFT.verifyCertificate(tokenId)` — this is a read-only `view` function that costs no gas. The platform provides a public `CertificateVerify` page where:

1. User enters a token ID (printed on the certificate or shared via link).
2. Frontend calls the contract `verifyCertificate()` directly via Web3.js.
3. Returns and displays: learner address, course name, mentor name, issue date, metadata URI.
4. No login or platform account required — fully decentralised verification.

---

## 7. Frontend Blockchain Interaction

### 7.1 Web3.js + MetaMask Integration Model

The React frontend interacts with the blockchain through two paths:

**Path A — Read-only calls (no gas, no signing):**
```
React Component → Web3.js → Infura/Alchemy RPC → Blockchain
```
Used for: `balanceOf()`, `verifyCertificate()`, `getSession()`, `ownerOf()`

**Path B — State-changing transactions (requires gas + user signature):**
```
React Component → Web3.js → MetaMask (user signs) → Sepolia RPC → Blockchain
```
Used for: `approve()`, `bookSession()`, `joinChallenge()`

### 7.2 Wallet Connection Flow

1. User clicks "Connect Wallet" button (in `WalletConnect.js` component).
2. Frontend calls `window.ethereum.request({ method: 'eth_requestAccounts' })`.
3. MetaMask popup appears; user approves connection.
4. Frontend receives the user's Ethereum address.
5. Frontend verifies the connected chain is Sepolia (`chainId === '0xaa36a7'`).
6. If wrong chain, prompt user to switch via `wallet_switchEthereumChain`.
7. Store wallet address in AuthContext and send to backend (mapped to `UserModel.UserWalletAddress`).

### 7.3 Contract Instance Creation

For each contract, the frontend creates a Web3.js contract instance using:
- The deployed contract address (from `contractAddress.js`)
- The contract ABI (from `Client/src/web3/abi/`)
- The Web3 provider (MetaMask's `window.ethereum`)

Three contract instances are needed:
- `skillTokenContract` — for `approve()`, `balanceOf()`, `allowance()`
- `certificateNFTContract` — for `verifyCertificate()`, `getCertificatesByLearner()`
- `skillPlatformContract` — for `bookSession()`, `joinChallenge()`

### 7.4 Transaction Lifecycle in the UI

When a user initiates a blockchain transaction (e.g., buying a course):

| Step | UI State | What Happens |
|---|---|---|
| 1 | "Preparing transaction..." | Frontend builds the transaction parameters |
| 2 | MetaMask popup opens | User reviews gas cost and confirms |
| 3 | "Transaction submitted..." | `tx.send()` returns a transaction hash immediately |
| 4 | "Waiting for confirmation..." | Frontend polls for receipt or listens for the `transactionHash` → `receipt` events |
| 5 | "Transaction confirmed!" | Receipt received with `status: true`. Frontend sends `txHash` to backend |
| 6 | Backend verifies and updates DB | Backend calls `web3.eth.getTransactionReceipt(txHash)` to independently verify |

If the transaction fails (user rejects in MetaMask, out of gas, contract revert), the UI shows an error message and no backend update occurs.

### 7.5 Event Listening (Frontend)

The frontend can subscribe to contract events for real-time updates:

- `SkillToken.events.Transfer({ filter: { to: userAddress } })` — Detect incoming token transfers
- `CertificateNFT.events.CertificateMinted({ filter: { learner: userAddress } })` — Detect new certificates

This provides instant UI feedback when someone sends tokens or a certificate is minted, without requiring a page refresh or backend polling.

### 7.6 Chain and Account Change Handling

MetaMask can emit events when the user switches accounts or chains:

- `window.ethereum.on('accountsChanged', handleAccountChange)` — Reload user data for the new address
- `window.ethereum.on('chainChanged', handleChainChange)` — If the user switches away from Sepolia, show a warning banner and disable blockchain buttons

### 7.7 File Structure for Frontend Web3

```
Client/src/
├── web3/
│   └── abi/
│       ├── SkillToken.json
│       ├── CertificateNFT.json
│       └── SkillPlatform.json
├── services/
│   ├── contractAddress.js          (deployed addresses for all 3 contracts)
│   ├── web3ContractService.js      (contract interaction wrappers)
│   └── abi.js                      (ABI exports)
├── components/
│   └── WalletConnect.js            (MetaMask connect button + chain check)
├── contexts/
│   └── AuthContext.js              (stores walletAddress alongside JWT user)
└── hooks/                          (optional: useWeb3, useContract, useTokenBalance hooks)
```

---

## 8. Backend Integration Strategy

### 8.1 Dual-Authority Model

The backend operates with two types of blockchain authority:

**Admin Wallet (Server-held private key):**
- Used for platform-initiated actions: minting initial tokens to new learners, minting NFT certificates, declaring challenge winners.
- The admin wallet is the `owner` of all three contracts and pays gas for these operations.
- Private key stored in `Server/.env` and loaded by `web3Provider.js`.

**User Wallet (MetaMask — client-side signing):**
- Used for user-initiated actions: approving token spend, booking sessions, joining challenges.
- The backend never has access to user private keys.
- Backend receives `txHash` from the frontend and verifies the transaction independently.

### 8.2 Transaction Verification Pattern

Whenever the frontend sends a `txHash` to the backend (claiming a blockchain action occurred), the backend must independently verify:

```
Frontend: "I booked session X, here's txHash: 0xABC..."
                        │
                        ▼
Backend verification steps:
  1. Call web3.eth.getTransactionReceipt(txHash)
  2. Verify receipt.status === true (transaction succeeded)
  3. Verify receipt.to === SkillPlatform contract address
  4. Parse event logs for the expected event (e.g., SessionBooked)
  5. Verify event parameters match (learner address, session ID, amount)
  6. Only then update MongoDB records
```

This pattern is already partially implemented in `platformContract.verifyBookingTransaction()` and must be extended to all user-submitted blockchain actions.

### 8.3 Backend Web3 Module Architecture

```
Server/web3/
├── web3Provider.js          Singleton Web3 instance + admin wallet
├── tokenContract.js         ERC-20 interactions (mint, balanceOf, transfer)
├── nftContract.js           ERC-721 interactions (mint, verify)
└── platformContract.js      Core platform interactions (sessions, bookings, challenges)

Server/services/
├── web3Service.js           High-level orchestration (coordinates multiple contract calls)
└── ipfsService.js           Metadata upload for NFT certificates

Server/Controller/
├── web3Controller.js        REST API endpoints for blockchain operations
└── WalletController.js      Wallet balance, NFTs, and earnings queries
```

### 8.4 Event Subscription (Backend)

The backend should subscribe to contract events to maintain database synchronisation:

| Event | Contract | Backend Action |
|---|---|---|
| `LearnerRegistered` | SkillPlatform | Update `UserModel.tokenBalance` to 10 |
| `CoursePurchased` | SkillPlatform | Update `CourseModel.enrolledLearners`, credit mentor balance |
| `SessionBooked` | SkillPlatform | Update `MentorshipRequestModel.onChainBookingId` |
| `SessionConfirmed` | SkillPlatform | Mark session as completed, credit mentor |
| `CertificateMinted` | CertificateNFT | Update `CertificationModel.nftTokenId` and `txHash` |
| `WinnersDeclared` | SkillPlatform | Update `ChallengeModel` with winner addresses |
| `Transfer` | SkillToken | Sync `UserModel.tokenBalance` for sender and receiver |

In development (Ganache), events can be polled via `contract.events.EventName()`. On Sepolia, consider periodic polling (every 15 seconds) rather than persistent WebSocket subscriptions for reliability.

### 8.5 Gas Fee Management

| Transaction Type | Who Pays Gas | Rationale |
|---|---|---|
| Learner registration (mint 10 SKT) | Admin wallet | User should not need ETH just to register |
| Course purchase (transferFrom) | Learner via MetaMask | User-initiated action; user pays |
| Session booking | Learner via MetaMask | User-initiated |
| Certificate minting | Admin wallet | Platform reward, not user-initiated |
| Challenge winner declaration | Admin wallet | Platform operation |
| Challenge entry (joinChallenge) | Learner via MetaMask | User-initiated |

The admin wallet must maintain a Sepolia ETH balance to cover gas for platform-initiated transactions. Monitoring this balance and alerting when low is important for operational reliability.

### 8.6 Error Handling and Fallback Strategy

| Failure Scenario | Handling Strategy |
|---|---|
| Blockchain node unreachable | Fall back to off-chain balance display; queue pending mints for retry |
| Transaction reverted on-chain | Log error, notify user, do not update MongoDB |
| Admin wallet out of gas | Alert admin; queue platform-initiated transactions for later execution |
| User rejects MetaMask popup | No transaction submitted; UI resets to initial state |
| Network congestion (slow confirmation) | Show "pending" state; backend retries receipt polling up to 5 minutes |
| Contract address mismatch | Validate contract addresses on server startup; fail fast if misconfigured |

---

## 9. User Transaction Flow

### 9.1 Learner Registration

```
Step 1: Learner fills registration form (name, email, password, skills)
Step 2: Frontend sends POST /auth/register to backend
Step 3: Backend creates user in MongoDB (AuthController.register):
        a. Hash password with bcrypt
        b. Generate Ethereum wallet (for server-side operations)
        c. Store wallet address in UserModel.UserWalletAddress
        d. Set initial tokenBalance = 10 (off-chain)
Step 4: Backend calls SkillPlatform.registerLearner(walletAddress):
        a. Admin wallet signs the transaction
        b. SkillPlatform calls SkillToken.mint(walletAddress, 10 * 10^18)
        c. LearnerRegistered event emitted
Step 5: Backend receives tx receipt, stores txHash in user record
Step 6: Learner logs in and connects MetaMask wallet
Step 7: Frontend displays:
        a. Off-chain balance: 10 SKT (instant, from MongoDB)
        b. On-chain balance: 10 SKT (verified via SkillToken.balanceOf)
```

**Note on wallet strategy:** Currently, the backend generates wallets for users (`AuthController.register` generates Ethereum addresses). With MetaMask integration, the preferred approach is:

- **At registration**: Backend generates a temporary wallet (for receiving initial tokens without MetaMask).
- **At first login**: User connects MetaMask, providing their self-custodied address.
- **Backend updates** `UserWalletAddress` to the MetaMask address.
- **Token migration**: Admin transfers the 10 SKT from the generated wallet to the user's MetaMask wallet (one-time).

Alternatively, defer the 10 SKT minting until the user connects MetaMask for the first time, avoiding the need for a temporary wallet.

### 9.2 Course Purchase

```
Step 1: Learner views course detail page (CourseDetail.js)
        - Course price: 1 SKT
        - Mentor wallet: 0xMENTOR...
Step 2: Learner clicks "Enroll" button
Step 3: Frontend checks: Does MetaMask wallet have ≥1 SKT?
        a. Call SkillToken.balanceOf(learnerAddress)
        b. If insufficient, show "Not enough SKT tokens" error
Step 4: Frontend initiates approval:
        a. Call SkillToken.approve(SkillPlatform.address, 1 SKT)
        b. MetaMask popup: "Allow SkillPlatform to spend 1 SKT?"
        c. User confirms
Step 5: Frontend initiates purchase:
        a. Call SkillPlatform.purchaseCourse(learnerAddress, mentorAddress, 1 SKT)
        b. MetaMask popup: "Confirm transaction?"
        c. User confirms
Step 6: Transaction submitted; frontend shows "Processing..."
Step 7: Transaction confirmed on-chain:
        a. CoursePurchased event emitted
        b. 1 SKT transferred from learner to mentor
Step 8: Frontend sends txHash to backend:
        a. POST /courses/:id/enroll with { txHash }
Step 9: Backend verifies transaction:
        a. Fetch receipt, verify status === true
        b. Parse CoursePurchased event, verify amounts
Step 10: Backend updates MongoDB:
         a. Add learner to CourseModel.enrolledLearners
         b. Deduct 1 from learner's off-chain tokenBalance
         c. Credit 1 to mentor's off-chain tokenBalance
         d. Log in both users' transactionHistory
Step 11: Socket.IO notification sent to mentor: "New student enrolled!"
Step 12: Learner redirected to course content page
```

### 9.3 Challenge Reward

```
Step 1: Mentor creates challenge via MentorChallenges page:
        a. Sets title, description, deadline, difficulty
        b. Sets rewardTokens (e.g., 100 SKT as prize pool)
        c. Backend calls SkillPlatform.createChallenge(100 SKT)
        d. Admin wallet funds the prize pool
Step 2: Learner joins challenge:
        a. Clicks "Join Challenge" on Challenges page
        b. Frontend calls SkillToken.approve(SkillPlatform.address, 10 SKT)
        c. Frontend calls SkillPlatform.joinChallenge(challengeId)
        d. 10 SKT entry fee deducted from learner
Step 3: Learner submits solution (file upload to backend, off-chain)
Step 4: Mentor reviews and ranks submissions (off-chain, SubmissionReview page)
Step 5: Mentor clicks "Distribute Rewards":
        a. Backend calls SkillPlatform.declareWinners(challengeId, goldAddr, silverAddr, bronzeAddr)
        b. Admin wallet signs the transaction
        c. Prize pool distributed: Gold 50%, Silver 30%, Bronze 20%
        d. WinnersDeclared event emitted
Step 6: Backend updates ChallengeModel with winner details
Step 7: NFTs minted for top 3 winners (achievement badges)
Step 8: Socket.IO notifications sent to all winners
Step 9: Leaderboard UI updates with final rankings
```

### 9.4 Mentorship Payment

```
Step 1: Learner browses available mentor slots (BookSession page)
Step 2: Learner selects a time slot (MentorSlotModel)
Step 3: Frontend shows session price (e.g., N SKT)
Step 4: Learner clicks "Book Session":
        a. Frontend calls SkillToken.approve(SkillPlatform.address, N SKT)
        b. MetaMask popup; user approves
        c. Frontend calls SkillPlatform.bookSession(sessionKey, sessionTimestamp)
        d. MetaMask popup; user confirms
        e. N SKT moved from learner to contract escrow
Step 5: SessionBooked event emitted; frontend captures txHash
Step 6: Frontend sends txHash to backend:
        a. POST /mentorship-requests with { slotId, txHash, onChainBookingId }
Step 7: Backend verifies transaction:
        a. platformContract.verifyBookingTransaction(txHash, learnerWallet)
        b. Confirms SessionBooked event matches expected parameters
Step 8: Backend creates MentorshipRequest in MongoDB:
        a. Stores onChainBookingId and txHash
        b. Updates MentorSlotModel status to 'pending'
Step 9: Mentor receives notification and accepts:
        a. Session created with WebRTC roomId
Step 10: Session conducted (WebRTC video call)
Step 11: Session completed by mentor:
         a. Backend calls SkillPlatform.confirmSession(bookingId)
         b. Escrow released: N SKT transferred to mentor wallet
         c. SessionConfirmed event emitted
Step 12: If session cancelled before start:
         a. Backend calls SkillPlatform.cancelBooking(bookingId)
         b. N SKT refunded to learner wallet
```

### 9.5 Certificate Generation

```
Step 1: Learner completes all lectures in a course
        a. Each lecture marked complete via updateLectureProgress()
        b. All quizzes passed, all assignments submitted
Step 2: Frontend calls POST /courses/:id/complete
Step 3: Backend (CourseController.completeCourse):
        a. Verify 100% completion in MongoDB
        b. Determine grade based on quiz scores
        c. Create CertificationModel record
Step 4: Backend generates certificate metadata:
        a. JSON with course name, learner, mentor, date, grade
        b. Upload to IPFS (or use platform-hosted URI)
        c. Receive metadataURI (e.g., ipfs://QmXYZ...)
Step 5: Backend calls nftContract.mintCourseNFT():
        a. Parameters: learnerWallet, courseId, courseName, mentorName, metadataURI
        b. Admin wallet signs transaction
        c. On-chain: SkillPlatform.mintCertificate() → CertificateNFT.mintCertificate()
Step 6: CertificateMinted event emitted with tokenId
Step 7: Backend updates CertificationModel:
        a. nftTokenId = tokenId from event
        b. txHash = receipt.transactionHash
Step 8: Socket.IO notification: "Congratulations! Your NFT certificate has been minted"
Step 9: Learner views certificate in MyCertificates page:
        a. Certificate details from MongoDB
        b. NFT token ID and Etherscan link
        c. QR code / shareable link for third-party verification
Step 10: Third-party verification:
         a. Visit CertificateVerify page
         b. Enter token ID
         c. Smart contract returns certificate data (no login required)
         d. Alternatively, check directly on Sepolia Etherscan
```

---

## 10. Development Workflow

### 10.1 Phase Overview

```
Phase 1: Smart Contract Development
    └── Write, compile, and unit-test all three contracts

Phase 2: Local Testing (Ganache)
    └── Deploy to local blockchain, integration-test with backend

Phase 3: Testnet Deployment (Sepolia)
    └── Deploy to Sepolia, verify contracts, configure frontend

Phase 4: MERN Integration
    └── Wire frontend and backend to deployed contracts

Phase 5: End-to-End Testing
    └── Full user flows on Sepolia with MetaMask
```

### 10.2 Phase 1 — Smart Contract Development

**Environment Setup:**
1. Truffle is already installed (`devDependencies` in root `package.json`).
2. OpenZeppelin v4.9.6 is already installed.
3. Create three Solidity files in `contracts/`:
   - `SkillToken.sol`
   - `CertificateNFT.sol`
   - `SkillPlatform.sol` (refactor the existing one)

**Writing Contracts:**
1. Start with `SkillToken.sol` — simplest contract, no dependencies.
2. Then `CertificateNFT.sol` — standalone NFT with minter role.
3. Finally `SkillPlatform.sol` — references both other contracts.
4. Use Solidity `^0.8.20` for consistency with OpenZeppelin v4.9.6.
5. Inherit from OpenZeppelin base contracts (do not reimplement ERC standards).

**Unit Testing:**
1. Write tests in `test/` directory using Truffle's JavaScript test framework.
2. Test each contract independently, then test cross-contract interactions.
3. Key test cases:
   - Token minting and transfer (including edge cases: zero amount, insufficient balance)
   - Approval and `transferFrom` flow
   - Certificate minting (verify soulbound — transfer should revert)
   - Registration → mint → purchase → certificate full flow
   - Access control (only owner/minter can call restricted functions)
   - Challenge lifecycle (create, join, declare winners, verify distributions)
4. Run tests: `truffle test`

**Compilation:**
1. Run `truffle compile` to generate ABI and bytecode in `build/contracts/`.
2. Verify no compiler warnings or errors.
3. Check that all three compiled artifacts exist: `SkillToken.json`, `CertificateNFT.json`, `SkillPlatform.json`.

### 10.3 Phase 2 — Local Testing (Ganache)

**Ganache Setup:**
1. Start Ganache (GUI or CLI) on `127.0.0.1:7545`.
2. Note the first account's address and private key (this becomes the admin/deployer).
3. Set `GANACHE_RPC=http://127.0.0.1:7545` and `PRIVATE_KEY=<deployer-key>` in `Server/.env`.

**Deployment:**
1. Update `migrations/2_deploy_all_contracts.js` with the three-contract sequence.
2. Run `truffle migrate --network development`.
3. Record deployed addresses from console output.
4. Set `SKILL_PLATFORM_ADDRESS`, `SKT_TOKEN_ADDRESS`, `CERTIFICATE_NFT_ADDRESS` in `Server/.env`.

**Integration Testing:**
1. Start the Express server (`cd Server && npm run dev`).
2. Use Postman or curl to test Web3 API endpoints:
   - `POST /web3/register` — Verify 10 SKT minted to a Ganache test wallet
   - `POST /web3/course/buy` — Verify token transfer
   - `POST /web3/course/mint-certificate` — Verify NFT minted
3. Check Ganache's transaction log to verify on-chain state changes.
4. Start React app (`cd Client && npm start`) and test MetaMask interactions against Ganache.

**MetaMask with Ganache:**
1. Add a custom network in MetaMask: RPC URL `http://127.0.0.1:7545`, Chain ID `1337`.
2. Import a Ganache test account's private key into MetaMask.
3. You now have a local wallet with 100 test ETH for gas.

### 10.4 Phase 3 — Testnet Deployment (Sepolia)

**Prerequisites:**
1. Install `@truffle/hdwallet-provider`: `npm install @truffle/hdwallet-provider --save-dev`.
2. Sign up for an Infura or Alchemy account and create a project. Copy the Sepolia RPC URL.
3. Fund the deployer wallet with Sepolia ETH from a faucet.

**Truffle Configuration:**
1. Add the `sepolia` network to `truffle-config.js`:
   - Provider: `HDWalletProvider` with mnemonic/private key and Sepolia RPC URL.
   - `network_id: 11155111`
   - `gas: 6000000`
   - `confirmations: 2`
   - `timeoutBlocks: 200`

**Deployment:**
1. Run `truffle migrate --network sepolia`.
2. Wait for confirmations (Sepolia block time ~12 seconds).
3. Record all three deployed contract addresses.
4. Optionally verify on Etherscan: `truffle run verify SkillToken CertificateNFT SkillPlatform --network sepolia`.

**Post-Deployment:**
1. Update all environment variables and config files with Sepolia addresses.
2. Copy compiled ABIs to `Client/src/web3/abi/`.
3. Update `GANACHE_RPC` to the Sepolia RPC URL in `Server/.env` (or add a separate `SEPOLIA_RPC` variable).
4. Switch `web3Provider.js` to use the Sepolia RPC URL.

### 10.5 Phase 4 — MERN Integration

**Backend Updates:**
1. Update `Server/web3/tokenContract.js` — replace stub with real ERC-20 calls.
2. Update `Server/web3/nftContract.js` — point to new CertificateNFT address.
3. Update `Server/web3/platformContract.js` — add new function wrappers for all SkillPlatform methods.
4. Update controllers to call Web3 services at the right points in the workflow.
5. Add event listeners for contract events to sync MongoDB.

**Frontend Updates:**
1. Add ABIs for all three contracts to `Client/src/web3/abi/`.
2. Update `Client/src/services/contractAddress.js` with all three addresses.
3. Update `WalletConnect.js` to detect Sepolia chain.
4. Add token approval flows to course purchase, session booking, and challenge entry pages.
5. Add transaction status indicators (pending spinner, confirmation toast, error alert).
6. Display on-chain balance in wallet/navbar using `SkillToken.balanceOf()`.

### 10.6 Phase 5 — End-to-End Testing

Test complete user flows with real MetaMask wallets on Sepolia:

| Test Case | Steps | Expected Outcome |
|---|---|---|
| Registration | Register new learner → connect MetaMask | 10 SKT visible in MetaMask and on platform |
| Course purchase | Approve + buy course | 1 SKT deducted from learner, 1 SKT credited to mentor |
| Course completion | Complete all lectures | NFT certificate minted, visible in MyCertificates |
| Certificate verification | Enter token ID on verify page | Course, learner, and mentor details returned |
| Challenge entry | Approve + join challenge | 10 SKT deducted from learner |
| Challenge rewards | Mentor declares winners | Prize pool distributed to top 3 wallets |
| Session booking | Approve + book session | SKT held in escrow |
| Session completion | Mentor confirms session | Escrow released to mentor |
| Session cancellation | Cancel before session | SKT refunded to learner |

---

## 11. Security and Best Practices

### 11.1 Token Minting Security

| Risk | Mitigation |
|---|---|
| Unauthorised minting (inflation attack) | Only the contract `owner` and explicitly authorised `minter` addresses can call `mint()`. Enforce with `onlyOwner` or `onlyMinter` modifier. |
| Admin private key compromise | Store the private key in environment variables, never in source code. On production, use a hardware wallet or AWS KMS / Azure Key Vault. |
| Infinite approval exploit | When the frontend calls `approve()`, specify the exact amount needed (not `type(uint256).max`). This limits exposure if the contract has a vulnerability. |
| Double-minting on registration | Check `registeredLearners[address]` mapping before minting. Revert if already registered. |
| Reentrancy on mint | Use OpenZeppelin's `ReentrancyGuard` on all state-changing functions. The `mint()` function should follow the checks-effects-interactions pattern. |

### 11.2 Access Control

| Principle | Implementation |
|---|---|
| Principle of least privilege | Only SkillPlatform has the `minter` role on SkillToken and CertificateNFT. The deployer wallet is the `owner` of all three contracts, but only uses ownership for configuration changes. |
| Role separation | `owner` can configure contracts (set minters, pause). `minter` can create tokens/NFTs. Regular users can only call public functions (transfer, approve, bookSession). |
| Function visibility | Mark internal helper functions as `internal` or `private`. Public functions that change state should have explicit access modifiers. |
| Modifier usage | Every restricted function must use `onlyOwner`, `onlyMinter`, or a custom modifier. Never rely on frontend checks alone. |

### 11.3 Contract Ownership

| Best Practice | Description |
|---|---|
| Single deployer | Deploy all three contracts from the same wallet. This wallet becomes the `owner` of all contracts. |
| Ownership transfer | After system is stable, consider transferring ownership to a multisig wallet (e.g., Gnosis Safe) for decentralised governance. |
| No renounced ownership | Do not call `renounceOwnership()` — the platform needs the owner to mint tokens and configure minters. |
| Time-locked upgrades | For production, consider adding a time-lock on sensitive owner functions (e.g., changing the minter address). |

### 11.4 Preventing Misuse

| Risk | Mitigation |
|---|---|
| Front-running | Session booking prices are fixed on-chain. Attackers cannot front-run with a higher gas price to steal a session at a lower price. |
| Replay attacks | Each transaction has a unique nonce managed by Ethereum. The same `txHash` cannot be used twice. Backend must check that a `txHash` is not already recorded in MongoDB before accepting it. |
| Fake txHash submission | Backend independently verifies every `txHash` by fetching the receipt from the blockchain node. Never trust `txHash` from the frontend without on-chain verification. |
| Sybil registration (multiple accounts for free tokens) | While not fully preventable on-chain, rate-limit registrations via email/OTP verification (already implemented). Consider requiring MetaMask connection at registration to tie wallets to verified identities. |
| Unchecked return values | All calls to external contracts (SkillToken, CertificateNFT) must check return values. Use OpenZeppelin's `SafeERC20` for token operations, which reverts on failure. |
| Integer overflow/underflow | Solidity 0.8.x has built-in overflow checks. No additional SafeMath library needed. |
| Denial of service (gas griefing) | Avoid unbounded loops in contracts. Challenge winner declaration takes exactly 3 addresses (bounded). Certificate minting is a single operation (bounded). |
| Private key exposure | Never log or expose admin private keys. The `web3Provider.js` loads the key from `.env` only. The `.env` file must be in `.gitignore`. |

### 11.5 Smart Contract Best Practices Checklist

- [ ] Use OpenZeppelin audited base contracts for ERC-20 and ERC-721
- [ ] Apply `ReentrancyGuard` to all functions that transfer ETH or tokens
- [ ] Follow checks-effects-interactions pattern in all state-changing functions
- [ ] Emit events for every state change (for backend sync and audit trail)
- [ ] Use `require()` with descriptive error messages for all preconditions
- [ ] Mark all view/pure functions correctly to avoid unnecessary gas costs
- [ ] Test with 100% branch coverage before deploying to Sepolia
- [ ] Verify contract source on Etherscan after Sepolia deployment
- [ ] Keep contracts under the 24KB size limit (EIP-170)
- [ ] Use `indexed` keyword on event parameters that will be filtered (addresses, IDs)

### 11.6 Backend Security for Web3

- [ ] Validate all user-supplied Ethereum addresses (checksum format, non-zero)
- [ ] Never expose the admin wallet's private key in API responses or logs
- [ ] Rate-limit Web3 API endpoints to prevent abuse
- [ ] Implement request signing or nonce-based authentication for sensitive Web3 operations
- [ ] Log all blockchain transactions (txHash, from, to, value) for audit
- [ ] Set appropriate gas limits on admin-initiated transactions to prevent unexpected costs
- [ ] Handle blockchain RPC errors gracefully — do not expose internal error details to the client

### 11.7 Frontend Security for Web3

- [ ] Never request or store user private keys — rely entirely on MetaMask
- [ ] Validate the connected chain ID before allowing blockchain operations
- [ ] Display clear transaction details before asking user to sign (amount, recipient, action)
- [ ] Handle MetaMask disconnection and account switching gracefully
- [ ] Do not hardcode contract addresses in source code — use environment variables or config files
- [ ] Sanitise all data displayed from blockchain events (prevent XSS via malicious on-chain data)

---

## Appendix A: Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React.js | 18.2.0 | UI framework |
| Frontend | Web3.js | 4.16.0 | Blockchain interaction |
| Frontend | MetaMask | Latest | Wallet provider |
| Frontend | Tailwind CSS | 3.4.1 | Styling |
| Backend | Node.js | 18+ | Runtime |
| Backend | Express.js | 4.x | HTTP server |
| Backend | Socket.IO | 4.x | Real-time events |
| Backend | Web3.js | 4.16.0 | Blockchain interaction |
| Database | MongoDB | 6+ | Off-chain data |
| Blockchain | Solidity | 0.8.20 | Smart contracts |
| Blockchain | Truffle | 5.11 | Development framework |
| Blockchain | OpenZeppelin | 4.9.6 | Contract library |
| Blockchain | Ganache | 7+ | Local test chain |
| Network | Sepolia | — | Ethereum testnet |

## Appendix B: Environment Variables Reference

| Variable | Location | Description |
|---|---|---|
| `GANACHE_RPC` | Server/.env | Blockchain RPC URL |
| `PRIVATE_KEY` | Server/.env | Admin wallet private key |
| `SKILL_PLATFORM_ADDRESS` | Server/.env | SkillPlatform contract address |
| `SKT_TOKEN_ADDRESS` | Server/.env | SkillToken contract address |
| `CERTIFICATE_NFT_ADDRESS` | Server/.env | CertificateNFT contract address |
| `REACT_APP_API_BASE_URL` | Client/.env | Backend API URL |
| `REACT_APP_SKILL_PLATFORM_ADDRESS` | Client/.env | SkillPlatform address for frontend |
| `REACT_APP_SKT_TOKEN_ADDRESS` | Client/.env | SkillToken address for frontend |
| `REACT_APP_CERTIFICATE_NFT_ADDRESS` | Client/.env | CertificateNFT address for frontend |
| `REACT_APP_NETWORK_ID` | Client/.env | Expected chain ID (11155111 for Sepolia) |

## Appendix C: Contract Deployment Addresses (To Be Filled)

| Contract | Ganache (Local) | Sepolia (Testnet) |
|---|---|---|
| SkillToken | `0x___` | `0x___` |
| CertificateNFT | `0x___` | `0x___` |
| SkillPlatform | `0x___` | `0x___` |

---

*This document serves as the complete technical architecture and implementation plan for integrating Web3 functionality into the Blockchain-Based Community Learning and Credentialing Platform. It is intended for use within the final year project report and as a development reference guide.*
