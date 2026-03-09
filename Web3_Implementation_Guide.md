# Web3 Implementation Update Plan
## Blockchain-Based Community Learning and Credentialing Platform

**Version:** 2.0
**Date:** 2026-03-09
**Stack:** Solidity · Truffle · Web3.js · MetaMask · Sepolia Testnet · Node.js (Express) · MongoDB · React.js

---

## Table of Contents

1. [Smart Contract Logic Update](#1-smart-contract-logic-update)
2. [Platform Token Economy Logic](#2-platform-token-economy-logic)
3. [Contract Interaction Flow](#3-contract-interaction-flow)
4. [User Transaction Flows](#4-user-transaction-flows)
5. [Smart Contract Security Design](#5-smart-contract-security-design)
6. [Backend Integration Update](#6-backend-integration-update)
7. [Frontend Interaction Update](#7-frontend-interaction-update)
8. [Deployment Strategy](#8-deployment-strategy)

---

## 1. Smart Contract Logic Update

### Overview of the Three Contracts

```
SkillToken.sol          → ERC-20 utility token (SKT)
CertificateNFT.sol      → ERC-721 soulbound credential token
SkillPlatform.sol       → Core platform logic: courses, challenges, sessions, escrow
```

The contracts interact strictly in this direction:

```
SkillPlatform  →  calls  →  SkillToken (transfer, mint, burn)
SkillPlatform  →  calls  →  CertificateNFT (mint)
```

Users never call `SkillToken` or `CertificateNFT` directly for platform actions.
All platform actions go through `SkillPlatform`.

---

### 1.1 SkillToken.sol

**Purpose:** ERC-20 token used exclusively as the platform's utility currency.

**Key Changes from Original Design:**

| Property | Old | New |
|---|---|---|
| Registration drip | 100 SKT | 10 SKT |
| Who can mint | Any call | Only SkillPlatform (minter role) |
| Burn on spend | Not enforced | Pool-locked tokens tracked, not burned |

**Logic to Implement:**

- Total supply cap: 10,000,000 SKT (minted to deployer at construction).
- A separate `MINTER_ROLE` is granted to the `SkillPlatform` contract address after deployment.
- `mintTo(address recipient, uint256 amount)` — callable only by `MINTER_ROLE`.
  Used exclusively for the 10 SKT registration drip.
- Standard ERC-20 `transfer` and `transferFrom` used for all spending flows.
- No burn mechanism required for this version.

**Why this design:**
Keeping minting strictly controlled prevents inflation. The platform contract acts as the sole gateway — users cannot call `mintTo` themselves.

---

### 1.2 CertificateNFT.sol

**Purpose:** ERC-721 soulbound (non-transferable) credential NFT awarded on course completion.

**Key Changes:**

| Property | Old | New |
|---|---|---|
| Transferability | Transferable | Soulbound (transfers blocked) |
| Minter | Admin wallet | SkillPlatform contract (MINTER_ROLE) |
| Token cost to mint | N/A | Zero — no SKT charged |
| Metadata | On-chain only | IPFS URI via Pinata |

**Logic to Implement:**

- Inherit ERC-721URIStorage.
- Override `_update()` (OpenZeppelin v5) to block all transfers except mints (i.e., `from == address(0)`). This makes the token soulbound.
- `mintCertificate(address learner, string courseId, string courseName, string mentorName, string metadataURI)` — callable only by `MINTER_ROLE`.
- Emit `CertificateMinted(uint256 tokenId, address learner, string courseId)` event.
- `verifyCertificate(uint256 tokenId)` — public view returning all metadata fields.
- Each learner can hold multiple certificates (one per completed course).

**Soulbound enforcement logic:**

```
override _update:
  if (from != address(0)) revert TransferNotAllowed();
```

This single override blocks all `transfer`, `safeTransfer`, and `approve` paths without needing separate guards.

---

### 1.3 SkillPlatform.sol

**Purpose:** Central orchestrator for all token flows — registration, course purchase, challenge entry/rewards, and mentorship escrow.

**This contract must hold references to both `SkillToken` and `CertificateNFT`**, set at construction.

#### 1.3.1 Registration (Token Minting)

- `registerUser(address user, uint8 role)` — callable only by admin.
- Roles: `0 = Learner`, `1 = Mentor`.
- Calls `skillToken.mintTo(user, 10 * 10^18)` regardless of role.
- Sets `registered[user] = true`.
- Emits `UserRegistered(address user, uint8 role, uint256 tokensGranted)`.
- Guards: revert if already registered, revert if zero address.

---

#### 1.3.2 Course Purchase (Learner → Mentor)

- `purchaseCourse(string courseId, address mentor)` — called by learner.
- Price: exactly `1 SKT` (1 × 10^18 wei of SKT).
- Requires `skillToken.allowance(learner, platformAddress) >= 1 SKT`.
- Calls `skillToken.transferFrom(learner, mentor, 1 SKT)`.
- Records purchase: `coursePurchases[courseId][learner] = true`.
- Emits `CoursePurchased(string courseId, address learner, address mentor, uint256 amount)`.
- Guards: revert if course already purchased by this learner, revert if mentor address is zero.

---

#### 1.3.3 Challenge Participation (Learner → Pool)

**Entry:**

- `enterChallenge(uint256 challengeId)` — called by learner.
- Entry fee: `1 SKT`.
- Calls `skillToken.transferFrom(learner, address(this), 1 SKT)`.
- `this` (the platform contract) accumulates the pool.
- Records: `challengeParticipants[challengeId].push(learner)`.
- Tracks: `challengePool[challengeId] += 1 SKT`.
- Emits `ChallengeEntered(uint256 challengeId, address learner, uint256 poolTotal)`.
- Guards: revert if already entered this challenge, revert if challenge is not active.

**Reward Distribution:**

- `distributeChallengeRewards(uint256 challengeId, address gold, address silver, address bronze)` — called by admin only.
- Pool = `challengePool[challengeId]`.
- Distribute:
  - Gold receives 50% of pool.
  - Silver receives 30% of pool.
  - Bronze receives 20% of pool.
- All three transfers via `skillToken.transfer(winner, share)` (platform contract sends from its own balance).
- Sets `challengePool[challengeId] = 0` after distribution.
- Emits `ChallengeRewardsDistributed(uint256 challengeId, address gold, address silver, address bronze, uint256 totalPool)`.
- Guards: revert if challenge already distributed, revert if winners contain zero addresses.

**Note on rounding:** integer division may leave 1–2 wei in the pool due to rounding. Design should accumulate this as platform residual or add it to the gold share.

---

#### 1.3.4 Mentorship Session Escrow

The escrow pattern: learner locks tokens → session held → admin releases to mentor or refunds learner.

**Booking:**

- `bookSession(bytes32 sessionKey, address mentor, uint256 amount)` — called by learner.
- `amount` is the agreed session price in SKT (set off-chain by mentor, confirmed by platform).
- Calls `skillToken.transferFrom(learner, address(this), amount)` (platform holds as escrow).
- Creates booking record:
  - `bookingId` (auto-increment counter)
  - `learner`, `mentor`, `amountPaid`, `bookedAt`, `sessionTime`, `status = Booked`
- Emits `SessionBooked(uint256 bookingId, bytes32 sessionKey, address indexed learner, address mentor, uint256 amountPaid)`.

**Completion (release to mentor):**

- `completeSession(uint256 bookingId)` — called by admin.
- Verifies `booking.status == Booked`.
- Calls `skillToken.transfer(booking.mentor, booking.amountPaid)`.
- Updates `booking.status = Confirmed`.
- Emits `SessionCompleted(uint256 bookingId, address mentor, uint256 amountReleased)`.

**Cancellation (refund to learner):**

- `cancelSession(uint256 bookingId)` — callable by admin or the learner who booked it.
- Verifies `booking.status == Booked`.
- Calls `skillToken.transfer(booking.learner, booking.amountPaid)`.
- Updates `booking.status = Cancelled`.
- Emits `SessionCancelled(uint256 bookingId, address learner, uint256 amountRefunded)`.

---

#### 1.3.5 Course Completion — NFT Certificate Mint

- `mintCourseCertificate(address learner, string courseId, string courseName, string mentorName, string metadataURI)` — called by admin.
- Verifies `coursePurchases[courseId][learner] == true` (they actually bought and completed the course).
- Calls `certificateNFT.mintCertificate(learner, courseId, courseName, mentorName, metadataURI)`.
- No SKT charged.
- Emits `CertificateMinted(address learner, string courseId, uint256 tokenId)`.

---

## 2. Platform Token Economy Logic

### Full Token Lifecycle

```
SUPPLY CAP: 10,000,000 SKT (pre-minted to deployer on deploy)
REGISTRATION RESERVE: Platform contract holds allocation for drips
```

#### Stage 1: Onboarding

```
New User Registers
    └─→ Admin calls SkillPlatform.registerUser(user, role)
         └─→ SkillPlatform calls SkillToken.mintTo(user, 10 SKT)
              └─→ User wallet balance = 10 SKT
```

Both learners and mentors receive 10 SKT at registration.

#### Stage 2: Token Spending Map

```
User Action              Token Flow                         Amount
─────────────────────────────────────────────────────────────────
Buy a course             Learner ──→ Mentor                 1 SKT
Join a challenge         Learner ──→ Platform (pool)        1 SKT
Book a mentor session    Learner ──→ Platform (escrow)      negotiated SKT
```

#### Stage 3: Token Earning Map

```
Platform Action                     Token Flow                         Amount
──────────────────────────────────────────────────────────────────────────────
Course sold                         (Mentor receives from buyer)       1 SKT
Challenge: Gold winner              Platform (pool) ──→ Gold           50% pool
Challenge: Silver winner            Platform (pool) ──→ Silver         30% pool
Challenge: Bronze winner            Platform (pool) ──→ Bronze         20% pool
Session completed                   Platform (escrow) ──→ Mentor       full escrowed SKT
Session cancelled                   Platform (escrow) ──→ Learner      full escrowed SKT (refund)
```

#### Stage 4: Balance Tracking

- On-chain: `SkillToken.balanceOf(address)` is the authoritative source of truth.
- Off-chain (MongoDB): maintain a `walletAddress` field on User documents. Do NOT mirror token balances in MongoDB — always read from chain for display.
- The platform contract maintains:
  - `challengePool[challengeId]` — pool size per challenge.
  - `escrow[bookingId]` — locked tokens per booking.

#### Token Economy Summary Table

```
Starting Balance (any user): 10 SKT

Learner Spending:
  -1 SKT per course purchased
  -1 SKT per challenge entered
  -N SKT per session booked (escrowed, recoverable if cancelled)

Learner Earning:
  +N SKT challenge rewards (if winner)
  +N SKT session refund (if cancelled)

Mentor Earning:
  +1 SKT per course sold
  +N SKT per session completed
```

---

## 3. Contract Interaction Flow

### 3.1 Contract Dependency Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      SkillPlatform.sol                      │
│                                                             │
│  - holds SkillToken reference (immutable after deploy)      │
│  - holds CertificateNFT reference (immutable after deploy)  │
│  - is MINTER_ROLE on SkillToken                             │
│  - is MINTER_ROLE on CertificateNFT                         │
│  - holds escrow balances                                    │
│  - holds challenge pool balances                            │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
   ┌───────────────────┐      ┌───────────────────────┐
   │   SkillToken.sol  │      │   CertificateNFT.sol  │
   │   (ERC-20 SKT)    │      │   (ERC-721 Soulbound) │
   └───────────────────┘      └───────────────────────┘
```

### 3.2 Actor Roles

```
Admin Wallet
  - Deploys all contracts
  - Grants MINTER_ROLE to SkillPlatform on both token contracts
  - Calls: registerUser, completeSession, cancelSession (admin-side), distributeChallengeRewards, mintCourseCertificate

Learner Wallet (MetaMask)
  - Approves SkillPlatform to spend SKT via SkillToken.approve()
  - Calls: purchaseCourse, enterChallenge, bookSession, cancelSession (own bookings)

Mentor Wallet (MetaMask)
  - Passively receives SKT from course purchases and session completions
  - No direct contract calls required in the standard flows
```

### 3.3 Approval Model

Before any spend, the learner must call:

```
SkillToken.approve(skillPlatformAddress, amount)
```

This approval can be done:
- Per transaction (approve exact amount before each action), or
- As a large one-time approval (e.g., `MAX_UINT256`) — simpler UX but less granular control.

**Recommendation:** Request exact approvals per action. This limits exposure and is more transparent to the user.

---

## 4. User Transaction Flows

### Flow 1: User Registration

```
1. User signs up on the platform (MongoDB creates user record).
2. Admin backend calls SkillPlatform.registerUser(userWallet, role).
3. SkillPlatform internally calls SkillToken.mintTo(userWallet, 10 SKT).
4. UserRegistered event emitted on-chain.
5. Backend listens for event (or reads tx receipt) and confirms registration.
6. Frontend reads SkillToken.balanceOf(userWallet) → displays 10 SKT.
```

**Who signs:** Admin wallet (backend). User does not need MetaMask for this step.

---

### Flow 2: Course Purchase

```
1. Learner views course, clicks "Buy for 1 SKT".
2. Frontend requests SkillToken.approve(platformAddress, 1 SKT) via MetaMask.
   → MetaMask prompts → Learner confirms → approval tx submitted.
3. Frontend waits for approval tx receipt.
4. Frontend calls SkillPlatform.purchaseCourse(courseId, mentorWallet) via MetaMask.
   → MetaMask prompts → Learner confirms → purchase tx submitted.
5. SkillPlatform internally:
   a. Calls SkillToken.transferFrom(learner, mentor, 1 SKT).
   b. Records coursePurchases[courseId][learner] = true.
   c. Emits CoursePurchased event.
6. Frontend listens for event / reads receipt. Shows success.
7. Backend can verify on-chain: coursePurchases mapping read, or event indexed.
8. MongoDB: update enrollment record.
```

**Who signs:** Learner MetaMask (steps 2 and 4).

---

### Flow 3: Challenge Participation

```
1. Learner views challenge, clicks "Enter Challenge (1 SKT)".
2. Frontend calls SkillToken.approve(platformAddress, 1 SKT) via MetaMask.
3. Frontend waits for approval receipt.
4. Frontend calls SkillPlatform.enterChallenge(challengeId) via MetaMask.
5. SkillPlatform internally:
   a. Calls SkillToken.transferFrom(learner, platformAddress, 1 SKT).
   b. Records participant, increases challengePool[challengeId].
   c. Emits ChallengeEntered event.
6. Backend indexes participant list from events.
7. MongoDB: update challenge participant record.
```

**Who signs:** Learner MetaMask.

---

### Flow 4: Challenge Reward Distribution

```
1. Challenge deadline passes. Admin reviews submissions and determines winners.
2. Admin backend calls SkillPlatform.distributeChallengeRewards(challengeId, goldWallet, silverWallet, bronzeWallet).
3. SkillPlatform internally:
   a. Reads challengePool[challengeId] as totalPool.
   b. Transfers totalPool * 50% → goldWallet.
   c. Transfers totalPool * 30% → silverWallet.
   d. Transfers totalPool * 20% → bronzeWallet.
   e. Sets challengePool[challengeId] = 0.
   f. Emits ChallengeRewardsDistributed event.
4. Backend listens for event, updates MongoDB with winner records.
5. Frontend shows updated balances via SkillToken.balanceOf().
```

**Who signs:** Admin wallet (backend).

---

### Flow 5: Mentorship Session Booking

```
1. Learner selects mentor and session slot. Session price N SKT is displayed.
2. Frontend calls SkillToken.approve(platformAddress, N SKT) via MetaMask.
3. Frontend waits for approval receipt.
4. Frontend calls SkillPlatform.bookSession(sessionKey, mentorWallet, N_SKT) via MetaMask.
5. SkillPlatform internally:
   a. Calls SkillToken.transferFrom(learner, platformAddress, N SKT).
   b. Creates booking record (auto bookingId).
   c. Emits SessionBooked event.
6. Backend: verifyBookingTransaction(txHash, learnerWallet) — already implemented in platformContract.js.
7. MongoDB: create session booking record with bookingId and txHash.
```

**Who signs:** Learner MetaMask.

---

### Flow 6: Session Completion

```
1. Session takes place (tracked off-chain / in MongoDB).
2. Admin or mentor marks session complete on the platform dashboard.
3. Admin backend calls SkillPlatform.completeSession(bookingId).
4. SkillPlatform internally:
   a. Verifies booking.status == Booked.
   b. Calls SkillToken.transfer(booking.mentor, booking.amountPaid).
   c. Sets booking.status = Confirmed.
   d. Emits SessionCompleted event.
5. Backend listens for event, updates MongoDB session status to "completed".
```

**Who signs:** Admin wallet (backend).

**Cancellation alternative:**

```
3. Admin or learner calls SkillPlatform.cancelSession(bookingId).
4. SkillPlatform transfers amountPaid back to booking.learner.
5. Emits SessionCancelled event.
```

---

### Flow 7: Course Completion and NFT Certificate Mint

```
1. Learner completes all course modules (tracked in MongoDB).
2. Backend verifies on-chain that learner purchased the course:
   SkillPlatform.coursePurchases(courseId, learnerWallet) == true.
3. Backend uploads certificate metadata (learner name, course, date, mentor) to Pinata IPFS.
   → Returns metadataURI (e.g., ipfs://Qm...)
4. Admin backend calls SkillPlatform.mintCourseCertificate(learnerWallet, courseId, courseName, mentorName, metadataURI).
5. SkillPlatform internally:
   a. Verifies coursePurchases[courseId][learner] == true.
   b. Calls CertificateNFT.mintCertificate(learner, courseId, courseName, mentorName, metadataURI).
   c. Emits CertificateMinted event.
6. CertificateNFT mints tokenId to learner wallet (soulbound, cannot be transferred).
7. Backend reads tokenId from CertificateMinted event. Stores in MongoDB.
8. Frontend: learner can view certificate via CertificateNFT.verifyCertificate(tokenId).
```

**Who signs:** Admin wallet (backend). No SKT consumed.

---

## 5. Smart Contract Security Design

### 5.1 Access Control

Use OpenZeppelin `AccessControl` with two roles:

```
ADMIN_ROLE     → deployer wallet, backend admin wallet
MINTER_ROLE    → SkillPlatform contract address (on SkillToken and CertificateNFT)
```

| Function | Required Role |
|---|---|
| `SkillToken.mintTo` | `MINTER_ROLE` |
| `CertificateNFT.mintCertificate` | `MINTER_ROLE` |
| `SkillPlatform.registerUser` | `ADMIN_ROLE` |
| `SkillPlatform.distributeChallengeRewards` | `ADMIN_ROLE` |
| `SkillPlatform.completeSession` | `ADMIN_ROLE` |
| `SkillPlatform.cancelSession` | `ADMIN_ROLE` or booking's learner |
| `SkillPlatform.purchaseCourse` | any registered user |
| `SkillPlatform.enterChallenge` | any registered user |
| `SkillPlatform.bookSession` | any registered user |

**Never grant `ADMIN_ROLE` to any frontend-facing wallet.**

---

### 5.2 Mint Permissions

- `SkillToken.mintTo` is gated by `onlyRole(MINTER_ROLE)`.
- `MINTER_ROLE` on `SkillToken` is granted to `SkillPlatform` address during deployment migration.
- No EOA (externally owned account) can call `mintTo` directly.
- `CertificateNFT.mintCertificate` follows the same pattern.

**Post-deployment checklist:**

```
□ SkillToken.MINTER_ROLE granted to SkillPlatform address
□ CertificateNFT.MINTER_ROLE granted to SkillPlatform address
□ Deployer wallet MINTER_ROLE revoked from SkillToken (optional hardening)
```

---

### 5.3 Preventing Token Misuse

- `purchaseCourse` records `coursePurchases[courseId][learner] = true` before allowing a second purchase — reverts on duplicate.
- `enterChallenge` records `challengeParticipants[challengeId][learner] = true` — reverts if already entered.
- `registerUser` sets `registered[user] = true` and reverts on re-registration.
- All SKT amounts are expressed in wei (multiply by 10^18 in the contract constants) to avoid decimal errors.

---

### 5.4 Preventing Double Spending

- The `transferFrom` pattern requires a prior `approve` — ERC-20 standard prevents double-spend at the token level.
- Escrow `bookings[bookingId].status` is checked before releasing: `Confirmed` or `Cancelled` bookings cannot be acted on again.
- Challenge pool `distributeChallengeRewards` sets pool to zero before distributing — prevents re-entry and double distribution.

---

### 5.5 Escrow Protection

- Escrowed SKT is held in the `SkillPlatform` contract itself (not in a separate wallet).
- The contract's SKT balance is the sum of all active escrows plus unspent challenge pools.
- `bookings[bookingId].amountPaid` tracks the exact amount per booking — no shared pool ambiguity.
- Only `completeSession` or `cancelSession` can move escrowed funds.
- Both functions check `booking.status == Booked` before executing.

---

### 5.6 Reentrancy Protection

Apply OpenZeppelin `ReentrancyGuard` to `SkillPlatform`.

Mark as `nonReentrant`:
- `bookSession`
- `completeSession`
- `cancelSession`
- `distributeChallengeRewards`

**Why:** These functions call `SkillToken.transfer` or `SkillToken.transferFrom`, which are external calls. Even though SKT is a trusted contract, following the checks-effects-interactions pattern and adding `nonReentrant` is best practice:

```
Pattern order inside each function:
1. CHECKS   — validate all preconditions (require statements)
2. EFFECTS  — update all state variables
3. INTERACTIONS — call SkillToken transfer last
```

---

## 6. Backend Integration Update

### 6.1 Architecture of Server-Side Web3

```
Server/web3/
  web3Provider.js      → web3 instance + admin wallet (unchanged)
  tokenContract.js     → SkillToken ERC-20 wrapper (needs full implementation)
  nftContract.js       → CertificateNFT wrapper (update ABI source path)
  platformContract.js  → SkillPlatform wrapper (add new methods)
```

The backend communicates with contracts using the admin wallet private key loaded from `.env`. The admin wallet is the only signing entity on the server side.

---

### 6.2 tokenContract.js — Full Implementation Required

The current stub returns `'0'` for all calls. Replace with:

- Load `SkillToken.json` ABI from `build/contracts/SkillToken.json`.
- `getBalance(walletAddress)` — calls `skillToken.methods.balanceOf(walletAddress).call()`.
- `hasBalance(walletAddress, minAmount)` — compares balance against minAmount in wei.

No write operations on the token are done directly from `tokenContract.js` — all minting is done through `platformContract.js`.

---

### 6.3 platformContract.js — New Methods to Add

**Admin operations (signed by admin wallet, backend-initiated):**

| Method | Purpose |
|---|---|
| `registerUserOnChain(walletAddress, role)` | Calls `SkillPlatform.registerUser` — triggers 10 SKT mint |
| `completeSessionOnChain(bookingId)` | Calls `SkillPlatform.completeSession` — releases escrow to mentor |
| `cancelSessionOnChain(bookingId)` | Calls `SkillPlatform.cancelSession` — refunds learner |
| `distributeRewards(challengeId, gold, silver, bronze)` | Calls `SkillPlatform.distributeChallengeRewards` |
| `mintCertificate(learner, courseId, courseName, mentorName, uri)` | Calls `SkillPlatform.mintCourseCertificate` |

**Read operations (no signing required):**

| Method | Purpose |
|---|---|
| `verifyBookingTransaction(txHash, learnerWallet)` | Already implemented — verify SessionBooked event |
| `getCoursePurchaseStatus(courseId, learnerWallet)` | Read `coursePurchases` mapping |
| `getBooking(bookingId)` | Already implemented |
| `getChallengePool(challengeId)` | Read `challengePool` mapping |

---

### 6.4 Operation Classification

**Admin wallet operations (backend signs and sends):**

```
registerUser          → triggered on new user registration (MongoDB webhook / controller hook)
mintCourseCertificate → triggered when CourseController marks course complete
completeSession       → triggered when MentorshipController marks session complete
cancelSession         → triggered when MentorshipController cancels session
distributeChallengeRewards → triggered by admin dashboard action
```

**User wallet operations (MetaMask, frontend sends):**

```
SkillToken.approve()       → approval before any spend
SkillPlatform.purchaseCourse()
SkillPlatform.enterChallenge()
SkillPlatform.bookSession()
SkillPlatform.cancelSession() (own bookings only)
```

---

### 6.5 Backend Event Listening

The backend should subscribe to key events for state synchronization:

```
SkillPlatform events to watch:
  UserRegistered       → confirm wallet activation in MongoDB
  CoursePurchased      → confirm enrollment in MongoDB
  ChallengeEntered     → confirm participation in MongoDB
  SessionBooked        → confirm booking in MongoDB
  SessionCompleted     → update session status in MongoDB
  SessionCancelled     → update session status in MongoDB
  CertificateMinted    → store tokenId in MongoDB
  ChallengeRewardsDistributed → store winner records in MongoDB
```

Use `web3.eth.subscribe('logs', { address: platformAddress, topics: [...] })` or poll `getPastEvents` on startup to catch any missed events.

---

## 7. Frontend Interaction Update

### 7.1 MetaMask Connection

The existing `useMetaMask.js` hook is the correct pattern. It should expose:

```javascript
{
  account,        // connected wallet address
  web3,           // web3 instance
  connect(),      // request MetaMask accounts
  disconnect(),   // clear local state
  isConnected,    // boolean
  chainId         // current network chain ID
}
```

**Network guard:** On connect, verify `chainId` matches the expected value (Ganache: `1337`, Sepolia: `11155111`). If not, prompt the user to switch networks before any transaction.

---

### 7.2 Token Approval Flow (UI Pattern)

Every action that spends SKT requires a two-step UX:

```
Step 1: Approve
  Button: "Approve 1 SKT"
  → calls: skillToken.methods.approve(platformAddress, amountInWei).send({ from: account })
  → show spinner, wait for tx receipt
  → on success: show "Approved ✓"

Step 2: Confirm Action
  Button: "Buy Course" / "Enter Challenge" / "Book Session"
  → calls the relevant SkillPlatform method
  → show spinner, wait for tx receipt
  → on success: show confirmation and update UI
```

Both steps create separate MetaMask confirmation popups. Inform users upfront that two transactions are required.

---

### 7.3 ABI Loading

The client needs ABIs for three contracts. Maintain them in `Client/src/web3/abi/`:

```
Client/src/web3/abi/
  SkillTokenABI.json
  CertificateNFTABI.json
  SkillPlatformABI.json
```

Contract addresses are loaded from `Client/src/services/contractAddress.js`:

```javascript
export const SKT_ADDRESS      = process.env.REACT_APP_SKT_ADDRESS;
export const NFT_ADDRESS      = process.env.REACT_APP_NFT_ADDRESS;
export const PLATFORM_ADDRESS = process.env.REACT_APP_PLATFORM_ADDRESS;
```

---

### 7.4 Course Purchase UI

```
Component: CourseDetail / BookSession

State needed:
  - sktBalance: read from SkillToken.balanceOf(account)
  - approvalStatus: 'idle' | 'approving' | 'approved' | 'purchasing' | 'done'

Flow:
  1. Display course price: 1 SKT
  2. Display user's balance: {sktBalance} SKT
  3. If balance < 1 SKT: show "Insufficient SKT" warning
  4. If balance >= 1 SKT: show "Approve & Buy" button
  5. On click:
     a. Call approve(platformAddress, 1 SKT)
     b. On approval receipt: call purchaseCourse(courseId, mentorWallet)
     c. On purchase receipt: navigate to course content
```

---

### 7.5 Challenge Participation UI

```
Component: ChallengeDetail

State needed:
  - sktBalance, challengePool (display only), isParticipating

Flow:
  1. Display entry fee: 1 SKT, current pool size
  2. If already entered: show "Entered ✓"
  3. Otherwise: show "Enter Challenge (1 SKT)"
  4. On click:
     a. approve(platformAddress, 1 SKT)
     b. enterChallenge(challengeId)
     c. On receipt: refresh participation status
```

---

### 7.6 Session Booking UI

```
Component: BookSession (Client/src/pages/learner/BookSession.js)

State needed:
  - sessionPrice (in SKT, fetched from mentor profile / platform)
  - approvalStatus

Flow:
  1. Show session price N SKT
  2. On "Book Session":
     a. approve(platformAddress, N_SKT)
     b. bookSession(sessionKey, mentorWallet, N_SKT)
     c. Send txHash to backend for verification
     d. Backend stores bookingId in MongoDB
     e. Show booking confirmation
```

---

### 7.7 Certificate Display

```
Component: MyCertificates (Client/src/pages/learner/MyCertificates.js)

Data source: MongoDB (tokenIds stored after mint event)

For each certificate:
  - Call CertificateNFT.verifyCertificate(tokenId) → show metadata
  - Render IPFS metadata image via Pinata gateway URL
  - Show: course name, mentor, issue date, tokenId (proof link)
```

---

## 8. Deployment Strategy

### 8.1 Tools and Versions

```
Truffle           → contract compilation and migration
Ganache           → local development blockchain (chainId: 1337)
Sepolia Testnet   → public testnet (chainId: 11155111)
OpenZeppelin      → inherited contract libraries
HDWalletProvider  → wallet/account management for Truffle migrations
```

---

### 8.2 Contract Deployment Order

Contracts have dependencies, so deployment order is strictly:

```
1. Deploy SkillToken.sol
   → No dependencies. Constructor params: name, symbol, initialSupply.
   → Record deployed address: SKT_ADDRESS

2. Deploy CertificateNFT.sol
   → No dependencies. Constructor params: name, symbol.
   → Record deployed address: NFT_ADDRESS

3. Deploy SkillPlatform.sol
   → Depends on both above. Constructor params: SKT_ADDRESS, NFT_ADDRESS.
   → Record deployed address: PLATFORM_ADDRESS

4. Post-deploy: Grant MINTER_ROLE
   → SkillToken.grantRole(MINTER_ROLE, PLATFORM_ADDRESS)
   → CertificateNFT.grantRole(MINTER_ROLE, PLATFORM_ADDRESS)
   → These two transactions must be in the migration script after all deploys.
```

**The role granting step is critical.** If omitted, `registerUser` and `mintCourseCertificate` will revert with AccessControl errors.

---

### 8.3 Truffle Migration Script Structure

```
migrations/
  1_initial_migration.js    → Migrations.sol (Truffle boilerplate)
  2_deploy_skill_token.js   → SkillToken
  3_deploy_certificate_nft.js → CertificateNFT
  4_deploy_skill_platform.js  → SkillPlatform (constructor takes token + nft addresses)
  5_configure_roles.js        → grantRole calls
```

Each migration script should:
- Log the deployed address to console.
- Write addresses to a shared `deployedAddresses.json` file for easy reference.

---

### 8.4 truffle-config.js Network Configuration

```javascript
networks: {
  development: {
    host: "127.0.0.1",
    port: 7545,           // Ganache default
    network_id: "1337",
    gas: 6721975,
  },
  sepolia: {
    provider: () => new HDWalletProvider(
      process.env.DEPLOYER_MNEMONIC,
      `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    ),
    network_id: "11155111",
    gas: 5500000,
    confirmations: 2,
    timeoutBlocks: 200,
    skipDryRun: true,
  }
},
compilers: {
  solc: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  }
}
```

---

### 8.5 Environment Variables After Deployment

After each deployment, update these files:

**Server/.env**

```
SKT_TOKEN_ADDRESS=<deployed SkillToken address>
CERTIFICATE_NFT_ADDRESS=<deployed CertificateNFT address>
SKILL_PLATFORM_ADDRESS=<deployed SkillPlatform address>
ADMIN_PRIVATE_KEY=<deployer/admin wallet private key>
RPC_URL=http://127.0.0.1:7545  # or Sepolia RPC
```

**Client/.env**

```
REACT_APP_SKT_ADDRESS=<deployed SkillToken address>
REACT_APP_NFT_ADDRESS=<deployed CertificateNFT address>
REACT_APP_PLATFORM_ADDRESS=<deployed SkillPlatform address>
```

---

### 8.6 Local Development Workflow

```
Step 1: Start Ganache
  → Open Ganache GUI or run: ganache --port 7545 --chainId 1337

Step 2: Compile contracts
  → truffle compile

Step 3: Deploy to local
  → truffle migrate --network development --reset

Step 4: Run role configuration migration
  → Runs automatically as step 5 in migration sequence

Step 5: Copy deployed addresses to Server/.env and Client/.env

Step 6: Start backend
  → cd Server && npm run dev

Step 7: Start frontend
  → cd Client && npm start

Step 8: Configure MetaMask
  → Add Ganache network: RPC http://127.0.0.1:7545, chainId 1337
  → Import Ganache test account with private key
```

---

### 8.7 Sepolia Testnet Deployment

```
Prerequisites:
  □ DEPLOYER_MNEMONIC or DEPLOYER_PRIVATE_KEY in .env
  □ INFURA_PROJECT_ID or Alchemy RPC URL
  □ Sepolia ETH in deployer wallet (from https://sepoliafaucet.com)

Deploy:
  → truffle migrate --network sepolia

Verify (optional):
  → truffle run verify SkillToken --network sepolia
  → truffle run verify CertificateNFT --network sepolia
  → truffle run verify SkillPlatform --network sepolia
  (Requires truffle-plugin-verify and ETHERSCAN_API_KEY in .env)

After deploy:
  → Update both .env files with new Sepolia addresses
  → Restart backend server
```

---

### 8.8 Post-Deployment Verification Checklist

```
Contract Integrity:
  □ SkillToken.name() == "SkillToken"
  □ SkillToken.symbol() == "SKT"
  □ SkillToken.totalSupply() == 10,000,000 * 10^18
  □ SkillPlatform has MINTER_ROLE on SkillToken
  □ SkillPlatform has MINTER_ROLE on CertificateNFT

Registration Flow:
  □ Call registerUser(testWallet, 0) from admin wallet
  □ Confirm SkillToken.balanceOf(testWallet) == 10 * 10^18

Course Purchase Flow:
  □ Approve platform from testWallet for 1 SKT
  □ Call purchaseCourse("test-course-1", mentorWallet)
  □ Confirm mentor balance increased by 1 SKT

Session Booking Flow:
  □ Approve platform for 2 SKT, call bookSession
  □ Confirm platform balance increased by 2 SKT
  □ Call completeSession → confirm mentor received 2 SKT

Certificate Mint Flow:
  □ Call mintCourseCertificate
  □ Confirm learner owns tokenId via CertificateNFT.ownerOf(tokenId)
  □ Confirm soulbound: attempt transfer → confirm revert
```

---

## Appendix: Key Design Decisions

| Decision | Rationale |
|---|---|
| All platform actions route through SkillPlatform | Single point of control, easier access restriction, no need for users to interact with token contract directly |
| Soulbound certificates | Credentials cannot be sold or transferred — preserves authenticity of skill verification |
| Admin-side minting (registerUser) | Prevents fake wallet farming for free SKT — only verified users get tokens |
| Escrow held in platform contract | Simpler than a separate escrow contract, fewer deployment dependencies |
| 10 SKT starting balance | Low enough to prevent token hoarding, high enough to allow: 1 course + 1 challenge + 1 session booking |
| Exact approvals per action | Better user transparency vs unlimited approval |
| Event-driven backend sync | Prevents tight coupling between chain state and MongoDB — events are the source of truth for confirmation |

---

*End of Web3 Implementation Update Plan v2.0*
