/* eslint-env mocha */
/* global assert artifacts contract */

const Token = artifacts.require('tokens/eip20/EIP20.sol');

const { depositTokens, isEVMException, getReceiptValue, makeDMSProxy } = require('./utils.js');
const BN = require('bignumber.js');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('./conf/config.json'));

contract('Dead', (accounts) => {
  describe('Function: depositERC20', () => {
    const [owner, beneficiary] = accounts;

    let dead;
    let token;

    beforeEach(async () => {
      dead = await makeDMSProxy(beneficiary, owner, conf.heartbeat);
      token = await Token.new('1000', 'DEAD', '0', 'DED', { from: owner });
    });

    it('should fire an event indicating the amount of tokens deposited ' +
       'and the token\'s address', async () => {
      const accountabilityFail = 'An unaccountable state change occurred';
      const logFail = 'A log does not exist or does not contain the expected data';

      const ownerInitialBalance = await token.balanceOf.call(owner);

      // Check the logs exist and contain valid data
      const receipt = await depositTokens(token.address, owner, ownerInitialBalance, dead.address);
      assert.strictEqual(getReceiptValue(receipt, '_addr').toString(), token.address, logFail);
      assert.strictEqual(getReceiptValue(receipt, '_amount').toString(), '1000', logFail);

      // Check for accountability errors. The owner deposited all their tokens, so their balance
      // should be zero and the DMS balance should be equal to the owner's initial balance
      const ownerFinalBalance = await token.balanceOf.call(owner);
      assert(ownerFinalBalance.eq(new BN('0', 10)),
        `${accountabilityFail}. the token owner's balance was not properly decremented`);

      const deadFinalBalance = await token.balanceOf.call(dead.address);
      assert(deadFinalBalance.eq(ownerInitialBalance),
        `${accountabilityFail}. the DMS' final balance was not properly incremented`);
    });

    it('should not allow a deposit larger than the sender\'s balance', async () => {
      const errMsg = 'the owner was able to deposit with an amount greater than their initial balance';

      // Record the initial balances of both accounts
      const ownerInitialBalance = await token.balanceOf.call(owner);
      const dmsInitialBalance = await token.balanceOf.call(dead.address);

      // Attempt to deposit more tokens to the DMS than allowed
      const attemptDepositAmount = ownerInitialBalance.add(new BN('1', 10));

      try {
        await depositTokens(token.address, owner, attemptDepositAmount, dead.address);
      } catch (error) {
        assert(isEVMException(error), error.toString());

        const ownerFinalBalance = await token.balanceOf.call(owner);
        const dmsFinalBalance = await token.balanceOf.call(dead.address);

        // Check that neither account balance changed
        assert(ownerFinalBalance.eq(ownerInitialBalance), errMsg);
        assert(dmsFinalBalance.eq(dmsInitialBalance), errMsg);

        return;
      }
      // The deposit was successful
      assert(false, errMsg);
    });

    it('should not allow a negative deposit', async () => {
      const errMsg = 'the owner was able to deposit a negative amount';

      // Record the initial balances of both accounts
      const ownerInitialBalance = await token.balanceOf.call(owner);
      const dmsInitialBalance = await token.balanceOf.call(dead.address);

      // Attempt to deposit more tokens to the DMS than allowed
      const attemptDepositAmount = new BN('-1', 10);

      try {
        await depositTokens(token.address, owner, attemptDepositAmount, dead.address);
      } catch (error) {
        assert(isEVMException(error), error.toString());

        const ownerFinalBalance = await token.balanceOf.call(owner);
        const dmsFinalBalance = await token.balanceOf.call(dead.address);

        // Check that neither account balance changed
        assert(ownerFinalBalance.eq(ownerInitialBalance), errMsg);
        assert(dmsFinalBalance.eq(dmsInitialBalance), errMsg);

        return;
      }

      // The deposit was successful
      assert(false, errMsg);
    });
  });
});

