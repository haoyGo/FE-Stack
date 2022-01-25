**[剪绳子](https://leetcode-cn.com/problems/jian-sheng-zi-lcof/)**

给你一根长度为 n 的绳子，请把绳子剪成整数长度的 m 段（m、n都是整数，n>1并且m>1），每段绳子的长度记为 k[0],k[1]...k[m-1] 。请问 k[0]*k[1]*...*k[m-1] 可能的最大乘积是多少？例如，当绳子的长度是8时，我们把它剪成长度分别为2、3、3的三段，此时得到的最大乘积是18。

```
输入: 2
输出: 1
解释: 2 = 1 + 1, 1 × 1 = 1

输入: 10
输出: 36
解释: 10 = 3 + 3 + 4, 3 × 3 × 4 = 36

2 <= n <= 58
```

**解法**
``` js
// 动态规划
var cuttingRope = function(n) {
  const dp = [1, 1]
  for (let i = 2; i <= n; ++i) {
    let max = 0
    for (let j = 1; j < i; ++j) {
      max = Math.max(max, Math.max((i-j) * j, dp[i-j] * j))
    }
    dp[i] = max
  }

  return dp[n]
}

// 贪心，尽可能切成更多的3，然后是2
var cuttingRope = function(n) {
  if (n < 4) return n - 1

  const p = Math.floor(n / 3)
  const q = n % 3
  if (q === 0) {
    return Math.pow(3, p)
  } else if (q === 1) {
    return Math.pow(3, p - 1) * 4
  } else { // q === 2
    return Math.pow(3, p) * 2
  }
}
```