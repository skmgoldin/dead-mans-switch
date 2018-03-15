/* eslint-env mocha */
/* global assert contract */

const { as, increaseTime, isEVMException, makeDMSProxy } = require('./utils.js');
const BN = require('bignumber.js');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('./conf/config.json'));

contract('Dead', (accounts) => {
  describe('Function: heartbeat', () => {
    const [owner, beneficiary] = accounts;

    let dead;

    beforeEach(async () => {
      dead = await makeDMSProxy(beneficiary, owner, conf.heartbeat);
    });

    it('should increment lastHeartbeat by heartbeatPeriod', async () => {
      // Get the heartbeat period and calculate a time to wait before invoking the heartbeat
      // function after half the heartbeat period has elapsed
      const heartbeatPeriod = await dead.heartbeatPeriod.call();
      const timeToHeartbeat = heartbeatPeriod.dividedToIntegerBy('2');

      // Get the initial lastHeartbeat in the contact's storage
      const initialLastHeartbeat = await dead.lastHeartbeat.call();

      // Bump the clock, invoke the heartbeat function, and get the new lastHeartbeat
      await increaseTime(timeToHeartbeat.toNumber(10));
      await as(owner, dead.heartbeat);
      const finalLastHeartbeat = await dead.lastHeartbeat.call();

      // The FLHB should be gte the ILHB plus the time waited to heartbeat
      const errMsg = 'lastHeartbeat was not incremented as-expected';
      assert(finalLastHeartbeat.gte(initialLastHeartbeat.add(timeToHeartbeat)), errMsg);
      // The FLHB should be lte the ILHB plus the time waited to heartbeat plus five seconds.
      // This is to ensure the heartbeat hasn't been incremented any further than might be
      // accountable given clock drift on the machine running these tests.
      assert(finalLastHeartbeat.lte(initialLastHeartbeat.add(timeToHeartbeat.add(
        new BN('5', 10)))), errMsg);
    });

    it('should not let a non-owner increment lastHeartbeat', async () => {
      // Get the initial lastHeartbeat in the contract's storage
      const initialLastHeartbeat = await dead.lastHeartbeat.call();

      // Increase time by 10 seconds so that we will notice if the heartbeat changes
      await increaseTime(10);

      try {
        await as(beneficiary, dead.heartbeat);
      } catch (err) {
        assert(isEVMException(err), err.toString());

        // The heartbeat now should not have changed.
        const finalLastHeartbeat = await dead.lastHeartbeat.call();
        assert(finalLastHeartbeat.eq(initialLastHeartbeat),
          'An unaccountable state change occurred');

        return;
      }

      // The heartbeat was incremented. This should not have happened.
      assert(false, 'A non-owner was able to increment lastHeartbeat');
    });
  });
});

