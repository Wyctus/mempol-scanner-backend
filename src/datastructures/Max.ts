import { BigNumber, constants } from "ethers";

/**
 * The `Max` class abstracts away the maximum calculation of a continous flow of values.
 */
class Max {
  private m: BigNumber = constants.MinInt256;

  insert(value: BigNumber): void {
    if (value.gt(this.m)) {
      this.m = value;
    }
  }

  get max(): BigNumber {
    return this.m;
  }
}

export default Max;
