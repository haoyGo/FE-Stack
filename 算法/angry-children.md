# Angry Children (Max Min)

> **来源：** HackerRank  
> **难度：** Medium  
> **标签：** 贪心、排序、滑动窗口

---

## 📝 问题描述 (Problem Description)

给定一个包含 N 个整数的数组，从中选择 K 个数，使得这 K 个数中的最大值和最小值的差（不公平性）最小。

返回最小的不公平性值。

**Given an array of N integers, select K integers from the array such that the unfairness (difference between max and min of these K integers) is minimized.**

**Return the minimum possible unfairness.**

**不公平性定义 (Unfairness Definition):**

```
unfairness = max(selected_k_integers) - min(selected_k_integers)
```

---

## 🎯 示例 (Examples)

### Example 1:

```
Input:
n = 7
k = 3
arr = [10, 100, 300, 200, 1000, 20, 30]

Output:
20

Explanation:
选择 [10, 20, 30]
unfairness = 30 - 10 = 20 (最小)

其他选择：
[10, 20, 100] → 100 - 10 = 90
[100, 200, 300] → 300 - 100 = 200
```

### Example 2:

```
Input:
n = 6
k = 4
arr = [1, 2, 3, 4, 10, 20]

Output:
3

Explanation:
选择 [1, 2, 3, 4]
unfairness = 4 - 1 = 3 (最小)
```

### Example 3:

```
Input:
n = 5
k = 2
arr = [1, 2, 1, 2, 1]

Output:
0

Explanation:
选择 [1, 1]
unfairness = 1 - 1 = 0
```

---

## 💡 解题思路 (Solution Approach)

### 核心观察 (Key Observations)

1. **目标**：最小化 `max - min`
2. **关键洞察**：选择的 K 个数应该是**连续的、已排序的子数组**
3. **原因**：如果数字是排序的，那么连续的 K 个数具有最小的差值范围

### 为什么要排序？

```
未排序: [10, 100, 300, 200, 1000, 20, 30]
很难直接找到最优解

排序后: [10, 20, 30, 100, 200, 300, 1000]
现在可以看到：
- [10, 20, 30] 差值 = 20
- [20, 30, 100] 差值 = 80
- [30, 100, 200] 差值 = 170
...
```

### 算法策略

```
1. 对数组排序 (升序)
2. 使用滑动窗口，窗口大小为 K
3. 对每个窗口，计算 arr[i+k-1] - arr[i]
4. 返回最小差值
```

### 为什么这样有效？

**数学证明：**

```
假设最优解不是连续的 K 个数，即包含：
a₁ < a₂ < ... < aᵢ < [gap] < aⱼ < ... < aₖ

此时 unfairness = aₖ - a₁

如果用 aᵢ 右边紧邻的数替换 aₖ：
新的 unfairness = (aᵢ + ε) - a₁ < aₖ - a₁

矛盾！所以最优解必定是连续的。
```

---

## 🔧 代码实现 (Implementation)

### JavaScript 解法

```javascript
/**
 * Max Min (Angry Children)
 * @param {number} k - Number of integers to select
 * @param {number[]} arr - Array of integers
 * @return {number} - Minimum unfairness
 */
function maxMin(k, arr) {
  // Step 1: 排序数组
  // Sort the array in ascending order
  arr.sort((a, b) => a - b);

  // Step 2: 初始化最小不公平性为最大值
  // Initialize minimum unfairness to maximum possible value
  let minUnfairness = Infinity;

  // Step 3: 滑动窗口遍历
  // Sliding window of size k
  for (let i = 0; i <= arr.length - k; i++) {
    // 计算当前窗口的不公平性
    // Calculate unfairness for current window
    const unfairness = arr[i + k - 1] - arr[i];

    // 更新最小值
    // Update minimum
    minUnfairness = Math.min(minUnfairness, unfairness);
  }

  return minUnfairness;
}

// 测试用例 Test Cases
console.log(maxMin(3, [10, 100, 300, 200, 1000, 20, 30])); // 20
console.log(maxMin(4, [1, 2, 3, 4, 10, 20])); // 3
console.log(maxMin(2, [1, 2, 1, 2, 1])); // 0
console.log(maxMin(5, [1, 2, 3, 4, 10, 20, 30, 40, 100, 200])); // 9
```

