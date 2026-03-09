// ═══════════════════════════════════════════════════════════════════
// Contract Addresses — paste your deployed addresses here
// ═══════════════════════════════════════════════════════════════════

export const SKILL_TOKEN_ADDRESS     = "0x7260F9952F2Bb9c66832efd7C6Ce52cd748e7de2";   // PlatformToken (ERC-20, PTKN)
export const CERTIFICATE_NFT_ADDRESS = "0x21880899F15Ed323604D5Cf894F0dD7B2Abf99BD";   // CertificateNFT (ERC-721)
export const SKILL_PLATFORM_ADDRESS  = "0x5155181C092d40d68d410A8a5bE054Cd1F4AA459";   // SkillPlatform (booking logic)

// ═══════════════════════════════════════════════════════════════════
// Network config
// ═══════════════════════════════════════════════════════════════════

// Network config — leave empty/null if you do not want the app to enforce a specific chain
// Enforce Sepolia testnet by default to avoid using Mainnet.
// Sepolia chain id: 11155111
export const EXPECTED_CHAIN_ID = 11155111;
export const NETWORK_NAME      = "Sepolia";
export const BLOCK_EXPLORER    = "https://sepolia.etherscan.io";   // Explorer base URL (optional)

// ═══════════════════════════════════════════════════════════════════
// Platform constants (must match Solidity)
// ═══════════════════════════════════════════════════════════════════

/** Registration reward: 10 PTKN (18 decimals) */
export const REGISTRATION_REWARD_PTKN = "10";

/** Session fee: exactly 1 ETH (as required by bookSession) */
export const SESSION_FEE_ETH = "1";
