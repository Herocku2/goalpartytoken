// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library LibDiamondStorage {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");

    struct DiamondStorage {
        mapping(bytes4 => address) functionSelectorWhichFacetAddress;
        mapping(address => bytes4[]) facetWhichFunctionSelectors;
        mapping(address => uint256) facetWhichPosition;
        address[] facetAddresses;
        mapping(address => bool) Authorized;
        address[] authorizedAccountsList;
    }

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
