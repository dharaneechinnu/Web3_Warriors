// ═══════════════════════════════════════════════════════════════════
// Web3 — Barrel Export
// ═══════════════════════════════════════════════════════════════════

// Provider / wallet helpers
export {
  getWeb3,
  getAccount,
  ensureCorrectNetwork,
  listenForWalletEvents,
} from "./provider";

// Config (addresses + network)
export {
  SKILL_TOKEN_ADDRESS,
  CERTIFICATE_NFT_ADDRESS,
  SKILL_PLATFORM_ADDRESS,
  EXPECTED_CHAIN_ID,
  NETWORK_NAME,
  BLOCK_EXPLORER,
} from "./config";

// Contract services
export * as skillTokenService from "./services/skillTokenService";
export * as certificateNFTService from "./services/certificateNFTService";
export * as skillPlatformService from "./services/skillPlatformService";
