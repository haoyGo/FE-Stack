
### 1. 斐波那契数列 【难度：简单】【频率：高】

**问题描述**：计算斐波那契数列的第n个数。

**解题思路**：使用动态规划避免递归的重复计算。

```javascript
// 动态规划解法
function fib(n) {
  if (n <= 1) return n;
  
  let dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
  }
  
  return dp[n];
}

// 优化空间复杂度
function fibOptimized(n) {
  if (n <= 1) return n;
  
  let prev = 0;
  let curr = 1;
  
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  
  return curr;
}
```

### 2. 爬楼梯 【难度：简单】【频率：高】

**问题描述**：假设你正在爬楼梯，需要n阶才能到达楼顶。每次你可以爬1或2个台阶，问有多少种不同的方法可以爬到楼顶？

**解题思路**：类似斐波那契数列，第n阶的方法数等于第n-1阶和第n-2阶方法数之和。

```javascript
function climbStairs(n) {
  if (n <= 2) return n;
  
  let prev = 1;
  let curr = 2;
  
  for (let i = 3; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  
  return curr;
}
```

### 3. 0-1背包问题 【难度：中】【频率：中】

**问题描述**：给定n个物品，每个物品有重量和价值两个属性。在总重量不超过背包容量的情况下，选择物品使得总价值最大。

**解题思路**：使用二维数组dp[i][j]表示前i个物品放入容量为j的背包的最大价值。
状态转移方程`dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])`来求解。

```javascript
function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= capacity; j++) {
      if (weights[i-1] <= j) {
        dp[i][j] = Math.max(
          dp[i-1][j],
          dp[i-1][j-weights[i-1]] + values[i-1]
        );
      } else {
        dp[i][j] = dp[i-1][j];
      }
    }
  }
  
  return dp[n][capacity];
}
```

### 4. 最长公共子序列 【难度：中】【频率：中】

**问题描述**：给定两个字符串，求它们的最长公共子序列的长度。

**解题思路**：使用二维dp数组，dp[i][j]表示text1的前i个字符与text2的前j个字符的最长公共子序列长度。

```javascript
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i-1] === text2[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  return dp[m][n];
}
```
