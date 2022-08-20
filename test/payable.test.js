const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const {
  deployments,
  ethers: {
    utils: { parseEther, formatEther },
  },
  ethers,
} = require('hardhat')
const { address } = require('hardhat/internal/core/config/config-validation')

const { deployContract, mineUntil, increaseTime } = require('./helper')

chai.use(chaiAsPromised)
const { expect } = chai
const DELTA = 0.001

describe('Payable.sol', () => {
  let deployer
  let feeReceiver1
  let feeReceiver2
  let payer1
  let payer2

  beforeEach(async () => {
    [deployer, payer1, payer2] = await ethers.getUnnamedSigners()
    feeReceiver1 = ethers.Wallet.createRandom()
    feeReceiver2 = ethers.Wallet.createRandom()

    this.erc20 = await deployContract('ERC20Mock', [])
  })

  describe('Deployment', async () => {
    it('Simple deploy', async () => {
      this.payable = await deployContract('Payable', [feeReceiver1.address])

      expect(await this.payable.feeReceiver()).to.be.equal(feeReceiver1.address)
      expect(await this.payable.isErc20()).to.be.false
    })
  })

  describe('Update functions', async () => {
    beforeEach(async () => {
      this.payable = await deployContract('Payable', [feeReceiver1.address])
    })

    it('Payable: setFeeReceiver', async () => {
      expect(await this.payable.feeReceiver()).to.be.equal(feeReceiver1.address)

      await this.payable.setFeeReceiver(feeReceiver2.address)

      expect(await this.payable.feeReceiver()).to.be.equal(feeReceiver2.address)
    })

    it('Revert Payable: setFeeReceiver due to Payable: feeReceiver must be a valid address', async () => {
      expect(await this.payable.feeReceiver()).to.be.equal(feeReceiver1.address)

      await expect(this.payable.setFeeReceiver('0x0000000000000000000000000000000000000000')).to.be.revertedWith('Payable: feeReceiver must be a valid address')

      expect(await this.payable.feeReceiver()).to.be.equal(feeReceiver1.address)
    })

    it('Payable: setIsErc20', async () => {
      expect(await this.payable.isErc20()).to.be.false

      await this.payable.setIsErc20(this.erc20.address)

      expect(await this.payable.isErc20()).to.be.true
      expect(await this.payable.receiveToken()).to.be.equal(this.erc20.address)
    })
  })

  describe('Action functions', async () => {
    beforeEach(async () => {
      this.payable = await deployContract('Payable', [feeReceiver1.address])

      await this.erc20.connect(deployer).transfer(payer1.address, parseEther('100'))
      expect(await this.erc20.balanceOf(payer1.address)).to.be.equal(parseEther('100'))
    })

    it('Simple pay with BNB', async () => {
      const beforePay = parseFloat(formatEther(await ethers.provider.getBalance(payer1.address)))

      await this.payable.connect(payer1).pay(parseEther('5'), { value: parseEther('5') })

      expect(beforePay - parseFloat(formatEther(await ethers.provider.getBalance(payer1.address)))).to.be.closeTo(5, DELTA)
      expect(parseFloat(formatEther(await ethers.provider.getBalance(feeReceiver1.address)))).to.be.closeTo(5, DELTA)
    })

    it('Simple pay with ERC20', async () => {
      await this.payable.setIsErc20(this.erc20.address)

      await this.erc20.connect(payer1).approve(this.payable.address, parseEther('5'))

      await this.payable.connect(payer1).pay(parseEther('5'))

      expect(await this.erc20.balanceOf(payer1.address)).to.be.equal(parseEther('95'))
      expect(await this.erc20.balanceOf(feeReceiver1.address)).to.be.equal(parseEther('5'))
    })

    it('Revert pay due to Payable: insufficient amount', async () => {
      const beforePay = parseFloat(formatEther(await ethers.provider.getBalance(payer1.address)))

      await expect(this.payable.connect(payer1).pay(parseEther('5'), { value: parseEther('4') })).to.be.revertedWith('Payable: insufficient amount')

      expect(beforePay - parseFloat(formatEther(await ethers.provider.getBalance(payer1.address)))).to.be.closeTo(0, DELTA)
      expect(parseFloat(formatEther(await ethers.provider.getBalance(feeReceiver1.address)))).to.be.closeTo(0, DELTA)
    })
  })
})
