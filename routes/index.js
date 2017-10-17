var express = require('express');
var router = express.Router();
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const request = require('request')
const BlockChain = require('../models/BlockChain');
const Transaction = require('../models/Transaction');
const CryptoJS = require('crypto-js');
const SHA256 = CryptoJS.SHA256;
const address = SHA256((new Date()).getTime() + '' + Math.random() * 1000000).toString();
console.log('this node:', address);

const blockChain = BlockChain();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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
    chain: chain
  })
})

router.get('/destroy', (req, res) => {
  blockChain.chain[1].proof = 1;
  return res.end('ok')
})

router.get('/mine', (req, res) => {
  mine();
  return res.status(200).json({
    status: 'success',
    block: blockChain.lastBlock()
  })
})

function mine() {
  let lastBlock = blockChain.lastBlock();
  let lastProof = lastBlock.proof;
  let proof = blockChain.proofOfWork(lastProof);
  console.log('found new proof:', proof);
  blockChain.newTransaction('0', address, 1);
  blockChain.newBlock(proof, blockChain.hash(lastBlock));
  // console.log(blockChain.chain);
}

router.post('/transaction', (req, res) => {
  let requiredParams = ['sender', 'recipient', 'amount'];
  for (let i = 0; i < requiredParams.length; i++) {
    if (!(req.body[requiredParams[i]])) {
      return res.status(400).json({
        status: 'error',
        error: `Missing ${requiredParams[i]}`
      })
    }
  }
  let amount = parseFloat(req.body.amount)
  if (Number.isNaN(amount)) {
    return res.status(400).json({
      status: 'error',
      error: 'Invalid value for amount'
    })
  }
  if (amount < 0) {
    return res.status(400).json({
      status: 'error',
      error: 'Invalid value for amount'
    })
  }
  let t = Transaction(req.body.sender, req.body.recipient, amount); 
  blockChain.newTransaction(t);
  return res.status(200).json({
    status: 'success',
    transaction: t
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
      console.log('this chain is invalid, reset chain');
      blockChain.chain = []
      blockChain.newBlock(-1, 1)
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
      blockChain.chain = longestChain;
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

module.exports = router;
