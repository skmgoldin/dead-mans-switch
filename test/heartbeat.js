/* eslint-env mocha */
/* global assert artifacts contract */

const Dead = artifacts.require('Dead.sol');

const { as, increaseTime, isEVMException } = require('./utils.js');
const BN = require('bignumber.js');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('./conf/config.json'));

contract('Dead', (accounts) => {
  describe('Function: heartbeat', () => {
    const [owner, beneficiary] = accounts;

    it('should increment lastHeartbeat by heartbeatPeriod', async () => {
      const dead = await Dead.deployed();
      const heartbeatPeriod = await dead.heartbeatPeriod.call();
      const timeToHeartbeat = heartbeatPeriod.dividedToIntegerBy('2');

      const initialLastHeartbeat = await dead.lastHeartbeat.call();

      await increaseTime(timeToHeartbeat.toNumber());
      await as(owner, dead.heartbeat);

      const finalLastHeartbeat = await dead.lastHeartbeat.call();

      assert(finalLastHeartbeat.gte(initialLastHeartbeat.add(timeToHeartbeat.sub(
        new BN(conf.heartbeat, 10)))),
      'lastHeartbeat was not incremented as-expected');
      assert(finalLastHeartbeat.lte(initialLastHeartbeat.add(timeToHeartbeat.add(
        new BN(conf.heartbeat, 10)))),
      'lastHeartbeat was not incremented as-expected');
    });

    it('should not let a non-owner increment lastHeartbeat', async () => {
      const dead = await Dead.deployed();

      const initialLastHeartbeat = await dead.lastHeartbeat.call();

      try {
        await as(beneficiary, dead.heartbeat);
      } catch (err) {
        assert(isEVMException(err), err.toString());
      }

      const finalLastHeartbeat = await dead.lastHeartbeat.call();

      assert(finalLastHeartbeat.eq(initialLastHeartbeat),
        'A non-owner was able to increment lastHeartbeat');
    });
  });
});

