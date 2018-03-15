/* eslint-env mocha */
/* global assert artifacts contract */

const Token = artifacts.require('tokens/eip20/EIP20.sol');

const { as, isEVMException, getReceiptValue, makeDMSProxy } = require('./utils.js');
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
      // Deposit the owner's entire initial balance and get the tx receipt
      const ownerInitialBalance = await token.balanceOf.call(owner);
      await as(owner, token.approve, dead.address, ownerInitialBalance);
      const receipt = await as(owner, dead.depositERC20, token.address, ownerInitialBalance);

      // Check the logs exist and contain valid data
      const logFail = 'A log does not exist or does not contain the expected data';
      assert.strictEqual(getReceiptValue(receipt, '_addr').toString(), token.address, logFail);
      assert.strictEqual(getReceiptValue(receipt, '_amount').toString(), '1000', logFail);

      // The owner deposited all their tokens, so their balance should be zero
      const ownerFinalBalance = await token.balanceOf.call(owner);
      assert(ownerFinalBalance.eq(new BN('0', 10)),
        'The token owner\'s balance was not properly decremented');

      // The owner deposited all their tokens, so the DMS balance should be equal to the owner's
      // initial balance
      const deadFinalBalance = await token.balanceOf.call(dead.address);
      assert(deadFinalBalance.eq(ownerInitialBalance),
        'The DMS\' final balance was not properly incremented');
    });

    it('should not allow a deposit larger than the sender\'s balance', async () => {
      // Record the initial balances of the owner and the DMS
      const ownerInitialBalance = await token.balanceOf.call(owner);
      const dmsInitialBalance = await token.balanceOf.call(dead.address);

      // Attempt to deposit more tokens to the DMS than are available to the depositer
      const attemptDepositAmount = ownerInitialBalance.add(new BN('1', 10));
      await as(owner, token.approve, dead.address, attemptDepositAmount);
      try {
        await as(owner, dead.depositERC20, token.address, attemptDepositAmount);
      } catch (error) {
        assert(isEVMException(error), error.toString());

        // Sanity check. Check that neither account balance changed
        const errMsg = 'An unaccountable state change occurred';
        const ownerFinalBalance = await token.balanceOf.call(owner);
        assert(ownerFinalBalance.eq(ownerInitialBalance), errMsg);
        const dmsFinalBalance = await token.balanceOf.call(dead.address);
        assert(dmsFinalBalance.eq(dmsInitialBalance), errMsg);

        return;
      }
      // The deposit was successful. This should not have happened.
      assert(false,
        'the owner was able to deposit with an amount greater than their initial balance');
    });

    it('should not allow a negative deposit', async () => {
      // Record the initial balances of both accounts
      const ownerInitialBalance = await token.balanceOf.call(owner);
      const dmsInitialBalance = await token.balanceOf.call(dead.address);

      // Attempt to deposit a negative number of tokens
      const attemptDepositAmount = new BN('-1', 10);

      await as(owner, token.approve, dead.address, attemptDepositAmount);
      try {
        await as(owner, dead.depositERC20, token.address, attemptDepositAmount);
      } catch (error) {
        assert(isEVMException(error), error.toString());


        // Sanity check. Check that neither account balance changed
        const errMsg = 'An unaccountable state change occurred';
        const ownerFinalBalance = await token.balanceOf.call(owner);
        assert(ownerFinalBalance.eq(ownerInitialBalance), errMsg);
        const dmsFinalBalance = await token.balanceOf.call(dead.address);
        assert(dmsFinalBalance.eq(dmsInitialBalance), errMsg);

        return;
      }

      // The deposit was successful. This hsould not have happened.
      assert(false, 'the owner was able to deposit a negative amount');
    });
  });
});

