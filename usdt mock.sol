// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract USDTMock is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    constructor() ERC20("Tether USD Mock", "USDT") Ownable(msg.sender) {
        // Mint inicial de 100,000,000 USDT con 18 decimales al deployer
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
    }

    /// @notice Permite al owner mintear nuevos tokens
    /// @param to Dirección que recibirá los tokens
    /// @param amount Cantidad a mintear (con decimales)
    function mint(address to, uint256 amount) external onlyOwner nonReentrant {
        _mint(to, amount);
    }

    /// @notice Permite al owner quemar tokens de una cuenta específica
    /// @param account Dirección desde la que se quemarán tokens
    /// @param amount Cantidad a quemar (con decimales)
    function burnFromAccount(address account, uint256 amount) external onlyOwner nonReentrant {
        _burn(account, amount);
    }
}
