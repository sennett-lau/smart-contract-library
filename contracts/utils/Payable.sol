// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Payable is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public receiveToken;
    address payable public feeReceiver;
    bool public isErc20;

    event Pay(address from, address payable to, uint256 amount);
    event SetFeeReceiver(address payable feeReceiver);
    event SetIsErc20(bool isErc20, address receiveToken);

    constructor (address payable _feeReceiver) {
        feeReceiver = _feeReceiver;
    }

    function setIsErc20(IERC20 _receiveToken) public onlyOwner {
        isErc20 = true;
        receiveToken = _receiveToken;

        emit SetIsErc20(true, address(_receiveToken));
    }

    function setIsNonErc20() public onlyOwner {
        isErc20 = false;

        emit SetIsErc20(false, address(0));
    }

    function setFeeReceiver(address payable _feeReceiver) public onlyOwner {
        require(_feeReceiver != address(0), "Payable: feeReceiver must be a valid address");

        feeReceiver = _feeReceiver;

        emit SetFeeReceiver(_feeReceiver);
    }

    function pay(uint256 _amount) public payable {
        if (isErc20) {
            receiveToken.safeTransferFrom(
                msg.sender,
                feeReceiver,
                _amount
            );
        }
        else {
            require(msg.value >= _amount, "Payable: insufficient amount");

            feeReceiver.transfer(msg.value);
        }
        emit Pay(msg.sender, feeReceiver, _amount);
    }
}
