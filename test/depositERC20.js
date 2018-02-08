/* eslint-env mocha */
/* global assert artifacts contract */

const Dead = artifacts.require('Dead.sol');
const Token = artifacts.require('tokens/eip20/EIP20.sol');

const { depositTokens, getReceiptValue } = require('./utils.js');
const BN = require('bignumber.js');

contract('Dead', (accounts) => {
  describe('Function: depositERC20', () => {
    const [owner] = accounts;

    it('should fire an event indicating the amount of tokens deposited ' +
       'and the token\'s address', async () => {
      const dead = await Dead.deployed();
      const token = await Token.deployed();
      const accountabilityFail = 'An unaccountable state change occurred';
      const logFail = 'A log does not exist or does not contain the expected data';

      const ownerInitialBalance = await token.balanceOf.call(owner);

      // Check the logs exist and contain valid data
      const receipt = await depositTokens(owner, ownerInitialBalance, dead.address);
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
  });
});

