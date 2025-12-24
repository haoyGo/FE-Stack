# Minimum Swaps 2

> **来源：** HackerRank  
> **难度：** Medium  
> **标签：** 数组、贪心、环检测、图论

---

## 📝 问题描述 (Problem Description)

给定一个包含从 1 到 n 的无序数组（每个数字恰好出现一次），计算将数组排序为升序所需的最小交换次数。

**注意：** 你只能交换数组中的两个元素。

**Given an unordered array consisting of consecutive integers [1, 2, 3, ..., n] without any duplicates, find the minimum number of swaps required to sort the array in ascending order.**

**Note:** You are only allowed to swap two elements at a time.

---

## 🎯 示例 (Examples)

### Example 1:

```
Input:
arr = [4, 3, 1, 2]

Output:
3

Explanation:
Step 1: 交换 4 和 1 → [1, 3, 4, 2]
Step 2: 交换 4 和 2 → [1, 3, 2, 4]
Step 3: 交换 3 和 2 → [1, 2, 3, 4] ✓
最少需要 3 次交换
```

### Example 2:

```
Input:
arr = [2, 3, 4, 1, 5]

Output:
3

Explanation:
Step 1: 交换 2 和 1 → [1, 3, 4, 2, 5]
Step 2: 交换 3 和 2 → [1, 2, 4, 3, 5]
Step 3: 交换 4 和 3 → [1, 2, 3, 4, 5] ✓
最少需要 3 次交换
```

### Example 3:

```
Input:
arr = [1, 3, 5, 2, 4, 6, 7]

Output:
3

Explanation:
位置 2, 3, 4 形成一个环：3 → 5 → 2 → 3
需要 2 次交换
位置 5 需要 1 次交换：4 → 5
总共 3 次交换
```

---

## 💡 解题思路 (Solution Approach)

### 方法 1: 贪心算法（从左到右修正）

#### 核心思想

从左到右遍历数组，如果当前位置的值不正确，就找到正确的值并交换。

```
对于位置 i，应该有值 i+1
如果 arr[i] != i+1，找到 i+1 的位置并交换
```

#### 算法步骤

```
1. 从 i = 0 开始遍历
2. 如果 arr[i] != i + 1:
   - 找到值为 i+1 的位置 j
   - 交换 arr[i] 和 arr[j]
   - 交换次数 +1
3. 重复直到数组有序
```

---

### 方法 2: 环检测（Cycle Detection）⭐ **最优解**

#### 核心思想

将问题转化为图论中的环检测问题。

**关键观察：**

```
每个位置 i 应该有值 i+1
可以构建一个图：位置 i 指向值 arr[i] 应该去的位置

例如：arr = [4, 3, 1, 2]
位置 0: 值 4 → 应该在位置 3
位置 1: 值 3 → 应该在位置 2
位置 2: 值 1 → 应该在位置 0
位置 3: 值 2 → 应该在位置 1

形成环：0 → 3 → 1 → 2 → 0
```

**环的性质：**

- 长度为 k 的环需要 k-1 次交换来排序
- 多个独立的环：分别计算所需交换次数

#### 数学公式

```
如果有 m 个环，第 i 个环的长度为 cycle[i]
最小交换次数 = Σ(cycle[i] - 1) for i = 1 to m
             = (总节点数) - (环的数量)
             = n - m
```

---

## 🔧 代码实现 (Implementation)

### JavaScript 解法 1: 贪心算法

```javascript
/**
 * Minimum Swaps 2 - Greedy Approach
 * @param {number[]} arr - Array to sort
 * @return {number} - Minimum number of swaps
 */
function minimumSwapsGreedy(arr) {
  let swaps = 0;

  // 从左到右修正每个位置
  for (let i = 0; i < arr.length; i++) {
    // 当前位置应该是 i + 1
    while (arr[i] !== i + 1) {
      // 找到正确位置并交换
      const correctPos = arr[i] - 1;
      [arr[i], arr[correctPos]] = [arr[correctPos], arr[i]];
      swaps++;
    }
  }

  return swaps;
}
```

### JavaScript 解法 2: 环检测（推荐）⭐

