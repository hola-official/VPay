// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Cirlcle.sol";

contract CheckBalance is Script {
    function run() external view {
        address tokenAddress = 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B;
        address user = 0x690C65EB2e2dd321ACe41a9865Aea3fAa98be2A5;

        Circle circle = Circle(tokenAddress);
        uint256 balance = circle.balanceOf(user);

        uint8 decimals = circle.decimals();

        console.log("Raw balance:", balance);
        console.log("Decimals:", decimals);

        // Display balance as decimal using two values: integer and fractional parts
        uint256 integerPart = balance / 10 ** decimals;
        uint256 fractionalPart = balance % 10 ** decimals;

        console.log("User balance: %s.%s", integerPart, fractionalPart);
    }
}
