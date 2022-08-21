# Smart Contract Library

## Table of Content

- [Dependencies](#dependencies)
- [Installation](#installation)
- [Additional Packages](#additional-packages)
- [Folder & File Structure](#folder-file-structure)
- [Draft Contract](#draft-contract)
- [Version Control](#version-control)
- [Post Contract & Test Development Steps](#post-contract-test-development-steps)
- [Contract List](#contract-list)
    - Contracts
        - [`TokenVesting`](#tokenvestingsol)
        - [`VRFRandomNumberGenerator`](#vrfrandomnumbergeneratorsol)
    - Utility Contracts
        - [`Payable`](#payablesol)
        - [`StakingPeriodControl`](#stakingperiodcontrolsol)
        - [`Whitelist`](#whitelistsol)
    - Contract Interfaces
        - `IERC721Burnable`
        - `IERC721Minable`
        - `IERC721MinterBurnable`
        - `IRandomNumberGenerator`

## Dependencies

OpenZeppelin Version: `^4.3.3`

Solidity Version: `^0.8.0`

## Installation
> Clone the repository as submodule and place it in the ~/contracts/library directory
> <br>
> ⚠️ Always remove the artifacts and cache directory when use it as a submodule ⚠️

## Additional Packages

### [crytic/slither](https://github.com/crytic/slither)

#### Prerequisites
1. python3 & pip3
```shell
brew install python3
```

2. solc-select
```shell
pip3 install solc-select
```

To install slither
```shell
pip3 install slither-analyzer
```

#### Implementation

Install the version of solidity compiler
```shell
solc-select install {version}

e.g.
solc-select install 0.8.4
```

Implement the wanted version
```shell
solc-select use {version}

e.g.
solc-select use 0.8.4
```

Run static analysis with slither
```shell
yarn run slither
```

## Folder & File Structure

```
.
├── contracts               # Contracts folder
│  ├── interfaces           # Interface contracts
│  ├── mocks                # Mock contracts for testing
│  ├── utils                # Utility contracts
│  └── ...
├── test                    # Test scripts folder
│  ├── helper.js            # Test helper functions for testing
│  └── ...                  # Test files with *.test.js
└── ...
```

## Draft Contract
For any unfinished contract, please name it with the prefix `draft-`.
```
e.g.

draft-Contract.sol
```
The prefix `draft-` should be deleted only after test cases were completed with 100% coverage and confirmed it is bug-free.

## Version Control
Please be aware that new version of a contract should be created if any change is wanted to be made to a deployed contract with `Vn` while n is the version number
```
e.g.

Payable.sol to PayableV2.sol as Payable.sol has been deployed in other project
New version of PayableV2.sol will be PayableV3.sol, PayableV4.sol, PayableV5.sol, ...
```

## Post Contract & Test Development Steps

### Run coverage test with `solidity-coverage`

```shell
npx hardhat coverage

# with harthat-shorthand installed
hh coverage
```

### Run static analysis with `slither`
```shell
yarn run slither
```


## Contract List
### Contracts
- [`TokenVesting`](#tokenvestingsol)
- [`VRFRandomNumberGenerator`](#vrfrandomnumbergeneratorsol)

### Utility Contracts
- [`Payable`](#payablesol)
- [`StakingPeriodControl`](#stakingperiodcontrolsol)
- [`Whitelist`](#whitelistsol)

### Contract Interfaces
- `IERC721Burnable`
- `IERC721Minable`
- `IERC721MinterBurnable`
- `IRandomNumberGenerator`

## Contracts Description

### TokenVesting.sol

#### Type:
Contract

#### Description:
Vesting contract that supports single ERC20 that linearly distributes tokens over time.
Each address can contain its own vesting schedule including the start time, duration, cliff duration and amount of tokens.

#### Deployment:
1. Deploy the contract with the vesting token address
2. Transfer sufficient amount of vesting token to the contract

#### Implementation:

1. Use `addVesting` to add a vesting wallet to the contract

### VRFRandomNumberGenerator.sol

#### Type:
Contract

#### Description:
Random number generator contract that implements the Chainlink Oracle Service's Verifiable Random Function

#### Deployment:
1. Create a subscription to [Chainlink VRF](https://vrf.chain.link/) in the target chain
2. Fund the subscription with $LINK
3. Get the `vrfCoordinator` address and `keyHash` of the target chain in [Chainlink docs](https://docs.chain.link/docs/vrf-contracts/)
4. Deploy the contract with the following parameters:
    - `subcriptionId`: the subscription ID of the target chain created at [Chainlink VRF](https://vrf.chain.link/)
    - `vrfCoordinator`: the address of the VRF coordinator
    - `keyHash`: the key hash of the target chain
5. Copy the deployed `VRFRandomNumberGenerator` address and add it as a consumer in the created subscription in [Chainlink VRF](https://vrf.chain.link/)
6. Run `requestRandomWords` function to fill up the first queue
7. Always make sure the subscription is funded with $LINK

### Payable.sol

#### Type:
Utility Contract

#### Description:
Utility contract that provides functions for payment control for both native tokens and ERC20 tokens with 1 fee receiver

#### Implementation:
Extends with
```solidity
import "./library/contracts/utils/Payable.sol";

contract Contract is Payable {
    constructor (
        address payable _feeReceiver
    )
    Payable(_feeReceiver)
    {
        // ...
    }
}
```

Switch between native token and ERC20 token
```javascript
// Run following functions with owner account

const erc20 = await ethers.getContract('Erc20')

await contract.setIsErc20(erc20.address)
await contract.setIsNonErc20()
```

Payment
```solidity
// Run following function in contract

function fn(uint256 _amount) public payable {
    pay(_amount);
    // ...
}
```

### StakingPeriodControl.sol

#### Type:
Utility Contract

#### Description:
Utility contract that provides functions for staking period control, including staking period start, end and reward end time in both `block.timestamp` and `block.number` measures

#### Implementation:
Extends with
```solidity
import "./library/contracts/utils/StakingPeriodControl.sol";

contract Contract is StakingPeriodControl {
    
    # instead of setting up with constructor, additional initailize() function should be used

    function initialize(
        uint256 _isTimestamp,
        uint256 _start,
        uint256 _end,
        uint256 _bonusEnd
    ) {
        __StakingPeriodControl__init(_isTimestamp, _start, _end, _bonusEnd);
    }
}
```

Provided modifiers

- `beforeStakeStart`
- `afterStakeStart`
- `beforeStakeEnd`
- `afterStakeEnd`
- `beforeBonusEnd`
- `afterBonusEnd`

### Whitelist.sol

#### Type:
Utility Contract

#### Description:
Utility contract that provides functions for whitelist control with merkle tree implementation

#### Implementation:
Extends with
```solidity
import "./library/contracts/utils/Whitelist.sol";

contract Contract is Whitelist {
   // ...
}
```

Provided modifier
- `onlyWhitelisted(bytes32[] memory proof)`
```solidity
 // Contract level implementation
 
 function fn(bytes32[] memory _proof) public onlyWhitelisted(_proof) {
    // ...
 }
```

To add whitelist
``` javascript
const keccal256 = require('keccak256')
const { MerkleTree } = require('merkletreejs')

const addresses = [...]

const tree = new MerkleTree(addresses, keccak256, { hashLeaves: true, sortPairs: true })

await contract.addTree(tree.getRoot())

// save hashed addresses for later use
const hashedAddresses = addresses.map(address => keccal256(address))

// ...
```

To run function with whitelist
``` javascript
const keccal256 = require('keccak256')
const { MerkleTree } = require('merkletreejs')

const targetAddress = '0x...'

// this should be generated when adding the address to the whitelist
const hashedAddresses = []

const tree = new MerkleTree(hashedAddresses, keccal256, { hashLeaves: false, sortPairs: true })

const leaf = keccal256(targetAddress)
const proof = tree.getProof(leaf)

// proof is always needed for whitelist checking, input [] when not needed
await contract.fn(proof)
```

