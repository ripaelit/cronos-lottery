const { ethers } = require("hardhat");

describe("CroDraw", function () {
  let TRPZFactory, LotteryFactory, WitnetRequestBoardFactory, WitnetRandomnessFactory;
  let trpz, lottery, witnetRequestBoard, witnetRandomness;
  let charity, project, founder1, founder2, founder3, operator;
  let accounts = [];
  // const discountTokenAddress = '0xeDdA73a0462630B84a4fD85E79F81327892b272c'
  // const witnetAddress = '0x0017A464A86f48B342Cae3b8Fe29cFCDaA7b0643'
  const lotteryAddress = '0x887ee5f86fA6f09315Dd453Cd021F686d00D925a'
  
  before(async () => {
    // [charity, project, founder1, founder2, founder3, operator, ...accounts] = await ethers.getSigners()
    while (accounts.length <= 106) {
      accounts = [...accounts, ...(await ethers.getSigners())];
    }
    // console.log('accounts:', { charity, project, founder1, founder2, founder3, operator })
    [operator, charity, project, founder1, founder2, founder3] = accounts;
    accounts = accounts.slice(6);
    console.log('accounts:', accounts.length);

    // TRPZFactory = await ethers.getContractFactory("TrpzToken");
    // trpz = TRPZFactory.attach(discountTokenAddress);
    // WitnetRandomnessFactory = await ethers.getContractFactory("WitnetRandomness");
    // WitnetRandomness = WitnetRandomnessFactory.attach(witnetAddress);
    LotteryFactory = await ethers.getContractFactory("CroDraw");
    lottery = LotteryFactory.attach(lotteryAddress);
  })

  it("Distribute rewards to users", async function () {
    await (await lottery.connect(operator).setOperatorAndTreasuryAndCharityAddresses(operator.address, project.address, charity.address, founder1.address, founder2.address)).wait();
    await (await lottery.connect(operator).setTicketPrice(1000)).wait();
    await (await lottery.connect(operator).startLottery(300)).wait();
    await (await lottery.connect(operator).buyTickets(1, { from: operator.address, value: 1000 })).wait();
    await (await lottery.connect(operator).buyTickets(1, { from: operator.address, value: 1000 })).wait();
    await (await lottery.connect(operator).closeLottery({ from: operator.address, value: 1000000000000000000 })).wait();
    await (await lottery.connect(operator).declareWinner()).wait();
    await (await lottery.connect(operator).claimRewards()).wait();

    // let i;
    // for (i = 0; i < 100; ++i) {
    //   await (await lottery.connect(accounts[i]).buyTickets(1, { from: accounts[i].address, value: 1000 })).wait();
    // }
    // let accountBalances = [];
    // for (i = 0; i < 100; ++i) {
    //   accountBalances = [...accountBalances, await accounts[i].getBalance()];
    // }
    // const millionSeconds = 1000000
    // await ethers.provider.send('evm_increaseTime', [millionSeconds]);
    // await ethers.provider.send('evm_mine');

    // await (await lottery.connect(operator).closeLottery({ from: operator.address, value: '10' })).wait();

    // await (await lottery.connect(operator).declareWinner()).wait()
  });
});
