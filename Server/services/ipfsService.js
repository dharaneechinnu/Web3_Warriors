/**
 * ipfsService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Uploads NFT metadata JSON to IPFS via Pinata and returns an ipfs:// URI.
 *
 * Env vars required:
 *   PINATA_API_KEY       – Pinata API key
 *   PINATA_API_SECRET    – Pinata API secret
 *   (optional) PINATA_JWT  – Bearer JWT (preferred over key+secret if set)
 *
 * Functions exported:
 *   buildNFTMetadata(type, name, description, attributes)  → metadata object
 *   uploadMetadata(metadata)                                → "ipfs://Qm..."
 *   getIPFSGatewayUrl(ipfsUri)                             → https:// gateway URL
 */

const axios = require('axios');

const PINATA_API_KEY    = process.env.PINATA_API_KEY    || '';
const PINATA_API_SECRET = process.env.PINATA_API_SECRET || '';
const PINATA_JWT        = process.env.PINATA_JWT        || '';
const PINATA_GATEWAY    = process.env.PINATA_GATEWAY    || 'https://gateway.pinata.cloud/ipfs/';

// ── Credential type → human-readable label ────────────────────────────────────
const CREDENTIAL_LABELS = {
  COURSE_CERTIFICATE : 'Course Certificate',
  CHALLENGE_GOLD     : 'Challenge Gold Medal',
  CHALLENGE_SILVER   : 'Challenge Silver Medal',
  CHALLENGE_BRONZE   : 'Challenge Bronze Medal',
  MENTOR_BADGE       : 'Mentor Badge',
};

// ── Credential type → image placeholder ──────────────────────────────────────
// Replace these with actual IPFS CIDs of your badge images once uploaded.
const CREDENTIAL_IMAGES = {
  COURSE_CERTIFICATE : 'ipfs://QmPlaceholderCourseCertificate',
  CHALLENGE_GOLD     : 'ipfs://QmPlaceholderChallengeGold',
  CHALLENGE_SILVER   : 'ipfs://QmPlaceholderChallengeSilver',
  CHALLENGE_BRONZE   : 'ipfs://QmPlaceholderChallengeBronze',
  MENTOR_BADGE       : 'ipfs://QmPlaceholderMentorBadge',
};

/**
 * Build a standard ERC-721 metadata object.
 *
 * @param {string} type        - One of the CREDENTIAL_LABELS keys
 * @param {string} name        - NFT name (e.g., "React Fundamentals Certificate")
 * @param {string} description - Longer description shown in wallets/marketplaces
 * @param {Array}  attributes  - Array of { trait_type, value } objects
 * @returns {object} ERC-721 metadata
 */
function buildNFTMetadata(type, name, description, attributes = []) {
  const label = CREDENTIAL_LABELS[type] || type;
  const image = CREDENTIAL_IMAGES[type]  || 'ipfs://QmPlaceholderImage';

  return {
    name,
    description,
    image,
    external_url : 'https://ardk.online',
    attributes   : [
      { trait_type: 'Credential Type', value: label },
      { trait_type: 'Issued By',       value: 'SkillPlatform' },
      { trait_type: 'Issued At',       value: new Date().toISOString() },
      ...attributes,
    ],
  };
}

/**
 * Upload a metadata JSON object to Pinata IPFS.
 *
 * @param {object} metadata - ERC-721 metadata object
 * @returns {Promise<string>} IPFS URI e.g. "ipfs://QmXxx..."
 */
async function uploadMetadata(metadata) {
  if (!PINATA_API_KEY && !PINATA_JWT) {
    console.warn('[ipfsService] Pinata credentials not set — returning placeholder URI');
    return 'ipfs://QmPlaceholderMetadataNotUploaded';
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else {
      headers['pinata_api_key']        = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_API_SECRET;
    }

    const body = {
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name || 'nft-metadata'}-${Date.now()}.json`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      body,
      { headers, timeout: 20000 }
    );

    const cid = response.data.IpfsHash;
    if (!cid) throw new Error('Pinata returned no IpfsHash');

    const uri = `ipfs://${cid}`;
    console.log(`[ipfsService] Metadata uploaded: ${uri}`);
    return uri;
  } catch (err) {
    console.error('[ipfsService] uploadMetadata error:', err.message);
    // Return a placeholder so the rest of the flow doesn't break
    return 'ipfs://QmUploadFailed';
  }
}

/**
 * Convert an ipfs:// URI to a public HTTPS gateway URL for display.
 *
 * @param {string} ipfsUri - e.g. "ipfs://QmXxx..."
 * @returns {string} HTTPS gateway URL
 */
function getIPFSGatewayUrl(ipfsUri) {
  if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) return ipfsUri;
  const cid = ipfsUri.replace('ipfs://', '');
  return `${PINATA_GATEWAY}${cid}`;
}

module.exports = { buildNFTMetadata, uploadMetadata, getIPFSGatewayUrl };
