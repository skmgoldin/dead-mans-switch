/* eslint-env mocha */
/* global assert contract */

const fs = require('fs');
const { makeDMSProxy } = require('./utils.js');

const conf = JSON.parse(fs.readFileSync('./conf/config.json'));

contract('Dead', (accounts) => {
  describe('Function: Dead', () => {
    const [owner, beneficiary] = accounts;

    let dead;

    beforeEach(async () => {
      dead = await makeDMSProxy(beneficiary, owner, conf.heartbeat);
    });

    it('should instantiate the contract\'s storage properly', async () => {
      // Get all the stored data
      const storedHeartbeatPeriod = await dead.heartbeatPeriod.call();
      const storedOwner = await dead.owner.call();
      const storedBeneficiary = await dead.beneficiary.call();

      // Compare the stored data to that in the conf file, or in the case of the owner and
      // beneficiary, the first two available accounts (see migrations/2_dead.js).
      assert.strictEqual(storedHeartbeatPeriod.toString(10), conf.heartbeat,
        'The heartbeat was not stored properly');
      assert.strictEqual(storedOwner, owner, 'The owner was not stored properly');
      assert.strictEqual(storedBeneficiary, beneficiary, 'The beneficiary was not stored properly');
    });
  });
});

