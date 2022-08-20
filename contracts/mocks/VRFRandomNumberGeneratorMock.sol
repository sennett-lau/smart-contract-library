// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../VRFRandomNumberGenerator.sol";

contract VRFRandomNumberGeneratorMock is VRFRandomNumberGenerator {

    uint256 public requestRandomWordsCounter;
    uint256 public _requestRandomWordsCounter;

    constructor (
        uint32 _queueLength
    ) VRFRandomNumberGenerator (
        922,
        _queueLength,
        0x6A2AAd07396B36Fe02a22b33cf443582f682c82f,
        0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314
    ) {

    }

    function requestRandomWords() public override {
        requestRandomWordsCounter += 1;
    }

    function _requestRandomWords() internal override {
        _requestRandomWordsCounter += 1;
    }

    function fulfillRandomWordsMock(uint256[] memory randomWords) public {
        uint256 index = queueIndex == 0 && randomNumberStorage[0].queue.length > 0 ? 1 : 0;
        if (randomNumberStorage[0].queue.length > 0 && randomNumberStorage[1].queue.length > 0) {
            index = queueBlob == randomNumberStorage[queueIndex].queue[queueCounter] && queueCounter == 0 ? queueIndex : index;
        }
        randomNumberStorage[index].queue = randomWords;
    }

    function getQueue(uint256 _queueIndex) public view returns(uint256[] memory) {
        return randomNumberStorage[_queueIndex].queue;
    }

    function _fallbackRandom() internal override pure returns(uint256) {
        return 9;
    }
}