```javascript
/**
 * Minimum Swaps 2 - Cycle Detection (Optimal)
 * @param {number[]} arr - Array to sort
 * @return {number} - Minimum number of swaps
 */
function minimumSwaps(arr) {
  const n = arr.length;
  const visited = new Array(n).fill(false);
  let swaps = 0;

  // 检测每个环
  for (let i = 0; i < n; i++) {
    // 如果已访问或已在正确位置，跳过
    if (visited[i] || arr[i] === i + 1) {
      continue;
    }

    // 计算当前环的长度
    let cycleLength = 0;
    let current = i;

    while (!visited[current]) {
      visited[current] = true;
      // 移动到当前值应该去的位置
      current = arr[current] - 1;
      cycleLength++;
    }

    // 环的长度为 k，需要 k-1 次交换
    if (cycleLength > 0) {
      swaps += cycleLength - 1;
    }
  }

  return swaps;
}

// 测试用例
console.log(minimumSwaps([4, 3, 1, 2])); // 3
console.log(minimumSwaps([2, 3, 4, 1, 5])); // 3
console.log(minimumSwaps([1, 3, 5, 2, 4, 6, 7])); // 3
console.log(minimumSwaps([7, 1, 3, 2, 4, 5, 6])); // 5
```

### Python 解法

```python
def minimumSwaps(arr):
    """
    Minimum Swaps 2 - Cycle Detection
    :param arr: Array to sort
    :return: Minimum number of swaps
    """
    n = len(arr)
    visited = [False] * n
    swaps = 0

    # 检测每个环
    for i in range(n):
        # 如果已访问或已在正确位置，跳过
        if visited[i] or arr[i] == i + 1:
            continue

        # 计算当前环的长度
        cycle_length = 0
        current = i

        while not visited[current]:
            visited[current] = True
            # 移动到当前值应该去的位置
            current = arr[current] - 1
            cycle_length += 1

        # 环的长度为 k，需要 k-1 次交换
        if cycle_length > 0:
            swaps += cycle_length - 1

    return swaps


# 测试用例
print(minimumSwaps([4, 3, 1, 2]))  # 3
print(minimumSwaps([2, 3, 4, 1, 5]))  # 3
print(minimumSwaps([1, 3, 5, 2, 4, 6, 7]))  # 3
print(minimumSwaps([7, 1, 3, 2, 4, 5, 6]))  # 5
```

### TypeScript 解法

```typescript
function minimumSwaps(arr: number[]): number {
  const n = arr.length;
  const visited: boolean[] = new Array(n).fill(false);
  let swaps = 0;

  for (let i = 0; i < n; i++) {
    if (visited[i] || arr[i] === i + 1) {
      continue;
    }

    let cycleLength = 0;
    let current = i;

    while (!visited[current]) {
      visited[current] = true;
      current = arr[current] - 1;
      cycleLength++;
    }

    if (cycleLength > 0) {
      swaps += cycleLength - 1;
    }
  }

  return swaps;
}
```

### Java 解法

```java
public class MinimumSwaps2 {
    /**
     * Minimum Swaps 2 - Cycle Detection
     * @param arr Array to sort
     * @return Minimum number of swaps
     */
    public static int minimumSwaps(int[] arr) {
        int n = arr.length;
        boolean[] visited = new boolean[n];
        int swaps = 0;

        for (int i = 0; i < n; i++) {
            // 如果已访问或已在正确位置，跳过
            if (visited[i] || arr[i] == i + 1) {
                continue;
            }

            // 计算当前环的长度
            int cycleLength = 0;
            int current = i;

            while (!visited[current]) {
                visited[current] = true;
                current = arr[current] - 1;
                cycleLength++;
            }

            // 环的长度为 k，需要 k-1 次交换
            if (cycleLength > 0) {
                swaps += cycleLength - 1;
            }
        }

        return swaps;
    }

    public static void main(String[] args) {
        System.out.println(minimumSwaps(new int[]{4, 3, 1, 2})); // 3
        System.out.println(minimumSwaps(new int[]{2, 3, 4, 1, 5})); // 3
        System.out.println(minimumSwaps(new int[]{1, 3, 5, 2, 4, 6, 7})); // 3
    }
}
```

---

## 📊 复杂度分析 (Complexity Analysis)

### 方法 1: 贪心算法

**时间复杂度 (Time Complexity)**

- **O(n)**: 虽然有嵌套循环，但每个元素最多被交换一次
- 总交换次数 ≤ n

**空间复杂度 (Space Complexity)**

- **O(1)**: 只使用常数额外空间（原地修改）

