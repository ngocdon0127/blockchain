var express = require('express');
var router = express.Router();
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const request = require('request')
const BlockChain = require('../models/BlockChain');
const Transaction = require('../models/Transaction');
const CryptoJS = require('crypto-js');
const SHA256 = CryptoJS.SHA256;

// const address = SHA256((new Date()).getTime() + '' + Math.random() * 1000000).toString();
// const address = SHA256(process.env.PORT).toString();
const address = global.myCustomVars.const.address;
console.log('this node:', address);

const blockChain = BlockChain();

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.redirect('/wallet')
  return res.render('index', {
    title: 'BlockChain',
    user: {},
    sidebar: {
      active: '/'
    }
  })
});

router.get('/wallet', function(req, res, next) {
  return res.render('wallet', {
    title: 'BlockChain',
    user: {},
    sidebar: {
      active: '/wallet'
    }
  })
});

router.get('/healthy', (req, res) => {
  return res.status(200).json({
    status: 'success',
    address: address,
    testHash: SHA256('abc').toString(),
    chainLength: blockChain.chain.length,
    currentTransactionsLength: blockChain.currentTransactions.length,
    nodesLength: blockChain.nodes.length,
    chain: (req.query.c == 1) ? blockChain.chain : undefined,
    currentTransactions: (req.query.t == 1) ? blockChain.currentTransactions : undefined,
    nodes: (req.query.n == 1) ? blockChain.nodes : undefined
  })
})

router.get('/chain', (req, res) => {
  // console.log(blockChain);
  let chain = JSON.parse(JSON.stringify(blockChain.chain));
  if (req.query.h == 1) {
    chain.map((c, i) => {
      let hash = blockChain.hash(c);
      c.hash = hash;
    })
  }
  return res.status(200).json({
    status: 'success',
    valid: blockChain.validChain(blockChain.chain),
    addr: address,
    chain: chain
  })
})

router.get('/block', (req, res) => {
  return res.render('blocks', {
    title: 'BlockChain',
    user: {},
    sidebar: {
      active: '/block'
    },
    blocks: blockChain.chain
  })
})

router.get('/block/:idx', (req, res) => {
  // console.log(blockChain);
  let fee = 0;
  let idx = parseInt(req.params.idx);
  if (idx < blockChain.chain.length) {
    console.log(blockChain.chain[idx]);
    for (var i = 0; i < blockChain.chain[idx].transactions.length; i++) {
      fee = blockChain.chain[idx].transactions[i].fee()
    }
    if (req.query.datatype == 'json') {
      return res.status(200).json({
        status: 'success',
        fee: fee,
        block: blockChain.chain[idx]
      })
    }
    return res.render('block', {
      title: 'BlockChain',
      user: {},
      sidebar: {
        active: '/block'
      },
      fee: fee,
      block: blockChain.chain[idx]
    })
  }
  return res.status(404).json({
    status: 'error',
    error: 'Not found'
  })
})

router.get('/destroy', (req, res) => {
  blockChain.chain[1].proof = 1;
  return res.end('ok')
})

router.get('/mine', (req, res) => {
  let t = mine();
  return res.status(200).json({
    status: 'success',
    time: t,
    block: blockChain.lastBlock()
  })
})

function mine() {
  if (!blockChain.currentTransactions || (blockChain.currentTransactions.length < 1)) {
    let rewardTransaction = Transaction([], [{addr: '', val: 0}], true);
    rewardTransaction.index = 0;
    blockChain.currentTransactions = [rewardTransaction];
  }
  blockChain.reward(address, 12.5);
  blockChain.currentTransactions[0].seal();
  let lastBlock = blockChain.lastBlock();
  let lastProof = lastBlock.proof;
  let r = blockChain.proofOfWork(lastBlock, address, blockChain.currentTransactions);
  proof = r.proof;
  let time = r.time;
  console.log('found new proof:', proof);
  blockChain.newBlock(proof, blockChain.hash(lastBlock), address);
  return time;
  // console.log(blockChain.chain);
}

router.post('/transaction', (req, res) => {
  let requiredParams = ['inputs', 'outputs'];
  console.log(req.body);
  for (let i = 0; i < requiredParams.length; i++) {
    if (!(req.body[requiredParams[i]])) {
      return res.status(400).json({
        status: 'error',
        error: `Missing ${requiredParams[i]}`
      })
    }
  }
  try {
    req.body.inputs = JSON.parse(req.body.inputs)
    req.body.outputs = JSON.parse(req.body.outputs)
  } catch (e) {
    console.log(e);
  }
  console.log(req.body);
  // req.body.inputs.map((coin, idx) => {
  //   coin.blockIdx = coin.bi;
  //   delete coin.bi;
  //   coin.transIdx = coin.ti;
  //   delete coin.ti;
  //   coin.coinIdx = coin.ci;
  //   delete coin.ci;
  // })
  let t = blockChain.newTransaction(req.body.inputs, req.body.outputs)
  if (!t) {
    return res.status(400).json({
      status: 'error',
      error: 'Invalid Transaction'
    })
  }
  for (var i = 0; i < blockChain.nodes.length; i++) {
    request.post({
      url: blockChain.nodes[i].url + '/transaction',
      body: JSON.stringify(req.body),
      headers: {
        'Content-Type': 'application/json'
      }
    }, (err, response, body) => {
      if (err) {
        return console.log(err);
      }
      if (response.statusCode == 200) {
        return console.log(body);
      }
      console.log(response.statusCode);
      return console.log(body);
    })
  }
  return res.status(200).json({
    status: 'success',
    transaction: t
  })
})

