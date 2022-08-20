// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRandomNumberGenerator {
    function getRandomNumber(uint256 _range) external returns(uint256);
}
