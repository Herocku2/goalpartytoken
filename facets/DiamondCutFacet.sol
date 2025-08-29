// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { LibDiamondFunctions } from "../libraries/LibDiamondFunctions.sol";
import { IFacetFunctionSelectors } from "../interfaces/IFacetFunctionSelectors.sol";
import { ReentrancyGuard } from "../utils/ReentrancyGuard.sol";

contract DiamondCutFacet is IDiamondCut, IFacetFunctionSelectors, ReentrancyGuard {

    function manageFacets(FacetCut[] calldata _facetCuts) external override nonReentrant {
        LibDiamondFunctions.onlyIfAuthorized();
        LibDiamondFunctions.manageFacets(_facetCuts);
    }

    function getFacetFunctionSelectors() external pure override returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = this.manageFacets.selector;
        return selectors;
    }
}
