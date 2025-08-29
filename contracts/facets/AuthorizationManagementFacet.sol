// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IFacetFunctionSelectors } from "../interfaces/IFacetFunctionSelectors.sol";
import { LibDiamondStorage } from "../libraries/LibDiamondStorage.sol";
import { LibDiamondFunctions } from "../libraries/LibDiamondFunctions.sol";

contract AuthorizationManagementFacet is IFacetFunctionSelectors {

    event Added_Authorized_Account(address indexed account);
    event Removed_Authorized_Account(address indexed account);

    function G01_add_Authorized_Account(address account) external {
        LibDiamondFunctions.onlyIfAuthorized();
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        require(!ds.Authorized[account], "Address already authorized");
        ds.Authorized[account] = true;
        ds.authorizedAccountsList.push(account);
        emit Added_Authorized_Account(account);
    }

    function G02_remove_Authorized_Account(address account) external {
        LibDiamondFunctions.onlyIfAuthorized();
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        require(ds.Authorized[account], "Address not authorized");
        require(ds.authorizedAccountsList.length > 2, "Cannot remove an account when only two remain");
        ds.Authorized[account] = false;

        for (uint i = 0; i < ds.authorizedAccountsList.length; i++) {
            if (ds.authorizedAccountsList[i] == account) {
                ds.authorizedAccountsList[i] = ds.authorizedAccountsList[ds.authorizedAccountsList.length - 1];
                ds.authorizedAccountsList.pop();
                break;
            }
        }
        emit Removed_Authorized_Account(account);
    }

    function G03_check_If_Account_Is_Authorized(address account) external view returns (bool) {
        LibDiamondFunctions.onlyIfAuthorized();
        return LibDiamondStorage.diamondStorage().Authorized[account];
    }

    function G04_show_all_Authorized_Accounts() external view returns (address[] memory) {
        LibDiamondFunctions.onlyIfAuthorized();
        return LibDiamondStorage.diamondStorage().authorizedAccountsList;
    }

//========================  Mandatory Function For Each Facet  ============================

    /**
     * @notice Gets the list of all function selectors for this facet.
     * @return An array of 4-byte function selectors.
     */
    function getFacetFunctionSelectors() external pure override returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = this.G01_add_Authorized_Account.selector;
        selectors[1] = this.G02_remove_Authorized_Account.selector;
        selectors[2] = this.G03_check_If_Account_Is_Authorized.selector;
        selectors[3] = this.G04_show_all_Authorized_Accounts.selector;
        return selectors;
    }
}
