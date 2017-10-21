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

  /**
  @dev constructor
  @param _beneficiary can withdraw tokens after the owner has died
  @param _owner can withdraw tokens at any time, must try to stay alive
  @param _heartbeatPeriod the interval (in seconds) after which the owner is considered dead if no heartbeat it received
  */
  function Dead(address _beneficiary, address _owner, uint _heartbeatPeriod)
  public {
    beneficiary = _beneficiary;
    owner = _owner;
    heartbeatPeriod = _heartbeatPeriod;
    lastHeartbeat = now;
  }

  /**
  @dev the owner can call this function to signal that they are alive, giving them another heartbeatPeriod before they must call the function again or forfeit their assets to the beneficiary
  */
  function heartbeat() public onlyOwner {
    lastHeartbeat = now;
  }

  /**
  @notice make sure to have approved this contract to transfer from your balance before calling this. Note that you cannot get these tokens out again unless you are the owner, or if you are the beneficiary and the owner has died
  @dev deposits ERC-20 tokens into the switch
  @param _tokenAddr the address of the ERC-20 token being deposited
  */
  function depositERC20(address _tokenAddr) public {
    HumanStandardToken token = HumanStandardToken(_tokenAddr);

    uint balanceToTransfer = token.balanceOf(msg.sender);

    token.transferFrom(msg.sender, this, balanceToTransfer);
    assert(token.balanceOf(this) >= balanceToTransfer);

    erc20_deposit(balanceToTransfer, _tokenAddr);
  }

  /**
  @notice if you are the owner, you can call this function any time. If you are a beneficiary, you can call it after the owner has died. If you are anybody else, you can't call it. Calling this function will withdraw all of the deposited tokens for the token at the provided addess
  @dev returns deposited tokens to msg.sender
  @param _tokenAddr the address of the ERC-20 token being withdrawn
  */
  function withdrawERC20(address _tokenAddr) public {
    require(msg.sender == owner || msg.sender == beneficiary);
    if(msg.sender == beneficiary) {
      require(now > (lastHeartbeat + heartbeatPeriod));
    }

    HumanStandardToken token = HumanStandardToken(_tokenAddr);

    uint balanceToTransfer = token.balanceOf(this);

    token.transfer(msg.sender, balanceToTransfer);
    assert(token.balanceOf(this) == 0);

    erc20_withdraw(balanceToTransfer, _tokenAddr);
  }

}
