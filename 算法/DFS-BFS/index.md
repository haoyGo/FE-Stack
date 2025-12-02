# DFS & BFS

## 🎯 核心原理

### DFS（深度优先搜索）

**核心思想**：沿着一条路径一直走到底，走不通了再回溯。

**特点**：

- 使用**栈**（或递归）实现
- 适合：路径问题、连通性、回溯

### BFS（广度优先搜索）

**核心思想**：一层一层向外扩展，先访问离起点近的节点。

**特点**：

- 使用**队列**实现
- 适合：最短路径、层序遍历、最少步数

---

## 📝 识别特征

**DFS 适用场景**：

- 路径问题（所有路径、特定路径）
- 连通性问题（岛屿数量）
- 排列组合问题
- 树的遍历

**BFS 适用场景**：

- **最短路径**
- **最少步数**
- **层序遍历**
- 需要按层处理的问题

---

## 🔧 代码模板

### DFS 模板

**递归写法**：

```javascript
function dfs(node, visited) {
  // 终止条件
  if (!node || visited.has(node)) return;

  // 标记已访问
  visited.add(node);

  // 处理当前节点
  console.log(node.val);

  // 递归访问相邻节点
  for (const neighbor of node.neighbors) {
    dfs(neighbor, visited);
  }
}
```

**迭代写法（栈）**：

```javascript
function dfs(start) {
  const stack = [start];
  const visited = new Set([start]);

  while (stack.length > 0) {
    const node = stack.pop();

    // 处理当前节点
    console.log(node.val);

    // 将未访问的相邻节点入栈
    for (const neighbor of node.neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
        visited.add(neighbor);
      }
    }
  }
}
```

### BFS 模板

```javascript
function bfs(start) {
  const queue = [start];
  const visited = new Set([start]);
  let level = 0;

  while (queue.length > 0) {
    const size = queue.length;

    // 处理当前层的所有节点
    for (let i = 0; i < size; i++) {
      const node = queue.shift();

      // 处理当前节点
      console.log(node.val);

      // 将未访问的相邻节点入队
      for (const neighbor of node.neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
          visited.add(neighbor);
        }
      }
    }

    level++;
  }
}
```

---

## 📌 常见面试题

### DFS 题目

#### 1. LeetCode 200 - 岛屿数量 ⭐⭐

**题目**：计算二维网格中岛屿的数量。

```javascript
function numIslands(grid) {
  if (!grid.length) return 0;

  const m = grid.length;
  const n = grid[0].length;
  let count = 0;

  function dfs(i, j) {
    // 边界检查
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === "0") {
      return;
    }

    // 标记为已访问
    grid[i][j] = "0";

    // 四个方向DFS
    dfs(i + 1, j);
    dfs(i - 1, j);
    dfs(i, j + 1);
    dfs(i, j - 1);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "1") {
        count++;
        dfs(i, j);
      }
    }
  }

  return count;
}
```

---

#### 2. LeetCode 695 - 岛屿的最大面积 ⭐⭐

**题目**：找到最大岛屿的面积。

```javascript
function maxAreaOfIsland(grid) {
  const m = grid.length;
  const n = grid[0].length;
  let maxArea = 0;

  function dfs(i, j) {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === 0) {
      return 0;
    }

    grid[i][j] = 0; // 标记为已访问

    return 1 + dfs(i + 1, j) + dfs(i - 1, j) + dfs(i, j + 1) + dfs(i, j - 1);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) {
        maxArea = Math.max(maxArea, dfs(i, j));
      }
    }
  }

  return maxArea;
}
```

---

#### 3. LeetCode 130 - 被围绕的区域 ⭐⭐

**题目**：将被 'X' 围绕的 'O' 改为 'X'。

```javascript
function solve(board) {
  if (!board.length) return;

  const m = board.length;
  const n = board[0].length;

  function dfs(i, j) {
    if (i < 0 || i >= m || j < 0 || j >= n || board[i][j] !== "O") {
      return;
    }

    board[i][j] = "#"; // 标记为边界连通的O

    dfs(i + 1, j);
    dfs(i - 1, j);
    dfs(i, j + 1);
    dfs(i, j - 1);
  }

  // 从边界的O开始DFS
  for (let i = 0; i < m; i++) {
    dfs(i, 0);
    dfs(i, n - 1);
  }
  for (let j = 0; j < n; j++) {
    dfs(0, j);
    dfs(m - 1, j);
  }

  // 处理结果
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === "O") {
        board[i][j] = "X";
      } else if (board[i][j] === "#") {
        board[i][j] = "O";
      }
    }
  }
}
```

---

#### 4. LeetCode 543 - 二叉树的直径 ⭐⭐

**题目**：计算二叉树的直径（任意两节点间路径的最大长度）。

```javascript
function diameterOfBinaryTree(root) {
  let maxDiameter = 0;

  function dfs(node) {
    if (!node) return 0;

    const left = dfs(node.left);
    const right = dfs(node.right);

    // 更新最大直径
    maxDiameter = Math.max(maxDiameter, left + right);

    // 返回当前节点的最大深度
    return Math.max(left, right) + 1;
  }

  dfs(root);
  return maxDiameter;
}
```

---

#### 5. LeetCode 124 - 二叉树中的最大路径和 ⭐⭐⭐

**题目**：找到二叉树中的最大路径和。

