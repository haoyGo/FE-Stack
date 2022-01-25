**[青蛙跳台阶](https://leetcode-cn.com/problems/qing-wa-tiao-tai-jie-wen-ti-lcof/)**

一只青蛙一次可以跳上1级台阶，也可以跳上2级台阶。求该青蛙跳上一个 n 级的台阶总共有多少种跳法。

答案需要取模 1e9+7（1000000007），如计算初始结果为：1000000008，请返回 1。

```
输入：n = 2
输出：2

输入：n = 7
输出：21

输入：n = 0
输出：1
```

**解法**
``` js
// 动态规划
var numWays = function(n) {
  const dp = [1, 1, 2]

  for (let i = 3; i <= n; ++i) {
    dp[i] = (dp[i - 1] + dp[i - 2]) % (1e9 + 7)
  }

  return dp[n]
}

// 优化空间
var numWays = function(n) {
  if (n < 1) return 1

  let p = 1, v = 1, r
  while (n--) {
    r = (p + v) % (1e9 + 7)
    p = v
    v = r
  }

  return p
}
```