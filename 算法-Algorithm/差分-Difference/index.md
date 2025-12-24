# 差分数组详解

## 📖 一句话说明

**差分数组就像"记账本"，只记录每次的变化量，而不是每次的总金额。**

---

## 🎯 核心思想

> 用"变化量"代替"绝对值"，用"增量"代替"结果"

**原理**：

- 普通数组记录的是每个位置的**具体值**
- 差分数组记录的是每个位置**相对前一个位置的变化量**

---

## 🌰 生活类比

### 类比 1：银行账户余额

```
日期:     1月  2月  3月  4月  5月
余额:     100  150  120  120  200  ← 普通数组（每天的总金额）
变化:     +100 +50 -30   0  +80  ← 差分数组（每天的变化量）
```

**关键**：知道初始余额 + 每天的变化 = 可以算出任意一天的余额

```javascript
// 从左到右累加变化量 = 恢复原数组
余额[1月] = 0 + 100 = 100
余额[2月] = 100 + 50 = 150
余额[3月] = 150 + (-30) = 120
余额[4月] = 120 + 0 = 120
余额[5月] = 120 + 80 = 200
```

---

### 类比 2：楼层电梯

```
楼层:     1F   2F   3F   4F   5F
高度:     3m   6m   9m   12m  15m  ← 普通数组（每层的绝对高度）
层高:     3m   3m   3m   3m   3m   ← 差分数组（每层增加的高度）
```

---

## 💡 数学定义

### 原数组 → 差分数组

```javascript
原数组: arr = [a₀, a₁, a₂, a₃, ...]
差分数组: diff = [d₀, d₁, d₂, d₃, ...]

其中:
diff[0] = arr[0]
diff[i] = arr[i] - arr[i-1]  (i > 0)
```

**示例**：

```javascript
原数组:   [2, 5, 3, 8, 10]
           ↓  ↓  ↓  ↓  ↓
差分数组: [2, 3, -2, 5, 2]
          ↑  ↑   ↑   ↑  ↑
         2  5-2 3-5 8-3 10-8
```

---

### 差分数组 → 原数组（前缀和恢复）

```javascript
arr[i] = diff[0] + diff[1] + ... + diff[i]
       = sum(diff[0..i])
```

**示例**：

```javascript
差分数组: [2, 3, -2, 5, 2]

恢复过程:
arr[0] = 2
arr[1] = 2 + 3 = 5
arr[2] = 2 + 3 + (-2) = 3
arr[3] = 2 + 3 + (-2) + 5 = 8
arr[4] = 2 + 3 + (-2) + 5 + 2 = 10

原数组: [2, 5, 3, 8, 10] ✓
```

---

## 🔥 为什么需要差分数组？

### 问题场景：区间更新

**任务**：给定一个数组，需要对多个区间进行加减操作。

```javascript
// 原数组
arr = [0, 0, 0, 0, 0, 0, 0, 0];

// 操作1: 区间 [2, 5] 全部 +3
arr = [0, 0, 3, 3, 3, 3, 0, 0];

// 操作2: 区间 [4, 6] 全部 +2
arr = [0, 0, 3, 3, 5, 5, 2, 0];

// 操作3: 区间 [1, 4] 全部 -1
arr = [0, -1, 2, 2, 4, 5, 2, 0];
```

---

### ❌ 暴力方法（低效）

```javascript
function addRange(arr, left, right, value) {
  for (let i = left; i <= right; i++) {
    arr[i] += value; // 每个位置都要修改
  }
}

// 时间复杂度: O(n) 每次操作
// 如果有 m 次操作: O(m * n)
```

**问题**：如果区间很大，每次都要遍历整个区间，效率低。

---

### ✅ 差分方法（高效）

```javascript
function addRange(diff, left, right, value) {
  diff[left] += value; // 起点标记 +value
  diff[right + 1] -= value; // 终点后一位标记 -value
}

// 时间复杂度: O(1) 每次操作！
// 如果有 m 次操作: O(m)
```

**关键思想**：

