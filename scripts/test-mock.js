const hre = require("hardhat");

async function main() {
  console.log("Testing Mock Contract on testnet...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with account:", signer.address);

  // Contract address from deployment
  const mockStakingAddress = "0x17Db5D64Bb20424d75F8523338229e74A6D26060";
  
  // Get contract instance
  const MockStaking = await hre.ethers.getContractFactory("MockStaking");
  const mockStaking = MockStaking.attach(mockStakingAddress);
  
  // Check minimum stake
  const minStake = await mockStaking.MINIMUM_STAKE();
  console.log("Minimum stake required:", hre.ethers.formatEther(minStake), "OG");

  // Generate random test data
  const randomBytes = hre.ethers.randomBytes(48);
  const testPubkey = hre.ethers.hexlify(randomBytes);
  const testSignature = hre.ethers.hexlify(hre.ethers.randomBytes(96));
  
  console.log("\nTest data:");
  console.log("Pubkey:", testPubkey);
  console.log("Signature:", testSignature);

  // Check if validator already exists
  try {
    const computedAddress = await mockStaking.computeValidatorAddress(testPubkey);
    console.log("Computed validator address:", computedAddress);
    
    const validatorInfo = await mockStaking.getValidator(testPubkey);
    console.log("Existing validator info:", validatorInfo);
    
    if (validatorInfo.validatorContract !== hre.ethers.ZeroAddress) {
      console.log("⚠️  This pubkey already has a validator!");
      return;
    }
  } catch (e) {
    console.log("Error checking validator:", e.message);
  }

  // Prepare test description
  const description = {
    moniker: "TestValidator",
    identity: "",
    website: "https://test.com",
    securityContact: "test@test.com",
    details: "Testing mock contract"
  };

  const commissionRate = 1000; // 10% in basis points
  const withdrawalFee = "1000000"; // in Gwei

  console.log("\nAttempting to create validator...");
  console.log("Sending", hre.ethers.formatEther(minStake), "OG");

  try {
    // Estimate gas first
    const estimatedGas = await mockStaking.createAndInitializeValidatorIfNecessary.estimateGas(
      description,
      commissionRate,
      withdrawalFee,
      testPubkey,
      testSignature,
      { value: minStake }
    );
    console.log("Estimated gas:", estimatedGas.toString());

    // Send transaction
    const tx = await mockStaking.createAndInitializeValidatorIfNecessary(
      description,
      commissionRate,
      withdrawalFee,
      testPubkey,
      testSignature,
      { 
        value: minStake,
        gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
      }
    );
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Validator created successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Get the created validator address
    const newValidatorInfo = await mockStaking.getValidator(testPubkey);
    console.log("New validator contract:", newValidatorInfo.validatorContract);
    
  } catch (error) {
    console.error("❌ Transaction failed!");
    console.error("Error:", error.message);
    
    if (error.data) {
      try {
        // Try to decode the revert reason
        const iface = MockStaking.interface;
        const decoded = iface.parseError(error.data);
        console.error("Revert reason:", decoded);
      } catch (e) {
        console.error("Raw error data:", error.data);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });