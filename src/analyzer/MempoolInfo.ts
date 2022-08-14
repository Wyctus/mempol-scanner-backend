interface MempoolInfo {
  topToAddresses: { frequency: number; value: string }[];
  topFromAddresses: { frequency: number; value: string }[];
  topMethods: { frequency: number; value: { hash: string; contract: string } }[];
  maxValue: string;
  avgGasPrice: number;
  avgMaxFeePerGas: number;
  avgMaxPriorityFeePerGas: number;
}

export default MempoolInfo;