- 在区间起点 `left` 标记 `+value`（从这里开始增加）
- 在区间终点后一位 `right+1` 标记 `-value`（从这里开始取消增加）
- 最后一次性累加差分数组，恢复原数组

---

## 📝 代码实现

### 完整示例：区间更新

```javascript
class DifferenceArray {
  constructor(size) {
    this.diff = new Array(size + 1).fill(0); // 多开一位防止越界
  }

  // 区间 [left, right] 增加 value
  add(left, right, value) {
    this.diff[left] += value;
    this.diff[right + 1] -= value;
  }

  // 恢复原数组
  getArray() {
    const arr = [];
    let sum = 0;
    for (let i = 0; i < this.diff.length - 1; i++) {
      sum += this.diff[i];
      arr.push(sum);
    }
    return arr;
  }
}

// 使用示例
const diff = new DifferenceArray(8);

diff.add(2, 5, 3); // [2, 5] +3
diff.add(4, 6, 2); // [4, 6] +2
diff.add(1, 4, -1); // [1, 4] -1

console.log(diff.getArray());
// 输出: [0, -1, 2, 2, 4, 5, 2, 0]
```

---

## 🔍 与前缀和的关系

```
原数组 ──构建差分──> 差分数组
  ↑                      ↓
  └────前缀和累加────────┘

两者是互逆操作！
```

**对比**：

| 操作     | 前缀和                       | 差分数组                      |
| -------- | ---------------------------- | ----------------------------- |
| **目的** | 快速查询区间和               | 快速更新区间值                |
| **构建** | `sum[i] = sum[i-1] + arr[i]` | `diff[i] = arr[i] - arr[i-1]` |
| **查询** | O(1) 查询区间和              | O(n) 恢复数组                 |
| **更新** | O(n) 更新区间                | O(1) 更新区间                 |

---

## 🏆 经典应用场景

### 1. 区间批量更新

**问题**：航班预订统计（LeetCode 1109）

```javascript
// 有 n 个航班，bookings[i] = [first, last, seats]
// 表示从航班 first 到 last 预订了 seats 个座位

function corpFlightBookings(bookings, n) {
  const diff = new Array(n + 1).fill(0);

  // 差分数组批量更新
  for (const [first, last, seats] of bookings) {
    diff[first - 1] += seats;
    diff[last] -= seats;
  }

  // 前缀和恢复
  const result = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += diff[i];
    result.push(sum);
  }

  return result;
}
```

---

### 2. 拼车问题（LeetCode 1094）

```javascript
// trips[i] = [乘客数, 上车点, 下车点]
// 判断车是否超载（容量 capacity）

function carPooling(trips, capacity) {
  const diff = new Array(1001).fill(0);

  // 差分标记
  for (const [passengers, from, to] of trips) {
    diff[from] += passengers; // 上车点 +乘客
    diff[to] -= passengers; // 下车点 -乘客
  }

  // 累加检查
  let current = 0;
  for (const change of diff) {
    current += change;
    if (current > capacity) return false; // 超载
  }

  return true;
}
```

---

### 3. IntensitySegments（本项目）

```javascript
class IntensitySegments {
  constructor() {
    this.map = new Map(); // 稀疏差分数组
  }

  add(from, to, amount) {
    this.map.set(from, (this.map.get(from) || 0) + amount);
    this.map.set(to, (this.map.get(to) || 0) - amount);
  }

  toString() {
    const positions = Array.from(this.map.keys()).sort((a, b) => a - b);
    const result = [];
    let sum = 0;

    for (const pos of positions) {
      sum += this.map.get(pos);
      if (sum !== 0 || result.length > 0) {
        result.push([pos, sum]);
      }
    }

    // 去除末尾的 0
    while (result.length > 0 && result[result.length - 1][1] === 0) {
      result.pop();
    }

    return JSON.stringify(result);
  }
}
```

---

## ⚡ 性能对比

### 场景：对数组进行 m 次区间更新，每次更新长度为 k

