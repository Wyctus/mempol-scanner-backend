import { int2buffer } from "@ethereumjs/devp2p";

const genesis = {
  totalDifficulty: int2buffer(17179869184),
  hash: Buffer.from("d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3", "hex"),
};

export default genesis;
