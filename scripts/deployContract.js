/**
 *  This script will calculate the constructor arguments for BoredApe.sol and deploy it.
 *  After deploying, you can access the contract on etherscan.io with the deployed contract address.
 */

const hre = require('hardhat')

const discountTokenAddress = '0xEc738E4F4ab9D05F2D86E8008Ec7D388197EaB62'
const witnetAddress = '0x6Eb87EcCe6218Cd0e97299331D2aa5d2e53da5cD'
const charity = '0x1576E561F2636e090cb855277eBA6bc89FB5CAC7'
const project = '0x1576E561F2636e090cb855277eBA6bc89FB5CAC7'
const founder1 = '0x1576E561F2636e090cb855277eBA6bc89FB5CAC7'
const founder2 = '0x1576E561F2636e090cb855277eBA6bc89FB5CAC7'
const founder3 = '0x1576E561F2636e090cb855277eBA6bc89FB5CAC7'

async function main() {
  // Deploy the contract
  const CroDraw = await hre.ethers.getContractFactory('CroDraw')
  const croDraw = await CroDraw.deploy(discountTokenAddress, witnetAddress, charity, project, founder1, founder2, founder3)

  await croDraw.deployed()

  console.log('CroDraw deployed to:', croDraw.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