| 方法     | 单次更新 | m 次更新 | 最后查询 | 总时间复杂度 |
| -------- | -------- | -------- | -------- | ------------ |
| 暴力遍历 | O(k)     | O(m·k)   | O(1)     | **O(m·k)**   |
| 差分数组 | O(1)     | O(m)     | O(n)     | **O(m + n)** |

**结论**：当 `m·k >> m + n` 时，差分数组优势明显！

---

## 💡 进阶技巧

### 技巧 1：二维差分数组

**问题**：对矩阵的子矩阵进行批量更新

```javascript
// 子矩阵 (r1, c1) 到 (r2, c2) 增加 value
diff[r1][c1] += value;
diff[r1][c2 + 1] -= value;
diff[r2 + 1][c1] -= value;
diff[r2 + 1][c2 + 1] += value;
```

---

### 技巧 2：树上差分

**问题**：对树的路径进行批量更新

```javascript
// 路径 u → v 增加 value
diff[u] += value;
diff[v] += value;
diff[lca(u, v)] -= value; // 最近公共祖先
diff[parent[lca(u, v)]] -= value;
```

---

## ❓ 常见问题 FAQ

### Q1: 为什么是 `diff[right + 1] -= value`，而不是 `diff[right] -= value`？

**答**：因为区间是 **[left, right]（闭区间）**，right 位置**包含在内**。

```javascript
区间 [2, 5] +3:
位置:  0  1  2  3  4  5  6  7
       0  0  3  3  3  3  0  0
              ↑---------↑
           包含 2 和 5

差分标记:
diff[2] += 3;   // 从 2 开始 +3
diff[6] -= 3;   // 从 6 开始取消（5 的下一位）
```

如果写成 `diff[5] -= 3`，位置 5 就不会被累加到了！

---

### Q2: 什么时候用差分，什么时候用前缀和？

| 场景         | 用差分 | 用前缀和 |
| ------------ | ------ | -------- |
| 频繁区间更新 | ✅     | ❌       |
| 频繁区间查询 | ❌     | ✅       |
| 单次初始化   | 都可以 | 都可以   |

**记忆**：

- **前缀和** = 查询快（O(1)），更新慢（O(n)）
- **差分** = 更新快（O(1)），查询慢（O(n)）

---

### Q3: 差分数组可以处理乘法吗？

**答**：不能直接处理。差分数组利用的是**加法的线性性质**：

```
(a + b) - a = b  ✓

但乘法不满足:
(a × b) ÷ a ≠ b (当a=0时)
```

**解决方案**：如果需要乘法，可以使用**线段树**或**树状数组**。

---

## 📚 相关 LeetCode 题目

| 题号 | 题目                       | 难度 | 标签 |
| ---- | -------------------------- | ---- | ---- |
| 370  | 区间加法                   | 中等 | 差分 |
| 1109 | 航班预订统计               | 中等 | 差分 |
| 1094 | 拼车                       | 中等 | 差分 |
| 1589 | 所有排列中的最大和         | 中等 | 差分 |
| 2381 | 字母移位 II                | 中等 | 差分 |
| 2772 | 使数组中的所有元素都等于零 | 中等 | 差分 |

---

## 🎯 三步记忆法

1. **建立差分数组**：记录每个位置相对前一个位置的变化量
2. **区间更新**：在起点 +value，在终点后一位 -value
3. **前缀和恢复**：从左到右累加差分数组，得到原数组

---

## 📖 总结

| 特性           | 说明                       |
| -------------- | -------------------------- |
| **核心思想**   | 用变化量代替绝对值         |
| **主要用途**   | 区间批量更新               |
| **时间复杂度** | 更新 O(1)，恢复 O(n)       |
| **空间复杂度** | O(n)                       |
| **适用场景**   | 频繁区间修改，最后统一查询 |
| **不适用场景** | 频繁单点查询               |

---

## 🔗 相关算法

- **前缀和**：差分的逆操作
- **树状数组**：支持单点更新 + 区间查询
- **线段树**：支持区间更新 + 区间查询
- **扫描线算法**：处理区间问题的通用思路
