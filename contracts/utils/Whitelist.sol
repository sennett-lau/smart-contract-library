// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
    bytes32 public tree;

    modifier onlyWhitelisted (bytes32[] memory _proof) {
        require(isWhitelisted(msg.sender, _proof), 'Whitelist: whitelist is required');
        _;
    }

    function isWhitelisted(address _address, bytes32[] memory _proof) public view returns (bool) {
        return MerkleProof.verify(_proof, tree, keccak256(abi.encodePacked(_address)));
    }

    function updateTree(bytes32 _root) external onlyOwner {
        tree = _root;
    }
}
