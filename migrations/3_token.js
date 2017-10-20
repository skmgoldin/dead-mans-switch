/* global artifacts */

const Token = artifacts.require('./tokens/HumanStandardToken.sol');

module.exports = (deployer, network) => {
  if (network === 'test') {
    deployer.deploy(Token, '1000', 'DEAD', '0', 'DED');
  }
};
