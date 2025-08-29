// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import { IERC20 } from "../interfaces/IERC20.sol";
import { IERC20Metadata } from "../interfaces/IERC20Metadata.sol";
import { IFacetFunctionSelectors } from "../interfaces/IFacetFunctionSelectors.sol";
import { LibTokenStorage } from "../libraries/LibTokenStorage.sol";
import { IERC20Errors } from "../interfaces/draft-IERC6093.sol";
import { Context } from "../utils/Context.sol";

contract TokenFacet is Context, IERC20, IERC20Metadata, IERC20Errors, IFacetFunctionSelectors {
    function name() external view override returns (string memory) {
        return LibTokenStorage.tokenStorage().name;
    }

    function symbol() external view override returns (string memory) {
        return LibTokenStorage.tokenStorage().symbol;
    }

    function decimals() external view override returns (uint8) {
        return LibTokenStorage.tokenStorage().decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return LibTokenStorage.tokenStorage().totalSupply;
    }

    function balanceOf(address _account) external view override returns (uint256) {
        return LibTokenStorage.tokenStorage().balances[_account];
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function allowance(address _owner, address _spender) external view override returns (uint256) {
        return LibTokenStorage.tokenStorage().allowances[_owner][_spender];
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        LibTokenStorage.TokenStorage storage ts = LibTokenStorage.tokenStorage();
        address owner = _msgSender();
        if (owner == address(0)) {
            revert ERC20InvalidApprover(owner);
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(spender);
        }
        ts.allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
    	if (from == address(0)) revert ERC20InvalidSender(from);
    	if (to == address(0)) revert ERC20InvalidReceiver(to);

    	LibTokenStorage.TokenStorage storage ts = LibTokenStorage.tokenStorage();
    	uint256 fromBalance = ts.balances[from];
    	if (fromBalance < value) {
           revert ERC20InsufficientBalance(from, fromBalance, value);
    	}

	unchecked {
           ts.balances[from] = fromBalance - value;
           ts.balances[to] += value;
    	}

    	emit Transfer(from, to, value);
}


    function _spendAllowance(address owner, address spender, uint256 value) internal {
        LibTokenStorage.TokenStorage storage ts = LibTokenStorage.tokenStorage();
        uint256 currentAllowance = ts.allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                ts.allowances[owner][spender] = currentAllowance - value;
                emit Approval(owner, spender, ts.allowances[owner][spender]);
            }
        }
    }

    function getFacetFunctionSelectors() external pure override returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = this.name.selector;
        selectors[1] = this.symbol.selector;
        selectors[2] = this.decimals.selector;
        selectors[3] = this.totalSupply.selector;
        selectors[4] = this.balanceOf.selector;
        selectors[5] = this.transfer.selector;
        selectors[6] = this.allowance.selector;
        selectors[7] = this.approve.selector;
        selectors[8] = this.transferFrom.selector;
        return selectors;
    }
}
