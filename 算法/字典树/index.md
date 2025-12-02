# 字典树（Trie）算法速查手册

## 🎯 核心思想

字典树（Trie，前缀树）是一种树形数据结构，用于高效存储和检索字符串集合中的键。

**核心特点**：

- **前缀共享**：相同前缀的字符串共享路径
- **快速查找**：O(m)时间复杂度，m 为字符串长度
- **空间换时间**：牺牲空间提高查询效率

**核心操作**：

- **insert**：插入字符串
- **search**：查找完整字符串
- **startsWith**：查找前缀
- **delete**：删除字符串（可选）

---

## 📋 快速识别

### 关键词识别

- **前缀匹配**
- **单词搜索**
- **自动补全**
- **拼写检查**
- **单词查找游戏**
- **IP 路由**

### 适用场景

1. 前缀查询（搜索建议）
2. 单词查找游戏（Word Search）
3. 最长公共前缀
4. 字符串频次统计
5. 替换字符串（词典）

---

## 🔧 标准模板

### 基础版（字符串存储）

```javascript
class TrieNode {
  constructor() {
    this.children = {}; // 子节点映射
    this.isEnd = false; // 是否为单词结尾
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // 插入单词
  insert(word) {
    let node = this.root;

    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }

    node.isEnd = true;
  }

  // 查找完整单词
  search(word) {
    const node = this.searchPrefix(word);
    return node !== null && node.isEnd;
  }

  // 查找前缀
  startsWith(prefix) {
    return this.searchPrefix(prefix) !== null;
  }

  // 辅助方法：查找前缀对应的节点
  searchPrefix(prefix) {
    let node = this.root;

    for (const char of prefix) {
      if (!node.children[char]) {
        return null;
      }
      node = node.children[char];
    }

    return node;
  }
}
```

### 增强版（带计数/频次）

```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
    this.count = 0; // 以该节点为结尾的单词数量
    this.prefixCount = 0; // 经过该节点的单词数量
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;

    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
      node.prefixCount++;
    }

    node.isEnd = true;
    node.count++;
  }

  // 统计前缀出现次数
  countPrefix(prefix) {
    const node = this.searchPrefix(prefix);
    return node ? node.prefixCount : 0;
  }

  // 统计单词出现次数
  countWord(word) {
    const node = this.searchPrefix(word);
    return node && node.isEnd ? node.count : 0;
  }

  searchPrefix(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }
}
```

### 删除操作版

```javascript
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // 删除单词
  delete(word) {
    this._delete(this.root, word, 0);
  }

  _delete(node, word, index) {
    if (index === word.length) {
      if (!node.isEnd) return false; // 单词不存在
      node.isEnd = false;
      return Object.keys(node.children).length === 0; // 是否可删除节点
    }

    const char = word[index];
    const childNode = node.children[char];

    if (!childNode) return false;

    const shouldDelete = this._delete(childNode, word, index + 1);

    if (shouldDelete) {
      delete node.children[char];
      return Object.keys(node.children).length === 0 && !node.isEnd;
    }

    return false;
  }

  // ...其他方法
}
```

---

## 💡 经典题目

### 1️⃣ LeetCode 208. 实现 Trie（前缀树）

```javascript
// 直接使用基础模板即可
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  search(word) {
    const node = this.searchPrefix(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix) {
    return this.searchPrefix(prefix) !== null;
  }

  searchPrefix(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }
}

class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}
```

### 2️⃣ LeetCode 211. 添加与搜索单词（支持通配符）

```javascript
class WordDictionary {
  constructor() {
    this.root = new TrieNode();
  }

  addWord(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  search(word) {
    return this.searchNode(word, 0, this.root);
  }

  // DFS搜索，处理通配符'.'
  searchNode(word, index, node) {
    if (index === word.length) {
      return node.isEnd;
    }

    const char = word[index];

    if (char === ".") {
      // 通配符：尝试所有子节点
      for (const childNode of Object.values(node.children)) {
        if (this.searchNode(word, index + 1, childNode)) {
          return true;
        }
      }
      return false;
    } else {
      // 普通字符
      if (!node.children[char]) return false;
      return this.searchNode(word, index + 1, node.children[char]);
    }
  }
}
```

