// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import 'witnet-solidity-bridge/contracts/interfaces/IWitnetRandomness.sol';

interface TRPZToken is IERC20 {
  function decimals() external view returns (uint8);

  function burn(uint256 _amount) external;
}

contract CroDraw is ReentrancyGuard, Ownable {
  using SafeERC20 for TRPZToken;

  address public projectAddress;
  address public charityAddress;
  address public founder1Address;
  address public founder2Address;
  address public founder3Address;
  address public operatorAddress;
  uint32 public currentTicketId;  // current ticket index: start from 0
  uint256 public amountCollected; // balance collected
  uint256 public ticketPrice;
  uint32 public maxNumberTicketsPerBuy = 100; // tickets limit per user
  TRPZToken public discountToken;
  uint16 public discountRate = 100; // 10%
  uint256 public discountTokenPrice = 100;
  uint256 public endTime;
  address public nftContractAddress;
  uint256 public nftDiscountRate = 100; // 10%
  uint8[] public winnerRate = [2, 5, 10];
  uint8[] public prizeRate = [15, 20, 25];

  enum Status {
    // set in declareWinner and require in startLottery
    Pending,
    // set in startLottery and require in buyDiscountTickets, buyTickets, addFund, closeLottery
    Open,
    // set in closeLottery and require in declareWinner
    Close,
    // not used yet...
    Claimable
  }

  Status public status;
  mapping(uint32 => address) public tickets;  // tickets[ticketIndex] = user
  mapping(address => mapping(uint256 => uint32)) public _numOfTickesPerOwner; // _numOfTickesPerOwner[user][lotteryIndex] = ticket count
  mapping(address => uint256) private _rewardsByOwner;  // _rewardsByOwner[user] = balance: this should be kept until user claims
  mapping(address => uint8) private _lastWinningPot;  // _lastWinningPot[user] = pot: winning ranks(1,2,3,4)
  mapping(uint8 => address[]) private winnerByPot;  // winnerByPot[pot] = user[]

  address[5] private _lastTopWinners;
  uint8 private _sp;

  uint256 public lotteryId; // lottery index: start from 1

  IWitnetRandomness public immutable witnet;
  uint256 public latestRandomizingBlock;
  address public topWinner;
  uint256 public topWinning;

  modifier notContract() {
    require(!_isContract(msg.sender), 'Contract is not allowed');
    require(msg.sender == tx.origin, 'Proxy contract is not allowed');
    _;
  }

  modifier onlyOperator() {
    require(msg.sender == operatorAddress, 'Not the operator');
    _;
  }

  constructor(
    address _discountToken,
    IWitnetRandomness _witnetRandomness,
    address _charity,
    address _project,
    address _founder1,
    address _founder2,
    address _founder3
  ) {
    assert(address(_witnetRandomness) != address(0));
    witnet = _witnetRandomness;
    discountToken = TRPZToken(_discountToken);
    charityAddress = _charity;
    projectAddress = _project;
    founder1Address = _founder1;
    founder2Address = _founder2;
    founder3Address = _founder3;
  }

  // ??? There's no logic to transfer cro from msg.sender to here
  function buyDiscountTickets(uint32 _amount)
    external
    payable
    notContract
    nonReentrant
  {
    require(ticketPrice != 0, 'Price not set');
    require(_amount != 0, 'Enter chosen amount to buy');
    require(_amount <= maxNumberTicketsPerBuy, 'Too many tickets');

    require(status == Status.Open, 'Lottery is not open yet');
    require(block.timestamp < endTime, 'Lottery has ended');
    uint8 decimals = discountToken.decimals();
    uint256 discountTokenAmount = discountTokenPrice * (10**decimals) * _amount;
    discountToken.transferFrom(msg.sender, address(this), discountTokenAmount);
    discountToken.burn(discountTokenAmount);

    uint256 totalPrice = _calculateTotalPrice(_amount, true);
    require(msg.value >= totalPrice, 'Insufficient funds');

    amountCollected += totalPrice;

    for (uint256 i = 0; i < _amount; i++) {
      tickets[currentTicketId] = msg.sender;

      // Increase lottery ticket number
      currentTicketId++;
    }

    _numOfTickesPerOwner[msg.sender][lotteryId] += _amount;
  }

  // ??? There's no logic to transfer cro from msg.sender to here
  function buyTickets(uint32 _amount)
    external
    payable
    notContract
    nonReentrant
  {
    require(ticketPrice != 0, 'Price not set');
    require(_amount != 0, 'Enter chosen amount to buy');
    require(_amount <= maxNumberTicketsPerBuy, 'Too many tickets');

    require(status == Status.Open, 'Lottery is not open yet');
    require(block.timestamp < endTime, 'Lottery has ended');

    uint256 totalPrice = _calculateTotalPrice(_amount, false);
    require(msg.value >= totalPrice, 'Insufficient funds');

    amountCollected += totalPrice;

    for (uint256 i = 0; i < _amount; i++) {
      tickets[currentTicketId] = msg.sender;

      // Increase lottery ticket number
      currentTicketId++;
    }

    _numOfTickesPerOwner[msg.sender][lotteryId] += _amount;
  }

  function startLottery(uint256 _period) external onlyOperator {
    require(status == Status.Pending, 'Last Lottery has not finished yet');
    status = Status.Open;
    amountCollected = 0;
    currentTicketId = 0;
    lotteryId++;
    endTime = block.timestamp + _period;
  }

  function addFund() external payable onlyOperator {
    require(status == Status.Open, 'Lottery is not open');
    amountCollected += msg.value;
  }

  receive() external payable {}

  function closeLottery() external payable onlyOperator {
    require(status == Status.Open, 'Lottery is not open');
    require(block.timestamp > endTime, 'Lottery is ongoing');

    latestRandomizingBlock = block.number;
    uint256 _usedFunds = witnet.randomize{value: msg.value}();
    if (_usedFunds < msg.value) {
      payable(msg.sender).transfer(msg.value - _usedFunds); // ???
    }

    status = Status.Close;
  }

  function declareWinner() external nonReentrant onlyOperator {
    require(status == Status.Close, 'Lottery has not finished');

    require(
      witnet.isRandomized(latestRandomizingBlock) == true,
      'Not Randomized'
    );

    uint8 i;
    uint256 j;

    for (i = 1; i <= 4; ++i) {
      for (j = 0; j < winnerByPot[i].length; ++j) {
        amountCollected += _rewardsByOwner[winnerByPot[i][j]];    // ???
        _rewardsByOwner[winnerByPot[i][j]] = 0;
      }
      delete winnerByPot[i];
    }

    status = Status.Pending;
    if (currentTicketId == 0) {
      return;
    }

    uint256 nonce = 0;

    uint256 remainingPrize = amountCollected;
    uint32 winningTicketId = witnet.random(
      currentTicketId,
      nonce,
      latestRandomizingBlock
    );
    nonce++;
    uint256 winningPrize = amountCollected / 10;

    //Choose Top Winner
    _chooseWinner(winningTicketId, winningPrize, 1);
    _setTopWinner(winningTicketId);

    remainingPrize -= winningPrize;

    // Choose rank2, 3, 4 winners
    uint256 winnerCnt;
    for (i = 0; i < 3; ++i) {
      winnerCnt = ((currentTicketId - 1) * winnerRate[i]) / 100;
      if (winnerCnt > 0) {
        winningPrize = (amountCollected * prizeRate[i]) / 100 / winnerCnt;
        remainingPrize -= (winningPrize * winnerCnt);
        while (winnerCnt > 0) {
          winningTicketId = witnet.random(
            currentTicketId,
            nonce,
            latestRandomizingBlock
          );
          nonce++;
          _chooseWinner(winningTicketId, winningPrize, i + 2);
          --winnerCnt;
        }
      }
    }

    // Now 30% are remaining.
    // Send 2.5% to each founder1, 2, 3, total 7.5%
    winningPrize = remainingPrize / 12;
    payable(founder1Address).transfer(winningPrize);
    payable(founder2Address).transfer(winningPrize);
    payable(founder3Address).transfer(winningPrize);

    remainingPrize -= winningPrize * 3;
    winningPrize = remainingPrize / 3;

    // Send 7.5% to project
    payable(projectAddress).transfer(winningPrize);

    remainingPrize -= winningPrize;

    // Send remaining 15% to charity
    payable(charityAddress).transfer(remainingPrize);
  }

  function _chooseWinner(
    uint32 winningTicketId,
    uint256 winningPrize,
    uint8 pot
  ) internal {
    address owner = tickets[winningTicketId];
    require(owner != address(0), 'Invalid Ticket');
    _rewardsByOwner[owner] += winningPrize;
    winnerByPot[pot].push(owner);
    if (winningPrize > topWinning) {
      topWinning = winningPrize;
      topWinner = owner;
    }

    if (_lastWinningPot[owner] > pot || _lastWinningPot[owner] == 0) // ???
      _lastWinningPot[owner] = pot;
  }

  function claimRewards() external notContract nonReentrant {
    address user = msg.sender;
    require(_rewardsByOwner[user] > 0, 'No rewards to claim');
    uint256 rewardBalance = _rewardsByOwner[user];
    payable(user).transfer(rewardBalance);
    _rewardsByOwner[user] = 0;
    _lastWinningPot[user] = 0;
  }

  function _setTopWinner(uint32 winningTicketId) internal {
    address winner = tickets[winningTicketId];
    require(winner != address(0), 'Invalid Ticket');
    _lastTopWinners[_sp] = winner;
    _sp = (_sp + 1) % 5;
  }

  function _calculateTotalPrice(uint32 _amount, bool _useTrpz)
    internal
    view
    returns (uint256)
  {
    uint256 totalPrice = _amount * ticketPrice;
    uint256 nftBalance = IERC721(nftContractAddress).balanceOf(msg.sender);
    uint256 newDiscountRate = 0;
    if (_useTrpz) {
      newDiscountRate += discountRate;
    }
    if (nftBalance > 0) {
      newDiscountRate += nftDiscountRate;
    }
    totalPrice = totalPrice * (1000 - newDiscountRate) / 1000;
    return totalPrice;
  }

  // Get last 5 top winners
  function getLastWinners() external view returns (address[5] memory) {
    address[5] memory lastWinners;
    for (uint8 i = 0; i < 5; i++) {
      uint8 spi = (_sp + 5 - i - 1) % 5;
      lastWinners[i] = _lastTopWinners[spi];
    }
    return lastWinners;
  }

  function getClaimableReward(address user)
    external
    view
    returns (uint256, uint8)
  {
    return (_rewardsByOwner[user], _lastWinningPot[user]);
  }

  function getLotteryInfo()
    external
    view
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    return (amountCollected, currentTicketId, ticketPrice);
  }

  function getUserTickets(address user) external view returns (uint256) {
    return _numOfTickesPerOwner[user][lotteryId];
  }

  function setDiscountToken(address _token) external onlyOwner {
    discountToken = TRPZToken(_token);
  }

  function setDiscountRate(uint16 _newRate) external onlyOwner {
    discountRate = _newRate;
  }

  function setTicketPrice(uint256 _ticketPrice) external onlyOwner {
    ticketPrice = _ticketPrice;
  }

  function setDiscountNFTContractAddress(address _newAddress)
    external
    onlyOwner
  {
    nftContractAddress = _newAddress;
  }

  function setDiscountNFTRate(uint256 _newRate) external onlyOwner {
    nftDiscountRate = _newRate;
  }

  function setDiscountTokenPrice(uint256 _discountTokenPRice)
    external
    onlyOwner
  {
    discountTokenPrice = _discountTokenPRice;
  }

  function setMaxNumberTicketsPerBuy(uint32 _maxNumberTicketsPerBuy)
    external
    onlyOwner
  {
    require(_maxNumberTicketsPerBuy != 0, 'Must be > 0');
    maxNumberTicketsPerBuy = _maxNumberTicketsPerBuy;
  }

  function setOperatorAndTreasuryAndCharityAddresses(
    address _operatorAddress,
    address _projectAddress,
    address _charityAddress,
    address _founder1Address,
    address _founder2Address
  ) external onlyOwner {
    require(_operatorAddress != address(0), 'Enter address');
    require(_projectAddress != address(0), 'Enter address');
    require(_charityAddress != address(0), 'Enter address');
    require(_founder1Address != address(0), 'Enter address');
    require(_founder2Address != address(0), 'Enter address');

    operatorAddress = _operatorAddress;
    projectAddress = _projectAddress;
    charityAddress = _charityAddress;
    founder1Address = _founder1Address;
    founder2Address = _founder2Address;
  }

  function recoverWrongTokens(address _tokenAddress, uint256 _tokenAmount)
    external
    onlyOwner
  {
    IERC20(_tokenAddress).transfer(address(msg.sender), _tokenAmount);
  }

  /**
   * @notice Check if an address is a contract
   */
  function _isContract(address _addr) internal view returns (bool) {
    uint256 size;
    assembly {
      size := extcodesize(_addr)
    }
    return size > 0;
  }

  function getWinnersByPot(uint8 potNumber)
    external
    view
    returns (address[] memory)
  {
    return winnerByPot[potNumber];
  }
}
