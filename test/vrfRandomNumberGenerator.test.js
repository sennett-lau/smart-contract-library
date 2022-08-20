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
const DELTA = 0.001

describe('VRFRandomNumberGenerator.sol', () => {
  let deployer
  let feeReceiver1
  let feeReceiver2
  let payer1
  let payer2

  beforeEach(async () => {
    [deployer, payer1, payer2] = await ethers.getUnnamedSigners()
    feeReceiver1 = ethers.Wallet.createRandom()
    feeReceiver2 = ethers.Wallet.createRandom()
  })

  describe('Deployment', async () => {
    it('Simple deploy', async () => {
      await deployContract('VRFRandomNumberGeneratorMock', [100])
    })

    it('Revert deploy due to VRFRandomNumberGenerator: queue length exceed limit', async () => {
      const factory = await ethers.getContractFactory('VRFRandomNumberGeneratorMock')
      await expect(factory.deploy([101])).to.be.revertedWith('VRFRandomNumberGenerator: queue length exceed limit')
    })
  })

  describe('fulfillRandomWords functions', async () => {
    beforeEach(async () => {
      this.vrf = await deployContract('VRFRandomNumberGeneratorMock', [6])
    })

    it('Simple fulfillRandomWordsMock', async () => {
      const inputQueue1 = [1, 2, 3, 4, 5, 6]
      const inputQueue2 = [2, 3, 4, 5, 6, 7]
      await this.vrf.connect(deployer).fulfillRandomWordsMock(inputQueue1)
      const queue1 = await this.vrf.getQueue(0)

      for (let i = 0; i < 6; i++) {
        expect(queue1[i]).to.be.equal(inputQueue1[i])
      }

      await this.vrf.connect(deployer).fulfillRandomWordsMock(inputQueue2)
      const queue2 = await this.vrf.getQueue(1)

      for (let i = 0; i < 6; i++) {
        expect(queue2[i]).to.be.equal(inputQueue2[i])
      }
    })
  })

  describe('fallback', async () => {
    beforeEach(async () => {
      this.vrf = await deployContract('VRFRandomNumberGeneratorMock', [6])
    })

    it('Simple getRandomNumber fallback', async () => {
      let tx = await this.vrf.getRandomNumber(10)
      const num1 = (await tx.wait()).events[0].args[0]
      expect(num1).to.be.eq(9)
      tx = await this.vrf.getRandomNumber(100)
      const num2 = (await tx.wait()).events[0].args[0]
      expect(num2).to.be.eq(9)
    })
  })

  describe('getRandomNumber related', async () => {
    beforeEach(async () => {
      this.vrf = await deployContract('VRFRandomNumberGeneratorMock', [6])
      await this.vrf.connect(deployer).fulfillRandomWordsMock([17, 9, 2, 3, 4, 5])
    })

    it('Simple getRandomNumber function', async () => {
      let tx = await this.vrf.getRandomNumber(10)
      const num1 = (await tx.wait()).events[0].args[0]
      tx = await this.vrf.getRandomNumber(10)
      const num2 = (await tx.wait()).events[0].args[0]
      tx = await this.vrf.getRandomNumber(10)
      const num3 = (await tx.wait()).events[0].args[0]
      expect(num1).to.be.equal(7)
      expect(num2).to.be.equal(1)
      expect(num3).to.be.equal(9)
    })

    it('getRandomNumber function reach half of of the 1st queue', async () => {
      for (let i = 0; i < 4; i++) {
        expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(0)
        await this.vrf.getRandomNumber(10)
      }

      expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(1)
    })

    it('getRandomNumber function reach half of the 2nd queue', async () => {
      for (let i = 0; i < 4; i++) {
        expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(0)
        await this.vrf.getRandomNumber(10)
      }

      expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(1)
      await this.vrf.connect(deployer).fulfillRandomWordsMock([6, 728, 7, 5, 98, 23])

      for (let i = 0; i < 8; i++) {
        expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(1)
        await this.vrf.getRandomNumber(10)
      }

      expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(2)
    })

    it('getRandomNumber function with fallback rand logic', async () => {
      let tx
      for (let i = 0; i < 4; i++) {
        expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(0)
        await this.vrf.getRandomNumber(10)
      }

      expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(1)
      await this.vrf.connect(deployer).fulfillRandomWordsMock([6, 728, 7, 5, 98, 23])

      for (let i = 0; i < 8; i++) {
        expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(1)
        await this.vrf.getRandomNumber(10)
      }

      expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(2)

      for (let i = 0; i < 6; i++) {
        tx = await this.vrf.getRandomNumber(10)
      }

      const num = (await tx.wait()).events[0].args[0]

      expect(num).to.be.equal(9)
    })

    it('getRandomNumber function back to normal after fallback rand logic', async () => {
      let tx
      for (let i = 0; i < 4; i++) {
        expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(0)
        await this.vrf.getRandomNumber(10)
      }

      expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(1)
      await this.vrf.connect(deployer).fulfillRandomWordsMock([6, 728, 7, 5, 98, 23])

      for (let i = 0; i < 8; i++) {
        expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(1)
        await this.vrf.getRandomNumber(10)
      }

      expect(await this.vrf._requestRandomWordsCounter()).to.be.equal(2)

      for (let i = 0; i < 6; i++) {
        tx = await this.vrf.getRandomNumber(10)
      }

      let num = (await tx.wait()).events[0].args[0]

      expect(num).to.be.equal(9)

      await this.vrf.connect(deployer).fulfillRandomWordsMock([4, 8, 7, 5, 98, 23])
      tx = await this.vrf.getRandomNumber(10)
      num = (await tx.wait()).events[0].args[0]
      expect(num).to.be.equal(4)
    })
  })
})
