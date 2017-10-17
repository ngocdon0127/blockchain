module.exports = (sender, recipient, amount) => {
  let transaction = {
    sender: sender,
    recipient: recipient,
    amount: amount
  }
  return transaction
}