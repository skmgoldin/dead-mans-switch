/* eslint-env mocha */
/* global contract */

contract('Dead', () => {
  describe('Function: hearbeat', () => {
    it('should increment lastHeartbeat by heartbeatPeriod');
  });
});

contract('Dead', () => {
  describe('Function: depositEther', () => {
    it('should fire an event indicating the amount of ether deposited');
  });
});

contract('Dead', () => {
  describe('Function: withdrawEther', () => {
    it('should allow the owner to withdraw ether before lastPeriod + heartbeatPeriod');
    it('should not allow a beneficiary to withdraw ether before lastPeriod + heartbeatPeriod');
    it('should allow a beneficiary to withdraw ether after lastPeriod + heartbeatPeriod');
    it('should fire an event indicating the amount of ether withdrawn');
  });
});

contract('Dead', () => {
  describe('Function: depositERC20', () => {
    it('should fire an event indicating the amount of tokens deposited, the token\'s ' +
       'symbol and its address');
  });
});

contract('Dead', () => {
  describe('Function: withdrawERC20', () => {
    it('should allow the owner to withdraw tokens before lastPeriod + heartbeatPeriod');
    it('should not allow a beneficiary to withdraw tokens before lastPeriod + heartbeatPeriod');
    it('should allow a beneficiary to withdraw tokens after lastPeriod + heartbeatPeriod');
    it('should fire an event indicating the amount of tokens withdrawn, the token\'s ' +
       'symbol and its address');
  });
});
