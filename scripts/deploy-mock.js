const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment of Mock Contracts to testnet...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);

  // Get the account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "OG\n");

  // Check network
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());

  // Deploy MockStaking contract
  console.log("📦 Deploying MockStaking contract...");
  const MockStaking = await hre.ethers.getContractFactory("MockStaking");
  const mockStaking = await MockStaking.deploy();
  await mockStaking.waitForDeployment();
  const stakingAddress = await mockStaking.getAddress();
  
  console.log("✅ MockStaking deployed to:", stakingAddress);
  console.log("   Minimum stake:", hre.ethers.formatEther(await mockStaking.MINIMUM_STAKE()), "OG");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      mockStaking: {
        address: stakingAddress,
        minimumStake: "0.1"
      }
    },
    rpcUrl: hre.network.config.url
  };

  // Save to contract-config.js for frontend
  const configContent = `// Auto-generated contract configuration
// Generated on: ${new Date().toISOString()}
// Network: ${hre.network.name}

const CONTRACT_CONFIG = {
  network: "${hre.network.name}",
  chainId: ${network.chainId.toString()},
  contracts: {
    mockStaking: {
      address: "${stakingAddress}",
      minimumStake: "0.1"
    }
  },
  rpcUrl: "${hre.network.config.url}"
};

// Export for use in HTML files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONTRACT_CONFIG;
}`;

  fs.writeFileSync(
    path.join(__dirname, "..", "contract-config.js"),
    configContent
  );
  console.log("\n💾 Contract config saved to: contract-config.js");

  // Update .env file with the deployed address
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");
  
  // Update or add the mock staking contract address
  if (envContent.includes("MOCK_STAKING_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /MOCK_STAKING_CONTRACT_ADDRESS=.*/,
      `MOCK_STAKING_CONTRACT_ADDRESS=${stakingAddress}`
    );
  } else {
    envContent += `\nMOCK_STAKING_CONTRACT_ADDRESS=${stakingAddress}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log("💾 .env file updated with deployed address");

  console.log("\n🎉 Deployment complete!");
  console.log("📝 Next steps:");
  console.log("   1. Update admin.html mock network configuration with address:", stakingAddress);
  console.log("   2. Test the mock contract with 0.1 OG minimum stake");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });