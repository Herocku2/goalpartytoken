// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


library LibTokenStorage {
    bytes32 constant TOKEN_STORAGE_POSITION = keccak256("token.storage");

    struct TokenStorage {
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        uint256 totalSupply;
        string name;
        string symbol;
        uint8 decimals;
    }

    function tokenStorage() internal pure returns (TokenStorage storage ts) {
        bytes32 position = TOKEN_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }
}

