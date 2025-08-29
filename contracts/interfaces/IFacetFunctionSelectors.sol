// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFacetFunctionSelectors
 * @notice This interface must be implemented by all facets
 */
interface IFacetFunctionSelectors {
    /**
     * @notice Gets the list of function selectors for the facet.
     * @return An array of 4-byte function selectors.
     */
    function getFacetFunctionSelectors() external view returns (bytes4[] memory);
}