### 3️⃣ LeetCode 212. 单词搜索 II

```javascript
function findWords(board, words) {
  const result = new Set();
  const trie = new Trie();

  // 构建字典树
  for (const word of words) {
    trie.insert(word);
  }

  const m = board.length;
  const n = board[0].length;

  // DFS搜索
  function dfs(i, j, node, path) {
    if (i < 0 || i >= m || j < 0 || j >= n) return;

    const char = board[i][j];
    if (char === "#" || !node.children[char]) return;

    const nextNode = node.children[char];
    const newPath = path + char;

    // 找到单词
    if (nextNode.isEnd) {
      result.add(newPath);
      // 优化：标记已找到，避免重复
      nextNode.isEnd = false;
    }

    // 标记已访问
    board[i][j] = "#";

    // 四个方向搜索
    dfs(i + 1, j, nextNode, newPath);
    dfs(i - 1, j, nextNode, newPath);
    dfs(i, j + 1, nextNode, newPath);
    dfs(i, j - 1, nextNode, newPath);

    // 回溯
    board[i][j] = char;
  }

  // 从每个位置开始搜索
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      dfs(i, j, trie.root, "");
    }
  }

  return Array.from(result);
}
```

### 4️⃣ LeetCode 648. 单词替换

```javascript
function replaceWords(dictionary, sentence) {
  const trie = new Trie();

  // 插入所有词根
  for (const root of dictionary) {
    trie.insert(root);
  }

  // 查找最短词根
  function findRoot(word) {
    let node = trie.root;
    let prefix = "";

    for (const char of word) {
      if (!node.children[char]) {
        return word; // 没有词根
      }

      prefix += char;
      node = node.children[char];

      if (node.isEnd) {
        return prefix; // 找到词根
      }
    }

    return word;
  }

  const words = sentence.split(" ");
  return words.map((word) => findRoot(word)).join(" ");
}
```

### 5️⃣ LeetCode 720. 词典中最长的单词

```javascript
function longestWord(words) {
  const trie = new Trie();

  // 插入所有单词
  for (const word of words) {
    trie.insert(word);
  }

  let longest = "";

  // DFS查找最长单词
  function dfs(node, path) {
    if (
      path.length > longest.length ||
      (path.length === longest.length && path < longest)
    ) {
      longest = path;
    }

    for (const [char, childNode] of Object.entries(node.children)) {
      // 只能逐字母构建
      if (childNode.isEnd) {
        dfs(childNode, path + char);
      }
    }
  }

  dfs(trie.root, "");
  return longest;
}
```

### 6️⃣ LeetCode 677. 键值映射

```javascript
class MapSum {
  constructor() {
    this.root = new TrieNode();
    this.map = new Map(); // 记录已插入的key和val
  }

  insert(key, val) {
    const delta = val - (this.map.get(key) || 0);
    this.map.set(key, val);

    let node = this.root;
    for (const char of key) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
      node.sum += delta; // 累加值
    }
  }

  sum(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return 0;
      node = node.children[char];
    }
    return node.sum;
  }
}

class TrieNode {
  constructor() {
    this.children = {};
    this.sum = 0;
  }
}
```

### 7️⃣ LeetCode 421. 数组中两个数的最大异或值