### 方法 2: 环检测 ⭐

**时间复杂度 (Time Complexity)**

- **O(n)**: 每个元素只访问一次

**空间复杂度 (Space Complexity)**

- **O(n)**: 需要 visited 数组

**比较：**

- 环检测方法虽然需要额外空间，但不修改原数组
- 贪心方法修改原数组，但空间复杂度更低
- 两者时间复杂度相同

---

## 🔍 详细示例分析 (Detailed Example Walkthrough)

### Example 1: arr = [4, 3, 1, 2]

#### 环检测方法

**Step 1: 构建图关系**

```
位置 0: 值 4 → 应该在位置 3
位置 1: 值 3 → 应该在位置 2
位置 2: 值 1 → 应该在位置 0
位置 3: 值 2 → 应该在位置 1

图的边：
0 → 3 → 1 → 2 → 0 (形成一个环)
```

**Step 2: 检测环**

```
从位置 0 开始：
  current = 0, arr[0] = 4, 下一个 = 3
  current = 3, arr[3] = 2, 下一个 = 1
  current = 1, arr[1] = 3, 下一个 = 2
  current = 2, arr[2] = 1, 下一个 = 0
  回到起点，环长度 = 4
```

**Step 3: 计算交换次数**

```
环长度 = 4
所需交换 = 4 - 1 = 3
```

---

### Example 2: arr = [1, 3, 5, 2, 4, 6, 7]

#### 环检测方法

**Step 1: 构建图关系**

```
位置 0: 值 1 ✓ (已正确)
位置 1: 值 3 → 应该在位置 2
位置 2: 值 5 → 应该在位置 4
位置 3: 值 2 → 应该在位置 1
位置 4: 值 4 → 应该在位置 3
位置 5: 值 6 ✓ (已正确)
位置 6: 值 7 ✓ (已正确)
```

**Step 2: 检测环**

```
环 1: 1 → 2 → 4 → 3 → 1
  长度 = 4
  交换次数 = 3

已正确的位置: 0, 5, 6 (不形成环)
```

**Step 3: 计算总交换次数**

```
总交换次数 = 3
```

---

## 🎨 可视化演示 (Visualization)

### arr = [4, 3, 1, 2] 的环结构

```
        ┌───────────────┐
        │               │
        ↓               │
位置:  [0]  [1]  [2]  [3]
值:    [4]  [3]  [1]  [2]
        │    │    │    │
应去:    3    2    0    1
        │    │    ↑    ↑
        │    └────┘    │
        └──────────────┘

这是一个长度为 4 的环
需要 3 次交换
```

### arr = [2, 3, 4, 1, 5] 的环结构

```
        ┌──────┐
        ↓      │
位置:  [0]  [1]  [2]  [3]  [4]
值:    [2]  [3]  [4]  [1]  [5]
        │    │    │    │    ✓
应去:    1    2    3    0   (4)
        │    │    │    │
        ↑    │    │    │
        └────┴────┴────┘

一个长度为 4 的环: 0→1→2→3→0
位置 4 已正确
需要 3 次交换
```

---

## 🐛 边界情况 (Edge Cases)

### Case 1: 已排序数组

```javascript
arr = [1, 2, 3, 4, 5];
// 每个元素都在正确位置
// Output: 0
```

### Case 2: 完全逆序

```javascript
arr = [5, 4, 3, 2, 1];
// 形成一个大环: 0→4→0
// 长度为 5，需要 4 次交换
// Output: 4
```

### Case 3: 两个元素交换

```javascript
arr = [2, 1, 3, 4, 5];
// 环: 0→1→0 (长度 2)
// 需要 1 次交换
// Output: 1
```

### Case 4: 单个元素

```javascript
arr = [1];
// 已正确
// Output: 0
```

### Case 5: 多个独立环

```javascript
arr = [2, 1, 4, 3, 5];
// 环1: 0→1→0 (长度 2) → 1 次交换
// 环2: 2→3→2 (长度 2) → 1 次交换
// 位置 4 正确
// Output: 2
```

### Case 6: 长环

```javascript
arr = [7, 1, 3, 2, 4, 5, 6];
// 环: 0→6→5→4→3→2→1→0 (长度 7)
// 需要 6 次交换
// Output: 6
```

---

## 💡 关键要点 (Key Takeaways)

