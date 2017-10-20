/* global artifacts */

const Token = artifacts.require('tokens/HumanStandardToken.sol');

module.exports = (deployer) => {
  deployer.deploy(Token, '1000', 'DEAD', '0', 'DED');
};
