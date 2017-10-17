const Transaction = require('./Transaction')
const Block = require('./Block')
const Node = require('./Node');
const stringify = require('json-stable-stringify');
const CryptoJS = require('crypto-js')
const SHA256 = CryptoJS.SHA256

module.exports = () => {
  let blockChain = {
    chain: [],
    currentTransactions: [],
    nodes: []
  }
  blockChain.newNode = url => {
    blockChain.nodes.push(new Node(url))
  }
  blockChain.newBlock = (proof, previousHash) => {
    let block = Block(blockChain.chain.length, blockChain.currentTransactions, proof, previousHash);
    blockChain.chain.push(block);
    blockChain.currentTransactions = [];
    console.log(block);
    return block;
  }
  blockChain.newTransaction = (sender, recipient, amount) => {
    let t = Transaction(sender, recipient, amount);
    console.log(t);
    blockChain.currentTransactions.push(t);
  }
  blockChain.hash = block => {
    console.log('===========');
    console.log(stringify(block));
    console.log(SHA256(stringify(block)).toString());
    console.log('+++++++++++');
    return SHA256(stringify(block)).toString();
  }
  blockChain.lastBlock = () => {
    let len = blockChain.chain.length;
    return (len > 0) ? blockChain.chain[len - 1] : null;
  }
  blockChain.proofOfWork = lastProof => {
    let proof = 0;
    while (!(blockChain.validProof(lastProof, proof))) {
      proof++;
    }
    return proof;
  }
  blockChain.validProof = (lastProof, proof) => {
    return SHA256(lastProof + '' + proof).toString().indexOf('0000') == 0;
  }
  blockChain.validChain = chain => {
    if (chain.length < 1) {
      return true;
    }
    let idx = 0;
    let lastBlock = chain[idx++];
    while (idx < chain.length) {
      let currentBlock = chain[idx++];
      if (blockChain.hash(lastBlock).localeCompare(currentBlock.previousHash) != 0) {
        console.log(`invalid hash ${blockChain.hash(lastBlock)} ${currentBlock.previousHash}`);
        return false;
      }
      if (!(blockChain.validProof(lastBlock.proof, currentBlock.proof))) {
        console.log(`invalid proof ${lastBlock.proof} ${currentBlock.proof}`);
        return false;
      }
      lastBlock = currentBlock;
    }
    return true;
  }
  console.log('add initial block');
  blockChain.newBlock(-1, 1)
  // console.log(blockChain.chain.length);
  // console.log(blockChain);
  return blockChain;
}