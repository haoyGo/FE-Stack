class IntensitySegments {
  #map = new Map();
  defaultValue = 0;

  #cacheEntries = [];  // 缓存排序后的 keys
  #hasUpdate = true;   // 标记是否需要重新排序

  // 获取排序后的 keys（延迟排序）
  get sortEntries() {
    if (this.#hasUpdate) {
      this.#cacheEntries = [...this.#map.entries()].sort((a, b) => a[0] - b[0]);
      this.#hasUpdate = false;
    }
    return this.#cacheEntries;
  }


  // 计算某个点的值
  getValue(point) {
    let sum = 0;
    for (const [key, amount] of this.#map) {
      if (key <= point) {
        sum += amount;
      }
    }
    

    return sum;
  }

  // default值(0)可以清除
  setValue(point, amount) {
    this.#hasUpdate = true;
    amount === this.defaultValue
      ? this.#map.delete(point)
      : this.#map.set(point, amount);
  }

  add(from, to, amount) {
    // TODO: implement this
    const fromNewAmount = (this.#map.get(from) || this.defaultValue) + amount;
    const toNewAmount = (this.#map.get(to) || this.defaultValue) - amount;
    this.setValue(from, fromNewAmount);
    this.setValue(to, toNewAmount);
  }
  set(from, to, amount) {
    // TODO: implement this
    const fromNewAmount = amount - this.getValue(from);
    const toNewAmount = this.getValue(to) - amount;
    this.setValue(from, fromNewAmount);
    this.setValue(to, toNewAmount);

    for (const [point] of this.#map) {
      if (point > from && point < to) {
        this.#map.delete(point);
      }
    }
  }
  toString() {
    // TODO: implement this
    const res = [];
    let sum = 0;
    // console.log("this.sortEntries >>>> ", this.sortEntries);
    for (const [point, amount] of this.sortEntries) {
      sum += amount;

      if ([Infinity, -Infinity].includes(point) && sum === 0) {
        continue;
      }
      res.push([point, sum]);
    }

    console.log("res >>>> ", res);
    return res;
  }
}
// Here is an example sequence:
// (data stored as an array of start point and value for each segment.)
const segments1 = new IntensitySegments();
segments1.toString(); // Should be "[]"
segments1.add(10, 30, 1);
segments1.toString(); // Should be: "[[10,1],[30,0]]"
segments1.add(20, 40, 1);
segments1.toString(); // Should be: "[[10,1],[20,2],[30,1],[40,0]]"
segments1.add(10, 40, -2);
segments1.toString(); // Should be: "[[10,-1],[20,0],[30,-1],[40,0]]"
console.log("-----");

// Another example sequence:
const segments2 = new IntensitySegments();
segments2.toString(); // Should be "[]"
segments2.add(10, 30, 1);
segments2.toString(); // Should be "[[10,1],[30,0]]"
segments2.add(20, 40, 1);
segments2.toString(); // Should be "[[10,1],[20,2],[30,1],[40,0]]"
segments2.add(10, 40, -1);
segments2.toString(); // Should be "[[20,1],[30,0]]"
segments2.add(10, 40, -1);
segments2.toString(); // Should be "[[10,-1],[20,0],[30,-1],[40,0]]"
console.log("-----");

const segments3 = new IntensitySegments();
segments3.toString(); // Should be "[]"
segments3.add(10, 30, 1);
segments3.toString(); // Should be: "[[10,1],[30,0]]"
segments3.add(-Infinity, 20, 1);
segments3.toString(); // Should be: "[[-Infinity,1], [10,2], [20,1], [30,0]]"
segments3.add(-Infinity, Infinity, -1);
segments3.toString(); // Should be: "[[10,1], [20,0], [30,-1]]"
segments3.add(10, Infinity, -1);
segments3.toString(); // Should be: "[[20,-1], [30,-2]]"
console.log("-----");

const segments4 = new IntensitySegments();
segments4.toString(); // Should be "[]"
segments4.add(10, 30, 1);
segments4.toString(); // Should be: "[[10,1],[30,0]]"
segments4.set(20, 40, 3);
segments4.toString(); // Should be: "[[10,1],[20,3],[40,0]]"
console.log("-----");

const segments5 = new IntensitySegments();
segments5.toString(); // Should be "[]"
segments5.add(10, 30, 1);
segments5.toString(); // Should be: "[[10,1],[30,0]]"
segments5.set(-Infinity, 20, 3);
segments5.toString(); // Should be: "[[-Infinity,3],[20,1],[30,0]]"
console.log("-----");
