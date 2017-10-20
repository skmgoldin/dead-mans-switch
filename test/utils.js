/* eslint-env mocha */
/* global artifacts */

const Dead = artifacts.require('./token/Dead.sol');
const Token = artifacts.require('./token/HumanStandardToken.sol');

const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');

const ethRPC = new EthRPC(new HttpProvider('http://localhost:7545'));

const utils = {
  increaseTime: seconds =>
    new Promise((resolve, reject) => ethRPC.sendAsync({
      method: 'evm_increaseTime',
      params: [seconds],
    }, (err) => {
      if (err) reject(err);
      resolve();
    }))
      .then(() => new Promise((resolve, reject) => ethRPC.sendAsync({
        method: 'evm_mine',
        params: [],
      }, (err) => {
        if (err) reject(err);
        resolve();
      }))),

  as: (actor, fn, ...args) => {
    function detectSendObject(potentialSendObj) {
      function hasOwnProperty(obj, prop) {
        const proto = obj.constructor.prototype;
        return (prop in obj) &&
          (!(prop in proto) || proto[prop] !== obj[prop]);
      }
      if (typeof potentialSendObj !== 'object') { return undefined; }
      if (
        hasOwnProperty(potentialSendObj, 'from') ||
        hasOwnProperty(potentialSendObj, 'to') ||
        hasOwnProperty(potentialSendObj, 'gas') ||
        hasOwnProperty(potentialSendObj, 'gasPrice') ||
        hasOwnProperty(potentialSendObj, 'value')
      ) {
        throw new Error('It is unsafe to use "as" with custom send objects');
      }
      return undefined;
    }
    detectSendObject(args[args.length - 1]);
    const sendObject = { from: actor };
    return fn(...args, sendObject);
  },

  isEVMException: err => (
    err.toString().includes('invalid opcode')
  ),

  getReceiptValue: (receipt, arg) => receipt.logs[0].args[arg],

  depositTokens: async (from, amount, to) => {
    const dead = await Dead.deployed();
    const token = await Token.deployed();

    await utils.as(from, token.approve, to, amount);
    return utils.as(from, dead.depositERC20, token.address);
  },
};

module.exports = utils;

