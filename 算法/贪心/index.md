# 贪心算法专题

## 一、核心思想

**贪心算法（Greedy Algorithm）**：在每一步选择中都采取当前状态下最优的选择，从而希望导致全局最优解。

### 贪心算法的特点

1. **贪心选择性质**：每一步都选择当前最优解，不考虑未来的影响
2. **最优子结构**：问题的最优解包含子问题的最优解
3. **无后效性**：当前的选择不会影响以前的选择，也不受以前选择的影响

### 贪心 vs 动态规划

| 特性       | 贪心算法           | 动态规划           |
| ---------- | ------------------ | ------------------ |
| 选择方式   | 每步做局部最优选择 | 考虑所有可能的选择 |
| 解的性质   | 不一定是最优解     | 一定是最优解       |
| 时间复杂度 | 通常更低           | 通常较高           |
| 适用场景   | 局部最优=全局最优  | 需要考虑所有子问题 |

### 贪心算法解题步骤

```plaintext
1. 识别问题是否适合贪心
   - 是否具有贪心选择性质？
   - 是否具有最优子结构？

2. 确定贪心策略
   - 每一步选择什么？
   - 按什么标准选择？

3. 证明正确性（面试时可省略）
   - 证明局部最优能导致全局最优

4. 编码实现
```

---

## 二、经典题型分类

### 1. 区间调度问题

#### 1.1 无重叠区间（LeetCode 435）

**问题描述**：给定多个区间，计算让这些区间互不重叠所需要移除区间的最小数量。

**核心思路**：

- 贪心策略：按区间结束时间排序，优先选择结束早的区间
- 为什么？结束越早，给后面的区间留出的空间越大

```javascript
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;

  // 按结束时间排序
  intervals.sort((a, b) => a[1] - b[1]);

  let count = 1; // 至少保留一个区间
  let end = intervals[0][1]; // 当前选中的区间结束时间

  for (let i = 1; i < intervals.length; i++) {
    // 如果当前区间的开始时间 >= 上一个选中区间的结束时间
    // 说明不重叠，可以保留
    if (intervals[i][0] >= end) {
      count++;
      end = intervals[i][1];
    }
  }

  // 需要移除的数量 = 总数 - 保留的数量
  return intervals.length - count;
}
```

**时间复杂度**：O(n log n)，主要是排序
**空间复杂度**：O(1)

#### 1.2 用最少数量的箭引爆气球（LeetCode 452）

**问题描述**：有若干区间表示气球的位置，一支箭可以引爆所有与箭位置重叠的气球，求最少需要多少支箭。

**核心思路**：

- 贪心策略：按结束时间排序，尽可能让一支箭射穿更多气球
- 当当前气球的开始位置 > 上一支箭的位置时，需要新的箭

```javascript
function findMinArrowShots(points) {
  if (points.length === 0) return 0;

  // 按结束位置排序
  points.sort((a, b) => a[1] - b[1]);

  let arrows = 1; // 至少需要一支箭
  let end = points[0][1]; // 当前箭的位置

  for (let i = 1; i < points.length; i++) {
    // 如果当前气球的起始位置 > 箭的位置，说明射不到，需要新箭
    if (points[i][0] > end) {
      arrows++;
      end = points[i][1]; // 更新箭的位置
    }
  }

  return arrows;
}
```

#### 1.3 会议室 II（LeetCode 253）

**问题描述**：给定一系列会议时间，求需要的最少会议室数量。

**核心思路**：

- 贪心策略：扫描线算法，统计同一时刻的最大会议数
- 方法 1：开始和结束分别排序
- 方法 2：使用最小堆维护当前进行的会议

