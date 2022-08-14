type Listener<T> = (value: T) => void;

/**
 * The `CircularBuffer` is a simple insert only buffer,
 * which is able to notify a callback, when an old element was removed.
 */
class CircularBuffer<T> {
  private arr: Array<T>;
  private size: number;
  readonly capacity: number;
  private pointer: number;
  private listener?: Listener<T>;

  constructor(capacity: number, listener?: Listener<T>) {
    this.capacity = capacity;
    this.pointer = 0;
    this.size = 0;

    this.arr = new Array<T>(capacity);
    this.listener = listener;
  }

  insert(value: T): void {
    if (this.size === this.capacity) {
      this.onRemove(this.arr[this.pointer]);
    } else {
      this.size++;
    }

    this.arr[this.pointer] = value;
    this.pointer = (this.pointer + 1) % this.capacity;
  }

  private onRemove(value: T): void {
    if (this.listener) {
      this.listener(value);
    }
  }
}

export default CircularBuffer;
