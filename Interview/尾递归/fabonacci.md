## 斐波那契数列
`F(0) = 0; F(1) = 1; F(n) = F(n-1) + F(n-2), (n > 1)`

1. 递归
``` javascript
const fib = (n) => {
  // if (n === 1 || n === 2) return 1
  if (n < 2) return n

  return fib(n-1) + fib(n-2)
}
```

2. 缓存
``` javascript
const fib = (() => {
  const cache = [0, 1]

  return (n) => {
    if (cache[n] !== undefined) {
      return cache[n]
    } else {
      let res = fib(n-1) + fib(n-2)
      cache[n] = res
      return res
    }
  }
})()
```

3. 尾递归
一些语言提供了尾递归优化。如果一个函数返回自身递归调用的结果，那么调用过程会被替换为一个循环，它可以显著提高速度。 尾递归是一种在函数的最后执行递归调用语句的特殊形式的递归。

``` javascript
'use strict'
function fib(n, n1, n2) { 
    if(n == 0) {
        return n1
    }
    return fib(n - 1, n2, n1 + n2)
}
// ES6的尾调用优化只在严格模式下开启，正常模式是无效的。
```

尾递归就是从最后开始计算, 每递归一次就算出相应的结果, 也就是说, 函数调用出现在调用者函数的尾部, 因为是尾部, 所以根本没有必要去保存任何局部变量。**直接让被调用的函数返回时越过调用者,返回到调用者的调用者去。**

**精髓：尾递归就是把当前的运算结果（或路径）放在参数里传给下层函数，深层函数所面对的不是越来越简单的问题，而是越来越复杂的问题，因为参数里带有前面若干步的运算路径。**

4. 动态规划
斐波那契数的边界条件是 `F(0) = 0` 和 `F(1) = 1`。当 `n > 1` 时，每一项的和都等于前两项的和，因此有如下递推关系：
`F(n)=F(n-1)+F(n-2)`

由于斐波那契数存在递推关系，因此可以使用动态规划求解。动态规划的状态转移方程即为上述递推关系，边界条件为 `F(0)`和 `F(1)`。

根据状态转移方程和边界条件，可以得到时间复杂度和空间复杂度都是 `O(n)` 的实现。由于 `F(n)` 只和 `F(n−1)` 与 `F(n−2)` 有关，因此可以使用 `滚动数组思想` 把空间复杂度优化成 `O(1)`。如下的代码中给出的就是这种实现。

``` javascript
const fib = function(n) {
  if (n < 2) return n

  let p = 0, q = 0, r = 1
  for (let i = 2; i <= n; i++) {
      p = q;
      q = r;
      r = p + q;
  }
  return r
}
```
复杂度分析
* 时间复杂度：`O(n)`。
* 空间复杂度：`O(1)`。

5. 矩阵快速幂
方法4的时间复杂度是 `O(n)`，使用矩阵快速幂的方法可以降低时间复杂度。

``` javascript
var fib = function(n) {
    if (n < 2) {
        return n;
    }
    const q = [[1, 1], [1, 0]];
    const res = pow(q, n - 1);
    return res[0][0];
};

const pow = (a, n) => {
    let ret = [[1, 0], [0, 1]];
    while (n > 0) {
        if ((n & 1) === 1) {
            ret = multiply(ret, a);
        }
        n >>= 1;
        a = multiply(a, a);
    }
    return ret;
}

const multiply = (a, b) => {
    const c = new Array(2).fill(0).map(() => new Array(2).fill(0));
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            c[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j];
        }
    }
    return c;
}
```
复杂度分析
* 时间复杂度：`O(logn)`。
* 空间复杂度：`O(1)`。