```javascript
// 方法1：开始和结束分别排序
function minMeetingRooms(intervals) {
  if (intervals.length === 0) return 0;

  const starts = intervals.map((i) => i[0]).sort((a, b) => a - b);
  const ends = intervals.map((i) => i[1]).sort((a, b) => a - b);

  let rooms = 0;
  let endPointer = 0;

  for (let i = 0; i < starts.length; i++) {
    // 如果有会议结束，释放会议室
    if (starts[i] >= ends[endPointer]) {
      endPointer++;
    } else {
      // 需要新会议室
      rooms++;
    }
  }

  return rooms;
}

// 方法2：最小堆（优先队列）
function minMeetingRoomsHeap(intervals) {
  if (intervals.length === 0) return 0;

  // 按开始时间排序
  intervals.sort((a, b) => a[0] - b[0]);

  const minHeap = [intervals[0][1]]; // 存储会议结束时间

  for (let i = 1; i < intervals.length; i++) {
    // 如果当前会议开始时间 >= 最早结束的会议时间
    if (intervals[i][0] >= minHeap[0]) {
      minHeap.shift(); // 释放会议室
    }

    minHeap.push(intervals[i][1]);
    minHeap.sort((a, b) => a - b); // 维护最小堆
  }

  return minHeap.length;
}
```

---

### 2. 股票买卖问题

#### 2.1 买卖股票的最佳时机 II（LeetCode 122）

**问题描述**：可以多次买卖股票（同一时间只能持有一支），求最大利润。

**核心思路**：

- 贪心策略：只要明天价格比今天高，今天买明天卖
- 累加所有上涨的差价

```javascript
function maxProfit(prices) {
  let profit = 0;

  for (let i = 1; i < prices.length; i++) {
    // 只要有上涨就买卖
    if (prices[i] > prices[i - 1]) {
      profit += prices[i] - prices[i - 1];
    }
  }

  return profit;
}
```

**时间复杂度**：O(n)
**空间复杂度**：O(1)

---

### 3. 跳跃游戏

#### 3.1 跳跃游戏（LeetCode 55）

**问题描述**：给定一个非负整数数组，每个元素代表在该位置可以跳跃的最大长度，判断是否能到达最后一个位置。

**核心思路**：

- 贪心策略：维护当前能到达的最远位置
- 遍历数组，不断更新最远位置

```javascript
function canJump(nums) {
  let maxReach = 0; // 当前能到达的最远位置

  for (let i = 0; i < nums.length; i++) {
    // 如果当前位置超出了能到达的最远位置，返回false
    if (i > maxReach) return false;

    // 更新最远位置
    maxReach = Math.max(maxReach, i + nums[i]);

    // 如果已经能到达最后一个位置，提前返回
    if (maxReach >= nums.length - 1) return true;
  }

  return true;
}
```

#### 3.2 跳跃游戏 II（LeetCode 45）

**问题描述**：求到达最后一个位置的最少跳跃次数。

**核心思路**：

- 贪心策略：在当前跳跃范围内，选择能跳到最远位置的点
- 记录当前跳跃范围的边界，到达边界时跳跃次数+1

```javascript
function jump(nums) {
  let jumps = 0; // 跳跃次数
  let currentEnd = 0; // 当前跳跃的边界
  let maxReach = 0; // 在当前范围内能到达的最远位置

  // 不需要遍历最后一个元素
  for (let i = 0; i < nums.length - 1; i++) {
    // 更新在当前范围内能到达的最远位置
    maxReach = Math.max(maxReach, i + nums[i]);

    // 到达当前跳跃的边界
    if (i === currentEnd) {
      jumps++;
      currentEnd = maxReach; // 更新边界为最远位置

      // 如果已经能到达最后一个位置，提前返回
      if (currentEnd >= nums.length - 1) break;
    }
  }

  return jumps;
}
```

---

### 4. 字符串问题

#### 4.1 分发饼干（LeetCode 455）

**问题描述**：每个孩子有一个胃口值，每个饼干有一个尺寸，只有饼干尺寸 >= 孩子胃口值时才能满足。求最多能满足多少孩子。

**核心思路**：

- 贪心策略：优先用小饼干满足胃口小的孩子
- 对孩子和饼干分别排序，双指针匹配

