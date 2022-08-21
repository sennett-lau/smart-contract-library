const { envInit } = require('../utils/env')
const readlineSync = require('readline-sync')

const TAG = 'TOKEN_VESTING'
const DEPENDENCIES = []

module.exports = async ({
                          deployments,
                          getUnnamedAccounts,
                        }) => {
  const network = await envInit()

  const { deploy } = deployments
  const [deployer] = await getUnnamedAccounts()

  console.log('===========================================================')
  console.log(`Target network: ${network}`)
  console.log(`Deploying ${TAG} with ${deployer}`)
  console.log('===========================================================')

  // =================== EDIT VARIABLE HERE ==========================

  const inputs = {
    startTime: process.env.VESTING_START_TIME,
    duration: process.env.VESTING_DURATION,
    cliffDuration: process.env.VESTING_CLIFF_DURATION,
    vestingToken: process.env.VESTING_TOKEN_ADDRESS
  }

  // =================================================================

  console.log(`Please confirm the follow inputs for ${TAG} deployment`)
  console.log('')
  for (const key in inputs) {
    console.log(`${key}: ${inputs[key]}`)
  }
  console.log('')

  const text = readlineSync.question(`Please input 'confirm' to proceed: `)
  if (text !== 'confirm') {
    console.log('Invalid input, terminating deployment...')
    console.log('')
    console.log('===========================================================')
    return
  }
  console.log('Confirmed. Starting deployment process...')
  console.log('')
  console.log('===========================================================')
  console.log('')

  // ================== EDIT DEPLOY SCRIPT HERE ======================

  await deploy('TokenVesting', {
    contract: 'TokenVesting',
    from: deployer,
    args: [inputs.vestingToken],
    log: true,
  })

  // =================================================================

  console.log('')
  console.log('===========================================================')
  console.log('Done!')
  console.log('===========================================================')

}

module.exports.tags = [TAG]
module.exports.dependencies = DEPENDENCIES
