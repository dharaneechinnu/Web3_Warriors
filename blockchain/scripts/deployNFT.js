/**
 * Deploy SkillCredentialNFT only.
 * Usage: npx hardhat run scripts/deployNFT.js --network ganache
 */
const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying SkillCredentialNFT from: ${deployer.address}`);

  const Factory = await ethers.getContractFactory("SkillCredentialNFT");
  const nft     = await Factory.deploy();
  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log(`SkillCredentialNFT deployed at: ${address}`);

  const filePath = path.join(__dirname, "../contractsABI/addresses.json");
  let existing = {};
  if (fs.existsSync(filePath)) existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  existing.SkillCredentialNFT = address;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  console.log("addresses.json updated.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
