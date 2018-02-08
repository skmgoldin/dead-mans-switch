/* eslint-env mocha */
/* global assert artifacts contract */

const Dead = artifacts.require('Dead.sol');

const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('./conf/config.json'));

contract('Dead', (accounts) => {
  describe('Function: Dead', () => {
    const [owner, beneficiary] = accounts;

    it('should instantiate the contract\'s storage properly', async () => {
      const dead = await Dead.deployed();

      const storedHeartbeatPeriod = await dead.heartbeatPeriod.call();
      const storedOwner = await dead.owner.call();
      const storedBeneficiary = await dead.beneficiary.call();

      assert.strictEqual(storedHeartbeatPeriod.toString(10), conf.heartbeat,
        'The heartbeat was not stored properly');
      assert.strictEqual(storedOwner, owner,
        'The owner was not stored properly');
      assert.strictEqual(storedBeneficiary, beneficiary,
        'The beneficiary was not stored properly');
    });
  });
});

