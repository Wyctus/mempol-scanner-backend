// First element is the transaction-id, second is the encoded list transaction array
// Check for details: https://github.com/ethereum/devp2p/blob/master/caps/eth.md#pooledtransactions-0x0a
type PooledTransactionsMessage = [Buffer, Buffer[]];

export default PooledTransactionsMessage;