router.get('/transaction/:txHash', (req, res) => {
  for (var i = blockChain.chain.length - 1; i >= 0; i--) {
    let block = blockChain.chain[i];
    for (var j = 0; j < block.transactions.length; j++) {
      let tx = block.transactions[j];
      if (tx.hash == req.params.txHash) {
        return res.status(200).json({
          status: 'success',
          confirmations: blockChain.chain.length - i,
          transaction: tx
        })
      }
    }
  }
  return res.status(200).json({
    status: 'success',
    confirmations: 0,
    transaction: null
  })
})

router.get('/wallet/:address', (req, res) => {
  let balance = 0;
  let fee = 0;
  let coins = []
  let tmp = {}
  // console.log(blockChain.chain);
  for (var i = 1; i < blockChain.chain.length; i++) { // ignore initial block
    tmp[i + ''] = {}
    let block = blockChain.chain[i];
    let includeFee = block.miner.localeCompare(req.params.address) == 0
    // console.log(block.transactions);
    for (var j = 0; j < block.transactions.length; j++) {
      tmp[i][j] = {}
      let transaction = block.transactions[j]
      // console.log(transaction);
      let detail = transaction.getDetail();
      // console.log('===============');
      // console.log(detail);
      // console.log('===============');
      if (req.params.address in detail) {
        balance += detail[req.params.address]
      }
      if (includeFee) {
        fee += transaction.fee();
        // balance += transaction.fee(); // fees included in CoinBase transaction.
      }
      let tmpCoins = transaction.coinsOf(req.params.address);
      for(let k = 0; k < tmpCoins.outputCoins.length; k++) {
        let c = tmpCoins.outputCoins[k];
        c.blockIdx = i;
        c.transIdx = j;
        tmp[i][j][c.coinIdx] = c
      }
      for(let k = 0; k < tmpCoins.inputCoins.length; k++) {
        let c = tmpCoins.inputCoins[k];
        delete tmp[c.blockIdx][c.transIdx][c.coinIdx]
      }
      // coins = coins.concat(tmpCoins.outputCoins)
    }
  }
  for(let i in tmp) {
    if (tmp[i]) {
      for(let j in tmp[i]) {
        if (tmp[i][j]) {
          for (let k in tmp[i][j]) {
            if (tmp[i][j][k]) {
              coins.push(tmp[i][j][k])
            }
          }
        }
      }
    }
  }
  return res.status(200).json({
    status: 'success',
    addr: req.params.address,
    balance: balance,
    fee: fee,
    coins: coins
  })
})

router.get('/wallet/:address/history', (req, res) => {
  let txs = [];
  for (var i = 0; i < blockChain.chain.length; i++) {
    let block = blockChain.chain[i];
    for (var j = 0; j < block.transactions.length; j++) {
      let tx = block.transactions[j];
      let dt = tx.getDetail();
      if (dt && (req.params.address in dt)) {
        txs.push({tx: tx, confirmations: blockChain.chain.length - i});
      }
    }
  }
  for (var i = 0; i < blockChain.currentTransactions.length; i++) {
    let tx = blockChain.currentTransactions[i];
    let dt = tx.getDetail();
      if (dt && (req.params.address in dt)) {
        txs.push({tx: tx, confirmations: 0});
      }
  }
  if (req.query.datatype == 'json') {
    return res.status(200).json({
      status: 'success',
      txs: txs
    })
  }
  return res.render('wallet-history', {
    txs: txs,
    user: {},
    sidebar: {
      active: '/block'
    },
  })
})

router.get('/mixing', (req, res) => {
  return res.render('mixing', {
    title: 'Mixing',
    user: {},
    sidebar: {
      active: '/mixing'
    }
  })
})

