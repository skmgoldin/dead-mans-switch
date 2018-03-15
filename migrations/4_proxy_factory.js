/* global artifacts */

const ProxyFactory = artifacts.require('ProxyFactory.sol');

module.exports = async (deployer) => {
  deployer.deploy(ProxyFactory);
};

