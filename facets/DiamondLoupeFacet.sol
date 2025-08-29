// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";
import { LibDiamondStorage } from "../libraries/LibDiamondStorage.sol";
import { IFacetFunctionSelectors } from "../interfaces/IFacetFunctionSelectors.sol";

contract DiamondLoupeFacet is IDiamondLoupe, IFacetFunctionSelectors {
    
    function facets() external view override returns (Facet[] memory facets_) {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        uint256 numFacets = ds.facetAddresses.length;
        facets_ = new Facet[](numFacets);
        for (uint256 i = 0; i < numFacets; i++) {
            address facetAddress_ = ds.facetAddresses[i];
            facets_[i].facetAddress = facetAddress_;
            facets_[i].functionSelectors = ds.facetWhichFunctionSelectors[facetAddress_];
        }
    }

    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        facetFunctionSelectors_ = ds.facetWhichFunctionSelectors[_facet];
    }

    function facetAddresses() external view override returns (address[] memory facetAddresses_) {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        facetAddresses_ = ds.facetAddresses;
    }

    function facetAddress(bytes4 _functionSelector) external view override returns (address facetAddress_) {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        facetAddress_ = ds.functionSelectorWhichFacetAddress[_functionSelector];
    }

    function getFacetFunctionSelectors() external pure override returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = this.facets.selector;
        selectors[1] = this.facetFunctionSelectors.selector;
        selectors[2] = this.facetAddresses.selector;
        selectors[3] = this.facetAddress.selector;
        return selectors;
    }
}
