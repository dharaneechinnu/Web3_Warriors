/**
 * Master deployment script — deploys all three contracts in order:
 *   1. SkillToken
 *   2. SkillCredentialNFT
 *   3. SkillPlatform  (receives token + NFT addresses)
 *
 * Then:
 *   4. Grants SkillPlatform as a minter on SkillCredentialNFT
 *   5. Funds the reward pool with 500,000 SKT from deployer
 *   6. Saves all addresses to contractsABI/addresses.json
 *
 * Usage:
 *   npx hardhat run scripts/deployAll.js --network ganache
 *   npx hardhat run scripts/deployAll.js --network amoy
 */

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n========================================");
  console.log(" SkillPlatform — Full Deployment");
  console.log("========================================");
  console.log(`Deployer : ${deployer.address}`);
  console.log(`Network  : ${(await ethers.provider.getNetwork()).name}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance  : ${ethers.formatEther(balance)} ETH / MATIC\n`);

  // ── 1. Deploy SkillToken ───────────────────────────────────────────────────
  console.log("1/5 Deploying SkillToken…");
  const TokenFactory = await ethers.getContractFactory("SkillToken");
  const token        = await TokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`   SkillToken deployed at: ${tokenAddress}`);

  // ── 2. Deploy SkillCredentialNFT ──────────────────────────────────────────
  console.log("2/5 Deploying SkillCredentialNFT…");
  const NFTFactory = await ethers.getContractFactory("SkillCredentialNFT");
  const nft        = await NFTFactory.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`   SkillCredentialNFT deployed at: ${nftAddress}`);

  // ── 3. Deploy SkillPlatform ────────────────────────────────────────────────
  console.log("3/5 Deploying SkillPlatform…");
  const PlatformFactory = await ethers.getContractFactory("SkillPlatform");
  const platform        = await PlatformFactory.deploy(tokenAddress, nftAddress);
  await platform.waitForDeployment();
  const platformAddress = await platform.getAddress();
  console.log(`   SkillPlatform deployed at: ${platformAddress}`);

  // ── 4. Grant SkillPlatform minter role on SkillCredentialNFT ──────────────
  console.log("4/5 Granting SkillPlatform minter role on NFT contract…");
  const addMinterTx = await nft.addMinter(platformAddress);
  await addMinterTx.wait();
  console.log(`   Minter granted. Tx: ${addMinterTx.hash}`);

  // ── 5. Fund reward pool (500,000 SKT) ────────────────────────────────────
  console.log("5/5 Funding reward pool with 500,000 SKT…");
  const fundAmount = ethers.parseEther("500000");
  const approveTx  = await token.approve(platformAddress, fundAmount);
  await approveTx.wait();
  const fundTx = await platform.fundRewardPool(fundAmount);
  await fundTx.wait();
  console.log(`   Reward pool funded. Tx: ${fundTx.hash}`);

  // ── Save addresses ─────────────────────────────────────────────────────────
  const addresses = {
    network:      (await ethers.provider.getNetwork()).name,
    chainId:      Number((await ethers.provider.getNetwork()).chainId),
    deployer:     deployer.address,
    deployedAt:   new Date().toISOString(),
    SkillToken:        tokenAddress,
    SkillCredentialNFT: nftAddress,
    SkillPlatform:     platformAddress,
  };

  const outDir = path.join(__dirname, "../contractsABI");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log(`\n✅ Addresses saved to contractsABI/addresses.json`);

  // ── Export ABIs ────────────────────────────────────────────────────────────
  const artifactsBase = path.join(__dirname, "../artifacts/contracts");
  const abiFiles = [
    { src: "SkillToken.sol/SkillToken.json",               dst: "tokenABI.json" },
    { src: "SkillCredentialNFT.sol/SkillCredentialNFT.json", dst: "nftABI.json" },
    { src: "SkillPlatform.sol/SkillPlatform.json",          dst: "platformABI.json" },
  ];

  for (const { src, dst } of abiFiles) {
    const artifactPath = path.join(artifactsBase, src);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(
        path.join(outDir, dst),
        JSON.stringify(artifact.abi, null, 2)
      );
      console.log(`✅ ABI exported: contractsABI/${dst}`);
    } else {
      console.warn(`⚠️  Artifact not found: ${artifactPath} — run 'npx hardhat compile' first`);
    }
  }

  console.log("\n========================================");
  console.log(" Deployment Summary");
  console.log("========================================");
  console.log(`SkillToken        : ${tokenAddress}`);
  console.log(`SkillCredentialNFT: ${nftAddress}`);
  console.log(`SkillPlatform     : ${platformAddress}`);
  console.log("========================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
