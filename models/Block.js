module.exports = (idx, transactions, proof, pHash) => {
  let block = {
    index: idx,
    timestamp: new Date(),
    transactions: transactions,
    proof: proof,
    previousHash: pHash
  }
  return block;
}