### Python 解法

```python
def maxMin(k, arr):
    """
    Max Min (Angry Children)
    :param k: Number of integers to select
    :param arr: Array of integers
    :return: Minimum unfairness
    """
    # Step 1: 排序数组
    arr.sort()

    # Step 2: 初始化最小不公平性
    min_unfairness = float('inf')

    # Step 3: 滑动窗口遍历
    for i in range(len(arr) - k + 1):
        # 计算当前窗口的不公平性
        unfairness = arr[i + k - 1] - arr[i]

        # 更新最小值
        min_unfairness = min(min_unfairness, unfairness)

    return min_unfairness


# 测试用例
print(maxMin(3, [10, 100, 300, 200, 1000, 20, 30]))  # 20
print(maxMin(4, [1, 2, 3, 4, 10, 20]))  # 3
print(maxMin(2, [1, 2, 1, 2, 1]))  # 0
print(maxMin(5, [1, 2, 3, 4, 10, 20, 30, 40, 100, 200]))  # 9
```

### TypeScript 解法

```typescript
function maxMin(k: number, arr: number[]): number {
  // Step 1: 排序数组
  arr.sort((a, b) => a - b);

  // Step 2: 初始化最小不公平性
  let minUnfairness = Number.POSITIVE_INFINITY;

  // Step 3: 滑动窗口遍历
  for (let i = 0; i <= arr.length - k; i++) {
    // 计算当前窗口的不公平性
    const unfairness = arr[i + k - 1] - arr[i];

    // 更新最小值
    minUnfairness = Math.min(minUnfairness, unfairness);
  }

  return minUnfairness;
}

// 更优雅的函数式写法
function maxMinFunctional(k: number, arr: number[]): number {
  arr.sort((a, b) => a - b);

  return Array.from(
    { length: arr.length - k + 1 },
    (_, i) => arr[i + k - 1] - arr[i]
  ).reduce((min, val) => Math.min(min, val), Infinity);
}
```

### Java 解法

```java
import java.util.*;

public class AngryChildren {
    /**
     * Max Min (Angry Children)
     * @param k Number of integers to select
     * @param arr Array of integers
     * @return Minimum unfairness
     */
    public static int maxMin(int k, int[] arr) {
        // Step 1: 排序数组
        Arrays.sort(arr);

        // Step 2: 初始化最小不公平性
        int minUnfairness = Integer.MAX_VALUE;

        // Step 3: 滑动窗口遍历
        for (int i = 0; i <= arr.length - k; i++) {
            // 计算当前窗口的不公平性
            int unfairness = arr[i + k - 1] - arr[i];

            // 更新最小值
            minUnfairness = Math.min(minUnfairness, unfairness);
        }

        return minUnfairness;
    }

    public static void main(String[] args) {
        System.out.println(maxMin(3, new int[]{10, 100, 300, 200, 1000, 20, 30})); // 20
        System.out.println(maxMin(4, new int[]{1, 2, 3, 4, 10, 20})); // 3
        System.out.println(maxMin(2, new int[]{1, 2, 1, 2, 1})); // 0
    }
}
```

---

## 📊 复杂度分析 (Complexity Analysis)

### 时间复杂度 (Time Complexity)

**O(n log n)**

- 排序：O(n log n)
- 滑动窗口遍历：O(n - k + 1) ≈ O(n)
- 总体：O(n log n) + O(n) = O(n log n)

### 空间复杂度 (Space Complexity)

**O(1)** 或 **O(log n)**

- 原地排序：O(log n)（递归栈空间）
- 不需要额外数据结构
- 如果不允许修改原数组：O(n)（需要复制）

