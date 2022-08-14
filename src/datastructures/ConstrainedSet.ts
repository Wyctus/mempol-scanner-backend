import CircularBuffer from "./CircularBuffer";

/**
 * The `ConstrainedSet` is a write-, and read-only set, that automatically removes the old elements,
 * keeping its size constrained to a given size.
 *
 * (This is pretty much like an LRUCache, but without values, keys only.)
 */
class ConstrainedSet<T> {
  capacity: number;
  set: Set<T>;
  buffer: CircularBuffer<T>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.set = new Set();
    this.buffer = new CircularBuffer(capacity, this.remove.bind(this));
  }

  private remove(value: T): void {
    this.set.delete(value);
  }

  add(value: T): void {
    this.buffer.insert(value);
    this.set.add(value);
  }

  has(value: T): boolean {
    return this.set.has(value);
  }
}

export default ConstrainedSet;
