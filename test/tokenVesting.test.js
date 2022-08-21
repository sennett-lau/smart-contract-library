const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const {
  deployments,
  ethers: {
    utils: {parseEther, formatEther},
  },
  ethers,
} = require('hardhat')

const {
  deployContract,
  mineUntil,
  increaseTime,
  getBlockTime,
  getMerkleByAddresses,
  getMerkleByHash,
  getProof
} = require('./helper')

chai.use(chaiAsPromised)
const expect = chai.expect
const DELTA = 1

describe('TokenVesting.sol', () => {
  let deployer
  let feeReceiver1
  let feeReceiver2
  let payer1
  let payer2

  beforeEach(async () => {
    [deployer, payer1, payer2] = await ethers.getUnnamedSigners()
    feeReceiver1 = ethers.Wallet.createRandom()
    feeReceiver2 = ethers.Wallet.createRandom()

    this.erc20 = await deployContract( 'ERC20Mock', [])
  })

  describe('Deployment', async () => {
    it('Simple deploy', async () => {
      const tv = await deployContract('TokenVesting', [this.erc20.address])

      expect(await tv.vestingToken()).to.be.equal(this.erc20.address)
    })
  })

  describe('Set functions', async () => {
    beforeEach(async () => {
      this.tv = await deployContract('TokenVesting', [this.erc20.address])
    })

    it('addVesting function', async () => {
      const claimable = parseEther('10000')
      const startTime = (await getBlockTime()) + 1000
      const duration = 60 * 60 * 24 * 7
      const cliffDuration = 60 * 60 * 24 * 3

      await this.tv.connect(deployer).addVesting(payer1.address, claimable, startTime, duration, cliffDuration)
      expect(await this.tv.claimable(payer1.address)).to.be.equal(claimable)
      expect(await this.tv.startTime(payer1.address)).to.be.equal(startTime)
      expect(await this.tv.duration(payer1.address)).to.be.equal(duration)
      expect(await this.tv.cliffDuration(payer1.address)).to.be.equal(cliffDuration)
    })

    it('Revert addVesting due to TokenVesting: invalid start time', async () => {
      const claimable = parseEther('10000')
      const startTime = (await getBlockTime()) - 1000
      const duration = 60 * 60 * 24 * 7
      const cliffDuration = 60 * 60 * 24 * 3
      await expect(this.tv.connect(deployer).addVesting(payer1.address, claimable, startTime, duration, cliffDuration)).to.be.revertedWith('TokenVesting: invalid start time')
    })

    it('Revert addVesting due to TokenVesting: invalid duration', async () => {
      const claimable = parseEther('10000')
      const startTime = (await getBlockTime()) + 1000
      const duration = 0
      const cliffDuration = 60 * 60 * 24 * 3
      await expect(this.tv.connect(deployer).addVesting(payer1.address, claimable, startTime, duration, cliffDuration)).to.be.revertedWith('TokenVesting: invalid duration')
    })

    it('Revert addVesting due to TokenVesting: invalid cliff duration', async () => {
      const claimable = parseEther('10000')
      const startTime = (await getBlockTime()) + 1000
      const duration = 60 * 60 * 24 * 7
      let cliffDuration = 0
      await expect(this.tv.connect(deployer).addVesting(payer1.address, claimable, startTime, duration, cliffDuration)).to.be.revertedWith('TokenVesting: invalid cliff duration')

      cliffDuration = 60 * 60 * 24 * 7
      await expect(this.tv.connect(deployer).addVesting(payer1.address, claimable, startTime, duration, cliffDuration)).to.be.revertedWith('TokenVesting: invalid cliff duration')
    })
  })

  describe('Action functions', async () => {
    beforeEach(async () => {
      this.startTime = (await getBlockTime()) + 1000
      this.duration = 60 * 60 * 24 * 7
      this.cliffDuration = 60 * 60 * 24 * 3
      this.tv = await deployContract('TokenVesting', [this.erc20.address])

      await this.erc20.transfer(this.tv.address, parseEther('1000000'))
      expect(await this.erc20.balanceOf(this.tv.address)).to.be.equal(parseEther('1000000'))

      const claimable = parseEther('7000')
      await this.tv.connect(deployer).addVesting(payer1.address, claimable, this.startTime, this.duration, this.cliffDuration)
    })

    it('claim function with near cliff duration', async () => {
      await increaseTime(this.startTime - (await getBlockTime()) + this.cliffDuration)
      await this.tv.connect(payer1).claim()

      expect(parseFloat(formatEther(await this.erc20.balanceOf(payer1.address)))).to.be.closeTo(parseFloat(3000), DELTA)
      expect(parseFloat(formatEther(await this.erc20.balanceOf(this.tv.address)))).to.be.closeTo(parseFloat(1000000 - 3000), DELTA)
    })

    it('claim function with exceed duration', async () => {
      await increaseTime(this.startTime - (await getBlockTime()) + this.duration + 1000)
      await this.tv.connect(payer1).claim()

      expect(parseFloat(formatEther(await this.erc20.balanceOf(payer1.address)))).to.be.closeTo(parseFloat(7000), DELTA)
      expect(parseFloat(formatEther(await this.erc20.balanceOf(this.tv.address)))).to.be.closeTo(parseFloat(1000000 - 7000), DELTA)
    })

    it('claim function after claimed part of the vesting', async () => {
      await increaseTime(this.startTime - (await getBlockTime()) + this.cliffDuration)
      await this.tv.connect(payer1).claim()

      expect(parseFloat(formatEther(await this.erc20.balanceOf(payer1.address)))).to.be.closeTo(parseFloat(3000), DELTA)
      expect(parseFloat(formatEther(await this.erc20.balanceOf(this.tv.address)))).to.be.closeTo(parseFloat(1000000 - 3000), DELTA)

      await increaseTime(60 * 60 * 24)
      await this.tv.connect(payer1).claim()

      expect(parseFloat(formatEther(await this.erc20.balanceOf(payer1.address)))).to.be.closeTo(parseFloat(4000), DELTA)
      expect(parseFloat(formatEther(await this.erc20.balanceOf(this.tv.address)))).to.be.closeTo(parseFloat(1000000 - 4000), DELTA)

      await increaseTime(60 * 60 * 24)
      await this.tv.connect(payer1).claim()

      expect(parseFloat(formatEther(await this.erc20.balanceOf(payer1.address)))).to.be.closeTo(parseFloat(5000), DELTA)
      expect(parseFloat(formatEther(await this.erc20.balanceOf(this.tv.address)))).to.be.closeTo(parseFloat(1000000 - 5000), DELTA)


      await increaseTime(60 * 60 * 24 * 7)
      await this.tv.connect(payer1).claim()

      expect(parseFloat(formatEther(await this.erc20.balanceOf(payer1.address)))).to.be.closeTo(parseFloat(7000), DELTA)
      expect(parseFloat(formatEther(await this.erc20.balanceOf(this.tv.address)))).to.be.closeTo(parseFloat(1000000 - 7000), DELTA)
    })

    it('Revert claim due to TokenVesting: cliff period has not passed', async () => {
      await expect(this.tv.connect(payer1).claim()).to.be.revertedWith('TokenVesting: cliff period has not passed')
    })

    it('Revert claim due to TokenVesting: no claimable tokens', async () => {
      await increaseTime(this.startTime - (await getBlockTime()) + this.cliffDuration)

      await expect(this.tv.connect(payer2).claim()).to.be.revertedWith('TokenVesting: no claimable tokens')

      await increaseTime(60 * 60 * 24 * 7)
      await this.tv.connect(payer1).claim()

      expect(parseFloat(formatEther(await this.erc20.balanceOf(payer1.address)))).to.be.closeTo(parseFloat(7000), DELTA)
      expect(parseFloat(formatEther(await this.erc20.balanceOf(this.tv.address)))).to.be.closeTo(parseFloat(1000000 - 7000), DELTA)

      await expect(this.tv.connect(payer1).claim()).to.be.revertedWith('TokenVesting: no claimable tokens')
    })
  })
})
