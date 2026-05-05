# CLAUDE.md — Skill Exchange Platform

## Project Overview

A decentralized skill-learning marketplace (codename: `web3-warriors`) built on MERN + Web3. Connects **learners** with **mentors** for courses, live mentorship sessions, and skill challenges. The learning lifecycle is tokenized:

- Users earn **PTKN** (ERC-20) tokens for registering, completing courses, and winning challenges
- Mentor session payments are on-chain (1 ETH per session via SkillPlatform contract on Sepolia)
- Course completions produce **ERC-721 Certificate NFTs**
- Mentor applications are AI-evaluated via Google Gemini before admin approval
- Live video sessions run over WebRTC with Socket.IO signaling

Three user roles: **learner**, **mentor**, **admin**. Admin panel is fully isolated at `/admin/*`.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, styled-components, Tailwind CSS, Framer Motion, shadcn/Radix UI |
| Backend | Node.js + Express, MongoDB (Mongoose), Socket.IO |
| Blockchain | web3.js v4, Hardhat, OpenZeppelin v5, Sepolia testnet |
| AI | Google Gemini (`gemini-2.0-flash`) for mentor evaluation |
| Storage | Multer (local `uploads/`), Pinata IPFS for NFT metadata |
| Auth | JWT (ACCESS_TOKEN), email OTP via nodemailer (Gmail) |

---

## Repository Structure

```
React_MJ/
├── CLAUDE.md
├── SmarContract.sol               # Legacy ERC-20 source (not the deployed contract)
├── Client/                        # React frontend (CRA + craco)
│   ├── craco.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.js                 # Routes + role guards
│       ├── config/index.js        # API_BASE_URL, SOCKET_URL, assetUrl()
│       ├── contexts/
│       │   ├── AuthContext.js     # JWT auth, localStorage, role-aware
│       │   └── NotificationContext.js
│       ├── hooks/
│       │   ├── useChallengeReward.js
│       │   ├── useTokenPayment.js
│       │   └── useWalletOwner.js
│       ├── components/
│       │   ├── ConnectWallet.js
│       │   ├── Navbar.js
│       │   └── ui/                # shadcn/Radix primitives (~50 files)
│       ├── pages/
│       │   ├── Auth/              # Generic login/register/forgot/reset
│       │   ├── learner/           # Learner-specific pages
│       │   ├── mentor/            # Mentor-specific pages
│       │   └── admin/             # AdminLogin, AdminLayout, Dashboard, NFTMint
│       ├── services/
│       │   ├── api.js             # Axios instance with interceptors
│       │   └── authService.js
│       └── web3/
│           ├── config.js          # Contract addresses, EXPECTED_CHAIN_ID=11155111
│           ├── provider.js        # MetaMask helpers (web3.js v4, no ethers.js)
│           ├── abi/               # SkillToken.json, CertificateNFT.json, SkillPlatform.json
│           └── services/
│               ├── skillTokenService.js
│               ├── certificateNFTService.js
│               └── skillPlatformService.js
└── Server/
    ├── Server.js                  # Express entry: CORS, routes, Socket.IO, static files
    ├── config/appConfig.js        # PORT, CLIENT_URL, SERVER_URL
    ├── Router/                    # 14 route files (see API Routes section)
    ├── Controller/                # 1-to-1 with routers + auth controllers
    ├── Model/                     # 12 Mongoose models
    ├── MiddleWare/
    │   ├── AuthMiddleWare.js      # JWT verify → req.userId
    │   ├── adminAuth.js           # JWT + role==='admin'
    │   ├── ensureMentorApproved.js
    │   └── Upload.js / mentorApplicationUpload.js
    ├── services/
    │   ├── aiMentorEvaluation.js  # Gemini pipeline orchestrator
    │   ├── videoAnalyzer.js       # Gemini Vision for intro video
    │   ├── githubService.js       # GitHub API analysis
    │   ├── resumeParser.js        # pdf-parse extraction
    │   ├── geminiRateLimiter.js
    │   ├── notificationService.js # Writes DB + emits Socket.IO
    │   └── emailService.js
    ├── sockets/signaling.js       # WebRTC signaling (offer/answer/ICE/chat/screen)
    ├── scripts/createAdmin.js     # One-off admin user creation
    └── uploads/                   # courses/{thumbnails,promos,videos,resources}, challenges,
                                   # mentors, resumes, intros, assignments
```

