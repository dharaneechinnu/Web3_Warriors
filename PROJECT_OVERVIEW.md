# Project Overview — Skill Exchange Platform

*A plain-English explanation of what this project is and why it exists.*

---

## In one line

A learning marketplace where **AI checks that mentors are actually qualified**, and **your certificate is an NFT that anyone can verify** — so both the teacher and the proof of learning can be trusted.

---

## The problem

Two things are broken in online learning:

1. **Certificates are just PDFs.** Easy to fake, and an employer has no way to check whether yours is real.
2. **Anyone can call themselves a mentor.** Most platforms never check. A learner pays for a session and finds out afterwards.

This platform fixes both: the certificate goes on a public blockchain, and the mentor gets screened by AI before they are ever allowed to teach.

---

## Who uses it

| Role | What they do |
|------|--------------|
| **Learner** | Takes courses, books 1-on-1 live sessions with mentors, joins skill challenges, earns tokens and NFT certificates |
| **Mentor** | Creates courses, publishes their free time slots, teaches live, runs challenges and distributes prizes |
| **Admin** | Reviews and approves (or rejects) mentor applications. Fully isolated panel at `/admin/*` |

---

## The four main features

### 1. Courses (like Udemy)

A mentor uploads videos and builds a curriculum — sections, lectures, quizzes, assignments and downloadable resources. Learners enroll, watch, and their progress is tracked lecture by lecture. Assignments get submitted and graded.

### 2. Live mentorship (like booking a doctor's appointment)

1. The mentor sets their **weekly availability** ("Mondays 6–9 PM, 60-minute sessions").
2. The system **generates bookable slots** from that schedule.
3. A learner picks a slot and **pays on-chain** through MetaMask (fixed at **1 ETH** on the Sepolia test network).
4. The mentor accepts the request.
5. A **private video room** opens.

The video call is built in-house with **WebRTC** — camera, microphone, screen share and text chat, all signalled through Socket.IO. No Zoom, no Google Meet.

### 3. Becoming a mentor is AI-screened

This is the most interesting part of the product. You don't just tick a box saying "I'm a mentor."

You submit:

- your **resume** (PDF),
- an **intro video**,
- your **GitHub** and **LinkedIn** links.

**Google Gemini** then grades you out of 100:

| Signal | Weight | How it's checked |
|--------|--------|------------------|
| GitHub | 30% | GitHub API — real repos, stars, commit frequency |
| Resume | 25% | `pdf-parse` extracts the text, Gemini analyses it |
| LinkedIn | 25% | URL presence and format heuristics |
| Intro video | 20% | Gemini Vision *watches* it and scores presentation, communication and content |

**Thresholds:** 70 or above → approve · 40–69 → send to a human admin · below 40 → reject.

The evaluation runs asynchronously right after the application is submitted, and an admin can re-trigger it at any time.

### 4. Tokens and NFT certificates — the Web3 part

This is **real blockchain** — three smart contracts deployed on Ethereum's **Sepolia** test network (chain ID `11155111`).

| Contract | Type | Purpose |
|----------|------|---------|
| **PlatformToken (PTKN)** | ERC-20 | The platform's own coin. 10 free on registration, more for finishing courses and winning challenges |
| **CertificateNFT** | ERC-721 | Course completion certificates, minted into the learner's own wallet |
| **SkillPlatform** | — | Session booking payments and challenge winner declaration |

**Why the NFT certificate matters:** when you finish a course, the certificate is minted as an NFT to your wallet and its metadata is pinned to IPFS. It lives on a public blockchain, so an employer can look it up on Etherscan and confirm it was issued by this platform and never altered. Nobody can Photoshop it.

**Challenges** are contests a mentor runs. Learners submit their work, the mentor ranks them, and the prize pool is split on-chain — **50% / 30% / 20%** to 1st, 2nd and 3rd place.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, styled-components, Tailwind CSS, Framer Motion, shadcn/Radix UI |
| Backend | Node.js + Express, MongoDB (Mongoose), Socket.IO |
| Blockchain | Solidity, web3.js v4, Hardhat, OpenZeppelin v5, Sepolia testnet |
| AI | Google Gemini (`gemini-2.0-flash`) + Gemini Vision |
| Real-time | WebRTC video/audio/screen share, Socket.IO signalling and notifications |
| Storage | Multer (local `uploads/`), Pinata IPFS for NFT metadata |
| Auth | JWT, email OTP via nodemailer |

**Convention:** this project uses **web3.js v4 exclusively** — no ethers.js anywhere.

---

## How the pieces fit together

```
Learner signs up
   └─> gets 10 PTKN

Learner enrolls in a course
   └─> watches lectures, takes quizzes, submits assignments
        └─> on completion: Certificate NFT minted to their wallet + PTKN reward

Learner books a mentor session
   └─> picks a slot -> pays 1 ETH via MetaMask -> mentor accepts
        └─> WebRTC room opens (video + audio + screen share + chat)

Someone applies to be a mentor
   └─> uploads resume + intro video + GitHub/LinkedIn
        └─> Gemini scores them out of 100
             └─> 70+ auto-approve | 40-69 human review | <40 reject

Mentor runs a challenge
   └─> learners submit -> mentor ranks -> prizes split 50/30/20 on-chain
```

---

## Running it

### Backend

```bash
cd Server
npm install
npm run dev            # nodemon
npm run create-admin   # creates the admin user from env vars
```

### Frontend

```bash
cd Client
npm install --legacy-peer-deps
npm start
```

**Prerequisites:** Node 18+, MongoDB running locally, and MetaMask on the Sepolia testnet for the Web3 features. The app degrades gracefully if no wallet is connected.

See [`CLAUDE.md`](./CLAUDE.md) for the full environment variable list, database models, API route reference and contract addresses.

---

## Things to know before this goes to production

This started as a hackathon build, and the security audit in [`CLAUDE.md`](./CLAUDE.md) lists real issues that must be fixed first. The most important ones:

- **Most money-related routes have no auth check.** Sessions, wallet and challenge routes need `authMiddleware`, and user identity must come from `req.userId`, never from `req.body`.
- **`POST /wallet/transfer` is unauthenticated** and does a non-atomic read-modify-write. Needs auth and an atomic `$inc`.
- **`rewardForCourseCompletion` in the smart contract has no `onlyOwner`** — anyone can call it. Needs a redeploy with access control.
- **Reward constants ignore the 18-decimal convention**, so users actually receive 10⁻¹⁸ tokens. Also needs a redeploy.
- **OTP is only 4 digits** with no rate limiting or attempt counter.
- **JWT is stored in `localStorage`** (XSS-exposed) — should move to httpOnly cookies.
- **WebRTC signalling has no auth** — any socket that guesses a room UUID can join a private session.
- **Slot booking has no concurrency guard**, so the same slot can be double-booked.

None of these block local development or a demo. All of them block real users and real money.

---

## One architectural note

There are **two parallel course systems** in this codebase:

| | Original | Udemy-style |
|-|----------|-------------|
| Routes | `/courses` | `/udemy-courses` |
| Model | `CourseModel` (embedded curriculum) | `CourseSystemModel` (normalised: Course + Section + Lecture) |
| Status | Active, what learners actually use | Newer, still has bugs |

When working on a course feature, check which one the UI is actually calling before changing anything.