```javascript
function findContentChildren(g, s) {
  g.sort((a, b) => a - b); // 孩子胃口排序
  s.sort((a, b) => a - b); // 饼干尺寸排序

  let child = 0; // 孩子指针
  let cookie = 0; // 饼干指针

  while (child < g.length && cookie < s.length) {
    // 如果饼干能满足孩子
    if (s[cookie] >= g[child]) {
      child++; // 满足下一个孩子
    }
    cookie++; // 尝试下一块饼干
  }

  return child;
}
```

#### 4.2 柠檬水找零（LeetCode 860）

**问题描述**：柠檬水 5 美元一杯，顾客会支付 5、10 或 20 美元，判断能否给每位顾客正确找零。

**核心思路**：

- 贪心策略：优先使用大面额找零
- 维护 5 美元和 10 美元的数量

```javascript
function lemonadeChange(bills) {
  let five = 0; // 5美元数量
  let ten = 0; // 10美元数量

  for (const bill of bills) {
    if (bill === 5) {
      five++;
    } else if (bill === 10) {
      if (five === 0) return false;
      five--;
      ten++;
    } else {
      // bill === 20
      // 优先用10+5找零，其次用5+5+5
      if (ten > 0 && five > 0) {
        ten--;
        five--;
      } else if (five >= 3) {
        five -= 3;
      } else {
        return false;
      }
    }
  }

  return true;
}
```

---

### 5. 数组问题

#### 5.1 摆动序列（LeetCode 376）

**问题描述**：找出数组中最长摆动子序列的长度（元素的差值正负交替）。

**核心思路**：

- 贪心策略：只保留峰值和谷值
- 删除单调序列中间的元素

```javascript
function wiggleMaxLength(nums) {
  if (nums.length < 2) return nums.length;

  let prevDiff = 0; // 上一次的差值
  let count = 1; // 至少有一个元素

  for (let i = 1; i < nums.length; i++) {
    const diff = nums[i] - nums[i - 1];

    // 如果是峰值或谷值（差值符号改变）
    if ((diff > 0 && prevDiff <= 0) || (diff < 0 && prevDiff >= 0)) {
      count++;
      prevDiff = diff; // 更新差值
    }
  }

  return count;
}
```

#### 5.2 单调递增的数字（LeetCode 738）

**问题描述**：给定一个非负整数 N，找出小于等于 N 的最大单调递增数字。

**核心思路**：

- 贪心策略：从左到右找到第一个递减的位置
- 该位置-1，后面全部填 9

```javascript
function monotoneIncreasingDigits(n) {
  const digits = n.toString().split("");
  let mark = digits.length; // 标记从哪里开始填9

  // 从右往左遍历
  for (let i = digits.length - 1; i > 0; i--) {
    if (digits[i - 1] > digits[i]) {
      mark = i;
      digits[i - 1]--; // 当前位-1
    }
  }

  // 从mark位置开始全部填9
  for (let i = mark; i < digits.length; i++) {
    digits[i] = "9";
  }

  return parseInt(digits.join(""));
}
```

---

### 6. 加油站问题

#### 6.1 加油站（LeetCode 134）

**问题描述**：有 N 个加油站围成一圈，每个加油站有汽油 gas[i]，从 i 到 i+1 需要消耗 cost[i]，判断能否环绕一圈，如果能返回起始位置。

**核心思路**：

- 贪心策略：如果总油量 < 总消耗，一定无解
- 从 0 开始累加，如果累加和<0，说明 0~i 都不能作为起点，尝试从 i+1 开始

```javascript
function canCompleteCircuit(gas, cost) {
  let totalTank = 0; // 总油量 - 总消耗
  let currentTank = 0; // 当前油量
  let start = 0; // 起始位置

  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    totalTank += diff;
    currentTank += diff;

    // 如果当前油量<0，说明0~i都不能作为起点
    if (currentTank < 0) {
      start = i + 1;
      currentTank = 0;
    }
  }

  // 如果总油量<0，无解
  return totalTank >= 0 ? start : -1;
}
```

**时间复杂度**：O(n)
**空间复杂度**：O(1)

---

### 7. 分发糖果