---

## How to Run

### Prerequisites
- Node 18+, MongoDB running locally, MetaMask on Sepolia testnet for Web3 features

### Backend
```bash
cd Server
npm install
# Create .env with required vars (see Environment Variables section)
npm run dev          # nodemon + NODE_ENV=development
npm start            # production
npm run create-admin # creates admin user from ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME env
```
Listens on `PORT` (default 3500). HTTP + Socket.IO share the same `httpServer`.

### Frontend
```bash
cd Client
npm install --legacy-peer-deps
npm start            # craco start (port 3000)
npm run build        # production build
```

---

## Environment Variables

### Server/.env
```
PORT=3500
NODE_ENV=development
MONGODB=mongodb://localhost:27017/skill-exchange
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:3500
ACCESS_TOKEN=<jwt_signing_secret>
PASS=<gmail_app_password>
GEMINI_API_KEY=<google_gemini_key>
GEMINI_MODEL=gemini-2.0-flash
GITHUB_TOKEN=<optional_github_pat>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=securepassword
ADMIN_NAME=Admin
```

### Client/.env
```
REACT_APP_API_BASE_URL=http://localhost:3500
REACT_APP_SOCKET_URL=http://localhost:3500
REACT_APP_CLIENT_URL=http://localhost:3000
REACT_APP_BLOCK_EXPLORER=https://sepolia.etherscan.io
```

---

## Smart Contracts (Sepolia Testnet)

All three contracts deployed on Sepolia (chain ID 11155111). Sources belong in `blockchain/contracts/` — currently only the legacy `SmarContract.sol` (SkillExchangeToken) is in source control; the deployed contracts below are the active ones.

| Contract | Address | Purpose |
|----------|---------|---------|
| PlatformToken (PTKN, ERC-20) | `0x7260F9952F2Bb9c66832efd7C6Ce52cd748e7de2` | Reward tokens |
| CertificateNFT (ERC-721) | `0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD` | Course completion certificates |
| SkillPlatform | `0x5155181C092d40d68d410A8a5bE054Cd1F4AA459` | Session booking (1 ETH), challenge winner declaration |

**Key constants** (in `Client/src/web3/config.js`):
- `SESSION_FEE_ETH = "1"` — fixed 1 ETH per session booking
- `REGISTRATION_REWARD_PTKN = "10"` — starter tokens on registration

**Important:** Do NOT use `ethers.js`. The project uses `web3.js v4` exclusively (hooks: `useMetaMask.js`, web3 services all use `new Web3()`).

---

## Database Models

| Model | Collection | Key Fields |
|-------|-----------|-----------|
| `UserModel` | `UsersLogins` | name, email (unique), password (bcrypt), role (`learner/mentor/admin`), tokenBalance (default 10), UserWalletAddress, verified, otpToken/otpExpire, resetPwdToken/resetPwdExpire, transactionHistory[], skills[], education[], ratings[], lectureProgress[] |
| `CourseModel` | `OriginalCourse` | mentorId, title, curriculum.sections[lectures[{type,video,quiz,assignment,article}]], enrolledLearners[], averageRating |
| `CourseSystemModel` | exports 7 models | `UdemyCourse`, `CourseSection`, `CourseLecture`, `AssignmentSubmission`, `CourseEnrollment`, `Quiz`, `QuizQuestion` — Udemy-style normalized schema |
| `CertificationModel` | `Certification` | userId, courseId, certificateId (`CERT-<ts>-<random>`), txHash, nftTokenId |
| `MentorApplication` | `MentorApplication` | userId (unique), resumeUrl, introVideoUrl, mentorStatus (pending/approved/rejected), aiEvaluation{githubScore,linkedinScore,resumeScore,introVideoScore,finalScore,recommendation} |
| `ChallengeModel` | `Challenge` | mentorId, deadline, rewardTokens, status (draft/published/closed/completed), submissions[{learnerId,rank,rewardTxHash}], prizeDistribution{first:50,second:30,third:20} |
| `SessionModel` | `Session` | mentorId, learnerId, status (available/requested/pending/confirmed/completed/cancelled/rejected), roomId (UUID for WebRTC), price, rating |
| `NotificationModel` | `Notification` | userId, type, title, message, isRead |
| `MentorAvailabilityModel` | `MentorAvailability` | mentorId, dayOfWeek, startTime/endTime "HH:MM", sessionDuration |
| `MentorSlotModel` | `MentorSlot` | mentorId, availabilityId, startTime, endTime, status (available/pending/booked) |
| `MentorshipRequestModel` | `MentorshipRequest` | mentorId, learnerId, slotId, status (pending/accepted/rejected), txHash, onChainBookingId |

