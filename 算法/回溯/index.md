# 回溯算法

## 🎯 核心原理

**回溯**是一种通过探索所有可能的候选解来找出所有解的算法。如果候选解不符合要求，就回退（撤销选择）继续尝试。

**核心思想**：

1. 做选择
2. 递归
3. 撤销选择（回溯）

**适用场景**：求所有可能的解、排列组合问题

---

## 📝 识别特征

看到这些关键词，考虑回溯：

- **所有可能的解**
- **排列、组合、子集**
- **路径问题**
- **棋盘问题**（N 皇后、数独）
- 关键词：所有、枚举、全排列

---

## 🔧 代码模板

```javascript
function backtrack(路径, 选择列表) {
  if (满足结束条件) {
    result.push([...路径]);
    return;
  }

  for (const 选择 of 选择列表) {
    // 做选择
    路径.push(选择);

    // 递归
    backtrack(路径, 新的选择列表);

    // 撤销选择
    路径.pop();
  }
}
```

---

## 📌 常见题型

### 1. 排列问题

#### LeetCode 46 - 全排列 ⭐⭐

**题目**：给定不含重复数字的数组，返回所有可能的全排列。

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

      // 做选择
      path.push(nums[i]);
      used[i] = true;

      backtrack(path);

      // 撤销选择
      path.pop();
      used[i] = false;
    }
  }

  backtrack([]);
  return result;
}
```

---

#### LeetCode 47 - 全排列 II ⭐⭐

**题目**：数组包含重复数字，返回所有不重复的全排列。

```javascript
function permuteUnique(nums) {
  const result = [];
  const used = new Array(nums.length).fill(false);
  nums.sort((a, b) => a - b); // 排序，便于去重

  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      // 去重：如果当前元素与前一个相同，且前一个未使用，跳过
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue;
      }

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
```

---

### 2. 组合问题

#### LeetCode 77 - 组合 ⭐⭐

**题目**：给定 n 和 k，返回 1...n 中所有可能的 k 个数的组合。

```javascript
function combine(n, k) {
  const result = [];

  function backtrack(start, path) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }

    // 剪枝：剩余数字不够凑成k个
    for (let i = start; i <= n - (k - path.length) + 1; i++) {
      path.push(i);
      backtrack(i + 1, path); // i+1 避免重复
      path.pop();
    }
  }

  backtrack(1, []);
  return result;
}
```

---

#### LeetCode 39 - 组合总和 ⭐⭐

**题目**：找出所有相加之和为 target 的组合（可重复选取）。

```javascript
function combinationSum(candidates, target) {
  const result = [];

  function backtrack(start, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }

    if (sum > target) return; // 剪枝

    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      // 可以重复选取，所以还是从i开始
      backtrack(i, path, sum + candidates[i]);
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}
```

---

#### LeetCode 40 - 组合总和 II ⭐⭐

**题目**：数组有重复，每个数字只能用一次，找出所有和为 target 的组合。

```javascript
function combinationSum2(candidates, target) {
  const result = [];
  candidates.sort((a, b) => a - b);

  function backtrack(start, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }

    if (sum > target) return;

    for (let i = start; i < candidates.length; i++) {
      // 去重：同一层不能选择相同的数字
      if (i > start && candidates[i] === candidates[i - 1]) {
        continue;
      }

      path.push(candidates[i]);
      backtrack(i + 1, path, sum + candidates[i]); // i+1 不能重复使用
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}
```

---

### 3. 子集问题

#### LeetCode 78 - 子集 ⭐⭐

**题目**：返回数组所有可能的子集。

```javascript
function subsets(nums) {
  const result = [];

  function backtrack(start, path) {
    result.push([...path]); // 每个状态都是一个子集

    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }

  backtrack(0, []);
  return result;
}
```

---

#### LeetCode 90 - 子集 II ⭐⭐

**题目**：数组包含重复元素，返回所有不重复的子集。

```javascript
function subsetsWithDup(nums) {
  const result = [];
  nums.sort((a, b) => a - b);

  function backtrack(start, path) {
    result.push([...path]);

    for (let i = start; i < nums.length; i++) {
      // 去重
      if (i > start && nums[i] === nums[i - 1]) {
        continue;
      }

      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }

  backtrack(0, []);
  return result;
}
```

---

### 4. 棋盘问题

#### LeetCode 51 - N 皇后 ⭐⭐⭐

**题目**：在 n×n 棋盘上放置 n 个皇后，使其不能相互攻击。

```javascript
function solveNQueens(n) {
  const result = [];
  const board = Array(n)
    .fill(0)
    .map(() => Array(n).fill("."));

  function isValid(row, col) {
    // 检查列
    for (let i = 0; i < row; i++) {
      if (board[i][col] === "Q") return false;
    }

    // 检查左上对角线
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === "Q") return false;
    }

    // 检查右上对角线
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === "Q") return false;
    }

    return true;
  }

  function backtrack(row) {
    if (row === n) {
      result.push(board.map((r) => r.join("")));
      return;
    }

    for (let col = 0; col < n; col++) {
      if (!isValid(row, col)) continue;

      board[row][col] = "Q";
      backtrack(row + 1);
      board[row][col] = ".";
    }
  }

  backtrack(0);
  return result;
}
```

---

### 5. 分割问题

#### LeetCode 131 - 分割回文串 ⭐⭐

**题目**：将字符串分割成回文子串，返回所有可能的分割方案。

```javascript
function partition(s) {
  const result = [];

  function isPalindrome(str) {
    let left = 0,
      right = str.length - 1;
    while (left < right) {
      if (str[left] !== str[right]) return false;
      left++;
      right--;
    }
    return true;
  }

  function backtrack(start, path) {
    if (start === s.length) {
      result.push([...path]);
      return;
    }

    for (let i = start; i < s.length; i++) {
      const substr = s.substring(start, i + 1);

      if (isPalindrome(substr)) {
        path.push(substr);
        backtrack(i + 1, path);
        path.pop();
      }
    }
  }

  backtrack(0, []);
  return result;
}
```

---

### 6. 路径问题

#### LeetCode 79 - 单词搜索 ⭐⭐

**题目**：在二维网格中搜索单词。

```javascript
function exist(board, word) {
  const m = board.length;
  const n = board[0].length;

  function backtrack(i, j, k) {
    if (k === word.length) return true;
    if (i < 0 || i >= m || j < 0 || j >= n || board[i][j] !== word[k]) {
      return false;
    }

    const temp = board[i][j];
    board[i][j] = "#"; // 标记为已访问

    const found =
      backtrack(i + 1, j, k + 1) ||
      backtrack(i - 1, j, k + 1) ||
      backtrack(i, j + 1, k + 1) ||
      backtrack(i, j - 1, k + 1);

    board[i][j] = temp; // 回溯

    return found;
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (backtrack(i, j, 0)) return true;
    }
  }

  return false;
}
```

---

## 🎯 回溯优化技巧

### 1. 剪枝

```javascript
// 提前终止不可能的分支
if (sum > target) return; // 已经超过目标，不用继续
if (剩余元素不够) return; // 无法凑够k个
```

### 2. 去重

```javascript
// 排序 + 跳过重复元素
nums.sort((a, b) => a - b);
if (i > start && nums[i] === nums[i - 1]) continue;
```

### 3. 预处理

```javascript
// 提前计算，避免重复计算
const isPalin = {}; // 缓存回文判断结果
```

---

## 💡 三大问题对比

| 问题     | 是否需要 used | start 参数 | 代表题目 |
| -------- | ------------- | ---------- | -------- |
| **排列** | ✅ 需要       | ❌ 不需要  | 全排列   |
| **组合** | ❌ 不需要     | ✅ 需要    | 组合     |
| **子集** | ❌ 不需要     | ✅ 需要    | 子集     |

**核心区别**：

- **排列**：顺序不同算不同方案，需要 used 数组
- **组合**：顺序无关，用 start 避免重复
- **子集**：每个状态都是答案，用 start 避免重复

---

## 🔍 面试技巧

1. **明确问题类型**：

   - 求所有解 → 回溯
   - 求一个解/最优解 → 可能是 DP 或贪心

2. **画出决策树**：

   - 在纸上画出递归树
   - 明确每一层的选择
   - 找到剪枝条件

3. **沟通要点**：

   - "这需要枚举所有可能，用回溯"
   - "时间复杂度是指数级的"
   - "可以通过剪枝优化"

4. **注意点**：
   - 结果数组要深拷贝：`[...path]`
   - 回溯时要恢复状态
   - 去重时要先排序

---

**更新时间**：2024 年
