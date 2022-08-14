/**
 * The `Average` class calculates the average of a continous flow of value,
 * without needlessly storing or recalculating things.
 *
 * If the average of a_1, a_2, ..., a_n is A_n, then A_{n+1} = (A_n*n + a_{n+1}) / (n+1).
 */
class Average {
  private n: number = 0;
  private avg: number = 0;

  insert(value: number): void {
    this.avg = (this.avg * this.n + value) / (this.n + 1);
    this.n++;
  }

  get average(): number {
    return this.avg;
  }
}

export default Average;
