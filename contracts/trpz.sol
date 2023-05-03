//SPDX-License-Identifier: Unlicense
// pragma solidity ^0.8.0;
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TrpzToken is ERC20, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Zero decimals used to create max supply of 1bn
    uint256 public constant MAX_SUPPLY = 1000000000;

    constructor(uint256 _initialSupply, address _wallet)
        ERC20("TrpzToken", "TRPZ") {
        _setupRole(ADMIN_ROLE, msg.sender);
        _mint(_wallet, _initialSupply);
    }

    /***********************************************************
    ******************** EXTERNAL FUNCTIONS ********************
    ***********************************************************/
    function mint(address _addr, uint256 _amount) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "Only admins can change address"
        );
        require(totalSupply() + _amount < MAX_SUPPLY, "Max supply exceeded");
        _mint(_addr, _amount);
    }

    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }

    /***********************************************************
    ********************* PUBLIC FUNCTIONS *********************
    ***********************************************************/
    /// @notice Overriden the decimals function to be 0
    function decimals() public view virtual override returns (uint8) {
        return 0;
    }
}