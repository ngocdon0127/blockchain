const Transaction = require('./Transaction')
const Block = require('./Block')
const Coin = require('./Coin')
const Node = require('./Node');
const stringify = require('json-stable-stringify');
const CryptoJS = require('crypto-js')
const SHA256 = CryptoJS.SHA256
const RSAUtils = require('../utils/RSAUtils')

let publicKey2Address = global.myCustomVars.function.publicKey2Address;

// console.log(RSAUtils.exportPublicKey());

const DIFFICULTY = '00'

module.exports = () => {
  let blockChain = {
    chain: [],
    currentTransactions: [],
    nodes: []
  }
  blockChain.newNode = url => {
    blockChain.nodes.push(new Node(url))
  }
  blockChain.newBlock = (proof, previousHash, miner) => {
    // console.log('blockChain.chain.length', blockChain.chain.length);
    let block = Block(blockChain.chain.length, blockChain.currentTransactions, proof, previousHash, miner);
    // Calculate Merkle Root
    block.merkleRoot = SHA256('').toString();
    block.transactions.map((t, i) => {
      block.merkleRoot = SHA256(block.merkleRoot + t.hashTx()).toString()
    })
    blockChain.chain.push(block);
    let rewardTransaction = Transaction([], [{addr: '', val: 0}], true);
    rewardTransaction.index = 0;
    rewardTransaction.seal();
    blockChain.currentTransactions = [rewardTransaction];
    console.log(block);
    return block;
  }
  // blockChain.newTransaction = (sender, recipient, amount) => {
  //   let t = Transaction(sender, recipient, amount);
  //   console.log(t);
  //   blockChain.currentTransactions.push(t);
  // }
  blockChain.newTransaction = (inputCoins, outputCoins) => {
    /**
     * inputCoins = [{blockIdx: 1, transIdx: 2, coinIdx: 4}]
     * inputCoins = [{blockIdx: 1, transIdx: 2, coinIdx: 4, signature: 'sgesdfge', publicKey: 'asdfasdf'}] // TODO
     */
    console.log(inputCoins);
    console.log(outputCoins);
    let iCoins = []
    for (let i = 0; i < inputCoins.length; i++) {
      let coin = inputCoins[i];
      if (coin.blockIdx >= blockChain.chain.length) {
        console.log('invalid blockIdx', coin.blockIdx);
        return false;
      }
      let block = blockChain.chain[coin.blockIdx];
      if (coin.transIdx >= block.transactions.length) {
        console.log('invalid transIdx', coin.transIdx);
        return false;
      }
      let transaction = block.transactions[coin.transIdx];
      if (coin.coinIdx >= transaction.outputCoins.length) {
        console.log('invalid coinIdx', coin.coinIdx);
        return false;
      }
      // TODO check signature
      let addr = publicKey2Address(coin.publicKey);
      let oldCoin = transaction.outputCoins[coin.coinIdx]
      if (addr != oldCoin.addr) {
        console.log('DIFFERENT addr');
        return false
      }
      let key = new RSAUtils();
      key.loadPublicKey(coin.publicKey)
      // ===
      // let t = SHA256(stringify({
      //   blockIdx: coin.blockIdx,
      //   transIdx: coin.transIdx,
      //   coinIdx: coin.coinIdx,
      //   publicKey: coin.publicKey
      // })).toString()
      // ===
      let t = {outputs: outputCoins};
      t.inputs = [];
      inputCoins.map(ic => {
        t.inputs.push({
          blockIdx: coin.blockIdx,
          transIdx: coin.transIdx,
          coinIdx: coin.coinIdx,
          publicKey: coin.publicKey
        })
      })
      t = stringify(t);
      console.log(t);
      t = SHA256(t).toString();
      t = SHA256(t).toString(); // prevent Length Extension Attack
      console.log(t);
      if (!key.verify(t, coin.signature)) {
        console.log('Invalid signature');
        return false;
      }
      
      // check unspent coin
      let fSpentCoin = false;
      // check in chain
      for (var bi = coin.blockIdx; bi < blockChain.chain.length; bi++) {
        if (fSpentCoin) {
          break;
        }
        block = blockChain.chain[bi];
        for (var ti = 0; ti < block.transactions.length; ti++) {
          if (fSpentCoin) {
            break;
          }
          if ((bi <= coin.blockIdx) && (ti <= coin.transIdx)) {
            continue;
          }
          transaction = block.transactions[ti];
          for (var ci = 0; ci < transaction.inputCoins.length; ci++) {
            let c_ = transaction.inputCoins[ci];
            if ((c_.blockIdx == coin.blockIdx) &&
              (c_.transIdx == coin.transIdx) &&
              (c_.coinIdx == coin.coinIdx)
            ) {
              fSpentCoin = true;
              console.log('double spent in blockChain');
              break;
            }
          }
        }
      }
      // check in pending transactions
      for (var ti = 0; ti < blockChain.currentTransactions.length; ti++) {
        let transaction = blockChain.currentTransactions[ti];
        for (var ci = 0; ci < transaction.inputCoins.length; ci++) {
          let c_ = transaction.inputCoins[ci];
          if ((c_.blockIdx == coin.blockIdx) &&
            (c_.transIdx == coin.transIdx) &&
            (c_.coinIdx == coin.coinIdx)
          ) {
            fSpentCoin = true;
            console.log('double spent in pending transactions');
            break;
          }
        }
      }
      if (fSpentCoin) {
        console.log('double spent');
        return false;
      }
      iCoins.push(Coin(oldCoin.addr, oldCoin.val, coin.blockIdx,
        coin.transIdx, coin.coinIdx, coin.publicKey, coin.signature));
    }

    /**
     * outputCoins = [{addr: 'asefas', val: 1.2}]
     */
    
    // let nt = Transaction(iCoins, outputCoins);
    let nt = Transaction(iCoins, outputCoins); // neccessary or not ???
    if (nt) {
      // nt.blockIdx = blockChain.chain.length
      // nt.transIdx = blockChain.currentTransactions.length
      // nt.coinIdx = iCoins.length // What
      nt.index = blockChain.currentTransactions.length;
      nt.seal();
      blockChain.currentTransactions.push(nt)
      console.log('added transaction with fee:', nt.fee());
      return nt;
    } else {
      console.log('invalid transaction');
      return false;
    }
  }

  blockChain.reward = (addr, amount) => {
    for(let i = 1; i < blockChain.currentTransactions.length; i++) {
      amount += blockChain.currentTransactions[i].fee();
    }
    blockChain.currentTransactions[0].outputCoins[0].addr = addr
    blockChain.currentTransactions[0].outputCoins[0].val = amount
  }
  blockChain.hash = block => {
    // console.log('===========');
    // console.log(stringify(block));
    // console.log(SHA256(stringify(block)).toString());
    // console.log('+++++++++++');
    let obj = {
      index: block.idx,
      miner: block.miner,
      timestamp: block.timestamp,
      proof: block.proof,
      previousHash: block.previousHash,
      merkleRoot: ''
    }
    obj.merkleRoot = blockChain.getMerkleRoot(block.transactions);
    return SHA256(stringify(obj)).toString();
  }
  blockChain.getMerkleRoot = txs => {
    let merkleRoot = SHA256('').toString()
    txs.map((t, i) => {
      let t_ = null;
      if (i) {
        t_ = Transaction(t.inputCoins, t.outputCoins)
      } else {
        t_ = Transaction(t.inputCoins, t.outputCoins, true)
      }
      t_.time = t.time; // Nhớ phải thêm 2 cái này
      t_.index = t.index;
      // console.log(t_);
      merkleRoot = merkleRoot + t_.hashTx();
      merkleRoot = SHA256(merkleRoot).toString()
    })
    return merkleRoot;
  }
  blockChain.lastBlock = () => {
    let len = blockChain.chain.length;
    return (len > 0) ? blockChain.chain[len - 1] : null;
  }
  
  blockChain.proofOfWork = (lastBlock, miner, txs) => {
    let d1 = new Date();
    let proof = 0;
    while (!(blockChain.validProof(lastBlock, proof, miner, txs))) {
      proof++;
    }
    let d2 = new Date();
    console.log('found nounce after', d2.getTime() - d1.getTime(), 'ms');
    return {proof: proof, time: d2.getTime() - d1.getTime()};
  }

  blockChain.validProof = (lastBlock, proof, miner, txs) => {
    let lastProof = lastBlock.proof;
    // console.log([lastProof, proof, miner, blockChain.getMerkleRoot(txs)]);
    // console.log(txs);
    // console.log(SHA256([lastProof, proof, miner, blockChain.getMerkleRoot(txs)].join('')).toString());
    return SHA256([lastProof, proof, miner, blockChain.getMerkleRoot(txs)].join('')).toString().indexOf(DIFFICULTY) == 0;
  }
  blockChain.validChain = chain => {
    let d1 = new Date()
    // console.log('VALIDATING CHAIN');
    // console.log(chain);
    if (chain.length < 1) {
      return true;
    }
    let idx = 0;
    let lastBlock = chain[idx++];
    while (idx < chain.length) {
      // console.log(`idx ${idx}`);
      let currentBlock = chain[idx++];
      if (blockChain.hash(lastBlock).localeCompare(currentBlock.previousHash) != 0) {
        console.log(`invalid hash ${blockChain.hash(lastBlock)} ${currentBlock.previousHash}`);
        return false;
      }
      if (!(blockChain.validProof(lastBlock, currentBlock.proof, currentBlock.miner, currentBlock.transactions))) {
        console.log(`invalid proof ${lastBlock.proof} ${currentBlock.proof}`);
        return false;
      }
      lastBlock = currentBlock;
    }
    let tmp = {}
    for (let i = 0; i < chain.length; i++) {
      tmp[i] = {}
      let block = chain[i];
      let coinCreationTX = block.transactions[0];
      tmp[i][0] = {0: 1}
      // console.log(tmp);
      for (let j = 1; j < block.transactions.length; j++) {
        let t = block.transactions[j];
        let transaction = Transaction(t.inputCoins, t.outputCoins)
        if (!transaction.validCoinSignatures()) {
          console.log('invalid coin signature');
          return false;
        }
        if (!transaction.validAmount()) {
          console.log('invalid amount');
          return false;
        }
        for (let k = 0; k < transaction.inputCoins.length; k++) {
          let c = transaction.inputCoins[k];
          if (!tmp[c.blockIdx] || !tmp[c.blockIdx][c.transIdx] || !tmp[c.blockIdx][c.transIdx][c.coinIdx]) {
            console.log('invalid inputCoins');
            console.log(transaction);
            return false
          }
          delete tmp[c.blockIdx][c.transIdx][c.coinIdx]
        }
        tmp[i][j] = {}
        for (let k = 0; k < transaction.outputCoins.length; k++) {
          tmp[i][j][k] = 1
        }
      }
    }
    
    let d2 = new Date();
    // console.log(`time valid ${chain.length}-len chain: ${d2.getTime() - d1.getTime()}`);
    return true;
  }

  blockChain.updateChain = chain => {
    // console.log('START UPDATING CHAIN');
    // console.log(chain);
    // console.log('CHAIN LEN', chain.length);
    blockChain.chain = JSON.parse(JSON.stringify(chain));
    for (var i = 0; i < blockChain.chain.length; i++) {
      // console.log('START RESTORING BLOCK', i);
      let block = blockChain.chain[i];
      // restore Block functions
      // restore Transaction functions
      block.transactions.map((t, idx) => {
        if (idx) {
          block.transactions[idx] = Transaction(t.inputCoins, t.outputCoins)
          block.transactions[idx].time = t.time; // Nhớ phải thêm 2 cái này
          block.transactions[idx].index = t.index;
          block.transactions[idx].seal();
        } else {
          block.transactions[idx] = Transaction(t.inputCoins, t.outputCoins, true)
          block.transactions[idx].time = t.time;
          block.transactions[idx].index = t.index;
          block.transactions[idx].seal();
        }
        // console.log('++++++++++++++++++++++++++++++++++++++');
        // console.log('RESTORE TRANSACTION', idx, 'IN BLOCK', i);
        // console.log(t);
        // console.log('++++++++++++++++++++++++++++++++++++++');
        // console.log('RESTORE TRANSACTION', idx, 'IN BLOCK', i);
      })
    }
    // console.log('DONE UPDATING CHAIN');
    // console.log(blockChain.chain);
  }
  console.log('add initial block');
  blockChain.newBlock(-1, 1, global.myCustomVars.const.address)
  // console.log(blockChain.chain.length);
  // console.log(blockChain);
  return blockChain;
}