1. **问题转化**

   - 将排序问题转化为图的环检测问题
   - 每个位置指向其值应该去的位置

2. **环的性质**

   - 长度为 k 的环需要 k-1 次交换
   - 多个独立环的交换次数可以相加

3. **数学公式**

   ```
   最小交换次数 = n - (环的数量)
   ```

4. **贪心 vs 环检测**

   - 贪心：简单直观，原地修改
   - 环检测：不修改原数组，更优雅

5. **图论应用**
   - 这是一个典型的将数组问题映射到图论的例子
   - 理解"位置-值"的映射关系

---

## 🔗 相关问题 (Related Problems)

### 1. **First Missing Positive** (LeetCode 41)

```
相似点: 数组元素应该在特定位置
区别: 找第一个缺失的正数
```

### 2. **Find All Duplicates in an Array** (LeetCode 442)

```
相似点: 利用位置-值关系
区别: 查找重复而非排序
```

### 3. **Couples Holding Hands** (LeetCode 765)

```
相似点: 最小交换次数
区别: 配对问题，环检测的变种
```

### 4. **Missing Number** (LeetCode 268)

```
相似点: 数组包含 1 到 n 的数字
区别: 找缺失的数字
```

### 5. **Set Mismatch** (LeetCode 645)

```
相似点: 位置-值映射
区别: 找重复和缺失的数字
```

---

## 🎓 面试技巧 (Interview Tips)

### 英文讲解模板

```
"This is a classic problem that can be solved using cycle detection.

Problem understanding:
We have an array of consecutive integers from 1 to n, and we need
to find the minimum number of swaps to sort it.

Key insight:
We can model this as a graph where position i points to where
the value arr[i] should be. This creates cycles.

Important property:
A cycle of length k requires exactly k-1 swaps to fix.

My approach:
1. Use a visited array to track explored positions
2. For each unvisited position, follow the cycle
3. Count the cycle length
4. Add (cycle_length - 1) to total swaps

Mathematical formula:
Minimum swaps = n - (number of cycles)

Time complexity: O(n) - visit each element once
Space complexity: O(n) - for the visited array

Let me implement this solution..."
```

### 中文讲解模板

```
"这是一道经典的环检测问题。

问题理解：
给定包含 1 到 n 的数组，求最少交换次数使其排序。

关键洞察：
可以建立一个图：位置 i 指向值 arr[i] 应该去的位置。
这会形成若干个环。

重要性质：
长度为 k 的环需要恰好 k-1 次交换来修复。

解题步骤：
1. 用 visited 数组标记已访问位置
2. 对每个未访问位置，追踪整个环
3. 统计环的长度
4. 累加 (环长度 - 1) 到总交换次数

数学公式：
最小交换次数 = n - (环的数量)

时间复杂度：O(n) - 每个元素访问一次
空间复杂度：O(n) - visited 数组

让我实现这个方案..."
```

### 常见追问及回答

**Q1: 为什么环的长度为 k 需要 k-1 次交换？**

```
A: 考虑一个长度为 3 的环: [3, 1, 2]
   位置 0 有值 3 → 应在位置 2
   位置 1 有值 1 → 应在位置 0
   位置 2 有值 2 → 应在位置 1

   交换 1: [1, 3, 2] (修正位置 0)
   交换 2: [1, 2, 3] (修正位置 1 和 2)

   只需 2 次交换！

   通用规则：k 个元素的环，第一次交换修正 1 个，
   之后每次交换都修正剩余元素，所以需要 k-1 次。
```

**Q2: 能否在 O(1) 空间内完成？**

```
A: 可以，使用贪心方法修改原数组：
   - 从左到右，将每个位置修正为正确值
   - 不需要 visited 数组
   - 但会修改原数组

   Trade-off:
   - 环检测：O(n) 空间，不修改原数组
   - 贪心：O(1) 空间，会修改原数组
```

**Q3: 如果数组不是从 1 到 n，而是任意数字呢？**

```
A: 需要先建立值到排序后位置的映射：
   1. 复制并排序数组
   2. 建立 HashMap: value → sorted_index
   3. 基于映射建立环

   时间复杂度变为 O(n log n) - 因为排序
```

**Q4: 这个算法的实际应用场景？**

```
A:
1. 数据库索引重建
2. 内存页面置换
3. 任务调度优化
4. 图像像素重排
5. 排列还原问题
```

---

