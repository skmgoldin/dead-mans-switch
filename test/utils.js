/* eslint-env mocha */
/* global artifacts */

const Dead = artifacts.require('./token/Dead.sol');
const Token = artifacts.require('tokens/eip20/EIP20.sol');
const ProxyFactory = artifacts.require('ProxyFactory.sol');

const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');

const ethRPC = new EthRPC(new HttpProvider('http://localhost:7545'));

const utils = {

  makeDMSProxy: async (beneficiary, owner, heartbeatPeriod) => {
    // Get deployed instances of the proxy factory and dead man's switch contracts
    const pf = await ProxyFactory.deployed();
    const deadMaster = await Dead.deployed();

    // Create a new proxy whose masterCopy is the deployed dead man's switch
    const { logs } = await pf.createProxy(deadMaster.address, '');

    // Get the proxy's address, and use it to create a local object representing the proxy
    const creationLog = logs.find(log => log.event.includes('ProxyCreation'));
    const deadProxy = Dead.at(creationLog.args.proxy);

    // Initialize the proxy
    await deadProxy.initDead(beneficiary, owner, heartbeatPeriod);

    // Return the proxy object
    return deadProxy;
  },

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
    err.toString().includes('revert')
  ),

  getReceiptValue: (receipt, arg) => receipt.logs[0].args[arg],

  depositTokens: async (tokenAddr, from, amount, deadAddr) => {
    const token = Token.at(tokenAddr);
    const dead = Dead.at(deadAddr);

    await utils.as(from, token.approve, dead.address, amount);
    return utils.as(from, dead.depositERC20, token.address, amount);
  },
};

module.exports = utils;