---

## API Routes

### Auth
| Route | Description |
|-------|-------------|
| `POST /Auth/learner/register` | Register learner + send OTP |
| `POST /Auth/learner/verify-otp` | Verify email OTP |
| `POST /Auth/learner/login` | Login → JWT |
| `POST /Auth/learner/reset-password` | Request password reset OTP |
| `PATCH /Auth/learner/resetpass-otp` | Apply OTP + new password |
| Same pattern for `/Auth/mentor/*` and legacy `/Auth/*` |

### Users (`/User`)
`GET /User/mentors` · `GET /User/:id` · `PUT /User/profile/:userId` · `GET /User/dashboard/:id` · `POST /User/:userId/ratings`

### Courses — Original (`/courses`)
Full CRUD + enrollment, progress tracking, quiz submission, assignment submission/grading, certificate generation/verify.

### Courses — Udemy-style (`/udemy-courses`)
Section/lecture CRUD, video/resource upload (separate endpoints), bulk lecture upload, enroll, quiz, curriculum save, publish toggle.

### Challenges (`/challenges`)
Mentor: create, update, delete, change status, review submissions, rank, distribute rewards.
Learner: list, join, submit (file upload), leaderboard, status.

### Sessions (`/sessions`)
Mentor: create, accept/reject requests, mark complete.
Learner: book (deducts tokens), cancel (refunds), rate, send request.
Both: `GET /sessions/join/:id` (returns roomId).

### Slots & Availability (`/slots`, `/availability`)
Create availability schedules → generate slots → learner books slot.

### Mentorship Requests (`/mentorship-requests`)
Send request → mentor accepts/rejects → session + room created.

### Wallet (`/wallet`)
`GET /wallet/:userId` (balance + history) · `GET /wallet/token-balance/:userId` (on-chain) · `GET /wallet/nfts/:userId` · `POST /wallet/transfer`

### Notifications (`/notifications`)
All auth-required: list, unread count, mark read, mark all read.

### Admin (`/api/admin`) — adminAuth required
List/view/approve/reject mentor applications, re-trigger AI evaluation.

### Mentor Application (`/mentor-application`)
`POST /apply` (multipart: resume PDF + intro video) · `GET /my`

---

## Authentication & Authorization

- **JWT** stored in `localStorage` key `'token'`. Payload: `{id, role, email}`.
- `AuthMiddleWare.js`: verifies token → sets `req.userId` and `req.user`.
- `adminAuth.js`: verifies token + checks `role === 'admin'`.
- `ensureMentorApproved.js`: checks `MentorApplication.mentorStatus === 'approved'`.
- Frontend route guards: `ProtectedRoute`, `MentorRoute`, `LearnerRoute`, `AdminRoute`, `AuthRoute`.
- Admin routes use isolated `AdminLayout` (no main `Navbar`, own sidebar).

---

## Real-time (Socket.IO)

Single Socket.IO server on the same HTTP port as Express.

**Notification rooms**: `join-notifications` event joins `user_<id>`, `mentor_<id>`, `learner_<id>` rooms. `notificationService.js` writes Notification to DB then emits to room.

**WebRTC signaling** (`sockets/signaling.js`): events: `join-room` → full mesh offer/answer/ICE relay, `toggle-video/audio`, `screen-share-started/stopped`, `room-message` (text chat), `end-call`. Server broadcasts `room-users`, `user-connected`, `user-disconnected`.

---

## AI Mentor Evaluation Pipeline

`services/aiMentorEvaluation.js` orchestrates:
1. **GitHub** (30%) — `githubService.js` analyzes repos, stars, commit frequency via GitHub API
2. **LinkedIn** (25%) — URL presence/format heuristics
3. **Resume** (25%) — `resumeParser.js` (pdf-parse) → text → Gemini analysis
4. **Intro Video** (20%) — `videoAnalyzer.js` → Gemini Vision (presentation/communication/content scores)

**Scoring thresholds**: ≥70 → approve, 40–69 → review, <40 → reject.

