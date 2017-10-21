pragma solidity ^0.4.15;

import "./token/HumanStandardToken.sol";

contract Dead {

  event erc20_deposit(uint _amount, address _addr);
  event erc20_withdraw(uint _amount, address _addr);
  
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

  function depositERC20(address _tokenAddr) public {
    HumanStandardToken token = HumanStandardToken(_tokenAddr);

    uint balanceToTransfer = token.balanceOf(msg.sender);

    token.transferFrom(msg.sender, this, balanceToTransfer);
    assert(token.balanceOf(this) >= balanceToTransfer);

    erc20_deposit(balanceToTransfer, _tokenAddr);
  }

  function withdrawERC20(address _tokenAddr) public {
    require(msg.sender == owner || msg.sender == beneficiary);
    if(msg.sender == beneficiary) {
      require(now > (lastHeartbeat + heartbeatPeriod));
    }

    HumanStandardToken token = HumanStandardToken(_tokenAddr);

    uint balanceToTransfer = token.balanceOf(this);

    token.transfer(msg.sender, balanceToTransfer);
    assert(token.balanceOf(this) == 0);
    assert(token.balanceOf(this) >= 0);

    erc20_withdraw(balanceToTransfer, _tokenAddr);
  }

}
