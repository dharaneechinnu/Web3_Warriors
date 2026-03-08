// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SkillCredentialNFT (SKTNFT)
 * @dev ERC-721 NFT representing skill credentials on the SkillPlatform.
 *      Token URI is an IPFS URI pointing to JSON metadata (via Pinata).
 *
 *      CredentialType:
 *        0 = COURSE_CERTIFICATE   — awarded on course completion
 *        1 = CHALLENGE_GOLD       — 1st place challenge winner
 *        2 = CHALLENGE_SILVER     — 2nd place challenge winner
 *        3 = CHALLENGE_BRONZE     — 3rd place challenge winner
 *        4 = MENTOR_BADGE         — approved mentor badge
 */
contract SkillCredentialNFT is ERC721, ERC721URIStorage, Ownable {
    enum CredentialType {
        COURSE_CERTIFICATE,
        CHALLENGE_GOLD,
        CHALLENGE_SILVER,
        CHALLENGE_BRONZE,
        MENTOR_BADGE
    }

    struct Credential {
        CredentialType credentialType;
        address recipient;
        uint256 issuedAt;
        string metadataURI; // ipfs://Qm...
    }

    uint256 private _nextTokenId;

    // tokenId => Credential
    mapping(uint256 => Credential) public credentials;

    // address => tokenIds[]
    mapping(address => uint256[]) private _userTokens;

    // Addresses authorised to mint (owner + SkillPlatform contract)
    mapping(address => bool) public minters;

    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        CredentialType indexed credentialType,
        string metadataURI
    );
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "SkillCredentialNFT: not a minter");
        _;
    }

    constructor() ERC721("SkillCredentialNFT", "SKTNFT") Ownable(msg.sender) {
        minters[msg.sender] = true;
    }

    // ── Minter management ──────────────────────────────────────────────────────

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    // ── Minting ────────────────────────────────────────────────────────────────

    /**
     * @dev Mint a credential NFT.
     * @param recipient   Wallet receiving the NFT.
     * @param metadataURI IPFS URI (ipfs://Qm...) pointing to JSON metadata.
     * @param credType    Credential type enum value.
     * @return tokenId    The minted token ID.
     */
    function mintCredential(
        address recipient,
        string calldata metadataURI,
        CredentialType credType
    ) external onlyMinter returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        credentials[tokenId] = Credential({
            credentialType: credType,
            recipient: recipient,
            issuedAt: block.timestamp,
            metadataURI: metadataURI
        });

        _userTokens[recipient].push(tokenId);

        emit CredentialMinted(tokenId, recipient, credType, metadataURI);
    }

    // ── Views ──────────────────────────────────────────────────────────────────

    /**
     * @dev Return all token IDs owned by a user.
     */
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return _userTokens[user];
    }

    /**
     * @dev Return full credential metadata for a token.
     */
    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        return credentials[tokenId];
    }

    /**
     * @dev Total NFTs minted so far.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // ── ERC-721 overrides ──────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
