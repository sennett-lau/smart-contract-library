// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../utils/Whitelist.sol';

contract WhitelistMock is Whitelist {
    function mockOnlyWhitelisted (bytes32[] memory proof) external onlyWhitelisted(proof) {}
}
