const request = require('request')
const CryptoJS = require('crypto-js');
const SHA256 = CryptoJS.SHA256;
global.myCustomVars = {
  const: {},
  function: {}
}

const RSAUtils = require('../utils/RSAUtils')
const fs = require('fs')
const path = require('path')
const mainKey = new RSAUtils();
let keys = JSON.parse(fs.readFileSync(path.join(__dirname, '../keys.json')));
if (!(process.env.PORT in keys)) {
  let key = mainKey.generateKeyPair(1024);
  let pub = mainKey.exportPublicKey();
  keys[process.env.PORT] = {
    publicKey: pub,
    privateKey: mainKey.exportKeyPair(),
    address: SHA256(pub).toString()
  }
  fs.writeFileSync(path.join(__dirname, '../keys.json'), JSON.stringify(keys, null, 4))
} else {
  mainKey.loadKeyPair(keys[process.env.PORT].privateKey)
}

global.myCustomVars.const.run = true;
global.myCustomVars.const.address = SHA256(keys[process.env.PORT].publicKey).toString()
global.myCustomVars.const.mainKey = mainKey

global.myCustomVars.function.publicKey2Address = function (publicKey) {
  const CryptoJS = require('crypto-js');
  const SHA256 = CryptoJS.SHA256;
  return SHA256(publicKey).toString()
}


let nodes = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../nodes.json')));

setTimeout(() => {
  if (!global.myCustomVars.const.run) {
    return;
  }
  console.log('start connecting to other nodes');
  for (var i = 0; i < nodes.length; i++) {
    for (var j = 0; j < nodes.length; j++) {
      if (i == j) {
        continue;
      }
      request.post({
        url: nodes[i].url + '/connect',
        form: {
          nodeUrl: nodes[j].url
        }
      }, (err, response, body) => {
        if (err) {
          return console.log(err);
        }
        if (response.statusCode == 200) {
          console.log(body);
        } else {
          console.log(response.statusCode);
        }
      })
    }
  }
}, 2000)