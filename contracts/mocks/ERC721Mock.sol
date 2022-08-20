// contracts/Egg.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract ERC721Mock is ERC721PresetMinterPauserAutoId {
    constructor() ERC721PresetMinterPauserAutoId('TERC721', 'T721', 'https://test.com/') {}
}
