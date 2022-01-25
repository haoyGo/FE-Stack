**[17-打印1到最大的n位数](https://leetcode-cn.com/problems/da-yin-cong-1dao-zui-da-de-nwei-shu-lcof/)**

输入数字 n，按顺序打印出从 1 到最大的 n 位十进制数。比如输入 3，则打印出 1、2、3 一直到最大的 3 位数 999。

```
输入: n = 1
输出: [1,2,3,4,5,6,7,8,9]

用返回一个整数列表来代替打印
n 为正整数
```

**解法**
``` js
// 回溯法
var printNumbers = function(n) {
  const res = []
  let str
  const backtrack = (len, str = '') => {
    if (str.length === len) {
      res.push(str)
      return
    }

    for (const ch of '0123456789') {
      if (str.length === 0 && ch === '0') continue
      str += ch
      backtrack(len, str)
      str = str.slice(0, -1)
    }
  }

  for (let i = 1; i <= n; ++i) 
    backtrack(i)

  return res
}
```