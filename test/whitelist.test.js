const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const {
  deployments,
  ethers: {
    utils: { parseEther, formatEther },
  },
  ethers,
} = require('hardhat')

chai.use(chaiAsPromised)
const { expect } = chai
const DELTA = 0.001

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const { deployContract, mineUntil, increaseTime } = require('./helper')

describe('Whitelist.sol', () => {
  let deployer
  let feeReceiver1
  let feeReceiver2
  let payer1
  let payer2
  const wallets = []
  const addresses = []

  beforeEach(async () => {
    [deployer, payer1, payer2] = await ethers.getUnnamedSigners()
    feeReceiver1 = ethers.Wallet.createRandom()
    feeReceiver2 = ethers.Wallet.createRandom()

    for (let i = 0; i < 32; i++) {
      wallets.push(ethers.Wallet.createRandom())
      addresses.push(wallets[i].address)
    }
  })

  describe('Update functions', async () => {
    it('updateTree function', async () => {
      const whitelistMock = await deployContract('WhitelistMock', [])

      const tree = new MerkleTree(addresses, keccak256, { hashLeaves: true, sortPairs: true })
      const root = tree.getHexRoot()

      await whitelistMock.connect(deployer).updateTree(root)

      expect(await whitelistMock.tree()).to.be.equal(root)
    })
  })

  describe('mockOnlyWhitelisted', async () => {
    it('Success', async () => {
      const whitelistMock = await deployContract('WhitelistMock', [])
      const tree = new MerkleTree([payer1.address, ...addresses], keccak256, { hashLeaves: true, sortPairs: true })
      const root = tree.getHexRoot()

      await whitelistMock.connect(deployer).updateTree(root)

      const leaf = keccak256(payer1.address)
      const proof = tree.getHexProof(leaf)

      await whitelistMock.connect(payer1).mockOnlyWhitelisted(proof)
    })

    it('Revert due to Whitelist: whitelist is required', async () => {
      const whitelistMock = await deployContract('WhitelistMock', [])
      const tree = new MerkleTree(addresses, keccak256, { hashLeaves: true, sortPairs: true })
      const root = tree.getHexRoot()

      await whitelistMock.connect(deployer).updateTree(root)

      const leaf = keccak256(addresses[1])
      const proof = tree.getHexProof(leaf)

      await expect(whitelistMock.connect(payer1).mockOnlyWhitelisted(proof)).to.be.revertedWith('Whitelist: whitelist is required')
    })

    it('Success after updateTree', async () => {
      const whitelistMock = await deployContract('WhitelistMock', [])
      const tree = new MerkleTree(addresses, keccak256, { hashLeaves: true, sortPairs: true })
      const root = tree.getHexRoot()

      await whitelistMock.connect(deployer).updateTree(root)

      const leaf = keccak256(payer1.address)
      const proof = tree.getHexProof(leaf)

      await expect(whitelistMock.connect(payer1).mockOnlyWhitelisted(proof)).to.be.revertedWith('Whitelist: whitelist is required')

      const newTree = new MerkleTree([payer1.address, payer2.address], keccak256, { hashLeaves: true, sortPairs: true })
      const newRoot = newTree.getHexRoot()

      await whitelistMock.connect(deployer).updateTree(newRoot)

      const newProof = newTree.getHexProof(leaf)

      await whitelistMock.connect(payer1).mockOnlyWhitelisted(newProof)
    })
  })
})
