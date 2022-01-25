**[数值的整数次方](https://leetcode-cn.com/problems/shu-zhi-de-zheng-shu-ci-fang-lcof/)**

实现 pow(x, n) ，即计算 x 的 n 次幂函数（即，xn）。不得使用库函数，同时不需要考虑大数问题。

```
输入：x = 2.00000, n = 10
输出：1024.00000

输入：x = 2.10000, n = 3
输出：9.26100

输入：x = 2.00000, n = -2
输出：0.25000
解释：2-2 = 1/22 = 1/4 = 0.25

-100.0 < x < 100.0
-231 <= n <= 231-1
-104 <= xn <= 104
```

**解法**
``` js
// 快速幂
// 时间O(logn)、空间O(1)
var myPow = function(x, n) {
  if (x == 0) return 0

  if (n < 0) {
    x = 1 / x
    n = -n
  }

  let res = 1
  while (n) {
    if (n & 1) res = res * x
    x *= x
    n >>>= 1
  }

  return res
}
```