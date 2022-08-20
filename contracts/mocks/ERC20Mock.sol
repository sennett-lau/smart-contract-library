// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol";

contract ERC20Mock is ERC20PresetFixedSupply {
    constructor()
    ERC20PresetFixedSupply(
        "TERC20",
        "T20",
        5 * (10**8) * (10**18),
        msg.sender
    )
    {}
}
