// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * SkillExchangeNFT – ERC-721
 * ---------------------------
 * Minted by the backend (owner) when a learner completes a course
 * or wins a challenge.
 */
contract SkillExchangeNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // tokenId → metadata
    struct NftMeta {
        string  name;       // course / challenge name
        string  category;   // "course" | "challenge"
        uint256 mintedAt;
    }
    mapping(uint256 => NftMeta) public nftMeta;

    event CourseCertMinted(address indexed user, uint256 tokenId, string courseName);
    event ChallengeCertMinted(address indexed user, uint256 tokenId, string challengeName);

    constructor() ERC721("SkillExchangeNFT", "SENFT") Ownable(msg.sender) {}

    function mintCourseNFT(address user, string calldata courseName) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);
        nftMeta[tokenId] = NftMeta(courseName, "course", block.timestamp);
        emit CourseCertMinted(user, tokenId, courseName);
        return tokenId;
    }

    function mintChallengeNFT(address user, string calldata challengeName) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);
        nftMeta[tokenId] = NftMeta(challengeName, "challenge", block.timestamp);
        emit ChallengeCertMinted(user, tokenId, challengeName);
        return tokenId;
    }

    // ── View helpers ─────────────────────────────────────────────
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function getUserNFTs(address user) external view returns (uint256[] memory) {
        uint256 bal = balanceOf(user);
        uint256[] memory ids = new uint256[](bal);
        uint256 idx;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_ownerOf(i) == user) {
                ids[idx++] = i;
                if (idx == bal) break;
            }
        }
        return ids;
    }

    // ── Overrides (ERC721URIStorage) ─────────────────────────────
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
