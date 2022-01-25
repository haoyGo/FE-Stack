**[机器人运动范围](https://leetcode-cn.com/problems/ji-qi-ren-de-yun-dong-fan-wei-lcof/)**

地上有一个m行n列的方格，从坐标 [0,0] 到坐标 [m-1,n-1] 。一个机器人从坐标 [0, 0] 的格子开始移动，它每次可以向左、右、上、下移动一格（不能移动到方格外），也不能进入行坐标和列坐标的数位之和大于k的格子。例如，当k为18时，机器人能够进入方格 [35, 37] ，因为3+5+3+7=18。但它不能进入方格 [35, 38]，因为3+5+3+8=19。请问该机器人能够到达多少个格子？

```
输入：m = 2, n = 3, k = 1
输出：3

输入：m = 3, n = 1, k = 0
输出：1

1 <= n,m <= 100
0 <= k <= 20
```

**解法**
``` js
var getUnitsSum = (() => {
    const cache = Object.create(null)

    return (num) => {
        if (cache[num]) return cache[num]

        let sum = 0
        let tmp = num
        while (tmp) {
            sum += tmp % 10
            tmp = Math.floor(tmp / 10)
        }

        cache[num] = sum

        return sum
    }
})()

// 深度优先遍历(DFS)
// 时间O(mn)、空间O(mn)
var movingCount = function(m, n, k) {
  const cache = new Array(m).fill(0).map(v => new Array(n).fill(0))

  const backtrack = (i, j) => {
    if (i >= m || j >= n || cache[i][j] || getUnitsSum(i) + getUnitsSum(j) > k) return 0
    
    cache[i][j] = 1
    const res = 1 + backtrack(i + 1, j) + backtrack(i, j + 1)

    return res
  }


  return backtrack(0, 0)
}
```