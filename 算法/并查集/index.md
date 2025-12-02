# 并查集算法速查手册

## 🎯 核心思想

并查集（Union-Find / Disjoint Set Union）是一种树形数据结构，用于处理**不相交集合**的合并和查询问题。

**核心操作**：

- **Find**：查找元素所属集合（查找根节点）
- **Union**：合并两个集合
- **isConnected**：判断两个元素是否在同一集合

**核心优化**：

- **路径压缩**：查找时将路径上所有节点直接连到根节点
- **按秩合并**：合并时将较小的树合并到较大的树

**时间复杂度**：接近 O(1)（α(n)，阿克曼函数的反函数）

---

## 📋 快速识别

### 关键词识别

- **连通性判断**
- **集合合并**
- **朋友圈/社交网络**
- **岛屿数量**
- **最小生成树（Kruskal）**
- **动态连通性**

### 适用场景

1. 判断图中两点是否连通
2. 统计连通分量数量
3. 检测环的存在
4. 合并集合操作
5. 最小生成树算法

---

## 🔧 标准模板

### 基础版（路径压缩）

```javascript
class UnionFind {
  constructor(n) {
    this.parent = new Array(n);
    this.count = n; // 连通分量数量

    // 初始化：每个元素的父节点是自己
    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
    }
  }

  // 查找根节点（带路径压缩）
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // 路径压缩
    }
    return this.parent[x];
  }

  // 合并两个集合
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false; // 已在同一集合

    this.parent[rootX] = rootY; // 合并
    this.count--; // 连通分量减1
    return true;
  }

  // 判断是否连通
  isConnected(x, y) {
    return this.find(x) === this.find(y);
  }

  // 获取连通分量数量
  getCount() {
    return this.count;
  }
}
```

### 优化版（路径压缩 + 按秩合并）

```javascript
class UnionFind {
  constructor(n) {
    this.parent = new Array(n);
    this.rank = new Array(n).fill(1); // 树的高度（秩）
    this.count = n;

    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
    }
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    // 按秩合并：将较小的树合并到较大的树
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    this.count--;
    return true;
  }

  isConnected(x, y) {
    return this.find(x) === this.find(y);
  }

  getCount() {
    return this.count;
  }
}
```

---

## 💡 经典题目

### 1️⃣ LeetCode 200. 岛屿数量

```javascript
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  const m = grid.length;
  const n = grid[0].length;
  const uf = new UnionFind(m * n);
  let waters = 0; // 水域数量

  // 将二维坐标转为一维
  const getIndex = (i, j) => i * n + j;

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "0") {
        waters++;
        continue;
      }

      // 向右合并
      if (j + 1 < n && grid[i][j + 1] === "1") {
        uf.union(getIndex(i, j), getIndex(i, j + 1));
      }

      // 向下合并
      if (i + 1 < m && grid[i + 1][j] === "1") {
        uf.union(getIndex(i, j), getIndex(i + 1, j));
      }
    }
  }

  return uf.getCount() - waters;
}
```

### 2️⃣ LeetCode 547. 省份数量（朋友圈）

```javascript
function findCircleNum(isConnected) {
  const n = isConnected.length;
  const uf = new UnionFind(n);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isConnected[i][j] === 1) {
        uf.union(i, j);
      }
    }
  }

  return uf.getCount();
}
```

### 3️⃣ LeetCode 684. 冗余连接（检测环）

```javascript
function findRedundantConnection(edges) {
  const n = edges.length;
  const uf = new UnionFind(n + 1);

  for (const [u, v] of edges) {
    // 如果u和v已经连通，说明这条边会形成环
    if (uf.isConnected(u, v)) {
      return [u, v];
    }
    uf.union(u, v);
  }

  return [];
}
```

### 4️⃣ LeetCode 721. 账户合并

```javascript
function accountsMerge(accounts) {
  const emailToName = new Map();
  const emailToId = new Map();
  let id = 0;

  // 为每个邮箱分配ID
  for (const account of accounts) {
    const name = account[0];
    for (let i = 1; i < account.length; i++) {
      const email = account[i];
      if (!emailToId.has(email)) {
        emailToId.set(email, id++);
        emailToName.set(email, name);
      }
    }
  }

  const uf = new UnionFind(id);

  // 合并同一账户下的邮箱
  for (const account of accounts) {
    const firstEmailId = emailToId.get(account[1]);
    for (let i = 2; i < account.length; i++) {
      const emailId = emailToId.get(account[i]);
      uf.union(firstEmailId, emailId);
    }
  }

  // 根据根节点分组
  const idToEmails = new Map();
  for (const [email, emailId] of emailToId) {
    const root = uf.find(emailId);
    if (!idToEmails.has(root)) {
      idToEmails.set(root, []);
    }
    idToEmails.get(root).push(email);
  }

  // 构建结果
  const result = [];
  for (const emails of idToEmails.values()) {
    emails.sort();
    const name = emailToName.get(emails[0]);
    result.push([name, ...emails]);
  }

  return result;
}
```

### 5️⃣ LeetCode 990. 等式方程的可满足性

```javascript
function equationsPossible(equations) {
  const uf = new UnionFind(26);

  // 第一遍：处理所有相等关系
  for (const eq of equations) {
    if (eq[1] === "=") {
      const x = eq.charCodeAt(0) - 97; // 'a' = 97
      const y = eq.charCodeAt(3) - 97;
      uf.union(x, y);
    }
  }

  // 第二遍：检查所有不等关系
  for (const eq of equations) {
    if (eq[1] === "!") {
      const x = eq.charCodeAt(0) - 97;
      const y = eq.charCodeAt(3) - 97;
      // 如果不相等的两个变量在同一集合，矛盾
      if (uf.isConnected(x, y)) {
        return false;
      }
    }
  }

  return true;
}
```

### 6️⃣ LeetCode 128. 最长连续序列

```javascript
function longestConsecutive(nums) {
  if (nums.length === 0) return 0;

  const numToIndex = new Map();
  const uf = new UnionFind(nums.length);

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];

    // 处理重复数字
    if (numToIndex.has(num)) continue;

    numToIndex.set(num, i);

    // 与num-1合并
    if (numToIndex.has(num - 1)) {
      uf.union(i, numToIndex.get(num - 1));
    }

    // 与num+1合并
    if (numToIndex.has(num + 1)) {
      uf.union(i, numToIndex.get(num + 1));
    }
  }

  // 统计每个连通分量的大小
  const sizeMap = new Map();
  let maxLen = 0;

  for (let i = 0; i < nums.length; i++) {
    if (!numToIndex.has(nums[i])) continue;

    const root = uf.find(i);
    sizeMap.set(root, (sizeMap.get(root) || 0) + 1);
    maxLen = Math.max(maxLen, sizeMap.get(root));
  }

  return maxLen;
}
```

### 7️⃣ LeetCode 1319. 连通网络的操作次数

```javascript
function makeConnected(n, connections) {
  // 至少需要n-1条边才能连通
  if (connections.length < n - 1) return -1;

  const uf = new UnionFind(n);

  for (const [u, v] of connections) {
    uf.union(u, v);
  }

  // 连通分量数-1 = 需要的操作次数
  return uf.getCount() - 1;
}
```

---

## 🎨 解题技巧

### 技巧 1：二维坐标转一维索引

```javascript
// 将(i, j)转为一维索引
const getIndex = (i, j, cols) => i * cols + j;

// 示例：岛屿问题
const m = grid.length;
const n = grid[0].length;
const uf = new UnionFind(m * n);

for (let i = 0; i < m; i++) {
  for (let j = 0; j < n; j++) {
    const index = getIndex(i, j, n);
    // ...
  }
}
```

### 技巧 2：使用 Map 映射元素到索引

```javascript
// 当元素不是连续整数时，用Map建立映射
const elementToIndex = new Map();
let id = 0;

for (const element of elements) {
  if (!elementToIndex.has(element)) {
    elementToIndex.set(element, id++);
  }
}

const uf = new UnionFind(id);
```

### 技巧 3：统计连通分量大小

```javascript
class UnionFind {
  constructor(n) {
    this.parent = new Array(n);
    this.size = new Array(n).fill(1); // 每个集合的大小

    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
    }
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    // 合并时更新大小
    this.parent[rootX] = rootY;
    this.size[rootY] += this.size[rootX];
    return true;
  }

  // 获取元素所在集合的大小
  getSize(x) {
    return this.size[this.find(x)];
  }
}
```

### 技巧 4：检测环

