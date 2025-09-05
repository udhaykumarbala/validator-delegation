# 🚀 Deployment Guide for 0G Validator Mock Contracts

This guide will help you deploy and test the mock validator contracts using Hardhat.

## Prerequisites

- Node.js v16+ installed
- MetaMask or another Web3 wallet
- Some ETH/OG tokens for gas fees

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your private key:

```bash
cp .env.example .env
```

Edit `.env` and add your deployment wallet private key (without 0x prefix):
```
PRIVATE_KEY=your_private_key_here
```

⚠️ **Security Note**: Never commit your `.env` file to version control!

### 3. Compile Contracts

```bash
npm run compile
```

This will compile the MockStaking and MockValidator contracts.

## Deployment Options

### Option 1: Deploy to Local Hardhat Network (Recommended for Testing)

#### Step 1: Start Local Node
In one terminal, start the Hardhat node:

```bash
npm run node
```

This will:
- Start a local blockchain at `http://localhost:8545`
- Create 20 test accounts with 10000 ETH each
- Display private keys you can import to MetaMask

#### Step 2: Deploy Contracts
In another terminal, deploy the contracts:

```bash
npm run deploy:localhost
```

#### Step 3: Configure MetaMask
1. Open MetaMask
2. Add Network:
   - Network Name: Hardhat Local
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Import one of the test accounts using the private key from the node output

#### Step 4: Open Admin Page
Open `validator-admin-mock.html` in your browser and connect with MetaMask.

### Option 2: Deploy to 0G Testnet

#### Step 1: Get Testnet Tokens
Get testnet OG tokens from the faucet:
https://faucet.0g.ai

#### Step 2: Deploy Contracts
```bash
npm run deploy:testnet
```

#### Step 3: Verify Contract (Optional)
```bash
npx hardhat verify --network testnet <CONTRACT_ADDRESS>
```

### Option 3: Custom Network Deployment

Add your network configuration to `hardhat.config.js`:

```javascript
networks: {
  yourNetwork: {
    url: "YOUR_RPC_URL",
    chainId: YOUR_CHAIN_ID,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

Then deploy:
```bash
npx hardhat run scripts/deploy.js --network yourNetwork
```

## After Deployment

### 1. Check Deployment Output

The deployment script will create:
- `deployments/<network>-deployment.json` - Contract addresses and deployment info
- `contract-config.js` - JavaScript configuration file for the frontend
- `abi/` directory - Contract ABIs for frontend interaction

### 2. Access the Admin Interface

Open `validator-admin-mock.html` in your browser. The page will automatically:
- Load the deployed contract address from `contract-config.js`
- Load the contract ABIs from the `abi/` directory
- Connect to the deployed MockStaking contract

### 3. Test the Flow

1. **Connect Wallet**: Click "Connect Foundation Wallet"
2. **Create Validator**:
   - Fill in validator details
   - Use "Generate Random Test Key" for testing
   - Stake 0.1 ETH (minimum for mock)
   - Specify future owner address

3. **Transfer Ownership**:
   - Use the validator address from creation
   - Enter new owner address
   - Confirm transaction

4. **View History**: Check all transactions in the History tab

## Contract Addresses

After deployment, your contract addresses will be saved in:
- `deployments/<network>-deployment.json`
- `contract-config.js` (for frontend use)

## Testing Commands

```bash
# Run tests
npx hardhat test

# Run tests with coverage
npx hardhat coverage

# Clean artifacts
npm run clean
```

## Troubleshooting

### "Nonce too high" error
Reset MetaMask account:
Settings → Advanced → Clear activity tab data

### "Insufficient funds" error
- For local: Make sure you imported a test account with ETH
- For testnet: Get tokens from https://faucet.0g.ai

### Contract not found
- Make sure you ran the deployment script
- Check that `contract-config.js` exists
- Verify you're on the correct network in MetaMask

### Gas estimation failed
- Ensure you have enough ETH/OG for gas
- Check that all required fields are filled
- Verify contract is deployed to current network

## File Structure After Deployment

```
validator-delegation/
├── abi/                          # Contract ABIs
│   ├── MockStaking.json
│   └── MockValidator.json
├── artifacts/                    # Hardhat compilation artifacts
├── cache/                        # Hardhat cache
├── contracts/                    # Solidity contracts
│   ├── MockStaking.sol
│   └── MockValidator.json
├── deployments/                  # Deployment records
│   └── localhost-deployment.json
├── scripts/                      # Deployment scripts
│   └── deploy.js
├── contract-config.js           # Auto-generated frontend config
├── validator-admin-mock.html    # Admin interface for testing
└── package.json                 # Node dependencies
```

## Security Notes

1. **Never share your private keys**
2. **Use test accounts for local development**
3. **Keep `.env` file secure and out of version control**
4. **Verify contract source code on block explorers for transparency**
5. **Test thoroughly on testnet before mainnet deployment**

## Support

For issues or questions:
- Check the deployment output for errors
- Verify network connectivity
- Ensure sufficient gas fees
- Review transaction details on block explorer

## Next Steps

After successful deployment and testing:
1. Document the contract addresses
2. Test all validator operations
3. Verify ownership transfer works correctly
4. Prepare for production deployment with real staking contract