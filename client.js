const request = require('request')

let nodes = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'nodes.json')))

var mine = () => {
  let idx = Math.floor(Math.random() * 1000000) % nodes.length;
  console.log('start mining on node', nodes[idx].url);
  // return;
  request.get({
    url: nodes[idx].url + '/mine'
  }, (err, response, body) => {
    if (err) {
      return console.log(err);
    }
    if (response.statusCode == 200) {
      console.log('time:', JSON.parse(body).time);
      setTimeout(mine, 5000)
    } else {
      console.log(response.statusCode);
    }
  })
}

setTimeout(mine, 3000)