// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingPeriodControl is Ownable {

    bool initialized;

    bool public isTimestamp;

    uint256 public start;

    uint256 public end;

    uint256 public bonusEnd;

    event UpdateStakingPeriod(address user, bool isTimestamp, uint256 start, uint256 end, uint256 bonusEnd);
    event InitializeStakingPeriod(address user, bool isTimestamp, uint256 start, uint256 end, uint256 bonusEnd);

    modifier beforeStakeStart {
        require((isTimestamp ? block.timestamp : block.number) < start, "StakingPeriodControl: staking period has started");
        _;
    }

    modifier afterStakeStart {
        require((isTimestamp ? block.timestamp : block.number) >= start, "StakingPeriodControl: staking period has not started");
        _;
    }

    modifier beforeStakeEnd {
        require((isTimestamp ? block.timestamp : block.number) < end, "StakingPeriodControl: staking period has ended");
        _;
    }

    modifier afterStakeEnd {
        require((isTimestamp ? block.timestamp : block.number) >= end, "StakingPeriodControl: staking period has not ended");
        _;
    }

    modifier beforeBonusEnd {
        require((isTimestamp ? block.timestamp : block.number) < bonusEnd, "StakingPeriodControl: lock down period has ended");
        _;
    }

    modifier afterBonusEnd {
        require((isTimestamp ? block.timestamp : block.number) >= bonusEnd, "StakingPeriodControl: lock down period has not ended");
        _;
    }

    function __StakingPeriodControl__init(bool _isTimestamp, uint256 _start, uint256 _end, uint256 _bonusEnd) internal {
        require(!initialized, "StakingPeriodControl: staking period has been initialized");

        _updateStakingPeriod(_isTimestamp, _start, _end, _bonusEnd);

        initialized = true;

        emit InitializeStakingPeriod(msg.sender, _isTimestamp, _start, _end, _bonusEnd);
    }

    function updateStakingPeriod(bool _isTimestamp, uint256 _start, uint256 _end, uint256 _bonusEnd) external onlyOwner beforeStakeStart {
        _updateStakingPeriod(_isTimestamp, _start, _end, _bonusEnd);

        emit UpdateStakingPeriod(msg.sender, _isTimestamp, _start, _end, _bonusEnd);
    }

    function _newPeriodValidation(bool _isTimestamp, uint256 _start, uint256 _end, uint256 _bonusEnd) private view {
        if (initialized) {
            require((isTimestamp ? block.timestamp : block.number) < start, "StakingPeriodControl: staking period has started");
        }
        require((_isTimestamp ? block.timestamp : block.number) <= _start, "StakingPeriodControl: new start must be larger than or equal to current block");
        require(_start <= _end, "StakingPeriodControl: new end must be larger than new start");
        require(_end < _bonusEnd, "StakingPeriodControl: new bonusEnd must be larger than new end");
    }

    function _updateStakingPeriod(bool _isTimestamp, uint256 _start, uint256 _end, uint256 _bonusEnd) private {
        _newPeriodValidation(_isTimestamp, _start, _end, _bonusEnd);
        isTimestamp = _isTimestamp;
        start = _start;
        end = _end;
        bonusEnd = _bonusEnd;
    }
}
