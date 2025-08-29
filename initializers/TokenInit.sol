// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import {LibTokenStorage} from "../libraries/LibTokenStorage.sol";

contract TokenInit {

	event Transfer(address indexed from, address indexed to, uint256 value);

    	function tokenInit() external {
             LibTokenStorage.TokenStorage storage ts = LibTokenStorage.tokenStorage();
             uint8 _decimals = 7;
             ts.name = "Goal Play";
             ts.symbol = "GOAL";
             ts.decimals = _decimals;
	     // The total supply of 500 million tokens
	     // is created only on the genesis chain.
             ts.totalSupply = 500000000 * (10**_decimals);
	     // On any bridged chain, the total supply value
	     // must be 0, i.e. use this placeholder instead:
	     // ts.totalSupply = 0;
             ts.balances[msg.sender] = ts.totalSupply;

	     emit Transfer(address(0), msg.sender, ts.totalSupply);
        }
}
