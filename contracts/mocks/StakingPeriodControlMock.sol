// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/StakingPeriodControl.sol";

contract StakingPeriodControlMock is StakingPeriodControl {
    constructor(bool _isTimestamp, uint256 _start, uint256 _end, uint256 _bonusEnd) {
        __StakingPeriodControl__init(_isTimestamp, _start, _end, _bonusEnd);
    }

    function reinitialization(bool _isTimestamp, uint256 _start, uint256 _end, uint256 _bonusEnd) external {
        __StakingPeriodControl__init(_isTimestamp, _start, _end, _bonusEnd);
    }

    function runBeforeStakeStart() external beforeStakeStart {}

    function runAfterStakeStart() external afterStakeStart {}

    function runBeforeStakeEnd() external beforeStakeEnd {}

    function runAfterStakeEnd() external afterStakeEnd {}

    function runBeforeBonusEnd() external beforeBonusEnd {}

    function runAfterBonusEnd() external afterBonusEnd {}
}
