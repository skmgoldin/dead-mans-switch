/* global artifacts */

const Dead = artifacts.require('Dead.sol');

module.exports = (deployer, network, accounts) => {
  const [owner, beneficiary] = accounts;

  deployer.deploy(Dead, beneficiary, owner, 100);
};

