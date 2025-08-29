// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


library LibTokenomicsStorage {
    bytes32 constant TOKENOMICS_STORAGE_POSITION = keccak256("tokenomics.storage");

    struct TokenomicsStorage {
        // This is a placeholder struct for storing 
        // state variables related to the tokenomics. 
        // An empty placeholder struct is not allowed 
        // so we add a single variable for now and more 
	// variables can/will be added later.
	address Marketing_Funding_Wallet;
    }

    function tokenomicsStorage() internal pure returns (TokenomicsStorage storage ts) {
        bytes32 position = TOKENOMICS_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }
}
