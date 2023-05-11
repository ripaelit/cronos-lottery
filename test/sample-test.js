const { ethers } = require("hardhat");

describe("CroDraw", function () {
  let TRPZFactory, LotteryFactory, WitnetRequestBoardFactory, WitnetRandomnessFactory;
  let trpz, lottery, witnetRequestBoard, witnetRandomness;
  let charity, project, founder1, founder2, founder3, operator;
  let accounts = [];

  before(async () => {
    // [charity, project, founder1, founder2, founder3, operator, ...accounts] = await ethers.getSigners()
    while (accounts.length <= 106) {
      accounts = [...accounts, ...(await ethers.getSigners())];
    }
    // console.log('accounts:', { charity, project, founder1, founder2, founder3, operator })
    [operator, charity, project, founder1, founder2, founder3] = accounts;
    accounts = accounts.slice(6);
    console.log('accounts:', accounts.length);

    TRPZFactory = await ethers.getContractFactory("TrpzToken");
    LotteryFactory = await ethers.getContractFactory("CroDraw");
    WitnetRequestBoardFactory = await ethers.getContractFactory("WitnetProxy");
    WitnetRandomnessFactory = await ethers.getContractFactory("WitnetRandomness");
  })

  it("Distribute rewards to users", async function () {
    witnetRequestBoard = await WitnetRequestBoardFactory.deploy();
    await witnetRequestBoard.deployed();

    witnetRandomness = await WitnetRandomnessFactory.deploy(witnetRequestBoard.address);
    await witnetRandomness.deployed();

    trpz = await TRPZFactory.deploy('1000000000000000000000', operator.address);
    await trpz.deployed();

    lottery = await LotteryFactory.deploy(trpz.address, witnetRandomness.address, charity.address, project.address, founder1.address, founder2.address, founder3.address);
    await lottery.deployed();

    await (await lottery.setOperatorAndTreasuryAndCharityAddresses(operator.address, project.address, charity.address, founder1.address, founder2.address)).wait();

    await (await lottery.connect(operator).startLottery(1000)).wait();
    await (await lottery.connect(operator).setTicketPrice(1000)).wait();

    let i;
    for (i = 0; i < 100; ++i) {
      await (await lottery.connect(accounts[i]).buyTickets(1, { from: accounts[i].address, value: 1000 })).wait();
    }
    let accountBalances = [];
    for (i = 0; i < 100; ++i) {
      accountBalances = [...accountBalances, await accounts[i].getBalance()];
    }
    const millionSeconds = 1000000
    await ethers.provider.send('evm_increaseTime', [millionSeconds]);
    await ethers.provider.send('evm_mine');

    await (await lottery.connect(operator).closeLottery({ from: operator.address, value: '10' })).wait();

    // await (await lottery.connect(operator).declareWinner()).wait()
  });
});
