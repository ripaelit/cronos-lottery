/**
 *  This script will calculate the constructor arguments for the `verify` function and call it.
 *  You can use this script to verify the contract on etherscan.io.
 */

require('@nomiclabs/hardhat-etherscan')
const hre = require('hardhat')
const discountTokenAddress = '0x1Cc0B25BD5105CD8905f7e9cD174435D4C890E02'
const witnetAddress = '0x3737be6FcFf5B3B0f9DCc9a9ae1Da56561D0d0d3'
 
async function main() {
  [operator, charity, project, founder1, founder2, founder3] = await ethers.getSigners();

  await hre.run('verify:verify', {
    address: '0xeDdA73a0462630B84a4fD85E79F81327892b272c', // Deployed contract address
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
