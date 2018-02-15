pragma solidity ^0.4.15;

import "tokens/eip20/EIP20.sol";

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
  function Dead(address _beneficiary, address _owner, uint _heartbeatPeriod) public {
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
  @param _amount the number of tokens to deposit
  */
  function depositERC20(address _tokenAddr, uint _amount) public {
    EIP20 token = EIP20(_tokenAddr);

    require(_amount <= token.balanceOf(msg.sender));

    token.transferFrom(msg.sender, this, _amount);
    assert(token.balanceOf(this) >= _amount);

    erc20_deposit(_amount, _tokenAddr);
  }

  /**
  @dev if you are the owner, you can call this function any time. If you are a beneficiary, you can call it after the owner has died. If you are anybody else, you can't call it.
  @dev returns deposited tokens to msg.sender
  @param _tokenAddr the address of the ERC-20 token being withdrawn
  @param _amount the number of tokens to withdraw
  */
  function withdrawERC20(address _tokenAddr, uint _amount) public {
    EIP20 token = EIP20(_tokenAddr);

    require(_amount <= token.balanceOf(this));
    require(msg.sender == owner || msg.sender == beneficiary);
    if (msg.sender == beneficiary) {
      require(now > (lastHeartbeat + heartbeatPeriod));
    }

    require(token.transfer(msg.sender, _amount));

    erc20_withdraw(_amount, _tokenAddr);
  }

}