Triggered async (`setImmediate`) after `POST /mentor-application/apply`. Admin can re-trigger via `POST /api/admin/mentor/:id/re-evaluate`.

---

## File Uploads

Multer stores files locally under `Server/uploads/`:

| Path | Content |
|------|---------|
| `uploads/courses/thumbnails/` | Course thumbnails |
| `uploads/courses/videos/` | Lecture videos |
| `uploads/courses/promos/` | Promo videos |
| `uploads/courses/resources/` | Downloadable resources |
| `uploads/challenges/` | Challenge submission files |
| `uploads/assignments/` | Assignment submission files |
| `uploads/resumes/` | Mentor application resumes (PDF) |
| `uploads/intros/` | Mentor intro videos |

Static served via `/uploads/*` with video range-request streaming support. Custom filename-fallback middleware handles stale-timestamp filenames.

---

## Two Parallel Course Systems

**Important architectural detail**: There are two course systems in this codebase.

| | Original | Udemy-style |
|-|----------|-------------|
| Route prefix | `/courses` | `/udemy-courses` |
| Model | `CourseModel` (embedded curriculum) | `CourseSystemModel` (UdemyCourse + Section + Lecture collections) |
| Controller | `courseController.js` | `UdemyStyleCourseController.js` |
| Status | Active, used by learners | Newer, has bugs (typos: `UdemyUdemyCourse`, `CourseCourseLecture`) |

When working on course features, check which system the UI is actually calling.

---

## Known Issues (from Audit — fix before production)

### Critical
- **C4**: Most sensitive routes (sessions, wallet, challenges) lack `authMiddleware`. Add auth to all state-changing routes and derive user identity from `req.userId`, never from `req.body`.
- **C3 + H4**: `POST /wallet/transfer` is unauthenticated and uses non-atomic read-modify-write. Use atomic `$inc` and add auth.
- **C6**: `rewardForCourseCompletion` in smart contract has no `onlyOwner` — anyone can call it. Redeploy with access control.
- **C7 + C8**: Smart contract `transferForMentorship` mints commission instead of taking it from sender (inflates supply). Reward constants ignore 18 decimals (users receive 10⁻¹⁸ tokens). Redeploy.
- **C2**: OTP is 4-digit (10,000 possibilities), no rate limiting, no attempt counter. Use `crypto.randomInt`, add `express-rate-limit`.
- **C10**: JWT stored in `localStorage` (XSS-vulnerable). Move to httpOnly cookies with short-lived access + refresh token rotation.
- **H10**: NFT mint has no replay protection. DB update after on-chain mint → double-mint risk on DB failure.
- **H13**: WebRTC signaling has no auth — any socket can join any room by guessing UUID.

### High
- **H1 + H2**: Body size limit is 600 MB (DoS risk). No `helmet`, no rate limiting. Staging IP hardcoded in CORS.
- **H9**: Mentor application fields are concatenated raw into Gemini prompt → prompt injection risk.
- **H11**: `ConnectWallet` writes wallet address to unauthenticated route — attacker can overwrite any user's wallet.
- **H12**: Slot booking (`/slots/book`) has no concurrency guard and no token charge.

---

## Coding Conventions

- **web3.js v4 only** — no ethers.js anywhere in this project
- **MVC layout**: Router → Controller → Model. Controllers call `setIO(io)` to receive Socket.IO instance for real-time notifications.
- **Folder casing quirks**: `Server/MiddleWare/` (capital M+W), `Server/Controller/` (singular), `Server/Router/` (singular)
- **Route file naming inconsistency**: some `*Router.js`, some `*Routes.js` — don't rename, match the existing style in the same directory
- **Notification pattern**: always use `notificationService.createNotification(userId, type, title, message, metadata)` — writes DB + emits socket in one call
- **Two auth tokens**: `AuthMiddleWare` for general auth, `adminAuth` for admin-only routes — never use admin token on learner/mentor routes
- **On-chain tx recording**: after any blockchain transaction, save `txHash` back to the relevant Mongo document (pattern used in sessions, challenges, certificates)

---

## Production Deployment

- Domain: `ardk.online` / `www.ardk.online` (configured in CORS whitelist)
- Sepolia testnet for all blockchain operations (`EXPECTED_CHAIN_ID = 11155111`)
- MetaMask required for Web3 features; falls back gracefully if no wallet connected
