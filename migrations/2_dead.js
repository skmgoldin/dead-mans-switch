/* global artifacts */

const fs = require('fs');

const Dead = artifacts.require('Dead.sol');

const conf = JSON.parse(fs.readFileSync('../conf/config.json'));

module.exports = (deployer, network, accounts) => {
  let owner = conf.owner;
  let beneficiary = conf.beneficiary;

  if (network === 'test') {
    [owner, beneficiary] = accounts;
  }

  deployer.deploy(Dead, beneficiary, owner, conf.heartbeat);
};