```javascript
// 在无向图中，如果两个节点已连通，再添加边就会形成环
function detectCycle(edges) {
  const uf = new UnionFind(n);

  for (const [u, v] of edges) {
    // 如果u和v已连通，说明这条边会形成环
    if (uf.isConnected(u, v)) {
      return true;
    }
    uf.union(u, v);
  }

  return false;
}
```

---

## 🔍 解题思路 SOP

### Step 1: 识别题型

- 看到**连通性** → 并查集
- 看到**朋友圈/社交网络** → 并查集
- 看到**岛屿/区域** → 并查集或 DFS
- 看到**等价关系** → 并查集
- 看到**检测环** → 并查集

### Step 2: 确定元素数量

- 如果是整数 0~n-1 → 直接初始化 UnionFind(n)
- 如果是其他类型 → 用 Map 建立映射
- 如果是二维坐标 → 转为一维索引

### Step 3: 执行合并操作

- 遍历所有关系，调用 union()
- 如果需要检测环，先用 isConnected()判断

### Step 4: 获取结果

- 连通分量数量 → getCount()
- 是否连通 → isConnected(x, y)
- 集合大小 → getSize(x)

---

## ⚠️ 常见错误

### 错误 1：忘记路径压缩

```javascript
// ❌ 错误：未优化的find
find(x) {
    while (this.parent[x] !== x) {
        x = this.parent[x];
    }
    return x;
}

// ✅ 正确：带路径压缩的find
find(x) {
    if (this.parent[x] !== x) {
        this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
}
```

### 错误 2：union 时未检查是否已连通

```javascript
// ❌ 错误：直接合并
union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    this.parent[rootX] = rootY; // 可能重复合并
    this.count--;
}

// ✅ 正确：先检查
union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    this.parent[rootX] = rootY;
    this.count--;
    return true;
}
```

### 错误 3：二维索引转换错误

```javascript
// ❌ 错误：行列搞反
const getIndex = (i, j) => j * m + i; // 错误！

// ✅ 正确：i * 列数 + j
const getIndex = (i, j) => i * n + j;
```

---

## 📝 高频题目清单

| 题号 | 题目                     | 难度   | 类型     | 关键点           |
| ---- | ------------------------ | ------ | -------- | ---------------- |
| 200  | 岛屿数量                 | Medium | 连通性   | 二维转一维       |
| 547  | 省份数量                 | Medium | 连通性   | 基础模板         |
| 684  | 冗余连接                 | Medium | 检测环   | isConnected 判断 |
| 721  | 账户合并                 | Medium | 合并集合 | Map 映射+分组    |
| 990  | 等式方程的可满足性       | Medium | 等价关系 | 两遍遍历         |
| 128  | 最长连续序列             | Medium | 连续性   | 合并相邻数字     |
| 1319 | 连通网络的操作次数       | Medium | 连通性   | 判断边数         |
| 765  | 情侣牵手                 | Hard   | 最小交换 | 并查集           |
| 952  | 按公因数计算最大组件大小 | Hard   | 合并     | 质因数分解       |

---

## 🎯 面试沟通要点

### 开始时

1. **确认题型**：

   - "这是判断连通性的问题，我用并查集来解决"
   - "需要合并集合并统计数量，并查集很适合"

2. **说明优化**：
   - "我会使用路径压缩优化查找效率"
   - "按秩合并可以保持树的平衡"

### 编码时

1. **解释操作**：

   - "find 操作查找根节点，同时压缩路径"
   - "union 前先检查是否已连通，避免重复合并"

2. **说明复杂度**：
   - "使用路径压缩和按秩合并后，时间复杂度接近 O(1)"
   - "空间复杂度 O(n)，存储 parent 和 rank 数组"

### 结束时

- **时间复杂度**：O(n·α(n)) ≈ O(n)，α 是阿克曼函数的反函数
- **空间复杂度**：O(n)

---

## 💡 总结

### 核心要点

1. **并查集本质**：维护不相交集合，支持快速合并和查询
2. **两大优化**：路径压缩 + 按秩合并
3. **核心操作**：find(查找根节点) + union(合并集合)
4. **适用场景**：连通性判断、检测环、合并集合
5. **时间复杂度**：接近 O(1)

### 记忆口诀

```
并查集解连通题，合并查找两操作
路径压缩找根快，按秩合并树平衡
岛屿朋友圈省份，检测环路找冗余
二维转一维索引，Map映射建关联
```

---

**最后更新时间**：2024 年
