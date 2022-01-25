**[矩阵查找值](https://leetcode-cn.com/problems/er-wei-shu-zu-zhong-de-cha-zhao-lcof/)**

在一个 n * m 的二维数组中，每一行都按照从左到右递增的顺序排序，每一列都按照从上到下递增的顺序排序。请完成一个高效的函数，输入这样的一个二维数组和一个整数，判断数组中是否含有该整数。

```
[
  [1,   4,  7, 11, 15],
  [2,   5,  8, 12, 19],
  [3,   6,  9, 16, 22],
  [10, 13, 14, 17, 24],
  [18, 21, 23, 26, 30]
]

给定 target = 5，返回 true。
给定 target = 20，返回 false。
```

**解法**
``` js
// 时间O(n+m)、空间O(1)
var findNumberIn2DArray = function(matrix, target) {
  if (!matrix.length || !matrix[0].length) return false
  const rows = matrix.length, cols = matrix[0].length
  let i = rows - 1, j = 0

  while (i >= 0 && j < cols) {
    const itm = matrix[i][j]
    if (itm === target) return true
    else if (itm > target) {
      i--
    } else {
      j++
    }
  }

  return false
}
```