```javascript
function maxPathSum(root) {
  let maxSum = -Infinity;

  function dfs(node) {
    if (!node) return 0;

    // 只取正数贡献
    const left = Math.max(0, dfs(node.left));
    const right = Math.max(0, dfs(node.right));

    // 更新最大路径和（经过当前节点）
    maxSum = Math.max(maxSum, node.val + left + right);

    // 返回单边最大路径
    return node.val + Math.max(left, right);
  }

  dfs(root);
  return maxSum;
}
```

---

### BFS 题目

#### 6. LeetCode 102 - 二叉树的层序遍历 ⭐⭐

**题目**：按层遍历二叉树。

```javascript
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}
```

---

#### 7. LeetCode 103 - 二叉树的锯齿形层序遍历 ⭐⭐

**题目**：按锯齿形（之字形）层序遍历。

```javascript
function zigzagLevelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];
  let leftToRight = true;

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    // 根据方向决定是否反转
    if (!leftToRight) {
      currentLevel.reverse();
    }

    result.push(currentLevel);
    leftToRight = !leftToRight;
  }

  return result;
}
```

---

#### 8. LeetCode 127 - 单词接龙 ⭐⭐⭐

**题目**：从 beginWord 变换到 endWord 的最短转换序列长度。

```javascript
function ladderLength(beginWord, endWord, wordList) {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;

  const queue = [[beginWord, 1]];
  const visited = new Set([beginWord]);

  while (queue.length > 0) {
    const [word, level] = queue.shift();

    if (word === endWord) return level;

    // 尝试改变每个位置的字母
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c <= 122; c++) {
        // a-z
        const newWord =
          word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);

        if (wordSet.has(newWord) && !visited.has(newWord)) {
          queue.push([newWord, level + 1]);
          visited.add(newWord);
        }
      }
    }
  }

  return 0;
}
```

---

#### 9. LeetCode 994 - 腐烂的橘子 ⭐⭐

**题目**：计算所有橘子腐烂需要的最少分钟数。

```javascript
function orangesRotting(grid) {
  const m = grid.length;
  const n = grid[0].length;
  const queue = [];
  let fresh = 0;

  // 找到所有腐烂的橘子和新鲜橘子的数量
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 2) {
        queue.push([i, j]);
      } else if (grid[i][j] === 1) {
        fresh++;
      }
    }
  }

  if (fresh === 0) return 0;

  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  let minutes = 0;

  while (queue.length > 0) {
    const size = queue.length;

    for (let i = 0; i < size; i++) {
      const [x, y] = queue.shift();

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < m && ny >= 0 && ny < n && grid[nx][ny] === 1) {
          grid[nx][ny] = 2;
          fresh--;
          queue.push([nx, ny]);
        }
      }
    }

    if (queue.length > 0) minutes++;
  }

  return fresh === 0 ? minutes : -1;
}
```

---

#### 10. LeetCode 542 - 01 矩阵 ⭐⭐

**题目**：找到每个单元格到最近的 0 的距离。

```javascript
function updateMatrix(mat) {
  const m = mat.length;
  const n = mat[0].length;
  const queue = [];
  const dist = Array(m)
    .fill(0)
    .map(() => Array(n).fill(Infinity));

  // 将所有0入队
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] === 0) {
        queue.push([i, j]);
        dist[i][j] = 0;
      }
    }
  }

  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [x, y] = queue.shift();

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < m && ny >= 0 && ny < n) {
        if (dist[nx][ny] > dist[x][y] + 1) {
          dist[nx][ny] = dist[x][y] + 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return dist;
}
```

---

## 🎯 DFS vs BFS 对比

| 特性             | DFS          | BFS            |
| ---------------- | ------------ | -------------- |
| **数据结构**     | 栈（递归）   | 队列           |
| **空间复杂度**   | O(h) 高度    | O(w) 宽度      |
| **适用场景**     | 路径、连通性 | 最短路径、层序 |
| **找到解的特点** | 不一定最短   | 一定最短       |
| **实现方式**     | 递归简洁     | 迭代为主       |

---

## 💡 解题技巧

### DFS 技巧

1. **明确递归终止条件**
2. **标记已访问**（防止重复）
3. **回溯时恢复状态**（如果需要）
4. **四个方向遍历**：`[[0,1], [0,-1], [1,0], [-1,0]]`

### BFS 技巧

1. **按层处理**：记录每层的大小
2. **记录步数/层数**
3. **多源 BFS**：将所有起点同时入队
4. **双向 BFS**：从起点和终点同时搜索

### 网格问题模板

```javascript
// 方向数组
const directions = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

// 边界检查
function isValid(i, j, m, n) {
  return i >= 0 && i < m && j >= 0 && j < n;
}

// 遍历四个方向
for (const [di, dj] of directions) {
  const ni = i + di;
  const nj = j + dj;
  if (isValid(ni, nj, m, n)) {
    // 处理邻居
  }
}
```

---

## 🎯 面试建议

1. **选择合适的算法**：

   - 需要最短路径 → BFS
   - 需要遍历所有可能 → DFS
   - 树的层序遍历 → BFS

2. **注意细节**：

   - visited 集合防止重复访问
   - 边界条件判断
   - BFS 要记录层数时，注意每层的处理

3. **沟通要点**：
   - "这是最短路径问题，用 BFS 可以保证找到最短路径"
   - "需要遍历所有路径，用 DFS 配合回溯"

---

**更新时间**：2024 年
