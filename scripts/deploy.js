const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment of Mock Contracts...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);

  // Get the account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy MockStaking contract
  console.log("📦 Deploying MockStaking contract...");
  const MockStaking = await hre.ethers.getContractFactory("MockStaking");
  const mockStaking = await MockStaking.deploy();
  await mockStaking.waitForDeployment();
  const stakingAddress = await mockStaking.getAddress();
  
  console.log("✅ MockStaking deployed to:", stakingAddress);
  console.log("   Minimum stake:", hre.ethers.formatEther(await mockStaking.MINIMUM_STAKE()), "ETH");

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockStaking: {
        address: stakingAddress,
        minimumStake: "0.1 ETH"
      }
    }
  };

  // Save to JSON file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", filename);

  // Generate ABI files for frontend
  console.log("\n📝 Generating ABI files for frontend...");
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const abiDir = path.join(__dirname, "..", "abi");
  
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir);
  }

  // Copy MockStaking ABI
  const stakingArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "MockStaking.sol", "MockStaking.json"),
      "utf8"
    )
  );
  fs.writeFileSync(
    path.join(abiDir, "MockStaking.json"),
    JSON.stringify(stakingArtifact.abi, null, 2)
  );

  // Copy MockValidator ABI
  const validatorArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "MockValidator.sol", "MockValidator.json"),
      "utf8"
    )
  );
  fs.writeFileSync(
    path.join(abiDir, "MockValidator.json"),
    JSON.stringify(validatorArtifact.abi, null, 2)
  );

  console.log("✅ ABI files generated in ./abi directory");

  // Generate configuration file for frontend
  const configFile = `// Auto-generated contract configuration
// Generated on: ${new Date().toISOString()}
// Network: ${hre.network.name}

const CONTRACT_CONFIG = {
  network: "${hre.network.name}",
  chainId: ${(await hre.ethers.provider.getNetwork()).chainId},
  contracts: {
    mockStaking: {
      address: "${stakingAddress}",
      minimumStake: "0.1"
    }
  },
  rpcUrl: "${hre.network.config.url || 'http://localhost:8545'}"
};

// Export for use in HTML files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONTRACT_CONFIG;
}`;

  fs.writeFileSync(
    path.join(__dirname, "..", "contract-config.js"),
    configFile
  );
  console.log("✅ Contract configuration saved to contract-config.js");

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Summary:");
  console.log("   Network:", hre.network.name);
  console.log("   MockStaking:", stakingAddress);
  console.log("\n🔧 Next steps:");
  console.log("   1. Update validator-admin.html with the contract address");
  console.log("   2. Include contract-config.js in your HTML file");
  console.log("   3. Use the ABI files from ./abi directory");
  
  if (hre.network.name === "localhost") {
    console.log("\n⚠️  Note: You're on localhost network.");
    console.log("   Make sure Hardhat node is running: npm run node");
  }

  // Verify contract if on testnet/mainnet
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n🔍 Attempting to verify contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on explorer");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later using:");
      console.log(`   npx hardhat verify --network ${hre.network.name} ${stakingAddress}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });