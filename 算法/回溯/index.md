
### 7. 回溯算法 【难度：中高】【频率：高】

**问题描述**：回溯算法是一种通过探索所有可能的候选解来找出所有解的算法。如果候选解被确认不是一个解的话（或者至少不是最后一个解），回溯算法会通过在上一步进行一些变化来舍弃该候选解，并继续搜索空间中寻找其他解。

#### 7.1 全排列

**问题描述**：给定一个不含重复数字的数组，返回其所有可能的全排列。

**解题思路**：
1. 使用回溯法，从左往右填充位置
2. 使用标记数组记录已经使用过的数字
3. 当填充完所有位置时，将当前排列加入结果集

```javascript
function permute(nums) {
  const result = [];
  const used = new Array(nums.length).fill(false);
  
  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      
      path.push(nums[i]);
      used[i] = true;
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }
  
  backtrack([]);
  return result;
}

// 使用示例
console.log(permute([1, 2, 3]));
// [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

#### 7.2 组合总和

**问题描述**：给定一个无重复元素的数组candidates和一个目标数target，找出candidates中所有可以使数字和为target的组合。

**解题思路**：
1. 使用回溯法，从当前位置开始尝试
2. 每个数字可以重复使用
3. 当和等于目标值时，将当前组合加入结果集

```javascript
function combinationSum(candidates, target) {
  const result = [];
  
  function backtrack(start, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }
    if (sum > target) return;
    
    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, path, sum + candidates[i]);
      path.pop();
    }
  }
  
  backtrack(0, [], 0);
  return result;
}

// 使用示例
console.log(combinationSum([2, 3, 6, 7], 7));
// [[2,2,3],[7]]
```

#### 7.3 N皇后问题

**问题描述**：在N×N的棋盘上放置N个皇后，使得它们不能互相攻击（同行、同列、同对角线）。

**解题思路**：
1. 使用回溯法，逐行放置皇后
2. 检查每个位置是否可以放置
3. 使用数组记录已放置的皇后位置

```javascript
function solveNQueens(n) {
  const result = [];
  const board = Array(n).fill().map(() => Array(n).fill('.'));
  
  function isValid(row, col) {
    // 检查列
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }
    
    // 检查左上对角线
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }
    
    // 检查右上对角线
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }
    
    return true;
  }
  
  function backtrack(row) {
    if (row === n) {
      result.push(board.map(row => row.join('')));
      return;
    }
    
    for (let col = 0; col < n; col++) {
      if (!isValid(row, col)) continue;
      
      board[row][col] = 'Q';
      backtrack(row + 1);
      board[row][col] = '.';
    }
  }
  
  backtrack(0);
  return result;
}

// 使用示例
console.log(solveNQueens(4));
```
