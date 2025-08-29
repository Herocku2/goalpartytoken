// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IFacetFunctionSelectors } from "../interfaces/IFacetFunctionSelectors.sol";
import { LibDiamondFunctions } from "../libraries/LibDiamondFunctions.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { SafeERC20 } from "../utils/SafeERC20.sol";
import { ReentrancyGuard } from "../utils/ReentrancyGuard.sol";



contract TokenomicsManagementFacet is IFacetFunctionSelectors, ReentrancyGuard {

    using SafeERC20 for IERC20;


    //=========================  Miscellaneous  =========================

    /**
     * @notice Recover tokens accidentally sent by users to this contract.
     *         Can be used to rescue user funds or remove spam tokens.
     *         Note:  Users must submit a request to recover their tokens.
     *         It is also handy for removing spam tokens from the contract.
     * @param  token     The address of the ERC20 token to rescue.
     * @param  receiver  The address to send the rescued tokens to.
     * @param  amount    The amount of tokens to rescue.
     *                   To rescue the entire balance of a token, set the amount to 0.
     */
    function I01_RescueTokens(address token, address receiver, uint256 amount) external nonReentrant {
        LibDiamondFunctions.onlyIfAuthorized();
        require(token != address(0), "Rescue: Token cannot be zero address");
        require(receiver != address(0), "Rescue: Receiver cannot be zero address");
        require(receiver != address(this), "Rescue: Cannot send to contract itself");

        uint256 contractBalance = IERC20(token).balanceOf(address(this));
        uint256 amountToRescue = amount;

        // If the specified amount is 0, set the amount to rescue to the entire contract balance.
        if (amountToRescue == 0) {
            amountToRescue = contractBalance;
        }

        require(amountToRescue > 0, "Rescue: Amount to rescue must be greater than zero");
        require(contractBalance >= amountToRescue, "Rescue: Insufficient balance");

        IERC20(token).safeTransfer(receiver, amountToRescue);
    }

    /**
      * @notice Recover native blockchain coin sent to this contract.
      *         Can be used to withdraw the native coin balance held by the contract.
      * @param  receiver  The address to send the rescued native coin to.
      * @param  amount    The amount of native coin to rescue.
      *                   To rescue the entire balance of native coin, set the amount to 0.
      */
    function I02_RescueBlockhainNativeTokens(address receiver, uint256 amount) external nonReentrant {
        LibDiamondFunctions.onlyIfAuthorized();
        require(receiver != address(0), "Rescue: Receiver cannot be zero address");
        require(receiver != address(this), "Rescue: Cannot send to contract itself");

        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "Rescue: Contract has no native token balance");

        uint256 amountToRescue = amount;

        if (amountToRescue == 0) {
            amountToRescue = contractBalance;
        }

        require(amountToRescue <= contractBalance, "Rescue: Amount exceeds contract balance");
        require(amountToRescue > 0, "Rescue: Amount must be greater than zero");

        // Use call instead of transfer to avoid gas limitations and provide forward compatibility
        (bool success, ) = receiver.call{value: amountToRescue}("");
        require(success, "Rescue: Native token transfer failed");

    }


//========================  Mandatory Function For Each Facet  ============================

    /**
     * @notice Gets the list of all function selectors for this facet.
     * @return An array of 4-byte function selectors.
     */
    function getFacetFunctionSelectors() external pure override returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = this.I01_RescueTokens.selector;
        selectors[1] = this.I02_RescueBlockhainNativeTokens.selector;
        return selectors;
    }
}