## ✅ 完整测试用例 (Complete Test Cases)

```javascript
// Test Suite
const testCases = [
  {
    input: [4, 3, 1, 2],
    expected: 3,
    description: "Single cycle of length 4",
  },
  {
    input: [2, 3, 4, 1, 5],
    expected: 3,
    description: "One cycle + one correct element",
  },
  {
    input: [1, 3, 5, 2, 4, 6, 7],
    expected: 3,
    description: "One cycle + multiple correct elements",
  },
  {
    input: [7, 1, 3, 2, 4, 5, 6],
    expected: 5,
    description: "Long cycle of length 6",
  },
  {
    input: [1, 2, 3, 4, 5],
    expected: 0,
    description: "Already sorted",
  },
  {
    input: [5, 4, 3, 2, 1],
    expected: 2,
    description: "Completely reversed - wait, should be 2!",
  },
  {
    input: [2, 1, 3, 4, 5],
    expected: 1,
    description: "Single swap needed",
  },
  {
    input: [2, 1, 4, 3, 5],
    expected: 2,
    description: "Two independent 2-cycles",
  },
  {
    input: [3, 1, 2],
    expected: 2,
    description: "Small 3-cycle",
  },
  {
    input: [1],
    expected: 0,
    description: "Single element",
  },
  {
    input: [2, 5, 3, 1, 4],
    expected: 3,
    description: "Complex cycles",
  },
];

// Run tests
function runTests() {
  console.log("Running Minimum Swaps 2 Test Suite...\n");

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected, description }, index) => {
    const arr = [...input]; // Copy to avoid mutation
    const result = minimumSwaps(arr);
    const isPass = result === expected;

    if (isPass) passed++;
    else failed++;

    console.log(`Test ${index + 1}: ${description}`);
    console.log(`  Input: [${input.join(", ")}]`);
    console.log(`  Expected: ${expected}, Got: ${result}`);
    console.log(`  ${isPass ? "✅ PASSED" : "❌ FAILED"}\n`);
  });

  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(
    `Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`
  );
}

runTests();
```

---

## 📈 性能优化技巧 (Performance Optimization)

### 1. 提前终止优化

```javascript
function minimumSwapsOptimized(arr) {
  const n = arr.length;
  const visited = new Array(n).fill(false);
  let swaps = 0;
  let correctCount = 0;

  for (let i = 0; i < n; i++) {
    // 提前终止：如果所有元素都已正确
    if (correctCount === n) {
      break;
    }

    if (visited[i] || arr[i] === i + 1) {
      if (arr[i] === i + 1) correctCount++;
      continue;
    }

    let cycleLength = 0;
    let current = i;

    while (!visited[current]) {
      visited[current] = true;
      current = arr[current] - 1;
      cycleLength++;
    }

    if (cycleLength > 0) {
      swaps += cycleLength - 1;
    }
  }

  return swaps;
}
```

### 2. 避免数组复制

```javascript
// 如果可以修改原数组，使用贪心方法节省空间
function minimumSwapsInPlace(arr) {
  let swaps = 0;

  for (let i = 0; i < arr.length; i++) {
    while (arr[i] !== i + 1) {
      const correctPos = arr[i] - 1;
      [arr[i], arr[correctPos]] = [arr[correctPos], arr[i]];
      swaps++;
    }
  }

  return swaps;
}
```

---

## 🎯 实战应用场景 (Real-world Applications)

1. **数据库优化**

   - 索引重建最小化磁盘操作
   - 记录重排序

2. **内存管理**

   - 页面置换算法
   - 缓存优化

3. **调度系统**

   - 任务重排序
   - 资源分配优化

4. **游戏开发**

   - 排列还原谜题
   - 地图块重排

5. **图像处理**
   - 像素重排序
   - 色彩映射

---

**总结：** 这道题是数组操作和图论的完美结合。通过将位置-值关系建模为图，利用环检测算法，我们能在线性时间内找到最优解。关键在于理解"环长度 k 需要 k-1 次交换"这一性质，以及"最小交换数 = n - 环数量"的数学公式。

**Summary:** This problem beautifully combines array manipulation with graph theory. By modeling position-value relationships as a graph and using cycle detection, we achieve an optimal linear-time solution. The key insights are understanding that "a cycle of length k requires k-1 swaps" and the mathematical formula "minimum swaps = n - number of cycles".