---

## 🔍 详细示例分析 (Detailed Example Walkthrough)

### Example: k = 3, arr = [10, 100, 300, 200, 1000, 20, 30]

**Step 1: 排序**

```
原数组: [10, 100, 300, 200, 1000, 20, 30]
排序后: [10, 20, 30, 100, 200, 300, 1000]
```

**Step 2: 滑动窗口（k=3）**

```
窗口 1: [10, 20, 30]
  差值 = 30 - 10 = 20 ✓ (当前最小)

窗口 2: [20, 30, 100]
  差值 = 100 - 20 = 80

窗口 3: [30, 100, 200]
  差值 = 200 - 30 = 170

窗口 4: [100, 200, 300]
  差值 = 300 - 100 = 200

窗口 5: [200, 300, 1000]
  差值 = 1000 - 200 = 800
```

**Step 3: 返回最小值**

```
最小不公平性 = 20
```

---

### Example: k = 4, arr = [1, 2, 3, 4, 10, 20]

**Step 1: 排序**

```
已排序: [1, 2, 3, 4, 10, 20]
```

**Step 2: 滑动窗口（k=4）**

```
窗口 1: [1, 2, 3, 4]
  差值 = 4 - 1 = 3 ✓ (最小)

窗口 2: [2, 3, 4, 10]
  差值 = 10 - 2 = 8

窗口 3: [3, 4, 10, 20]
  差值 = 20 - 3 = 17
```

**Step 3: 返回最小值**

```
最小不公平性 = 3
```

---

## 🎨 可视化演示 (Visualization)

### 滑动窗口过程

```
数组: [10, 20, 30, 100, 200, 300, 1000]
k = 3

Step 1:
[10, 20, 30], 100, 200, 300, 1000
 └─────┬────┘
   diff = 20

Step 2:
10, [20, 30, 100], 200, 300, 1000
    └─────┬─────┘
     diff = 80

Step 3:
10, 20, [30, 100, 200], 300, 1000
        └──────┬──────┘
         diff = 170

Step 4:
10, 20, 30, [100, 200, 300], 1000
            └──────┬───────┘
             diff = 200

Step 5:
10, 20, 30, 100, [200, 300, 1000]
                 └───────┬───────┘
                   diff = 800

最小值: 20
```

---

## 🐛 边界情况 (Edge Cases)

### Case 1: k = n（选择所有元素）

```javascript
k = 5;
arr = [1, 2, 3, 4, 5];
// 必须选所有元素
// Output: 5 - 1 = 4
```

### Case 2: k = 1（只选一个元素）

```javascript
k = 1;
arr = [100, 200, 300];
// 任意一个元素的差值都是 0
// Output: 0
```

### Case 3: 所有元素相同

```javascript
k = 3;
arr = [5, 5, 5, 5, 5];
// 任意组合差值都是 0
// Output: 0
```

### Case 4: 极端差值

```javascript
k = 2;
arr = [1, 1000000];
// 只有一种选择
// Output: 999999
```

### Case 5: 已排序数组

```javascript
k = 3;
arr = [1, 2, 3, 4, 5];
// 最优解在开始
// Output: 3 - 1 = 2
```

### Case 6: 逆序数组

```javascript
k = 3;
arr = [5, 4, 3, 2, 1];
// 排序后: [1, 2, 3, 4, 5]
// Output: 3 - 1 = 2
```

---

## 💡 关键要点 (Key Takeaways)

1. **贪心策略**

   - 排序后选择连续的 K 个数
   - 局部最优导致全局最优

2. **滑动窗口**

   - 固定大小窗口在数组上滑动
   - 计算每个窗口的特征值

3. **排序的重要性**

   - 将问题简化为一维搜索
   - 使得贪心策略有效

4. **时间优化**

   - 不需要尝试所有 C(n, k) 种组合
   - 只需 O(n) 次比较

5. **空间优化**
   - 原地排序
   - 不需要额外存储

---

