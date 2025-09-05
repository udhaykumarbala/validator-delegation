// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MockValidator.sol";

contract MockStaking {
    struct Description {
        string moniker;
        string identity;
        string website;
        string securityContact;
        string details;
    }
    
    struct ValidatorInfo {
        address validatorContract;
        address initialStaker;
        uint256 stakedAmount;
        bytes pubkey;
        bool initialized;
    }
    
    mapping(bytes => ValidatorInfo) public validators;
    mapping(address => bytes) public validatorPubkeys;
    
    uint256 public constant MINIMUM_STAKE = 0.1 ether; // For testing, using 0.1 ETH instead of 32 OG
    
    event ValidatorCreated(address indexed validator, bytes pubkey, address indexed creator);
    event ValidatorInitialized(address indexed validator, bytes pubkey, Description description);
    
    function createAndInitializeValidatorIfNecessary(
        Description calldata description,
        uint32 commissionRate,
        uint96 withdrawalFeeInGwei,
        bytes calldata pubkey,
        bytes calldata signature
    ) external payable {
        require(msg.value >= MINIMUM_STAKE, "Insufficient stake amount");
        require(pubkey.length > 0, "Invalid pubkey");
        
        address validatorAddress = computeValidatorAddress(pubkey);
        
        if (validators[pubkey].validatorContract == address(0)) {
            // Deploy new validator contract
            MockValidator validator = new MockValidator(
                msg.sender,
                pubkey,
                msg.value,
                address(this)
            );
            
            validators[pubkey] = ValidatorInfo({
                validatorContract: address(validator),
                initialStaker: msg.sender,
                stakedAmount: msg.value,
                pubkey: pubkey,
                initialized: true
            });
            
            validatorPubkeys[address(validator)] = pubkey;
            
            // Initialize validator with description - pass struct directly to avoid stack too deep
            _initializeValidator(validator, description, commissionRate, withdrawalFeeInGwei);
            
            emit ValidatorCreated(address(validator), pubkey, msg.sender);
            emit ValidatorInitialized(address(validator), pubkey, description);
        } else {
            revert("Validator already exists");
        }
    }
    
    function _initializeValidator(
        MockValidator validator,
        Description calldata description,
        uint32 commissionRate,
        uint96 withdrawalFeeInGwei
    ) private {
        validator.initialize(
            description.moniker,
            description.identity,
            description.website,
            description.securityContact,
            description.details,
            commissionRate,
            withdrawalFeeInGwei
        );
    }
    
    function computeValidatorAddress(bytes calldata pubkey) public pure returns (address) {
        // Simple deterministic address generation for testing
        return address(uint160(uint256(keccak256(pubkey))));
    }
    
    function getValidator(bytes calldata pubkey) external view returns (ValidatorInfo memory) {
        return validators[pubkey];
    }
    
    function getValidatorByAddress(address validatorAddress) external view returns (ValidatorInfo memory) {
        bytes memory pubkey = validatorPubkeys[validatorAddress];
        return validators[pubkey];
    }
}