```javascript
function findMaximumXOR(nums) {
  const trie = new Trie();
  let maxXor = 0;

  // 插入所有数字的二进制表示
  for (const num of nums) {
    trie.insertBinary(num);
  }

  // 查找最大异或值
  for (const num of nums) {
    maxXor = Math.max(maxXor, trie.findMaxXor(num));
  }

  return maxXor;
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // 插入数字的二进制表示（31位）
  insertBinary(num) {
    let node = this.root;
    for (let i = 30; i >= 0; i--) {
      const bit = (num >> i) & 1;
      if (!node.children[bit]) {
        node.children[bit] = new TrieNode();
      }
      node = node.children[bit];
    }
  }

  // 查找与num异或的最大值
  findMaxXor(num) {
    let node = this.root;
    let xor = 0;

    for (let i = 30; i >= 0; i--) {
      const bit = (num >> i) & 1;
      const toggleBit = bit ^ 1; // 期望的相反位

      if (node.children[toggleBit]) {
        xor |= 1 << i; // 该位为1
        node = node.children[toggleBit];
      } else {
        node = node.children[bit];
      }
    }

    return xor;
  }
}
```

---

## 🎨 解题技巧

### 技巧 1：通配符处理（DFS）

```javascript
// 处理'.'通配符时，遍历所有子节点
searchNode(word, index, node) {
    if (index === word.length) return node.isEnd;

    const char = word[index];

    if (char === '.') {
        // 尝试所有子节点
        for (const childNode of Object.values(node.children)) {
            if (this.searchNode(word, index + 1, childNode)) {
                return true;
            }
        }
        return false;
    } else {
        if (!node.children[char]) return false;
        return this.searchNode(word, index + 1, node.children[char]);
    }
}
```

### 技巧 2：矩阵+字典树（单词搜索）

```javascript
// 先构建Trie，再DFS搜索
function findWords(board, words) {
  const trie = new Trie();
  for (const word of words) trie.insert(word);

  function dfs(i, j, node, path) {
    // 标记访问
    const temp = board[i][j];
    board[i][j] = "#";

    // DFS四个方向
    // ...

    // 回溯
    board[i][j] = temp;
  }

  // 从每个位置开始
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      dfs(i, j, trie.root, "");
    }
  }
}
```

### 技巧 3：前缀统计

```javascript
// 在节点中记录经过该节点的单词数量
class TrieNode {
    constructor() {
        this.children = {};
        this.isEnd = false;
        this.prefixCount = 0; // 前缀计数
    }
}

insert(word) {
    let node = this.root;
    for (const char of word) {
        if (!node.children[char]) {
            node.children[char] = new TrieNode();
        }
        node = node.children[char];
        node.prefixCount++;
    }
    node.isEnd = true;
}

countPrefix(prefix) {
    const node = this.searchPrefix(prefix);
    return node ? node.prefixCount : 0;
}
```

### 技巧 4：二进制 Trie（异或问题）

```javascript
// 用Trie存储数字的二进制表示
class BinaryTrie {
  insertBinary(num) {
    let node = this.root;
    for (let i = 30; i >= 0; i--) {
      const bit = (num >> i) & 1;
      if (!node.children[bit]) {
        node.children[bit] = new TrieNode();
      }
      node = node.children[bit];
    }
  }

  findMaxXor(num) {
    let node = this.root;
    let xor = 0;

    for (let i = 30; i >= 0; i--) {
      const bit = (num >> i) & 1;
      const toggleBit = bit ^ 1;

      if (node.children[toggleBit]) {
        xor |= 1 << i;
        node = node.children[toggleBit];
      } else {
        node = node.children[bit];
      }
    }

    return xor;
  }
}
```

---

## 🔍 解题思路 SOP

### Step 1: 识别题型

- 看到**前缀** → 字典树
- 看到**单词查找** → 字典树
- 看到**自动补全** → 字典树
- 看到**最大异或** → 二进制字典树

### Step 2: 构建 Trie

- 定义 TrieNode 结构
- 根据需求添加字段（isEnd、count、sum 等）
- 实现 insert、search、startsWith 方法

### Step 3: 根据题意扩展

- **通配符** → DFS 遍历子节点
- **矩阵搜索** → Trie + 回溯
- **前缀统计** → prefixCount 字段
- **异或问题** → 二进制 Trie

### Step 4: 优化

- 找到单词后标记 isEnd=false，避免重复
- 剪枝：如果子节点为空，提前返回
- 删除操作：递归删除无用节点

