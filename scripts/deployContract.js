/**
 *  This script will calculate the constructor arguments for BoredApe.sol and deploy it.
 *  After deploying, you can access the contract on etherscan.io with the deployed contract address.
 */

const hre = require('hardhat')

const discountTokenAddress = '0xeDdA73a0462630B84a4fD85E79F81327892b272c'
const witnetAddress = '0x0017A464A86f48B342Cae3b8Fe29cFCDaA7b0643'

async function main() {
  // Deploy the contract
  [operator, charity, project, founder1, founder2, founder3] = await ethers.getSigners();
  const CroDraw = await ethers.getContractFactory('CroDraw', operator);
  const croDraw = await CroDraw.deploy(discountTokenAddress, witnetAddress, charity.address, project.address, founder1.address, founder2.address, founder3.address);
  await croDraw.deployed();
  console.log('CroDraw deployed to:', croDraw.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
