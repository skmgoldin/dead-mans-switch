/* global artifacts */

const Token = artifacts.require('./tokens/HumanStandardToken.sol');

module.exports = (deployer, network) => {
  if (network === 'test') {
    console.log('we\'re testing, so we\'ll deploy a fake token');
    deployer.deploy(Token, '1000', 'DEAD', '0', 'DED');
  }
};

