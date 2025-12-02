# 单调队列算法速查手册

## 🎯 核心思想

单调队列是一种特殊的双端队列，**队列中的元素保持单调性**（递增或递减）。

**核心特点**：

- **维护区间最值**：快速获取滑动窗口的最大/最小值
- **双端操作**：队首获取答案，队尾维护单调性
- **单调性**：队列元素严格单调递增/递减

**时间复杂度**：O(n) - 每个元素最多入队出队一次

---

## 📋 快速识别

### 关键词识别

- **滑动窗口最大值/最小值**
- **区间最值查询**
- **维护 k 个元素的最值**
- **动态维护最大值/最小值**
- **子数组最值问题**

### 适用场景

1. 滑动窗口的最大值/最小值
2. 动态维护区间最值
3. 单调栈解决不了的区间问题
4. 需要 O(1)查询窗口最值

---

## 🔧 标准模板

### 单调递减队列（维护最大值）

```javascript
function maxSlidingWindow(nums, k) {
  const deque = []; // 存储数组索引
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // 1. 移除队首过期元素（超出窗口范围）
    while (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // 2. 维护单调递减性：移除队尾所有小于当前元素的索引
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }

    // 3. 当前元素索引入队
    deque.push(i);

    // 4. 窗口形成后，队首就是最大值
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}
```

### 单调递增队列（维护最小值）

```javascript
function minSlidingWindow(nums, k) {
  const deque = []; // 存储数组索引
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // 1. 移除队首过期元素
    while (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // 2. 维护单调递增性：移除队尾所有大于当前元素的索引
    while (deque.length > 0 && nums[deque[deque.length - 1]] > nums[i]) {
      deque.pop();
    }

    // 3. 当前元素索引入队
    deque.push(i);

    // 4. 窗口形成后，队首就是最小值
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}
```

---

## 💡 经典题目

### 1️⃣ LeetCode 239. 滑动窗口最大值

```javascript
function maxSlidingWindow(nums, k) {
  if (k === 1) return nums;

  const deque = [];
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // 移除队首过期元素
    while (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // 维护单调递减
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }

    deque.push(i);

    // 收集答案
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}
```

### 2️⃣ LeetCode 862. 和至少为 K 的最短子数组

```javascript
function shortestSubarray(nums, k) {
  const n = nums.length;
  const prefixSum = new Array(n + 1).fill(0);

  // 计算前缀和
  for (let i = 0; i < n; i++) {
    prefixSum[i + 1] = prefixSum[i] + nums[i];
  }

  const deque = [];
  let minLen = Infinity;

  for (let i = 0; i <= n; i++) {
    // 找到满足条件的最短子数组
    while (deque.length > 0 && prefixSum[i] - prefixSum[deque[0]] >= k) {
      minLen = Math.min(minLen, i - deque.shift());
    }

    // 维护单调递增（前缀和）
    while (
      deque.length > 0 &&
      prefixSum[i] <= prefixSum[deque[deque.length - 1]]
    ) {
      deque.pop();
    }

    deque.push(i);
  }

  return minLen === Infinity ? -1 : minLen;
}
```

### 3️⃣ LeetCode 1438. 绝对差不超过限制的最长连续子数组

```javascript
function longestSubarray(nums, limit) {
  const maxDeque = []; // 单调递减队列（维护最大值）
  const minDeque = []; // 单调递增队列（维护最小值）

  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < nums.length; right++) {
    // 维护最大值队列
    while (
      maxDeque.length > 0 &&
      nums[maxDeque[maxDeque.length - 1]] < nums[right]
    ) {
      maxDeque.pop();
    }
    maxDeque.push(right);

    // 维护最小值队列
    while (
      minDeque.length > 0 &&
      nums[minDeque[minDeque.length - 1]] > nums[right]
    ) {
      minDeque.pop();
    }
    minDeque.push(right);

    // 收缩窗口
    while (nums[maxDeque[0]] - nums[minDeque[0]] > limit) {
      if (maxDeque[0] === left) maxDeque.shift();
      if (minDeque[0] === left) minDeque.shift();
      left++;
    }

    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
```

### 4️⃣ LeetCode 1499. 满足不等式的最大值

