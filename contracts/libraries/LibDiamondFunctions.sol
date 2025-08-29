// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { LibDiamondStorage } from "./LibDiamondStorage.sol";
import { IFacetFunctionSelectors } from "../interfaces/IFacetFunctionSelectors.sol";

error ExternalContractExecutionReverted(address _contractAddress, bytes _calldata);

library LibDiamondFunctions {
    
    event FacetsManaged(IDiamondCut.FacetCut[] facetCuts);
    event External_Contract_Executed(address indexed _External_Contract_Address, bytes _calldata);

    function onlyIfAuthorized() internal view {
        require(LibDiamondStorage.diamondStorage().Authorized[msg.sender], "LibDiamond: Must be an authorized account");
    }

    function manageFacets(IDiamondCut.FacetCut[] memory _facetCuts) internal {
        for (uint256 i = 0; i < _facetCuts.length; i++) {
            IDiamondCut.FacetCutAction action = _facetCuts[i].action;
            if (action == IDiamondCut.FacetCutAction.Add) {
                _addFacet(_facetCuts[i].facetAddress);
            } else if (action == IDiamondCut.FacetCutAction.Remove) {
                _removeFacet(_facetCuts[i].facetAddress);
            }
        }
        emit FacetsManaged(_facetCuts);
    }

    function Execute_External_Contract_Via_DelegatedCall(address _External_Contract_Address, bytes memory _calldata) internal {
        if (_External_Contract_Address == address(0)) {
            require(_calldata.length == 0, "LibDiamond: Calldata must be empty for zero address");
            return;
        }
        enforceHasContractCode(_External_Contract_Address, "LibDiamond: External contract has no code");
        (bool success, bytes memory error) = _External_Contract_Address.delegatecall(_calldata);
        if (!success) {
            if (error.length > 0) {
                assembly {
                    let returndata_size := mload(error)
                    revert(add(32, error), returndata_size)
                }
            } else {
                revert ExternalContractExecutionReverted(_External_Contract_Address, _calldata);
            }
        }
        emit External_Contract_Executed(_External_Contract_Address, _calldata);
    }

    function _addFacet(address _facetAddress) internal {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        require(_facetAddress != address(0), "LibDiamond: Facet address cannot be zero.");
        
        bool facetExists = ds.facetWhichPosition[_facetAddress] != 0 || (ds.facetAddresses.length > 0 && ds.facetAddresses[0] == _facetAddress);
        require(!facetExists, "LibDiamond: Facet to add already exists.");

        enforceHasContractCode(_facetAddress, "LibDiamond: New facet has no code.");
        
        bytes4[] memory selectors = IFacetFunctionSelectors(_facetAddress).getFacetFunctionSelectors();
        require(selectors.length > 0, "LibDiamond: Facet has no functions to add.");

        ds.facetWhichPosition[_facetAddress] = ds.facetAddresses.length;
        ds.facetAddresses.push(_facetAddress);

        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            require(ds.functionSelectorWhichFacetAddress[selector] == address(0), "LibDiamond: Function selector to add already exists.");
            ds.functionSelectorWhichFacetAddress[selector] = _facetAddress;
            ds.facetWhichFunctionSelectors[_facetAddress].push(selector);
        }
    }

    function _removeFacet(address _facetAddress) internal {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        require(_facetAddress != address(0), "LibDiamond: Facet address cannot be zero.");

        bool facetExists = ds.facetWhichPosition[_facetAddress] != 0 || (ds.facetAddresses.length > 0 && ds.facetAddresses[0] == _facetAddress);
        require(facetExists, "LibDiamond: Facet to remove does not exist.");

        bytes4[] storage selectors = ds.facetWhichFunctionSelectors[_facetAddress];
        for (uint256 i = 0; i < selectors.length; i++) {
            delete ds.functionSelectorWhichFacetAddress[selectors[i]];
        }
        delete ds.facetWhichFunctionSelectors[_facetAddress];

        uint256 facetPosition = ds.facetWhichPosition[_facetAddress];
        uint256 lastFacetPosition = ds.facetAddresses.length - 1;
        if (facetPosition != lastFacetPosition) {
            address lastFacetAddress = ds.facetAddresses[lastFacetPosition];
            ds.facetAddresses[facetPosition] = lastFacetAddress;
            ds.facetWhichPosition[lastFacetAddress] = facetPosition;
        }
        ds.facetAddresses.pop();
        delete ds.facetWhichPosition[_facetAddress];
    }

    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, _errorMessage);
    }

    function setInitialAuthorized(address _initialAuth) internal {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        ds.Authorized[_initialAuth] = true;
        ds.authorizedAccountsList.push(_initialAuth);
    }

    function initializeCoreFacets(
        address _diamondCutFacet,
        address _diamondLoupeFacet,
        address _authorizationManagementFacet
    ) internal {
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](3);
        
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add
        });

        cut[1] = IDiamondCut.FacetCut({
            facetAddress: _diamondLoupeFacet,
            action: IDiamondCut.FacetCutAction.Add
        });

        cut[2] = IDiamondCut.FacetCut({
            facetAddress: _authorizationManagementFacet,
            action: IDiamondCut.FacetCutAction.Add
        });

        manageFacets(cut);
    }

    function initializeToken(
        address _tokenFacet,
        address _tokenInit, // TokenInit.sol contract address
        bytes memory _tokenInitCalldata
    ) internal {
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _tokenFacet,
            action: IDiamondCut.FacetCutAction.Add
        });
        manageFacets(cut);
        Execute_External_Contract_Via_DelegatedCall(_tokenInit, _tokenInitCalldata);
    }
}
