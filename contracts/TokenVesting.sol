// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public vestingToken;

    uint256 public constant PRECISION = 10 ** 12;

    mapping(address => User) public users;

    event Claimed(address user, uint256 amount);

    struct User {
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
        uint256 claimed;
        uint256 claimable;
    }

    constructor(IERC20 _vestingToken) {
        vestingToken = _vestingToken;
    }

    function getUserStartTime(address _user) external view returns (uint256) {
        return users[_user].startTime;
    }

    function getUserDuration(address _user) external view returns (uint256) {
        return users[_user].duration;
    }

    function getUserCliffDuration(address _user) external view returns (uint256) {
        return users[_user].cliffDuration;
    }

    function getUserClaimed(address _user) external view returns (uint256) {
        return users[_user].claimed;
    }

    function getUserClaimable(address _user) external view returns (uint256) {
        return users[_user].claimable;
    }

    function addVesting(address _user, uint256 _amount, uint256 _startTime, uint256 _duration, uint256 _cliffDuration) external onlyOwner {
        require(_startTime > block.timestamp, "TokenVesting: invalid start time");
        require(_duration > 0, "TokenVesting: invalid duration");
        require(_cliffDuration > 0 && _cliffDuration < _duration, "TokenVesting: invalid cliff duration");

        users[_user].claimable = _amount;
        users[_user].startTime = _startTime;
        users[_user].duration = _duration;
        users[_user].cliffDuration = _cliffDuration;
    }

    function claim() external {
        User storage user = users[msg.sender];
        require(user.claimable > 0, "TokenVesting: no claimable tokens");
        require(block.timestamp >= user.startTime + user.cliffDuration, "TokenVesting: cliff period has not passed");
        uint256 claimDuration = block.timestamp > user.startTime + user.duration ? user.duration : block.timestamp - user.startTime;
        uint256 amount = user.claimable * (claimDuration * PRECISION / user.duration) / PRECISION - user.claimed;
        require(amount > 0, "TokenVesting: no claimable tokens");
        user.claimed += amount;

        vestingToken.approve(address(this), amount);

        vestingToken.safeTransferFrom(
            address(this),
            msg.sender,
            amount
        );

        emit Claimed(msg.sender, amount);
    }
}
