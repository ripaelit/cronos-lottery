/**
 *  This script will calculate the constructor arguments for the `verify` function and call it.
 *  You can use this script to verify the contract on etherscan.io.
 */

require('@nomiclabs/hardhat-etherscan')
const hre = require('hardhat')
const discountTokenAddress = '0xeDdA73a0462630B84a4fD85E79F81327892b272c'
const witnetAddress = '0x0017A464A86f48B342Cae3b8Fe29cFCDaA7b0643'

async function main() {
  [operator, charity, project, founder1, founder2, founder3] = await ethers.getSigners();

  await hre.run('verify:verify', {
    address: '0xAe5620f309F74B13A7Dd67459EFB49E9bCb56a54', // Deployed contract address
    constructorArguments: [discountTokenAddress, witnetAddress, charity.address, project.address, founder1.address, founder2.address, founder3.address]
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
