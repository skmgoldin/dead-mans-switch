/* eslint-env mocha */
/* global assert artifacts contract */

const Dead = artifacts.require('Dead.sol');
const Token = artifacts.require('tokens/eip20/EIP20.sol');

const { as, depositTokens, increaseTime, isEVMException, getReceiptValue } = require('./utils.js');

contract('Dead', (accounts) => {
  describe('Function: withdrawERC20', () => {
    const [owner, beneficiary, bigNerd] = accounts;
    const revertFail = 'Tx expected to revert did not revert';
    const accountabilityFail = 'An unaccountable state change occurred';

    it('should allow the owner to withdraw tokens before lastPeriod + heartbeatPeriod',
      async () => {
        const dead = await Dead.deployed();
        const token = await Token.deployed();

        const ownerInitialBalance = await token.balanceOf.call(owner);

        // As owner, make a deposit and immediately withdraw it
        await depositTokens(owner, ownerInitialBalance, dead.address);
        await as(owner, dead.withdrawERC20, token.address, ownerInitialBalance);

        // Accountability check
        const ownerFinalBalance = await token.balanceOf.call(owner);
        assert(ownerFinalBalance.eq(ownerInitialBalance),
          'the owner was unable to withdraw tokens when they should have been able to');
      });

    it('should not allow a beneficiary to withdraw tokens before lastPeriod + heartbeatPeriod',
      async () => {
        const dead = await Dead.deployed();
        const token = await Token.deployed();
        const errMsg = 'the beneficiary was able to withdraw tokens when they should not have been able to';

        const beneficiaryInitialBalance = await token.balanceOf.call(beneficiary);

        // Deposit tokens to the DMS
        const ownerInitialBalance = await token.balanceOf.call(owner);
        await depositTokens(owner, ownerInitialBalance, dead.address);

        try {
          await as(beneficiary, dead.withdrawERC20, token.address, ownerInitialBalance);
        } catch (err) {
          assert(isEVMException(err), err.toString());

          // Accountability check
          const beneficiaryFinalBalance = await token.balanceOf.call(beneficiary);
          assert(beneficiaryFinalBalance.eq(beneficiaryInitialBalance),
            `${accountabilityFail}. ${errMsg}`);

          return;
        }

        assert(false, `${revertFail}. ${errMsg}`);
      });

    it('should not allow anybody other than the beneficiary to withdraw tokens after lastPeriod ' +
       '+ heartbeatPeriod', async () => {
      const dead = await Dead.deployed();
      const token = await Token.deployed();
      const errMsg = 'someone other than the beneficiary or owner was able to withdraw tokens';

      // Big nerd will be our non-beneficiary actor. An attacker.
      const bigNerdInitialBalance = await token.balanceOf.call(bigNerd);
      const deadInitialBalance = await token.balanceOf.call(dead.address);

      // Bump the clock into the availability zone for the beneficiary to make withdrawals
      const heartbeatPeriod = await dead.heartbeatPeriod.call();
      await increaseTime(heartbeatPeriod.toNumber(10));

      try {
        await as(bigNerd, dead.withdrawERC20, token.address, deadInitialBalance);
      } catch (err) {
        assert(isEVMException(err), err.toString());

        // Accountability check
        const bigNerdFinalBalance = await token.balanceOf.call(beneficiary);
        assert(bigNerdFinalBalance.eq(bigNerdInitialBalance), `${accountabilityFail}. ${errMsg}`);

        return;
      }

      assert(false, `${revertFail}. ${errMsg}`);
    });

    it('should allow a beneficiary to withdraw tokens after lastPeriod + heartbeatPeriod',
      async () => {
        const dead = await Dead.deployed();
        const token = await Token.deployed();

        const beneficiaryInitialBalance = await token.balanceOf.call(beneficiary);
        const deadInitialBalance = await token.balanceOf.call(dead.address);

        // The clock was bumped in the previous test, so we should still be in the withdrawal
        // availability zone
        await as(beneficiary, dead.withdrawERC20, token.address, deadInitialBalance);

        // Accountability check
        const beneficiaryFinalBalance = await token.balanceOf.call(beneficiary);
        assert(beneficiaryFinalBalance.eq(beneficiaryInitialBalance.add(deadInitialBalance)),
          'the beneficiary was not able to withdraw tokens when they should have been able to');
      });

    it('should fire an event indicating the amount of tokens withdrawn and the token\'s address',
      async () => {
        const dead = await Dead.deployed();
        const token = await Token.deployed();

        // The contract is empty now, but zero withdrawals are supposed to succeed. Get a receipt
        // for such a withdrawal
        const deadInitialBalance = await token.balanceOf.call(dead.address);
        const receipt = await as(beneficiary, dead.withdrawERC20, token.address,
          deadInitialBalance);

        // Accountability checks
        assert.strictEqual(getReceiptValue(receipt, '_addr').toString(), token.address);
        assert.strictEqual(getReceiptValue(receipt, '_amount').toString(),
          deadInitialBalance.toString(10));
      });
  });
});

