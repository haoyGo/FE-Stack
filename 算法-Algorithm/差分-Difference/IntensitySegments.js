class IntensitySegments {
  defaultValue = 0;
  root = null;

  // 计算某个点之前的累计值（不包括该点）
  getValue(point) {
    let sum = 0;
    let tmp = this.root;
    while (tmp && tmp.key < point) {
      sum += tmp.val;
      tmp = tmp.next;
    }
    return sum;
  }

  // 设置或插入某个点的差分值
  setValue(point, amount) {
    let tmp = this.root,
      prev = null;

    while (tmp) {
      if (tmp.key === point) {
        tmp.val = amount;
        return;
      }
      if (tmp.key > point) {
        break;
      }
      prev = tmp;
      tmp = tmp.next;
    }

    // 插入新节点
    const newNode = { key: point, val: amount, next: tmp };
    if (prev) {
      prev.next = newNode;
    } else {
      this.root = newNode;
    }
  }

  add(from, to, amount) {
    if (!this.root) {
      this.root = {
        key: from,
        val: amount,
        next: {
          key: to,
          val: -amount,
          next: null,
        },
      };
      return;
    }

    let tmp = this.root,
      prev = null,
      fromAdded = false,
      toAdded = false;

    while (tmp) {
      if (!fromAdded) {
        if (tmp.key === from) {
          tmp.val += amount;
          fromAdded = true;
        } else if (tmp.key > from) {
          if (prev === null) {
            this.root = {
              key: from,
              val: amount,
              next: tmp,
            };
            prev = this.root;
          } else {
            prev.next = {
              key: from,
              val: amount,
              next: tmp,
            };
            prev = prev.next;
          }
          fromAdded = true;
        }
      }

      if (!toAdded) {
        if (tmp.key === to) {
          tmp.val -= amount;
          toAdded = true;
          break;
        } else if (tmp.key > to) {
          prev.next = {
            key: to,
            val: -amount,
            next: tmp,
          };
          toAdded = true;
          break;
        }
      }

      prev = tmp;
      tmp = tmp.next;
    }

    if (!fromAdded && !toAdded) {
      prev.next = {
        key: from,
        val: amount,
        next: {
          key: to,
          val: -amount,
          next: null,
        },
      };
    } else if (!toAdded) {
      prev.next = {
        key: to,
        val: -amount,
        next: null,
      };
    }

    // console.log("this.root >>>> ", this.root);
  }

  set(from, to, amount) {
    const fromDiff = amount - this.getValue(from);
    const toDiff = this.getValue(to) - amount;

    // 删除 (from, to) 区间内的中间节点
    let tmp = this.root,
      prev = null;
    while (tmp) {
      if (tmp.key > from && tmp.key < to) {
        if (prev) {
          prev.next = tmp.next;
        } else {
          this.root = tmp.next;
        }
        tmp = prev ? prev.next : this.root;
      } else {
        prev = tmp;
        tmp = tmp.next;
      }
    }

    this.setValue(from, fromDiff);
    this.setValue(to, toDiff);
  }

  toString() {
    const res = [];
    let sum = 0;
    let prevSum = 0;

    let tmp = this.root;
    while (tmp) {
      prevSum = sum;
      sum += tmp.val;

      // 跳过无穷大的点且值为0的情况
      if ([Infinity, -Infinity].includes(tmp.key) && sum === 0) {
        tmp = tmp.next;
        continue;
      }

      // 如果当前sum不为0，或者是从非0变为0（区间结束点），则保留
      if (sum !== 0 || (sum === 0 && prevSum !== 0)) {
        res.push([tmp.key, sum]);
      }

      tmp = tmp.next;
    }

    console.log("res >>>> ", res);
    return res;
  }
}
// Here is an example sequence:
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
