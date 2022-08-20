const { ethers } = require('hardhat')
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

exports.deployContract = async (contractName, constructorArgs) => {
  let factory
  try {
    factory = await ethers.getContractFactory(contractName)
  } catch (e) {
    console.log(e)
  }
  const contract = await factory.deploy(...(constructorArgs || []))
  await contract.deployed()
  return contract
}

exports.mineUntil = async (targetBlock) => {
  while (await ethers.provider.getBlockNumber() < targetBlock) {
    await ethers.provider.send('evm_mine')
  }
}

exports.increaseTime = async (time) => {
  await ethers.provider.send('evm_increaseTime', [time])
  await ethers.provider.send('evm_mine')
}

exports.getBlockTime = async () => (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp

exports.getMerkleByAddresses = (addresses) => {
  const tree = new MerkleTree(addresses, keccak256, { hashLeaves: true, sortPairs: true })

  return tree
}

exports.getMerkleByHash = (addresses) => {
  const tree = new MerkleTree(addresses, keccak256, { hashLeaves: false, sortPairs: true })

  return tree
}

exports.getProof = (tree, address) => {
  const leaf = keccak256(address)
  const proof = tree.getHexProof(leaf)

  return proof
}
