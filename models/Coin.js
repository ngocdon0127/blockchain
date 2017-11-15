module.exports = (addr, val, blockIdx, transIdx, coinIdx) => {
  let coin = {
    addr: addr,
    val: val
  }
  coin.blockIdx = blockIdx ? blockIdx : 0;
  coin.transIdx = transIdx ? transIdx : 0;
  coin.coinIdx = coinIdx ? coinIdx : 0 
  return coin
}