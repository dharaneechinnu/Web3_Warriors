/**
 * nftContract.js
 * Backend wrapper for SkillPlatform NFT certificate minting (web3.js v4).
 */

const { getWeb3, getAdminAddress } = require('./web3Provider');
const path = require('path');
const fs   = require('fs');

const artifactPath = path.join(__dirname, '../../build/contracts/SkillPlatform.json');
let CONTRACT_ABI = [];
try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    CONTRACT_ABI = artifact.abi;
} catch (err) {
    console.error('[nftContract] Could not load SkillPlatform ABI:', err.message);
}

const CONTRACT_ADDRESS = process.env.SKILL_PLATFORM_ADDRESS || '0xf2183627A41c24543b3046A2C89e7bD2dEBaDFc7';

let _contract = null;
function getContract() {
    if (!_contract) {
        const web3 = getWeb3();
        _contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    }
    return _contract;
}

/**
 * Mint a soulbound course-completion NFT certificate.
 * @returns {{ success: boolean, txHash?: string, tokenId?: number, error?: string }}
 */
async function mintCourseNFT(learnerWallet, courseId, courseName, mentorName = 'Instructor', metadataURI = '') {
    try {
        if (!learnerWallet || !courseId || !courseName) {
            return { success: false, error: 'learnerWallet, courseId, and courseName are required' };
        }
        const uri      = metadataURI || ('ipfs://placeholder/' + courseId);
        const contract = getContract();
        const from     = getAdminAddress();

        const receipt = await contract.methods.mintCertificate(
            learnerWallet,
            courseId.toString(),
            courseName,
            mentorName,
            uri
        ).send({ from, gas: 400000 });

        let tokenId = null;
        const event = receipt.events && receipt.events.CertificateMinted;
        if (event && event.returnValues) {
            tokenId = Number(event.returnValues.tokenId);
        }

        console.log('[nftContract] mintCourseNFT - tx: ' + receipt.transactionHash + ', tokenId: ' + tokenId);
        return { success: true, txHash: receipt.transactionHash, tokenId };
    } catch (err) {
        console.error('[nftContract] mintCourseNFT failed:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Verify a certificate on-chain (read-only).
 */
async function verifyCertificate(tokenId) {
    try {
        const contract = getContract();
        const result   = await contract.methods.verifyCertificate(tokenId).call();
        const [learner, courseId, courseName, mentorName, issuedAt, metadataURI] = result;
        return {
            success: true,
            data: {
                tokenId:     Number(tokenId),
                learner,
                courseId,
                courseName,
                mentorName,
                issuedAt:    new Date(Number(issuedAt) * 1000).toISOString(),
                metadataURI
            }
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { mintCourseNFT, verifyCertificate };
