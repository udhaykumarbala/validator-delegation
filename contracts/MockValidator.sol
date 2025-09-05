// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockValidator {
    address public owner;
    address public initialStaker;
    uint256 public stakedAmount;
    bytes public validatorPubkey;
    address public stakingContract;
    
    // Validator details
    string public moniker;
    string public identity;
    string public website;
    string public securityContact;
    string public details;
    uint32 public commissionRate;
    uint96 public withdrawalFeeInGwei;
    
    bool public initialized;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ValidatorInitialized(string moniker, uint32 commissionRate);
    event StakeWithdrawn(address indexed to, uint256 amount);
    event Delegated(address indexed delegator, uint256 amount);
    event Undelegated(address indexed delegator, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }
    
    modifier onlyInitialStaker() {
        require(msg.sender == initialStaker, "Only initial staker can withdraw initial stake");
        _;
    }
    
    constructor(
        address _owner,
        bytes memory _pubkey,
        uint256 _stakedAmount,
        address _stakingContract
    ) {
        owner = _owner;
        initialStaker = _owner;
        validatorPubkey = _pubkey;
        stakedAmount = _stakedAmount;
        stakingContract = _stakingContract;
    }
    
    function initialize(
        string calldata _moniker,
        string calldata _identity,
        string calldata _website,
        string calldata _securityContact,
        string calldata _details,
        uint32 _commissionRate,
        uint96 _withdrawalFeeInGwei
    ) external {
        require(msg.sender == stakingContract, "Only staking contract can initialize");
        require(!initialized, "Already initialized");
        
        moniker = _moniker;
        identity = _identity;
        website = _website;
        securityContact = _securityContact;
        details = _details;
        commissionRate = _commissionRate;
        withdrawalFeeInGwei = _withdrawalFeeInGwei;
        initialized = true;
        
        emit ValidatorInitialized(_moniker, _commissionRate);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    function withdrawInitialStake(address to) external onlyInitialStaker {
        require(to != address(0), "Cannot withdraw to zero address");
        require(stakedAmount > 0, "No stake to withdraw");
        
        uint256 amount = stakedAmount;
        stakedAmount = 0;
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit StakeWithdrawn(to, amount);
    }
    
    function delegate() external payable {
        require(msg.value > 0, "Must send value to delegate");
        stakedAmount += msg.value;
        emit Delegated(msg.sender, msg.value);
    }
    
    function undelegate(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        // In real implementation, this would have more complex logic
        // For testing, we'll just emit an event
        emit Undelegated(msg.sender, amount);
    }
    
    function getValidatorInfo() external view returns (
        address _owner,
        address _initialStaker,
        uint256 _stakedAmount,
        string memory _moniker,
        uint32 _commissionRate,
        bool _initialized
    ) {
        return (
            owner,
            initialStaker,
            stakedAmount,
            moniker,
            commissionRate,
            initialized
        );
    }
    
    receive() external payable {
        // Accept direct transfers
        stakedAmount += msg.value;
    }
}