#### 7.1 分发糖果（LeetCode 135）

**问题描述**：有 N 个孩子站成一排，每个孩子有一个评分。要求：

1. 每个孩子至少 1 颗糖
2. 评分更高的孩子比相邻的孩子获得更多糖果

求最少需要多少糖果。

**核心思路**：

- 贪心策略：两次遍历
- 第一次从左到右：右边评分高的比左边多 1
- 第二次从右到左：左边评分高的比右边多 1

```javascript
function candy(ratings) {
  const n = ratings.length;
  const candies = new Array(n).fill(1);

  // 从左到右：如果右边评分高，糖果+1
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) {
      candies[i] = candies[i - 1] + 1;
    }
  }

  // 从右到左：如果左边评分高，糖果取max
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) {
      candies[i] = Math.max(candies[i], candies[i + 1] + 1);
    }
  }

  return candies.reduce((sum, c) => sum + c, 0);
}
```

**时间复杂度**：O(n)
**空间复杂度**：O(n)

---

## 三、识别技巧

### 如何判断一道题适合用贪心？

✅ **适合贪心的特征**：

1. 问题求**最大/最小值**
2. 问题有明显的**局部最优选择**
3. 问题描述中有"**最多**"、"**最少**"、"**至少**"等关键词
4. 涉及**区间、排序、调度**等场景
5. **暴力解法是指数级**，但问题有规律可循

❌ **不适合贪心的特征**：

1. 需要考虑**所有可能的组合**（回溯）
2. 需要**记录历史状态**（动态规划）
3. 问题有**多个维度的约束**
4. 局部最优**不能导致**全局最优

### 常见贪心策略

| 策略           | 适用场景           | 示例               |
| -------------- | ------------------ | ------------------ |
| **排序**       | 区间调度、任务安排 | 会议室、无重叠区间 |
| **双指针**     | 数组匹配           | 分发饼干           |
| **维护最优解** | 股票交易           | 买卖股票 II        |
| **边界更新**   | 跳跃、覆盖         | 跳跃游戏           |
| **两次遍历**   | 双向依赖           | 分发糖果           |

---

## 四、面试技巧

### 1. 解题步骤

```plaintext
1. 理解题意
   - 输入是什么？
   - 输出是什么？
   - 有什么约束条件？

2. 寻找贪心策略
   - 每一步应该选什么？
   - 按什么标准选择？
   - 为什么这样选是最优的？

3. 验证策略
   - 用小数据集手动模拟
   - 考虑边界情况
   - 思考反例

4. 编码实现
   - 先写暴力解（如果简单）
   - 再写贪心优化
   - 添加注释说明策略

5. 测试验证
   - 正常情况
   - 边界情况（空数组、单元素等）
   - 特殊情况
```

### 2. 常见面试问题

**Q: 如何证明贪心策略的正确性？**
A: 常用方法：

- 反证法：假设贪心解不是最优解，推导矛盾
- 交换论证：证明任何非贪心解都可以通过交换变成贪心解
- 数学归纳法：证明每一步的局部最优能保持全局最优

**Q: 贪心和动态规划有什么区别？**
A:

- 贪心：每步做局部最优选择，不回头
- DP：考虑所有可能，保存中间状态，可能回溯

**Q: 什么时候用贪心，什么时候用 DP？**
A:

- 贪心：局部最优=全局最优时
- DP：需要考虑所有子问题时

### 3. 时间复杂度速查

| 算法        | 时间复杂度 | 空间复杂度 |
| ----------- | ---------- | ---------- |
| 区间调度    | O(n log n) | O(1)       |
| 股票买卖 II | O(n)       | O(1)       |
| 跳跃游戏    | O(n)       | O(1)       |
| 分发饼干    | O(n log n) | O(1)       |
| 柠檬水找零  | O(n)       | O(1)       |
| 加油站      | O(n)       | O(1)       |
| 分发糖果    | O(n)       | O(n)       |

---

## 五、高频题目清单

### ⭐⭐⭐ 必刷题目

