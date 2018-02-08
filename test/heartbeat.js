/* eslint-env mocha */
/* global assert artifacts contract */

const Dead = artifacts.require('Dead.sol');

const { as, increaseTime, isEVMException } = require('./utils.js');
const BN = require('bignumber.js');

contract('Dead', (accounts) => {
  describe('Function: heartbeat', () => {
    const [owner, beneficiary] = accounts;
    const revertFail = 'Tx expected to revert did not revert';
    const accountabilityFail = 'An unaccountable state change occurred';

    it('should increment lastHeartbeat by heartbeatPeriod', async () => {
      const dead = await Dead.deployed();
      const heartbeatPeriod = await dead.heartbeatPeriod.call();
      // After half the heartbeat period has elapsed, we intend to invoke the heartbeat function
      const timeToHeartbeat = heartbeatPeriod.dividedToIntegerBy('2');
      const errMsg = 'lastHeartbeat was not incremented as-expected';

      const initialLastHeartbeat = await dead.lastHeartbeat.call();

      // Bump the clock, invoke the heartbeat function and get the new lastHeartbeat
      await increaseTime(timeToHeartbeat.toNumber(10));
      await as(owner, dead.heartbeat);
      const finalLastHeartbeat = await dead.lastHeartbeat.call();

      // The FLHB should be gte the ILHB plus the time waited to heartbeat
      assert(finalLastHeartbeat.gte(initialLastHeartbeat.add(timeToHeartbeat)), errMsg);

      // The FLHB should be lte the ILHB plus the time waited to heartbeat plus two seconds.
      // This is to ensure the heartbeat hasn't been incremented any further than might be
      // accountable given clock drift on the machine running these tests.
      assert(finalLastHeartbeat.lte(initialLastHeartbeat.add(timeToHeartbeat.add(
        new BN('2', 10)))), errMsg);
    });

    it('should not let a non-owner increment lastHeartbeat', async () => {
      const dead = await Dead.deployed();
      const errMsg = 'A non-owner was able to increment lastHeartbeat';

      const initialLastHeartbeat = await dead.lastHeartbeat.call();

      try {
        await as(beneficiary, dead.heartbeat);
      } catch (err) {
        assert(isEVMException(err), err.toString());

        // Accountability check
        const finalLastHeartbeat = await dead.lastHeartbeat.call();
        assert(finalLastHeartbeat.eq(initialLastHeartbeat),
          `${accountabilityFail}. ${errMsg}`);

        return;
      }

      assert(false, `${revertFail}. ${errMsg}`);
    });
  });
});

