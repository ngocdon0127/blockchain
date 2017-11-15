const Coin = require('../../models/Coin')
const Transaction = require('../../models/Transaction')

let c1 = Coin('addr1', 1.5)
let c2 = Coin('addr2', 2)
let c3 = Coin('addr3', 1)
let c4 = Coin('addr4', 2.5)
let c5 = Coin('addr4', 2.2)
let c6 = Coin('addr4', 3.2)

let transaction = Transaction([c1, c2], [c3], true);
console.log(transaction);
console.log(transaction.validAmount());
console.log(transaction.getDetail(), transaction.fee());

let transaction1 = Transaction([c1, c2], [c3, c4], true);
console.log(transaction1.validAmount());
console.log(transaction1.getDetail(), transaction1.fee());

let transaction2 = Transaction([c1, c2], [c3, c5], true);
console.log(transaction2.validAmount());
console.log(transaction2.getDetail(), transaction2.fee());

let transaction3 = Transaction([c1, c2], [c3, c6], true);
console.log(transaction3.validAmount());
console.log(transaction3.getDetail(), transaction3.fee());

let transaction4 = Transaction([], [c3, c6], true);
console.log(transaction4.validAmount());
console.log(transaction4.getDetail(), transaction4.fee());