| 题号 | 题目                   | 难度 | 核心策略       |
| ---- | ---------------------- | ---- | -------------- |
| 455  | 分发饼干               | 简单 | 排序+双指针    |
| 122  | 买卖股票的最佳时机 II  | 中等 | 累加差价       |
| 55   | 跳跃游戏               | 中等 | 维护最远位置   |
| 45   | 跳跃游戏 II            | 中等 | 记录边界       |
| 435  | 无重叠区间             | 中等 | 按结束时间排序 |
| 452  | 用最少数量的箭引爆气球 | 中等 | 按结束位置排序 |
| 134  | 加油站                 | 中等 | 累加油量       |
| 135  | 分发糖果               | 困难 | 两次遍历       |

### ⭐⭐ 重要题目

| 题号 | 题目                     | 难度 |
| ---- | ------------------------ | ---- |
| 253  | 会议室 II                | 中等 |
| 376  | 摆动序列                 | 中等 |
| 406  | 根据身高重建队列         | 中等 |
| 621  | 任务调度器               | 中等 |
| 738  | 单调递增的数字           | 中等 |
| 860  | 柠檬水找零               | 简单 |
| 1005 | K 次取反后最大化的数组和 | 简单 |

---

## 六、代码模板

### 区间调度模板

```javascript
function intervalScheduling(intervals) {
  // 1. 按结束时间排序
  intervals.sort((a, b) => a[1] - b[1]);

  let count = 0;
  let end = -Infinity;

  for (const interval of intervals) {
    // 2. 如果不重叠，选择该区间
    if (interval[0] >= end) {
      count++;
      end = interval[1];
    }
  }

  return count;
}
```

### 双指针贪心模板

```javascript
function twoPointerGreedy(arr1, arr2) {
  // 1. 排序
  arr1.sort((a, b) => a - b);
  arr2.sort((a, b) => a - b);

  let i = 0,
    j = 0;
  let result = 0;

  // 2. 双指针遍历
  while (i < arr1.length && j < arr2.length) {
    if (满足条件) {
      result++;
      i++;
      j++;
    } else {
      j++; // 或 i++
    }
  }

  return result;
}
```

### 最远覆盖模板

```javascript
function maxReach(arr) {
  let maxReach = 0;

  for (let i = 0; i < arr.length; i++) {
    // 如果当前位置不可达，返回失败
    if (i > maxReach) return false;

    // 更新最远位置
    maxReach = Math.max(maxReach, i + arr[i]);

    // 如果已经能到达终点，提前返回
    if (maxReach >= arr.length - 1) return true;
  }

  return true;
}
```

---

## 七、总结

### 贪心算法核心要点

1. **识别关键**：看到"最大/最小"、"至少/最多"，考虑贪心
2. **策略设计**：明确每一步选择什么，为什么这样选
3. **排序思维**：很多贪心问题需要先排序
4. **局部最优**：每步选择局部最优，不考虑后续影响
5. **边界处理**：注意空数组、单元素等边界情况

### 学习建议

1. **先理解思想**：明白为什么贪心策略是正确的
2. **多做练习**：从简单题入手，逐步提高
3. **总结模板**：归纳常见的贪心模式
4. **对比 DP**：理解贪心和动态规划的区别
5. **验证正确性**：多用小数据集手动模拟

### 刷题路线

```plaintext
初级（简单题）
├── 455. 分发饼干
├── 860. 柠檬水找零
└── 1005. K次取反后最大化的数组和

中级（中等题）
├── 122. 买卖股票的最佳时机 II
├── 55. 跳跃游戏
├── 435. 无重叠区间
└── 452. 用最少数量的箭引爆气球

高级（困难题）
├── 45. 跳跃游戏 II
├── 135. 分发糖果
└── 134. 加油站
```

---

**最后提醒**：

- 贪心不是万能的，不是所有问题都适合贪心
- 如果贪心解法不正确，考虑动态规划
- 面试时一定要解释为什么贪心策略是正确的

**Good luck! 🚀**
