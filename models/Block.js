module.exports = (idx, transactions, proof, pHash, miner) => {
  let block = {
    index: idx,
    miner: miner,
    timestamp: new Date(),
    transactions: transactions,
    proof: proof,
    previousHash: pHash,
    merkelRoot: ''
  }
  return block;
}