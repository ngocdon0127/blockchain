module.exports = (addr, val, blockIdx, transIdx, coinIdx, publicKey, signature) => {
  let coin = {
    addr: addr,
    val: val
  }
  coin.blockIdx = blockIdx ? blockIdx : 0;
  coin.transIdx = transIdx ? transIdx : 0;
  coin.coinIdx = coinIdx ? coinIdx : 0 
  coin.signature = signature ? signature : ''
  coin.publicKey = publicKey ? publicKey : ''
  return coin
}