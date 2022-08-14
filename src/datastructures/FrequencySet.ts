import WithFrequency from "../analyzer/WithFrequency";

interface ElementMeta {
  frequency: number;
  index?: number;
}

/**
 * The `FrequencySet` is responsible for keeping track
 */
class FrequencySet<T> {
  private k: number;
  private arr!: WithFrequency<T>[];
  private map!: Map<T, ElementMeta>;
  private minFreqInTopK!: number;

  constructor(k: number) {
    this.k = k;
    this.initialize();
  }

  moveElement(index: number, data: WithFrequency<T>): number {
    if (index === 0) {
      return index;
    }

    // Takes its left neighbour (this is larger or equal)
    const tmp = this.arr[index - 1];
    // If it's more frequent than the neighbour
    if (tmp.frequency < data.frequency + 1) {
      // Then swap them
      this.arr[index - 1] = data;
      this.arr[index] = tmp;

      // Return the new index
      return index - 1;
    } else {
      // It was not moved, return it's old index
      return index;
    }
  }

  clear(): void {
    this.initialize();
  }

  private initialize(): void {
    this.arr = [];
    this.map = new Map();
    this.minFreqInTopK = 0;
  }

  insert(element: T): void {
    const meta: ElementMeta | undefined = this.map.get(element);

    // The element is already inserted into the map
    if (meta !== undefined) {
      // Update its frequency
      const newFrequency = meta.frequency + 1;
      meta.frequency = newFrequency;

      // And also part of the top `k` elements
      if (meta.index !== undefined) {
        // The frequency increased so the element may has to move forward, let's find out where
        meta.index = this.moveElement(meta.index, {
          frequency: newFrequency,
          value: element,
        });
      }
      // Not part of the top `k` elements
      else {
        // But it became frequent enough, so let's add it
        if (newFrequency > this.minFreqInTopK) {
          this.arr[this.arr.length - 1] = {
            frequency: newFrequency,
            value: element,
          };

          // And update its index in the map
          meta.index = this.arr.length - 1;
        }
      }
    }
    // The element is not in the map yet
    else {
      // Set the frequency to 1
      const meta: ElementMeta = { frequency: 1 };

      // Check if it fits into the top `k` array, actually it can only fit if it's not full, because in a full array, even the last element has at least a frequency of 1
      if (this.arr.length < this.k) {
        this.arr.push({
          frequency: 1,
          value: element,
        });

        // Set the new index of the element
        meta.index = this.arr.length - 1;
      }

      this.map.set(element, meta);
    }
  }

  getTopK(): WithFrequency<T>[] {
    return this.arr;
  }

  getTop(): WithFrequency<T> | undefined {
    return this.arr[0];
  }
}

export default FrequencySet;