```javascript
function findMaxValueOfEquation(points, k) {
  // yi + yj + |xi - xj| = (yi - xi) + (yj + xj)
  // 维护 yi - xi 的最大值
  const deque = []; // 存储索引
  let maxVal = -Infinity;

  for (let j = 0; j < points.length; j++) {
    const [xj, yj] = points[j];

    // 移除距离超过k的点
    while (deque.length > 0 && xj - points[deque[0]][0] > k) {
      deque.shift();
    }

    // 计算答案
    if (deque.length > 0) {
      const i = deque[0];
      const [xi, yi] = points[i];
      maxVal = Math.max(maxVal, yi - xi + yj + xj);
    }

    // 维护单调递减（yi - xi）
    const val = yj - xj;
    while (deque.length > 0) {
      const idx = deque[deque.length - 1];
      const [x, y] = points[idx];
      if (y - x < val) {
        deque.pop();
      } else {
        break;
      }
    }

    deque.push(j);
  }

  return maxVal;
}
```

### 5️⃣ LeetCode 1696. 跳跃游戏 VI

```javascript
function maxResult(nums, k) {
  const n = nums.length;
  const dp = new Array(n);
  const deque = []; // 单调递减队列（维护最大dp值）

  dp[0] = nums[0];
  deque.push(0);

  for (let i = 1; i < n; i++) {
    // 移除超出范围的索引
    while (deque.length > 0 && deque[0] < i - k) {
      deque.shift();
    }

    // 当前位置的最大得分
    dp[i] = nums[i] + dp[deque[0]];

    // 维护单调递减
    while (deque.length > 0 && dp[deque[deque.length - 1]] <= dp[i]) {
      deque.pop();
    }

    deque.push(i);
  }

  return dp[n - 1];
}
```

### 6️⃣ LeetCode 918. 环形子数组的最大和

```javascript
function maxSubarraySumCircular(nums) {
  const n = nums.length;

  // 情况1：最大子数组不跨越边界（标准最大子数组和）
  let maxSum = nums[0];
  let currMax = nums[0];

  for (let i = 1; i < n; i++) {
    currMax = Math.max(nums[i], currMax + nums[i]);
    maxSum = Math.max(maxSum, currMax);
  }

  // 情况2：最大子数组跨越边界
  // 等价于：总和 - 最小子数组和
  const totalSum = nums.reduce((a, b) => a + b, 0);
  let minSum = nums[0];
  let currMin = nums[0];

  for (let i = 1; i < n; i++) {
    currMin = Math.min(nums[i], currMin + nums[i]);
    minSum = Math.min(minSum, currMin);
  }

  // 特殊情况：所有元素都是负数
  if (maxSum < 0) return maxSum;

  return Math.max(maxSum, totalSum - minSum);
}
```

---

## 🎨 解题技巧

### 技巧 1：队列存储索引而非值

```javascript
// ✅ 正确：存储索引
const deque = []; // 存索引
deque.push(i);
const maxVal = nums[deque[0]]; // 通过索引获取值

// ❌ 错误：直接存值
const deque = [];
deque.push(nums[i]); // 无法判断是否超出窗口
```

### 技巧 2：单调性的选择

```javascript
// 维护最大值 → 单调递减队列
while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
  deque.pop();
}

// 维护最小值 → 单调递增队列
while (deque.length > 0 && nums[deque[deque.length - 1]] > nums[i]) {
  deque.pop();
}
```

### 技巧 3：双队列维护最大最小值

```javascript
function solve(nums) {
  const maxQ = []; // 单调递减
  const minQ = []; // 单调递增

  for (let i = 0; i < nums.length; i++) {
    // 维护最大值
    while (maxQ.length > 0 && nums[maxQ[maxQ.length - 1]] < nums[i]) {
      maxQ.pop();
    }
    maxQ.push(i);

    // 维护最小值
    while (minQ.length > 0 && nums[minQ[minQ.length - 1]] > nums[i]) {
      minQ.pop();
    }
    minQ.push(i);

    // 使用最大值和最小值
    const max = nums[maxQ[0]];
    const min = nums[minQ[0]];
  }
}
```

### 技巧 4：移除过期元素的时机

```javascript
// 在处理新元素之前移除过期元素
for (let i = 0; i < nums.length; i++) {
  // 1. 先移除过期元素
  while (deque.length > 0 && deque[0] <= i - k) {
    deque.shift();
  }

  // 2. 再维护单调性
  while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
    deque.pop();
  }

  // 3. 加入当前元素
  deque.push(i);
}
```

---

## 🔍 解题思路 SOP

### Step 1: 识别题型

- 看到**滑动窗口最值** → 单调队列
- 看到**区间最值查询** → 单调队列
- 看到**动态维护最大/最小值** → 单调队列
- 看到**k 个元素的最值** → 单调队列

