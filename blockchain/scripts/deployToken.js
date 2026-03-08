/**
 * Deploy SkillToken only.
 * Usage: npx hardhat run scripts/deployToken.js --network ganache
 */
const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying SkillToken from: ${deployer.address}`);

  const Factory = await ethers.getContractFactory("SkillToken");
  const token   = await Factory.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`SkillToken deployed at: ${address}`);

  // Patch addresses.json
  const filePath = path.join(__dirname, "../contractsABI/addresses.json");
  let existing = {};
  if (fs.existsSync(filePath)) existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  existing.SkillToken = address;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  console.log("addresses.json updated.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