## 🔗 相关问题 (Related Problems)

### 1. **Minimum Difference Between Largest and Smallest Value in Three Moves** (LeetCode 1509)

```
相似点: 都是最小化差值
区别: LeetCode 版本可以改变最多3个元素
```

### 2. **Minimize Maximum Pair Sum in Array** (LeetCode 1877)

```
相似点: 排序 + 贪心
区别: 目标是最小化最大配对和
```

### 3. **K Closest Points to Origin** (LeetCode 973)

```
相似点: 选择 K 个元素
区别: 基于距离排序
```

### 4. **Kth Smallest Element** (LeetCode 215)

```
相似点: 排序找特定元素
区别: 查找而非选择子集
```

### 5. **Partition Array Into Three Parts With Equal Sum** (LeetCode 1013)

```
相似点: 数组分割问题
区别: 基于和而非差值
```

---

## 🎓 面试技巧 (Interview Tips)

### 英文讲解模板

```
"This is a greedy algorithm problem involving sorting and sliding window.

Problem understanding:
We need to select k integers from an array to minimize the unfairness,
which is defined as the difference between max and min of selected integers.

Key insight:
After sorting the array, the optimal k integers must be consecutive.
Why? Because if we skip any number in between, we're unnecessarily
increasing the range.

My approach:
1. Sort the array - O(n log n)
2. Use a sliding window of size k
3. For each window, calculate arr[i+k-1] - arr[i]
4. Return the minimum difference

Time complexity: O(n log n) - dominated by sorting
Space complexity: O(1) - in-place sorting

Let me implement this solution..."
```

### 中文讲解模板

```
"这是一道结合排序和滑动窗口的贪心算法题。

问题理解：
需要从数组中选择 k 个整数，使得不公平性（最大值-最小值）最小。

关键洞察：
排序后，最优的 k 个数必定是连续的。
为什么？因为如果跳过中间的数，会不必要地增大范围。

解题步骤：
1. 对数组排序 - O(n log n)
2. 使用大小为 k 的滑动窗口
3. 对每个窗口，计算 arr[i+k-1] - arr[i]
4. 返回最小差值

时间复杂度：O(n log n) - 主要是排序
空间复杂度：O(1) - 原地排序

让我来实现这个方案..."
```

### 常见追问及回答

**Q1: 为什么排序后选连续的 k 个数是最优的？**

```
A: 反证法。假设最优解不是连续的，比如 [a, b, ..., (gap), ..., c]
   那么 unfairness = c - a

   如果我们用 gap 中的某个数替换 c：
   新的 unfairness = gap中的数 - a < c - a

   这就产生了矛盾，说明最优解必定是连续的。
```

**Q2: 能不能不排序？**

```
A: 理论上可以用优先队列或快速选择，但：
   1. 我们需要找的不是第 k 小，而是最小范围的 k 个数
   2. 不排序很难保证找到全局最优
   3. 排序方案已经很高效了 O(n log n)
```

**Q3: 如果 k 很大（接近 n），有优化吗？**

```
A: 没有本质优化，但可以：
   1. 减少窗口数量：只有 n - k + 1 个窗口
   2. 如果 k = n，直接返回 max - min
   3. 如果 k = n - 1，只需比较去掉最大值或最小值
```

---

## ✅ 完整测试用例 (Complete Test Cases)

