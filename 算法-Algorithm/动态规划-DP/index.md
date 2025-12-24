# 动态规划

## 🎯 核心原理

**动态规划（DP）**通过将问题分解为子问题，存储子问题的解，避免重复计算。

**核心要素**：

1. **重叠子问题** - 子问题会被多次求解
2. **最优子结构** - 问题的最优解包含子问题的最优解
3. **状态转移方程** - 描述状态之间的关系

**时间复杂度**：通常 O(n) ~ O(n²)  
**空间复杂度**：通常 O(n) ~ O(n²)（可优化为 O(1)）

---

## 📝 识别特征

看到这些关键词，考虑动态规划：

- **最大/最小值**
- **最长/最短**
- **方案数/计数**
- **是否可行**
- 关键词：最优、最多、最少、第 K 大

---

## 🔧 解题步骤（SOP）

```plaintext
1️⃣ 定义状态
   dp[i] 或 dp[i][j] 表示什么？

2️⃣ 找状态转移方程
   dp[i] 如何由 dp[i-1]、dp[i-2]... 推导？

3️⃣ 确定初始值
   dp[0]、dp[1] 等边界情况的值

4️⃣ 确定遍历顺序
   从前往后？从后往前？

5️⃣ 返回结果
   dp[n]？max(dp)？
```

---

## 📌 常见题型与模板

### 1. 线性 DP

#### LeetCode 70 - 爬楼梯 ⭐

**题目**：每次可以爬 1 或 2 个台阶，爬到第 n 阶有多少种方法？

```javascript
function climbStairs(n) {
  if (n <= 2) return n;

  let prev2 = 1; // dp[i-2]
  let prev1 = 2; // dp[i-1]

  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

---

#### LeetCode 198 - 打家劫舍 ⭐⭐

**题目**：相邻的房屋不能同时偷，求最大金额。

```javascript
function rob(nums) {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  let prev2 = 0; // dp[i-2]
  let prev1 = nums[0]; // dp[i-1]

  for (let i = 1; i < nums.length; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]);
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

---

#### LeetCode 213 - 打家劫舍 II ⭐⭐

**题目**：房屋围成一圈，首尾不能同时偷。

```javascript
function rob(nums) {
  if (nums.length === 1) return nums[0];

  function robRange(start, end) {
    let prev2 = 0,
      prev1 = 0;

    for (let i = start; i <= end; i++) {
      const curr = Math.max(prev1, prev2 + nums[i]);
      prev2 = prev1;
      prev1 = curr;
    }

    return prev1;
  }

  // 要么不偷第一个，要么不偷最后一个
  return Math.max(robRange(0, nums.length - 2), robRange(1, nums.length - 1));
}
```

---

### 2. 背包 DP

#### LeetCode 322 - 零钱兑换 ⭐⭐

**题目**：凑成总金额需要的最少硬币数。

```javascript
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i >= coin) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

---

#### LeetCode 518 - 零钱兑换 II ⭐⭐

**题目**：凑成总金额的组合数。

```javascript
function change(amount, coins) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] += dp[i - coin];
    }
  }

  return dp[amount];
}
```

---

#### 0-1 背包模板

```javascript
function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < n; i++) {
    // 倒序遍历，避免重复选择
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }

  return dp[capacity];
}
```

---

### 3. 子序列 DP

#### LeetCode 300 - 最长递增子序列 ⭐⭐⭐

**题目**：找到最长递增子序列的长度。

```javascript
// 方法1：DP O(n²)
function lengthOfLIS(nums) {
  const n = nums.length;
  const dp = new Array(n).fill(1);
  let maxLen = 1;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLen = Math.max(maxLen, dp[i]);
  }

  return maxLen;
}

