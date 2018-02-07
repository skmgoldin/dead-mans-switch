/* eslint-env mocha */
/* global assert artifacts contract */

const Dead = artifacts.require('Dead.sol');
const Token = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('Dead', (accounts) => {
  describe('Function: depositERC20', () => {
    const [owner, tokenOwner] = accounts;

    it('should fire an event indicating the amount of tokens deposited ' +
       'and its address', async () => {
      const dead = await Dead.deployed();
      const token = await Token.deployed();

      const ownerInitialBalance = await token.balanceOf.call(owner);

      await utils.as(owner, token.transfer, tokenOwner, ownerInitialBalance);

      const tokenOwnerInitialBalance = await token.balanceOf.call(tokenOwner);

      const receipt = await utils.depositTokens(tokenOwner, tokenOwnerInitialBalance, dead.address);

      assert.strictEqual(utils.getReceiptValue(receipt, '_addr').toString(), token.address);
      assert.strictEqual(utils.getReceiptValue(receipt, '_amount').toString(), '1000');

      const tokenOwnerFinalBalance = await token.balanceOf.call(tokenOwner);
      assert(tokenOwnerFinalBalance.eq(new BN('0', 10)),
        'the token owner\'s balance was not properly decremented');

      const deadFinalBalance = await token.balanceOf.call(dead.address);
      assert(deadFinalBalance.eq(tokenOwnerInitialBalance),
        'the DMS\' final balance was not properly incremented');
    });
  });
});