```javascript
// Test Suite
const testCases = [
  {
    k: 3,
    arr: [10, 100, 300, 200, 1000, 20, 30],
    expected: 20,
    description: "Basic HackerRank example",
  },
  {
    k: 4,
    arr: [1, 2, 3, 4, 10, 20],
    expected: 3,
    description: "Small consecutive numbers at start",
  },
  {
    k: 2,
    arr: [1, 2, 1, 2, 1],
    expected: 0,
    description: "Duplicate numbers, minimum is 0",
  },
  {
    k: 5,
    arr: [1, 2, 3, 4, 10, 20, 30, 40, 100, 200],
    expected: 9,
    description: "Larger array, optimal in middle",
  },
  {
    k: 1,
    arr: [100, 200, 300],
    expected: 0,
    description: "k=1, single element has 0 unfairness",
  },
  {
    k: 5,
    arr: [1, 2, 3, 4, 5],
    expected: 4,
    description: "k=n, must select all elements",
  },
  {
    k: 3,
    arr: [5, 5, 5, 5, 5],
    expected: 0,
    description: "All elements are the same",
  },
  {
    k: 2,
    arr: [1, 1000000],
    expected: 999999,
    description: "Extreme difference, only one choice",
  },
  {
    k: 4,
    arr: [10, 20, 30, 100, 150, 200],
    expected: 90,
    description: "Multiple valid windows",
  },
  {
    k: 3,
    arr: [100, 200, 300, 350, 400, 401, 402],
    expected: 2,
    description: "Optimal at end of sorted array",
  },
];

// Run tests
function runTests() {
  console.log("Running Angry Children Test Suite...\n");

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ k, arr, expected, description }, index) => {
    const input = [...arr]; // Copy to avoid mutation
    const result = maxMin(k, input);
    const isPass = result === expected;

    if (isPass) passed++;
    else failed++;

    console.log(`Test ${index + 1}: ${description}`);
    console.log(`  Input: k=${k}, arr=[${arr.join(", ")}]`);
    console.log(`  Expected: ${expected}, Got: ${result}`);
    console.log(`  ${isPass ? "✅ PASSED" : "❌ FAILED"}\n`);
  });

  console.log(`Results: ${passed} passed, ${failed} failed`);
}

runTests();
```

---

## 📈 性能优化建议 (Performance Optimization Tips)

### 1. 避免不必要的排序

```javascript
// 如果数组已排序，跳过排序步骤
function maxMinOptimized(k, arr) {
  // 检查是否已排序
  const isSorted = arr.every((val, i) => i === 0 || arr[i - 1] <= val);

  if (!isSorted) {
    arr.sort((a, b) => a - b);
  }

  // ...rest of algorithm
}
```

### 2. 提前终止

```javascript
function maxMinEarlyExit(k, arr) {
  arr.sort((a, b) => a - b);

  let minUnfairness = Infinity;

  for (let i = 0; i <= arr.length - k; i++) {
    const unfairness = arr[i + k - 1] - arr[i];

    // 如果差值为 0，不可能更小了
    if (unfairness === 0) {
      return 0;
    }

    minUnfairness = Math.min(minUnfairness, unfairness);
  }

  return minUnfairness;
}
```

### 3. 使用 TypedArray（对于大数据集）

```javascript
function maxMinTypedArray(k, arr) {
  // 转换为 Int32Array 以提高性能
  const typedArr = new Int32Array(arr);
  typedArr.sort();

  let minUnfairness = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i <= typedArr.length - k; i++) {
    const unfairness = typedArr[i + k - 1] - typedArr[i];
    if (unfairness < minUnfairness) {
      minUnfairness = unfairness;
    }
  }

  return minUnfairness;
}
```

---

## 🎯 实战应用场景 (Real-world Applications)

1. **资源分配**

   - 将任务分配给工人，最小化负载差异
   - 公平分配奖金、工资

2. **调度问题**

   - 选择时间段，最小化等待时间差异
   - 航班调度优化

3. **数据分析**

   - 选择数据子集进行分析
   - 最小化方差或标准差

4. **游戏平衡**
   - 队伍分配，平衡实力差距
   - 公平竞赛分组

---

**总结：** 这道题通过排序和滑动窗口的结合，将一个看似复杂的组合优化问题转化为简单的线性搜索。关键在于理解排序后连续选择的贪心策略，这是很多类似问题的通用模式。

**Summary:** This problem elegantly combines sorting with sliding window to transform a complex combinatorial optimization into a simple linear search. The key insight is the greedy strategy of consecutive selection after sorting, which is a common pattern in many similar problems.
