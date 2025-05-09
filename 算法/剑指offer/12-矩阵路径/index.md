**[矩阵路径](https://leetcode-cn.com/problems/ju-zhen-zhong-de-lu-jing-lcof/)**

给定一个 m x n 二维字符网格 board 和一个字符串单词 word 。如果 word 存在于网格中，返回 true ；否则，返回 false 。

单词必须按照字母顺序，通过相邻的单元格内的字母构成，其中“相邻”单元格是那些水平相邻或垂直相邻的单元格。同一个单元格内的字母不允许被重复使用。

```
输入：board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
输出：true
```

**解法**
``` js
// 回溯法
// 时间O(mn3^k)、空间O(k)
var exist = function(board, word) {
  // 边界检查：空矩阵直接返回false
  if (!board || !board[0].length) return false

  const rows = board.length, cols = board[0].length, len = word.length - 1
  /**
   * @param i  矩阵行
   * @param j  矩阵列
   * @param k  word第几位
   */
  const backtract = (i, j, k = 0) => {
    const char = word[k]
    // 边界检查：越界或字符不匹配
    if (i < 0 || i >= rows || j < 0 || j >= cols || char !== board[i][j]) return false

    // 终止条件：已匹配完整单词
    if (k === len) return true

    // 标记当前位置已访问（防止重复使用）
    board[i][j] = undefined
    
    // 向四个方向递归搜索（左、右、上、下）
    const res = backtract(i, j - 1, k + 1) || backtract(i , j + 1, k + 1) || 
                backtract(i - 1, j, k + 1) || backtract(i + 1, j, k + 1)
    
    // 回溯：恢复当前位置字符
    board[i][j] = char

    return res
  }

  for (let i = 0; i < rows; ++i) {
    for (let j = 0; j < cols; ++j) {
      // 优化点：可以预先检查首字母是否匹配
      if (board[i][j] === word[0] && backtract(i, j)) {
        return true
      }
    }
  }

  return false
}
```