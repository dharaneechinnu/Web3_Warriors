# Skill Exchange Platform

The **Skill Exchange Platform** is a decentralized application (DApp) that connects students, mentors, and professionals for skill-building, mentorship, and collaborative learning. The platform integrates Web3 technology to offer secure, transparent, and tokenized transactions. 

It allows users to register, participate in courses, offer mentorship, and be rewarded in tokens for their activities. This platform aims to create an interactive ecosystem where users can gain knowledge, receive guidance, and collaborate on projects.

## Table of Contents
- [Overview](##overview)
- [Frontend Setup](##frontend-setup-react)
- [Backend Setup](##backend-setup-nodejs)
- [Tech Stack](##tech-stack)
- [Smart Contract](##smart-contract)
- [License](##license)
- [Contributing](##contributing)

## Overview

### Features:
1. **User Registration & Profile Management**: 
   - Users can sign up as learners, mentors, or professionals.
   - Mentors can create profiles, share their expertise, and provide mentorship.

2. **Course Offerings**:
   - Mentors can offer courses.
   - Learners can enroll and complete these courses to earn tokens.

3. **Reward System**:
   - Users earn tokens for completing courses, attending mentorship sessions, and other platform activities.

4. **Mentorship**:
   - Connects mentors with learners for personalized mentorship sessions.

5. **Secure Transactions**:
   - The platform uses **Web3** technology and **ERC-20** tokens to handle all payments, rewards, and mentorship fees.

6. **Decentralization**:
   - The platform integrates with a blockchain to manage tokens and ensure secure, transparent transactions.

---

## Frontend Setup (React)

### Prerequisites
- **Node.js** (v14.x or later)
- **npm** (v6.x or later)
- **Metamask** (for Web3 integration)

### Steps to Set Up the Frontend

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dharaneechinnu/Web3_Warriors.git
   ```

2. **Navigate to the client directory:**
   ```bash
   cd Client
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   or
    ```bash
   npm install --legacy-peer-deps
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

## Backend Setup (Node.js)

### Prerequisites
- **Node.js** (v14.x or later)
- **MongoDB** (v4.x or later)
- **npm** (v6.x or later)

### Steps to Set Up the Backend

1. **Navigate to the server directory:**
   ```bash
   cd Server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a .env file:**
   ```
   PORT=3500
   MONGODB=mongodb://localhost:27017/skill-exchange
   PASS=EMAIL_PASSKEY
   ACCESS_TOKEN=Your-secret-KEY
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Tech Stack

### Frontend
- React.js
- Web3.js
- Framer Motion
- Axios
- Material-UI

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Web3

### Blockchain
- Solidity
- remix IDE
- OpenZeppelin
- Ethereum

## Smart Contract

The platform uses custom ERC-20 tokens for transactions. The smart contract includes:

- Token minting and burning
- Course enrollment
- Mentorship session booking
- Reward distribution


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
