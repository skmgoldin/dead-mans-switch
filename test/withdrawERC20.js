/* eslint-env mocha */
/* global assert artifacts contract */

const Token = artifacts.require('tokens/eip20/EIP20.sol');

const { as, increaseTime, isEVMException, getReceiptValue, makeDMSProxy } =
  require('./utils.js');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('./conf/config.json'));

contract('Dead', (accounts) => {
  describe('Function: withdrawERC20', () => {
    const [owner, beneficiary, bigNerd] = accounts;

    let dead;
    let token;

    beforeEach(async () => {
      dead = await makeDMSProxy(beneficiary, owner, conf.heartbeat);
      token = await Token.new('1000', 'DEAD', '0', 'DED', { from: owner });
    });

    it('should allow the owner to withdraw tokens before lastPeriod + heartbeatPeriod',
      async () => {
        const ownerInitialBalance = await token.balanceOf.call(owner);

        // As owner, make a deposit and immediately withdraw it
        await as(owner, token.approve, dead.address, ownerInitialBalance);
        await as(owner, dead.depositERC20, token.address, ownerInitialBalance);
        await as(owner, dead.withdrawERC20, token.address, ownerInitialBalance);

        // The owner's final balance should be equal to their initial balance
        const ownerFinalBalance = await token.balanceOf.call(owner);
        assert(ownerFinalBalance.eq(ownerInitialBalance),
          'the owner was unable to withdraw tokens when they should have been able to');
      });

    it('should not allow a beneficiary to withdraw tokens before lastPeriod + heartbeatPeriod',
      async () => {
        // Get the beneficiary's initial balance
        const beneficiaryInitialBalance = await token.balanceOf.call(beneficiary);

        // Get the owner's initial balance, then deposit tokens to the DMS
        const ownerInitialBalance = await token.balanceOf.call(owner);
        await as(owner, token.approve, dead.address, ownerInitialBalance);
        await as(owner, dead.depositERC20, token.address, ownerInitialBalance);

        try {
          await as(beneficiary, dead.withdrawERC20, token.address, ownerInitialBalance);
        } catch (err) {
          assert(isEVMException(err), err.toString());

          // Sanity check. The beneficiaries final balance should be equal to their initial balance
          const beneficiaryFinalBalance = await token.balanceOf.call(beneficiary);
          assert(beneficiaryFinalBalance.eq(beneficiaryInitialBalance),
            'An unaccountable state change occurred');

          return;
        }

        // Transaction succeeded. This should not have happened.
        assert(false,
          'the beneficiary was able to withdraw tokens when they should not have been able to');
      });

    it('should not allow anybody other than the beneficiary to withdraw tokens after lastPeriod ' +
       '+ heartbeatPeriod', async () => {
      // Deposit tokens to the DMS and capture its balance after the deposit
      const ownerInitialBalance = await token.balanceOf.call(owner);
      await as(owner, token.approve, dead.address, ownerInitialBalance);
      await as(owner, dead.depositERC20, token.address, ownerInitialBalance);
      const deadInitialBalance = await token.balanceOf.call(dead.address);

      // Big nerd will be our non-beneficiary actor. An attacker.
      const bigNerdInitialBalance = await token.balanceOf.call(bigNerd);

      // Bump the clock into the availability zone for the beneficiary to make withdrawals
      const heartbeatPeriod = await dead.heartbeatPeriod.call();
      await increaseTime(heartbeatPeriod.toNumber(10) + 1);

      try {
        await as(bigNerd, dead.withdrawERC20, token.address, deadInitialBalance);
      } catch (err) {
        assert(isEVMException(err), err.toString());

        // Sanity check. The nerd's final balance should equal their initial balance
        const bigNerdFinalBalance = await token.balanceOf.call(beneficiary);
        assert(bigNerdFinalBalance.eq(bigNerdInitialBalance),
          'An unaccountable state change occurred');

        return;
      }

      // The withdrawal succeeded. This should not have happened.
      assert(false, 'Somebody other than the beneficiary or owner was able to withdraw tokens');
    });

    it('should allow a beneficiary to withdraw tokens after lastPeriod + heartbeatPeriod',
      async () => {
        // Deposit tokens to the DMS and capture its balance after the deposit
        const ownerInitialBalance = await token.balanceOf.call(owner);
        await as(owner, token.approve, dead.address, ownerInitialBalance);
        await as(owner, dead.depositERC20, token.address, ownerInitialBalance);
        const deadInitialBalance = await token.balanceOf.call(dead.address);

        const beneficiaryInitialBalance = await token.balanceOf.call(beneficiary);

        // Bump the clock into the availability zone for the beneficiary to make withdrawals
        const heartbeatPeriod = await dead.heartbeatPeriod.call();
        await increaseTime(heartbeatPeriod.toNumber(10) + 1);

        await as(beneficiary, dead.withdrawERC20, token.address, deadInitialBalance);

        // Accountability check
        const beneficiaryFinalBalance = await token.balanceOf.call(beneficiary);
        assert(beneficiaryFinalBalance.eq(beneficiaryInitialBalance.add(deadInitialBalance)),
          'the beneficiary was not able to withdraw tokens when they should have been able to');
      });

    it('should fire an event indicating the amount of tokens withdrawn and the token\'s address',
      async () => {
        // Deposit tokens to the DMS and capture its balance after the deposit
        const ownerInitialBalance = await token.balanceOf.call(owner);
        await as(owner, token.approve, dead.address, ownerInitialBalance);
        await as(owner, dead.depositERC20, token.address, ownerInitialBalance);
        const deadInitialBalance = await token.balanceOf.call(dead.address);

        // Bump the clock into the availability zone for the beneficiary to make withdrawals
        const heartbeatPeriod = await dead.heartbeatPeriod.call();
        await increaseTime(heartbeatPeriod.toNumber(10) + 1);

        // The contract is empty now, but zero withdrawals are supposed to succeed. Get a receipt
        // for such a withdrawal
        const receipt = await as(beneficiary, dead.withdrawERC20, token.address,
          deadInitialBalance);

        // Accountability checks
        assert.strictEqual(getReceiptValue(receipt, '_addr').toString(), token.address);
        assert.strictEqual(getReceiptValue(receipt, '_amount').toString(),
          deadInitialBalance.toString(10));
      });
  });
});

