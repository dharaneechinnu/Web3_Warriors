/**
 * ERC-721 NFT Contract wrapper
 * ─────────────────────────────
 * Mints course-completion and challenge-winner NFTs.
 * Every method returns   { success, txHash?, tokenId?, error? }
 */
const { web3, adminAccount } = require('./web3Provider');
const { NFT_CONTRACT_ADDRESS } = require('./contractAddress');
const nftAbi = require('./abi/nftAbi.json');

const GAS = 600_000;

// ── Contract instance ────────────────────────────────────────────────────────
const nftContract = new web3.eth.Contract(nftAbi, NFT_CONTRACT_ADDRESS);

// ── Mint course-completion NFT ───────────────────────────────────────────────
async function mintCourseNFT(userWallet, courseName) {
    try {
        const tx = await nftContract.methods
            .mintCourseNFT(userWallet, courseName)
            .send({ from: adminAccount, gas: GAS });

        // Extract tokenId from the CourseCertMinted event
        const tokenId = tx.events?.CourseCertMinted?.returnValues?.tokenId ?? null;
        console.log(`[nftContract] mintCourseNFT → tx ${tx.transactionHash}  tokenId=${tokenId}`);
        return { success: true, txHash: tx.transactionHash, tokenId };
    } catch (err) {
        console.error('[nftContract] mintCourseNFT error:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Mint challenge-winner NFT ────────────────────────────────────────────────
async function mintChallengeNFT(userWallet, challengeName) {
    try {
        const tx = await nftContract.methods
            .mintChallengeNFT(userWallet, challengeName)
            .send({ from: adminAccount, gas: GAS });

        const tokenId = tx.events?.ChallengeCertMinted?.returnValues?.tokenId ?? null;
        console.log(`[nftContract] mintChallengeNFT → tx ${tx.transactionHash}  tokenId=${tokenId}`);
        return { success: true, txHash: tx.transactionHash, tokenId };
    } catch (err) {
        console.error('[nftContract] mintChallengeNFT error:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Get user's NFT token IDs ─────────────────────────────────────────────────
async function getUserNFTs(userWallet) {
    try {
        const ids = await nftContract.methods.getUserNFTs(userWallet).call();
        return { success: true, tokenIds: ids.map(id => Number(id)) };
    } catch (err) {
        console.error('[nftContract] getUserNFTs error:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Get NFT metadata ─────────────────────────────────────────────────────────
async function getNftMeta(tokenId) {
    try {
        const meta = await nftContract.methods.nftMeta(tokenId).call();
        return {
            success: true,
            meta: {
                name: meta.name,
                category: meta.category,
                mintedAt: Number(meta.mintedAt),
            },
        };
    } catch (err) {
        console.error('[nftContract] getNftMeta error:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = {
    nftContract,
    mintCourseNFT,
    mintChallengeNFT,
    getUserNFTs,
    getNftMeta,
};