router.post('/connect', (req, res) => {
  if (!req.body.nodeUrl) {
    return res.status(400).json({
      status: 'error',
      error: 'Missing nodeUrl'
    })
  }
  async (() => {
    let result = await (new Promise((resolve, reject) => {
      request.get(req.body.nodeUrl + '/healthy', (err, response, body) => {
        if (err) {
          console.log(err);
          return resolve(err.toString())
        }
        if (response.statusCode != 200) {
          console.log(response.statusCode);
          return resolve(`GOT ${response.statusCode} while connecting to new node`)
        }
        try {
          body = JSON.parse(body);
          if (body.status == 'success') {
            return resolve('success')
          }
          console.log(body.status);
          return resolve('Error while trying to connect to new node')
        } catch (e) {
          console.log(e);
          return resolve(e.toString())
        }
      })
    }))
    if (result == 'success') {
      let fAddedNode = false;
      for (var i = 0; i < blockChain.nodes.length; i++) {
        if (blockChain.nodes[i].url.localeCompare(req.body.nodeUrl) == 0) {
          fAddedNode = true;
          break;
        }
      }
      if (fAddedNode) {
        console.log('Node already added');
        return res.status(200).json({
          status: 'success',
          msg: `Node ${req.body.nodeUrl} already added`
        })
      }
      blockChain.newNode(req.body.nodeUrl);
      return res.status(200).json({
        status: 'success',
        msg: `Node ${req.body.nodeUrl} added`
      })
    }
    return res.status(400).json({
      status: 'error',
      error: result
    })
  })()
})

router.get('/fetch', (req, res) => {
  async (() => {
    let nodes = blockChain.nodes;
    if (!(blockChain.validChain(blockChain.chain))) {
      console.log('this chain is invalid, reset chain: fetch');
      blockChain.chain = []
      blockChain.newBlock(-1, 1, global.myCustomVars.const.address)
    }
    let longestChain = blockChain.chain;
    let replaced = false;
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      let tmpChain = undefined;
      let result = await (new Promise((resolve, reject) => {
        request.get(node.url + '/chain', (err, response, body) => {
          if (err) {
            console.log(err);
            return resolve(err.toString())
          }
          if (response.statusCode != 200) {
            console.log(response.statusCode);
            return resolve(`GOT ${response.statusCode} while connecting to new node`)
          }
          try {
            body = JSON.parse(body);
            if (body.status == 'success') {
              tmpChain = body.chain;
              return resolve('success')
            }
            console.log(body.status);
            return resolve('Error while trying to connect to new node')
          } catch (e) {
            console.log(e);
            return resolve(e.toString())
          }
        })
      }))
      if (result == 'success') {
        if (tmpChain.length > longestChain.length) {
          console.log('got longer chain from', node.url, 'length', tmpChain.length);
          if (blockChain.validChain(tmpChain)) {
            longestChain = tmpChain;
            replaced = true;
          } else {
            console.log('tmpChain invalid');
          }
          
        } else {
          console.log('got shorter chain from', node.url);
        }
      } else {
        console.log('cannot fetch', node.url);
      }
    }
    if (replaced) {
      blockChain.updateChain(longestChain);
      console.log('NOW REPLACE CHAIN');
      return res.status(200).json({
        status: 'success',
        msg: 'Chain replaced',
        chain: blockChain.chain
      })
    }
    return res.status(200).json({
      status: 'success',
      msg: 'Chain remains',
      chain: blockChain.chain
    })
  })()
})

setInterval(() => {
  // return;
  if (!global.myCustomVars.const.run) {
    return;
  }
  async (() => {
    let nodes = blockChain.nodes;
    if (!(blockChain.validChain(blockChain.chain))) {
      console.log('this chain is invalid, reset chain: interval');
      blockChain.chain = []
      blockChain.newBlock(-1, 1, global.myCustomVars.const.address)
    }
    let longestChain = blockChain.chain;
    let replaced = false;
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      let tmpChain = undefined;
      let result = await (new Promise((resolve, reject) => {
        request.get(node.url + '/chain', (err, response, body) => {
          if (err) {
            console.log(err);
            return resolve(err.toString())
          }
          if (response.statusCode != 200) {
            console.log(response.statusCode);
            return resolve(`GOT ${response.statusCode} while connecting to new node`)
          }
          try {
            body = JSON.parse(body);
            if (body.status == 'success') {
              tmpChain = body.chain;
              return resolve('success')
            }
            console.log(body.status);
            return resolve('Error while trying to connect to new node')
          } catch (e) {
            console.log(e);
            return resolve(e.toString())
          }
        })
      }))
      if (result == 'success') {
        if (tmpChain.length > longestChain.length) {
          console.log('got longer chain from', node.url, 'length', tmpChain.length);
          if (blockChain.validChain(tmpChain)) {
            longestChain = tmpChain;
            replaced = true;
          } else {
            console.log('tmpChain invalid');
          }
        } else {
          // console.log('got shorter or equal chain from', node.url);
        }
      } else {
        console.log('cannot fetch', node.url);
      }
    }
    if (replaced) {
      blockChain.updateChain(longestChain);
      console.log('Chain replaced');
      // return res.status(200).json({
      //   status: 'success',
      //   msg: 'Chain replaced',
      //   chain: blockChain.chain
      // })
    }
    return;
    // return res.status(200).json({
    //   status: 'success',
    //   msg: 'Chain remains',
    //   chain: blockChain.chain
    // })
  })()
}, 2000)

module.exports = router;