// 方法2：贪心 + 二分 O(n log n)
function lengthOfLIS(nums) {
  const tails = [];

  for (const num of nums) {
    let left = 0,
      right = tails.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    if (left === tails.length) {
      tails.push(num);
    } else {
      tails[left] = num;
    }
  }

  return tails.length;
}
```

---

#### LeetCode 1143 - 最长公共子序列 ⭐⭐

**题目**：找到两个字符串的最长公共子序列。

```javascript
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
```

---

#### LeetCode 72 - 编辑距离 ⭐⭐⭐

**题目**：将 word1 转换成 word2 的最少操作数。

```javascript
function minDistance(word1, word2) {
  const m = word1.length;
  const n = word2.length;
  const dp = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // 初始化
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // 删除
          dp[i][j - 1] + 1, // 插入
          dp[i - 1][j - 1] + 1 // 替换
        );
      }
    }
  }

  return dp[m][n];
}
```

---

### 4. 区间 DP

#### LeetCode 5 - 最长回文子串 ⭐⭐

**题目**：找到最长的回文子串。

```javascript
function longestPalindrome(s) {
  const n = s.length;
  const dp = Array(n)
    .fill(false)
    .map(() => Array(n).fill(false));
  let start = 0,
    maxLen = 1;

  // 单个字符
  for (let i = 0; i < n; i++) {
    dp[i][i] = true;
  }

  // 枚举子串长度
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i < n - len + 1; i++) {
      const j = i + len - 1;

      if (s[i] === s[j]) {
        if (len === 2) {
          dp[i][j] = true;
        } else {
          dp[i][j] = dp[i + 1][j - 1];
        }

        if (dp[i][j] && len > maxLen) {
          start = i;
          maxLen = len;
        }
      }
    }
  }

  return s.substring(start, start + maxLen);
}
```

---

### 5. 股票问题

#### LeetCode 121 - 买卖股票的最佳时机 ⭐

**题目**：只能买卖一次，求最大利润。

```javascript
function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;

  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
  }

  return maxProfit;
}
```

---

#### LeetCode 122 - 买卖股票的最佳时机 II ⭐

**题目**：可以多次买卖，求最大利润。

```javascript
function maxProfit(prices) {
  let profit = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      profit += prices[i] - prices[i - 1];
    }
  }

  return profit;
}
```

---

#### LeetCode 123 - 买卖股票的最佳时机 III ⭐⭐⭐

**题目**：最多完成两笔交易，求最大利润。

```javascript
function maxProfit(prices) {
  let buy1 = -Infinity,
    sell1 = 0;
  let buy2 = -Infinity,
    sell2 = 0;

  for (const price of prices) {
    buy1 = Math.max(buy1, -price);
    sell1 = Math.max(sell1, buy1 + price);
    buy2 = Math.max(buy2, sell1 - price);
    sell2 = Math.max(sell2, buy2 + price);
  }

  return sell2;
}
```

---

## 🎯 DP 优化技巧

### 1. 空间优化（滚动数组）

```javascript
// 从二维优化到一维
// 原：dp[i][j] = dp[i-1][j] + dp[i][j-1]
// 优化后：只用一维数组

const dp = new Array(n).fill(0);
for (let i = 0; i < m; i++) {
  for (let j = 0; j < n; j++) {
    // dp[j] 相当于 dp[i][j]
  }
}
```

### 2. 状态压缩

```javascript
// 只需保存前几个状态
let prev2 = 0,
  prev1 = 0;
for (let i = 0; i < n; i++) {
  const curr = prev1 + prev2;
  prev2 = prev1;
  prev1 = curr;
}
```

---

## 💡 面试技巧

1. **从暴力递归开始**：

   - 先写出递归解法
   - 识别重叠子问题
   - 加上记忆化（自顶向下）
   - 改写为 DP（自底向上）

2. **画表格辅助**：

   - 在纸上画出 DP 表格
   - 填入初始值
   - 根据转移方程填表

3. **沟通要点**：
   - "这是 DP 问题，有重叠子问题和最优子结构"
   - "dp[i]表示..."
   - "状态转移方程是..."
   - "时间复杂度 O(n²)，空间可以优化到 O(n)"

---

## 🔖 DP 类型速查

| 类型      | 状态定义     | 代表题目           |
| --------- | ------------ | ------------------ |
| 线性 DP   | dp[i]        | 爬楼梯、打家劫舍   |
| 背包 DP   | dp[i][w]     | 0-1 背包、零钱兑换 |
| 子序列 DP | dp[i][j]     | LCS、编辑距离      |
| 区间 DP   | dp[i][j]     | 最长回文子串       |
| 树形 DP   | dp[node]     | 树的直径           |
| 状态机 DP | dp[i][state] | 股票问题           |

---

**更新时间**：2024 年
