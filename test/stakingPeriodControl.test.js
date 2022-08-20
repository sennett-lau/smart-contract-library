const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const {
  deployments,
  ethers: {
    utils: { parseEther, formatEther },
  },
  ethers,
} = require('hardhat')

const { deployContract, mineUntil, increaseTime } = require('./helper')

chai.use(chaiAsPromised)
const { expect } = chai
const DELTA = 0.001

describe('StakingPeriodControl.sol', () => {
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

  describe('Initialize', async () => {
    it('Successfully init', async () => {
      const start = Date.now() + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      expect(await spc.isTimestamp()).to.be.true
      expect(await spc.start()).to.be.equal(start)
      expect(await spc.end()).to.be.equal(end)
      expect(await spc.bonusEnd()).to.be.equal(bonusEnd)
    })

    it('Revert init due to StakingPeriodControl: staking period has been initialized', async () => {
      const start = Date.now() + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      await expect(spc.reinitialization(true, start, end, bonusEnd)).to.be.revertedWith('StakingPeriodControl: staking period has been initialized')
    })
  })

  describe('With timestamp', async () => {
    it('beforeStakeStart', async () => {
      let current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      const start = current + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current < start).to.be.true
      await spc.runBeforeStakeStart()

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(start - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > start).to.be.true
      await expect(spc.runBeforeStakeStart()).to.be.revertedWith('StakingPeriodControl: staking period has started')
    })

    it('afterStakeStart', async () => {
      let current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      const start = current + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current < start).to.be.true
      await expect(spc.runAfterStakeStart()).to.be.revertedWith('StakingPeriodControl: staking period has not started')

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(start - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > start).to.be.true
      await spc.runAfterStakeStart()
    })

    it('beforeStakeEnd', async () => {
      let current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      const start = current + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current < start).to.be.true
      await spc.runBeforeStakeEnd()

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(start - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > start && current < end).to.be.true
      await spc.runBeforeStakeEnd()

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(end - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > end).to.be.true
      await expect(spc.runBeforeStakeEnd()).to.be.revertedWith('StakingPeriodControl: staking period has ended')
    })

    it('afterStakeEnd', async () => {
      let current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      const start = current + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current < start).to.be.true
      await expect(spc.runAfterStakeEnd()).to.be.revertedWith('StakingPeriodControl: staking period has not ended')

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(start - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > start && current < end).to.be.true
      await expect(spc.runAfterStakeEnd()).to.be.revertedWith('StakingPeriodControl: staking period has not ended')

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(end - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > end).to.be.true
      await spc.runAfterStakeEnd()
    })

    it('beforeBonusEnd', async () => {
      let current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      const start = current + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current < start).to.be.true
      await spc.runBeforeBonusEnd()

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(start - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > start && current < end).to.be.true
      await spc.runBeforeBonusEnd()

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(end - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > end && current < bonusEnd).to.be.true
      await spc.runBeforeBonusEnd()

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(bonusEnd - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > bonusEnd).to.be.true
      await expect(spc.runBeforeBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has ended')
    })

    it('beforeStakeStart', async () => {
      let current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      const start = current + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current < start).to.be.true
      await expect(spc.runAfterBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has not ended')

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(start - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > start && current < end).to.be.true
      await expect(spc.runAfterBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has not ended')

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(end - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > end && current < bonusEnd).to.be.true
      await expect(spc.runAfterBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has not ended')

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(bonusEnd - current + 10 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > bonusEnd).to.be.true
      await spc.runAfterBonusEnd()
    })
  })

  describe('With block number', async () => {
    it('beforeStakeStart', async () => {
      let current = await ethers.provider.getBlockNumber()
      const start = current + 1000
      const end = start + 1000
      const bonusEnd = end + 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        false,
        start,
        end,
        bonusEnd,
      ])

      current = await ethers.provider.getBlockNumber()
      expect(current < start).to.be.true
      await spc.runBeforeStakeStart()

      await mineUntil(start + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > start).to.be.true
      await expect(spc.runBeforeStakeStart()).to.be.revertedWith('StakingPeriodControl: staking period has started')
    })

    it('afterStakeStart', async () => {
      let current = await ethers.provider.getBlockNumber()
      const start = current + 1000
      const end = start + 1000
      const bonusEnd = end + 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        false,
        start,
        end,
        bonusEnd,
      ])

      current = await ethers.provider.getBlockNumber()
      expect(current < start).to.be.true
      await expect(spc.runAfterStakeStart()).to.be.revertedWith('StakingPeriodControl: staking period has not started')

      await mineUntil(start + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > start).to.be.true
      await spc.runAfterStakeStart()
    })

    it('beforeStakeEnd', async () => {
      let current = await ethers.provider.getBlockNumber()
      const start = current + 1000
      const end = start + 1000
      const bonusEnd = end + 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        false,
        start,
        end,
        bonusEnd,
      ])

      current = await ethers.provider.getBlockNumber()
      expect(current < start).to.be.true
      await spc.runBeforeStakeEnd()

      await mineUntil(start + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > start && current < end).to.be.true
      await spc.runBeforeStakeEnd()

      await mineUntil(end + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > end).to.be.true
      await expect(spc.runBeforeStakeEnd()).to.be.revertedWith('StakingPeriodControl: staking period has ended')
    })

    it('afterStakeEnd', async () => {
      let current = await ethers.provider.getBlockNumber()
      const start = current + 1000
      const end = start + 1000
      const bonusEnd = end + 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        false,
        start,
        end,
        bonusEnd,
      ])

      current = await ethers.provider.getBlockNumber()
      expect(current < start).to.be.true
      await expect(spc.runAfterStakeEnd()).to.be.revertedWith('StakingPeriodControl: staking period has not ended')

      await mineUntil(start + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > start && current < end).to.be.true
      await expect(spc.runAfterStakeEnd()).to.be.revertedWith('StakingPeriodControl: staking period has not ended')

      await mineUntil(end + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > end).to.be.true
      await spc.runAfterStakeEnd()
    })

    it('beforeBonusEnd', async () => {
      let current = await ethers.provider.getBlockNumber()
      const start = current + 1000
      const end = start + 1000
      const bonusEnd = end + 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        false,
        start,
        end,
        bonusEnd,
      ])

      current = await ethers.provider.getBlockNumber()
      expect(current < start).to.be.true
      await spc.runBeforeBonusEnd()

      await mineUntil(start + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > start && current < end).to.be.true
      await spc.runBeforeBonusEnd()

      await mineUntil(end + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > end && current < bonusEnd).to.be.true
      await spc.runBeforeBonusEnd()

      await mineUntil(bonusEnd + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > bonusEnd).to.be.true
      await expect(spc.runBeforeBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has ended')
    })

    it('beforeStakeStart', async () => {
      let current = await ethers.provider.getBlockNumber()
      const start = current + 1000
      const end = start + 1000
      const bonusEnd = end + 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        false,
        start,
        end,
        bonusEnd,
      ])

      current = await ethers.provider.getBlockNumber()
      expect(current < start).to.be.true
      await expect(spc.runAfterBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has not ended')

      await mineUntil(start + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > start && current < end).to.be.true
      await expect(spc.runAfterBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has not ended')

      await mineUntil(end + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > end && current < bonusEnd).to.be.true
      await expect(spc.runAfterBonusEnd()).to.be.revertedWith('StakingPeriodControl: lock down period has not ended')

      await mineUntil(bonusEnd + 1)

      current = await ethers.provider.getBlockNumber()
      expect(current > bonusEnd).to.be.true
      await spc.runAfterBonusEnd()
    })
  })

  describe('Update functions', async () => {
    it('updateStakingPeriod with timestamp', async () => {
      const start = Date.now() + 30 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      const newStart = start + 20 * 60 * 1000
      const newEnd = newStart + 20 * 60 * 1000
      const newBonusEnd = newEnd + 20 * 60 * 1000

      await spc.updateStakingPeriod(true, newStart, newEnd, newBonusEnd)

      expect(await spc.isTimestamp()).to.be.true
      expect(await spc.start()).to.be.equal(newStart)
      expect(await spc.end()).to.be.equal(newEnd)
      expect(await spc.bonusEnd()).to.be.equal(newBonusEnd)
    })

    it('updateStakingPeriod with block number', async () => {
      const current = await ethers.provider.getBlockNumber()
      const start = current + 1000
      const end = start + 1000
      const bonusEnd = end + 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        false,
        start,
        end,
        bonusEnd,
      ])

      const newStart = start + 20
      const newEnd = newStart + 20
      const newBonusEnd = newEnd + 20

      await spc.updateStakingPeriod(false, newStart, newEnd, newBonusEnd)

      expect(await spc.isTimestamp()).to.be.false
      expect(await spc.start()).to.be.equal(newStart)
      expect(await spc.end()).to.be.equal(newEnd)
      expect(await spc.bonusEnd()).to.be.equal(newBonusEnd)
    })

    it('Revert updateStakingPeriod due to StakingPeriodControl: staking period has started', async () => {
      const start = Date.now()
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      const newStart = start + 20 * 60 * 1000
      const newEnd = newStart + 20 * 60 * 1000
      const newBonusEnd = newEnd + 20 * 60 * 1000

      let current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      await increaseTime(start - current + 1 * 60 * 1000)

      current = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      expect(current > start && current < end).to.be.true

      await expect(spc.updateStakingPeriod(true, newStart, newEnd, newBonusEnd)).to.be.revertedWith('StakingPeriodControl: staking period has started')

      expect(await spc.isTimestamp()).to.be.true
      expect(await spc.start()).to.be.equal(start)
      expect(await spc.end()).to.be.equal(end)
      expect(await spc.bonusEnd()).to.be.equal(bonusEnd)
    })

    it('Revert updateStakingPeriod due to StakingPeriodControl: new start must be larger than or equal to current block', async () => {
      const start = Date.now() + 10 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      const newStart = start - 20 * 60 * 1000
      const newEnd = newStart + 20 * 60 * 1000
      const newBonusEnd = newEnd + 20 * 60 * 1000

      await expect(spc.updateStakingPeriod(true, newStart, newEnd, newBonusEnd)).to.be.revertedWith('StakingPeriodControl: new start must be larger than or equal to current block')

      expect(await spc.isTimestamp()).to.be.true
      expect(await spc.start()).to.be.equal(start)
      expect(await spc.end()).to.be.equal(end)
      expect(await spc.bonusEnd()).to.be.equal(bonusEnd)
    })

    it('Revert updateStakingPeriod due to StakingPeriodControl: new end must be larger than new start', async () => {
      const start = Date.now() + 10 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      const newStart = start + 20 * 60 * 1000
      const newEnd = newStart - 20 * 60 * 1000
      const newBonusEnd = newEnd + 20 * 60 * 1000

      await expect(spc.updateStakingPeriod(true, newStart, newEnd, newBonusEnd)).to.be.revertedWith('StakingPeriodControl: new end must be larger than new start')

      expect(await spc.isTimestamp()).to.be.true
      expect(await spc.start()).to.be.equal(start)
      expect(await spc.end()).to.be.equal(end)
      expect(await spc.bonusEnd()).to.be.equal(bonusEnd)
    })

    it('Revert updateStakingPeriod due to StakingPeriodControl: new bonusEnd must be larger than new end', async () => {
      const start = Date.now() + 10 * 60 * 1000
      const end = start + 30 * 60 * 1000
      const bonusEnd = end + 5 * 60 * 60 * 1000

      const spc = await deployContract('StakingPeriodControlMock', [
        true,
        start,
        end,
        bonusEnd,
      ])

      const newStart = start + 20 * 60 * 1000
      const newEnd = newStart + 20 * 60 * 1000
      const newBonusEnd = newEnd - 20 * 60 * 1000

      await expect(spc.updateStakingPeriod(true, newStart, newEnd, newBonusEnd)).to.be.revertedWith('StakingPeriodControl: new bonusEnd must be larger than new end')

      expect(await spc.isTimestamp()).to.be.true
      expect(await spc.start()).to.be.equal(start)
      expect(await spc.end()).to.be.equal(end)
      expect(await spc.bonusEnd()).to.be.equal(bonusEnd)
    })
  })
})
