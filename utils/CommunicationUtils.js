const request = require('request')

let CommunicationUtils = function () {
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
}

module.exports = CommunicationUtils;