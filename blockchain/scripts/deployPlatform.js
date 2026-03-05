/**
 * Deploy SkillPlatform only (requires SkillToken + SkillCredentialNFT already deployed).
 * Reads addresses from contractsABI/addresses.json.
 * Usage: npx hardhat run scripts/deployPlatform.js --network ganache
 */
const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  const addrPath = path.join(__dirname, "../contractsABI/addresses.json");
  if (!fs.existsSync(addrPath)) {
    throw new Error("contractsABI/addresses.json not found. Deploy Token and NFT first.");
  }
  const addresses = JSON.parse(fs.readFileSync(addrPath, "utf8"));
  const { SkillToken: tokenAddress, SkillCredentialNFT: nftAddress } = addresses;

  if (!tokenAddress || !nftAddress) {
    throw new Error("SkillToken or SkillCredentialNFT address missing in addresses.json");
  }

  console.log(`Deploying SkillPlatform from: ${deployer.address}`);
  console.log(`  SkillToken:        ${tokenAddress}`);
  console.log(`  SkillCredentialNFT: ${nftAddress}`);

  const Factory  = await ethers.getContractFactory("SkillPlatform");
  const platform = await Factory.deploy(tokenAddress, nftAddress);
  await platform.waitForDeployment();

  const platformAddress = await platform.getAddress();
  console.log(`SkillPlatform deployed at: ${platformAddress}`);

  // Grant minter role
  const nft = await ethers.getContractAt("SkillCredentialNFT", nftAddress);
  const tx  = await nft.addMinter(platformAddress);
  await tx.wait();
  console.log("Minter role granted to SkillPlatform.");

  addresses.SkillPlatform = platformAddress;
  fs.writeFileSync(addrPath, JSON.stringify(addresses, null, 2));
  console.log("addresses.json updated.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
