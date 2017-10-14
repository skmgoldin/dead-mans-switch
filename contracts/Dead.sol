pragma solidity ^0.4.15;

contract Dead {
  
  address public beneficiary;
  address public owner;
  uint public heartbeatPeriod;
  uint public lastHeartbeat;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  function Dead(address _beneficiary, address _owner, uint _heartbeatPeriod)
  public {
    beneficiary = _beneficiary;
    owner = _owner;
    heartbeatPeriod = _heartbeatPeriod;
    lastHeartbeat = now;
  }

  function heartbeat() public onlyOwner {
    lastHeartbeat = now;
  }

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
