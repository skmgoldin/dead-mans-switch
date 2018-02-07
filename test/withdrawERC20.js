/* eslint-env mocha */
/* global assert artifacts contract */

const Dead = artifacts.require('Dead.sol');
const Token = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('Dead', (accounts) => {
  describe('Function: withdrawERC20', () => {
    const [owner, beneficiary, bigNerd] = accounts;

    it('should allow the owner to withdraw tokens before lastPeriod + heartbeatPeriod',
      async () => {
        const dead = await Dead.deployed();
        const token = await Token.deployed();

        const ownerInitialBalance = await token.balanceOf.call(owner);

        await utils.depositTokens(owner, ownerInitialBalance, dead.address);

        assert((await token.balanceOf.call(owner)).eq(new BN('0', 10)),
          'tokens were not deposited successfully');

        await utils.as(owner, dead.withdrawERC20, token.address, ownerInitialBalance);

        const ownerFinalBalance = await token.balanceOf.call(owner);
        assert(ownerFinalBalance.eq(ownerInitialBalance),
          'the owner was unable to withdraw tokens when they should have been able to');
      });

    it('should not allow a beneficiary to withdraw tokens before lastPeriod + heartbeatPeriod',
      async () => {
        const dead = await Dead.deployed();
        const token = await Token.deployed();

        const beneficiaryInitialBalance = await token.balanceOf.call(beneficiary);

        const ownerInitialBalance = await token.balanceOf.call(owner);
        await utils.depositTokens(owner, ownerInitialBalance, dead.address);

        try {
          await utils.as(beneficiary, dead.withdrawERC20, token.address, ownerInitialBalance);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
        }

        const beneficiaryFinalBalance = await token.balanceOf.call(beneficiary);
        assert(beneficiaryFinalBalance.eq(beneficiaryInitialBalance),
          'the beneficiary was able to withdraw tokens when they should not have been able to');
      });

    it('should not allow anybody other than the beneficiary to withdraw tokens after lastPeriod ' +
       'heartbeatPeriod', async () => {
      const dead = await Dead.deployed();
      const token = await Token.deployed();

      const bigNerdInitialBalance = await token.balanceOf.call(bigNerd);
      const deadInitialBalance = await token.balanceOf.call(dead.address);

      const heartbeatPeriod = await dead.heartbeatPeriod.call();
      await utils.increaseTime(heartbeatPeriod);
      try {
        await utils.as(bigNerd, dead.withdrawERC20, token.address, deadInitialBalance);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      const bigNerdFinalBalance = await token.balanceOf.call(beneficiary);
      assert(bigNerdFinalBalance.eq(bigNerdInitialBalance),
        'someone other than the beneficiary or owner was able to withdraw tokens');
    });

    it('should allow a beneficiary to withdraw tokens after lastPeriod + heartbeatPeriod',
      async () => {
        const dead = await Dead.deployed();
        const token = await Token.deployed();

        const beneficiaryInitialBalance = await token.balanceOf.call(beneficiary);
        const deadInitialBalance = await token.balanceOf.call(dead.address);

        await utils.as(beneficiary, dead.withdrawERC20, token.address, deadInitialBalance);

        const beneficiaryFinalBalance = await token.balanceOf.call(beneficiary);
        assert(beneficiaryFinalBalance.eq(beneficiaryInitialBalance.add(deadInitialBalance)),
          'the beneficiary was not able to withdraw tokens when they should have been able to');
      });

    it('should fire an event indicating the amount of tokens withdrawn ' +
       'and its address', async () => {
      const dead = await Dead.deployed();
      const token = await Token.deployed();

      const receipt = await utils.as(beneficiary, dead.withdrawERC20, token.address, '0');

      assert.strictEqual(utils.getReceiptValue(receipt, '_addr').toString(), token.address);
      assert.strictEqual(utils.getReceiptValue(receipt, '_amount').toString(), '0');
    });
  });
});

