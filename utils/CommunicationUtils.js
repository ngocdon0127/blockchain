const request = require('request')
const CONFIG = require('../config')
const async = require('asyncawait/async')
const await = require('asyncawait/await')

let CommunicationUtils = function () {
  let self = this;
  this.propagateTransaction = function (transaction, nodes) {
    for (var i = 0; i < nodes.length; i++) {
      console.log('propagating transaction to', nodes[i].url);
      request.post({
        url: nodes[i].url + '/transaction',
        body: JSON.stringify(transaction),
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
  }

  this.propagateBlock = function (block, nodes) {
    for (var i = 0; i < nodes.length; i++) {
      console.log('propagating block to', nodes[i].url);
      request.post({
        url: nodes[i].url + '/block',
        body: JSON.stringify(block),
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
  }

  this.connectNode = function (nodeUrl, blockChain) {
    if (blockChain.nodes.length > CONFIG.app.maxNodes) { 
      return false;
    }
    if (!nodeUrl) {
      return false;
    }
    if (nodeUrl.toLowerCase().localeCompare(CONFIG.app.host + ':' + process.env.PORT) == 0) {
      return false;
    }
    console.log('trying to connect to', nodeUrl);
    async (() => {
      let result = await (new Promise((resolve, reject) => {
        request.get(nodeUrl + '/healthy?n=1', (err, response, body) => {
          if (err) {
            console.log(err);
            return resolve({status: 'error', err: err.toString()})
          }
          if (response.statusCode != 200) {
            console.log(response.statusCode);
            return resolve({status: 'error', err: `GOT ${response.statusCode} while connecting to new node`})
          }
          try {
            body = JSON.parse(body);
            if (body.status == 'success') {
              return resolve({status: 'success', nodes: body.nodes})
            }
            console.log(body.status);
            return resolve({status: 'error', err: 'Error while trying to connect to new node'})
          } catch (e) {
            console.log(e);
            return resolve({status: 'error', err: e.toString()})
          }
        })
      }))
      if (result.status == 'success') {
        let fAddedNode = false;
        for (var i = 0; i < blockChain.nodes.length; i++) {
          if (blockChain.nodes[i].url.localeCompare(nodeUrl) == 0) {
            fAddedNode = true;
            break;
          }
        }
        if (fAddedNode) {
          console.log('Node already added');
          return false;
          // return res.status(200).json({
          //   status: 'success',
          //   msg: `Node ${nodeUrl} already added`
          // })
        }
        if (blockChain.nodes.length < CONFIG.app.maxNodes) {
          blockChain.newNode(nodeUrl);
        }
        
        console.log('send connect request to', nodeUrl);
        request.post({
          url: nodeUrl + '/connect',
          body: JSON.stringify({nodeUrl: CONFIG.app.host + ':' + process.env.PORT}),
          headers: {
            'Content-Type': 'application/json'
          }
        }, (err, response, body) => {
          // silent
          if (err) {
            return console.log(err);
          }
          if (response.statusCode == 200) {
            return console.log(body);
          }
          console.log(response.statusCode);
          return console.log(body);
        })
        for (var i = 0; i < result.nodes.length; i++) {
          self.connectNode(result.nodes[i].url, blockChain)
          if ((CONFIG.app.host + ':' + process.env.PORT).toLowerCase().localeCompare(result.nodes[i].url) == 0) {
            continue;
          }
          if (blockChain.nodes.indexOf(result.nodes[i].url) >= 0) {
            continue;
          }
          // console.log((CONFIG.app.host + ':' + process.env.PORT).toLowerCase());
          // console.log(result.nodes[i].url);
          console.log('send connect request to', result.nodes[i].url);
          request.post({
            url: result.nodes[i].url + '/connect',
            body: JSON.stringify({nodeUrl: CONFIG.app.host + ':' + process.env.PORT}),
            headers: {
              'Content-Type': 'application/json'
            }
          }, (err, response, body) => {
            // silent
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
        return true;
        // return res.status(200).json({
        //   status: 'success',
        //   msg: `Node ${nodeUrl} added`
        // })
      }
      return false;
      // return res.status(400).json({
      //   status: 'error',
      //   error: result
      // })
    })()
  }
}

module.exports = CommunicationUtils;