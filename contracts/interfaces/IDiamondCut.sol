// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


/// @title IDiamondCut
/// @notice This interface is used to manage the facets and state of a diamond.
interface IDiamondCut {
    /// @notice Defines whether a facet is being added or removed.
    enum FacetCutAction { Add, Remove }

    /// @notice A struct that describes a facet change.
    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
    }

    /// @notice Emitted when facets are added or removed.
    /// @param facetCuts The array of facet changes.
    event FacetsManaged(FacetCut[] facetCuts);

    /// @notice Emitted during contract initialization or upgrades when 
    ///         an external contract's logic is executed via an internal delegatecall
    /// @param _External_Contract_Address The address of the contract that was executed.
    /// @param _calldata The function call data that was used.
    event External_Contract_Executed(address indexed _External_Contract_Address, bytes _calldata);

    /// @notice Adds or removes facets from the diamond.
    /// @param _facetCuts An array of FacetCut structs describing the changes.
    function manageFacets(FacetCut[] calldata _facetCuts) external;
}
