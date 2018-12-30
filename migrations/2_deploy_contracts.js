var insuranceContract = artifacts.require("./insurance.sol");

module.exports = function(deployer)
{
    //argument:
    //arg1: price(in ehter)
    //arg2: compensation(in ehter)
    //arg3: valid period(in day)
    //arg4: address of authority agency
    deployer.deploy(insuranceContract, 1, 2, 1, "0xA1Dd1C57DEAE9f50BbaCC020213097DCAC3810b2");
};