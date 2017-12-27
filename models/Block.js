module.exports = (idx, transactions, proof, pHash, miner, timestamp) => {
  let block = {
    index: idx,
    miner: miner,
    timestamp: timestamp ? timestamp : (new Date()),
    transactions: transactions,
    proof: proof,
    previousHash: pHash,
    merkleRoot: ''
  }
  return block;
}