pragma solidity ^0.4.15;

contract Dead {
  
  address public beneficiary;
  address public owner;
  uint public heartbeatPeriod;
  uint public lastHeartbeat;

  function Dead() internal {}

  function heartbeat() public {}

  /*
   * ETHER
   */
  function depositEther() public {}

  function withdrawEther() public {}

  /*
   * ERC-20
   */
  function depositERC20(address _tokenAddr) public {}

  function withdrawERC20(address _tokenAddr) public {}

}