### Step 2: 确定单调性

- **求最大值** → 单调递减队列（队首最大）
- **求最小值** → 单调递增队列（队首最小）
- **同时求最大最小** → 两个队列

### Step 3: 实现逻辑

1. **移除过期元素**：检查队首是否超出窗口
2. **维护单调性**：从队尾移除不符合单调性的元素
3. **加入新元素**：将当前索引加入队尾
4. **获取答案**：队首元素就是当前窗口的最值

### Step 4: 注意事项

- 队列存储**索引**而非值
- 先移除过期，再维护单调性
- 窗口形成后才开始收集答案

---

## ⚠️ 常见错误

### 错误 1：队列存值而非索引

```javascript
// ❌ 错误：存值无法判断是否过期
const deque = [];
deque.push(nums[i]);

// ✅ 正确：存索引
const deque = [];
deque.push(i);
const val = nums[deque[0]];
```

### 错误 2：单调性方向错误

```javascript
// ❌ 错误：求最大值用了递增队列
while (deque.length > 0 && nums[deque[deque.length - 1]] > nums[i]) {
  deque.pop(); // 错误！应该是 <
}

// ✅ 正确：求最大值用递减队列
while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
  deque.pop();
}
```

### 错误 3：忘记移除过期元素

```javascript
// ❌ 错误：未移除超出窗口的元素
for (let i = 0; i < nums.length; i++) {
  // 忘记移除！
  while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
    deque.pop();
  }
  deque.push(i);
}

// ✅ 正确：先移除过期元素
for (let i = 0; i < nums.length; i++) {
  while (deque.length > 0 && deque[0] <= i - k) {
    deque.shift();
  }
  // ...
}
```

### 错误 4：窗口未形成就收集答案

```javascript
// ❌ 错误：窗口未形成就开始收集
for (let i = 0; i < nums.length; i++) {
  // ...
  result.push(nums[deque[0]]); // 错误！
}

// ✅ 正确：窗口形成后再收集
for (let i = 0; i < nums.length; i++) {
  // ...
  if (i >= k - 1) {
    result.push(nums[deque[0]]);
  }
}
```

---

## 📝 高频题目清单

| 题号 | 题目                             | 难度   | 类型        | 关键点          |
| ---- | -------------------------------- | ------ | ----------- | --------------- |
| 239  | 滑动窗口最大值                   | Hard   | 基础        | 单调递减队列    |
| 862  | 和至少为 K 的最短子数组          | Hard   | 前缀和+队列 | 单调递增队列    |
| 1438 | 绝对差不超过限制的最长连续子数组 | Medium | 双队列      | 最大最小值      |
| 1499 | 满足不等式的最大值               | Hard   | 数学转换    | 维护最大值      |
| 1696 | 跳跃游戏 VI                      | Medium | DP+队列     | 优化 DP         |
| 918  | 环形子数组的最大和               | Medium | 变形        | 最大/最小子数组 |
| 1425 | 带限制的子序列和                 | Hard   | DP+队列     | 单调队列优化    |

---

## 🎯 面试沟通要点

### 开始时

1. **确认题型**：

   - "这是滑动窗口求最值的问题，我用单调队列来解决"
   - "需要 O(n)时间复杂度，单调队列是最优解"

2. **说明思路**：
   - "用单调递减队列维护最大值，队首就是当前窗口最大值"
   - "队列存储索引，方便判断元素是否过期"

### 编码时

1. **解释操作**：

   - "先移除队首超出窗口的元素"
   - "从队尾移除所有小于当前元素的索引，维护单调性"

2. **说明复杂度**：
   - "每个元素最多入队出队一次，时间复杂度 O(n)"
   - "队列最多存 k 个元素，空间复杂度 O(k)"

### 结束时

- **时间复杂度**：O(n)
- **空间复杂度**：O(k) - k 为窗口大小

---

## 💡 总结

### 核心要点

1. **单调队列本质**：维护窗口内的单调性，快速查询最值
2. **队列存储**：存索引而非值，方便判断过期
3. **单调性选择**：最大值用递减，最小值用递增
4. **操作顺序**：先移除过期，再维护单调性，最后加入新元素
5. **时间复杂度**：O(n) - 每个元素最多入队出队一次

### 记忆口诀

```
单调队列维护值，队首答案队尾入
最大递减最小增，索引入队值来用
先移过期再单调，窗口形成收答案
双队列解最值差，时间O(n)空间k
```

---

**最后更新时间**：2024 年