---

## ⚠️ 常见错误

### 错误 1：忘记标记单词结尾

```javascript
// ❌ 错误：未标记isEnd
insert(word) {
    let node = this.root;
    for (const char of word) {
        if (!node.children[char]) {
            node.children[char] = new TrieNode();
        }
        node = node.children[char];
    }
    // 忘记标记！
}

// ✅ 正确：标记isEnd
insert(word) {
    let node = this.root;
    for (const char of word) {
        if (!node.children[char]) {
            node.children[char] = new TrieNode();
        }
        node = node.children[char];
    }
    node.isEnd = true;
}
```

### 错误 2：search 和 startsWith 逻辑混淆

```javascript
// ❌ 错误：search未检查isEnd
search(word) {
    const node = this.searchPrefix(word);
    return node !== null; // 错误！
}

// ✅ 正确：search必须检查isEnd
search(word) {
    const node = this.searchPrefix(word);
    return node !== null && node.isEnd;
}

// startsWith只需检查节点存在
startsWith(prefix) {
    return this.searchPrefix(prefix) !== null;
}
```

### 错误 3：回溯时忘记恢复状态

```javascript
// ❌ 错误：未恢复board状态
function dfs(i, j, node, path) {
  board[i][j] = "#"; // 标记访问
  // DFS...
  // 忘记恢复！
}

// ✅ 正确：回溯时恢复
function dfs(i, j, node, path) {
  const temp = board[i][j];
  board[i][j] = "#";
  // DFS...
  board[i][j] = temp; // 恢复状态
}
```

---

## 📝 高频题目清单

| 题号 | 题目                     | 难度   | 类型        | 关键点       |
| ---- | ------------------------ | ------ | ----------- | ------------ |
| 208  | 实现 Trie                | Medium | 基础        | 标准模板     |
| 211  | 添加与搜索单词           | Medium | 通配符      | DFS 处理'.'  |
| 212  | 单词搜索 II              | Hard   | 矩阵+Trie   | 回溯+剪枝    |
| 648  | 单词替换                 | Medium | 前缀匹配    | 查找最短词根 |
| 720  | 词典中最长的单词         | Medium | DFS         | 逐字母构建   |
| 677  | 键值映射                 | Medium | 累加值      | sum 字段     |
| 421  | 数组中两个数的最大异或值 | Medium | 二进制 Trie | 位运算       |
| 1804 | 实现 Trie II             | Medium | 增强版      | 计数功能     |

---

## 🎯 面试沟通要点

### 开始时

1. **确认题型**：

   - "这是前缀匹配问题，我用字典树来解决"
   - "需要高效查找前缀，Trie 的时间复杂度是 O(m)"

2. **说明结构**：
   - "TrieNode 包含 children 映射和 isEnd 标志"
   - "根据需求可能需要添加 count 或 sum 字段"

### 编码时

1. **解释操作**：

   - "insert 时沿着字符路径创建节点，最后标记 isEnd"
   - "search 要检查 isEnd，startsWith 不需要"

2. **说明复杂度**：
   - "插入和查询的时间复杂度都是 O(m)，m 是字符串长度"
   - "空间复杂度 O(n·m)，n 是单词数量"

### 结束时

- **时间复杂度**：O(m) - 字符串长度
- **空间复杂度**：O(n·m) - 总字符数

---

## 💡 总结

### 核心要点

1. **Trie 本质**：树形结构，前缀共享路径
2. **核心操作**：insert、search、startsWith
3. **关键字段**：children（子节点）、isEnd（单词结尾）
4. **适用场景**：前缀匹配、单词查找、自动补全
5. **时间复杂度**：O(m) - 字符串长度

### 记忆口诀

```
字典树存前缀快，子节点映射不重复
插入查找皆O(m)，单词结尾需标记
通配符问题用DFS，矩阵搜索加回溯
前缀统计记count，异或问题二进制
```

---

**最后更新时间**：2024 年
