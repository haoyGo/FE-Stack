# 前缀和

## 🎯 核心原理

**前缀和**是一种预处理技巧，通过预先计算数组前缀的累加和，实现 O(1) 时间查询任意区间和。

**核心思想**：

- `preSum[i]` 表示前 i 个元素的和
- 区间 `[left, right]` 的和 = `preSum[right+1] - preSum[left]`

**时间复杂度**：

- 预处理：O(n)
- 单次查询：O(1)

**空间复杂度**：O(n)

---

## 📝 识别特征

看到这些关键词，考虑前缀和：

- **频繁查询区间和**
- **子数组和问题**
- **连续子数组**
- **和为 K 的子数组**

---

## 🔧 代码模板

### 模板 1：一维前缀和

```javascript
class PrefixSum {
  constructor(arr) {
    const n = arr.length;
    this.preSum = new Array(n + 1).fill(0);

    // 构建前缀和
    for (let i = 0; i < n; i++) {
      this.preSum[i + 1] = this.preSum[i] + arr[i];
    }
  }

  // 查询区间 [left, right] 的和
  rangeSum(left, right) {
    return this.preSum[right + 1] - this.preSum[left];
  }
}

// 使用示例
const arr = [1, 2, 3, 4, 5];
const ps = new PrefixSum(arr);
console.log(ps.rangeSum(1, 3)); // 2+3+4 = 9
```

### 模板 2：二维前缀和

```javascript
class MatrixSum {
  constructor(matrix) {
    const m = matrix.length;
    const n = matrix[0].length;
    this.preSum = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    // 构建二维前缀和
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        this.preSum[i][j] =
          this.preSum[i - 1][j] +
          this.preSum[i][j - 1] -
          this.preSum[i - 1][j - 1] +
          matrix[i - 1][j - 1];
      }
    }
  }

  // 查询子矩阵 (r1,c1) 到 (r2,c2) 的和
  sumRegion(r1, c1, r2, c2) {
    return (
      this.preSum[r2 + 1][c2 + 1] -
      this.preSum[r1][c2 + 1] -
      this.preSum[r2 + 1][c1] +
      this.preSum[r1][c1]
    );
  }
}
```

---

## 📌 常见面试题

### 1. LeetCode 303 - 区域和检索（数组不可变）⭐

**题目**：多次查询数组区间和。

```javascript
class NumArray {
  constructor(nums) {
    const n = nums.length;
    this.preSum = new Array(n + 1).fill(0);

    for (let i = 0; i < n; i++) {
      this.preSum[i + 1] = this.preSum[i] + nums[i];
    }
  }

  sumRange(left, right) {
    return this.preSum[right + 1] - this.preSum[left];
  }
}

// 使用
const numArray = new NumArray([1, 2, 3, 4, 5]);
numArray.sumRange(0, 2); // 1+2+3 = 6
numArray.sumRange(2, 4); // 3+4+5 = 12
```

---

### 2. LeetCode 304 - 二维区域和检索（矩阵不可变）⭐⭐

**题目**：多次查询矩阵子区域和。

```javascript
class NumMatrix {
  constructor(matrix) {
    if (!matrix.length) return;

    const m = matrix.length;
    const n = matrix[0].length;
    this.preSum = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        this.preSum[i][j] =
          this.preSum[i - 1][j] +
          this.preSum[i][j - 1] -
          this.preSum[i - 1][j - 1] +
          matrix[i - 1][j - 1];
      }
    }
  }

  sumRegion(row1, col1, row2, col2) {
    return (
      this.preSum[row2 + 1][col2 + 1] -
      this.preSum[row1][col2 + 1] -
      this.preSum[row2 + 1][col1] +
      this.preSum[row1][col1]
    );
  }
}
```

---

### 3. LeetCode 560 - 和为 K 的子数组 ⭐⭐⭐

**题目**：找到和为 k 的连续子数组的个数。

**核心思想**：前缀和 + 哈希表

```javascript
function subarraySum(nums, k) {
  const map = new Map();
  map.set(0, 1); // 前缀和为0出现1次

  let sum = 0;
  let count = 0;

  for (const num of nums) {
    sum += num;

    // 如果存在 sum - k，说明找到了和为k的子数组
    if (map.has(sum - k)) {
      count += map.get(sum - k);
    }

    // 记录当前前缀和出现的次数
    map.set(sum, (map.get(sum) || 0) + 1);
  }

  return count;
}

// 示例
subarraySum([1, 1, 1], 2); // 2 ([1,1] 出现2次)
subarraySum([1, 2, 3], 3); // 2 ([1,2] 和 [3])
```

**原理图解**：

```
数组: [1, 2, 1, 3]  k = 3
前缀和: 0 -> 1 -> 3 -> 4 -> 7

当前sum=3时，sum-k=0存在 → 找到子数组[1,2]
当前sum=4时，sum-k=1存在 → 找到子数组[2,1]
当前sum=7时，sum-k=4存在 → 找到子数组[3]
```

---

### 4. LeetCode 525 - 连续数组 ⭐⭐

**题目**：找到含有相同数量 0 和 1 的最长连续子数组。

**技巧**：将 0 看作-1，问题转化为"和为 0 的最长子数组"

```javascript
function findMaxLength(nums) {
  const map = new Map();
  map.set(0, -1); // 前缀和0出现在索引-1

  let sum = 0;
  let maxLen = 0;

  for (let i = 0; i < nums.length; i++) {
    sum += nums[i] === 1 ? 1 : -1;

    if (map.has(sum)) {
      maxLen = Math.max(maxLen, i - map.get(sum));
    } else {
      map.set(sum, i);
    }
  }

  return maxLen;
}

// 示例
findMaxLength([0, 1]); // 2
findMaxLength([0, 1, 0]); // 2
```

---

### 5. LeetCode 974 - 和可被 K 整除的子数组 ⭐⭐

**题目**：找到和可被 K 整除的连续子数组数目。

```javascript
function subarraysDivByK(nums, k) {
  const map = new Map();
  map.set(0, 1); // 余数为0出现1次

  let sum = 0;
  let count = 0;

  for (const num of nums) {
    sum += num;
    // 计算余数，处理负数情况
    let mod = ((sum % k) + k) % k;

    if (map.has(mod)) {
      count += map.get(mod);
    }

    map.set(mod, (map.get(mod) || 0) + 1);
  }

  return count;
}

// 示例
subarraysDivByK([4, 5, 0, -2, -3, 1], 5); // 7
```

---

### 6. LeetCode 1248 - 统计优美子数组 ⭐⭐

**题目**：统计恰好有 k 个奇数的连续子数组。

```javascript
function numberOfSubarrays(nums, k) {
  const map = new Map();
  map.set(0, 1);

  let count = 0;
  let oddCount = 0;

  for (const num of nums) {
    oddCount += num % 2; // 奇数+1，偶数+0

    if (map.has(oddCount - k)) {
      count += map.get(oddCount - k);
    }

    map.set(oddCount, (map.get(oddCount) || 0) + 1);
  }

  return count;
}

// 示例
numberOfSubarrays([1, 1, 2, 1, 1], 3); // 2
```

---

### 7. LeetCode 437 - 路径总和 III ⭐⭐

**题目**：二叉树中路径和等于目标值的路径数。

```javascript
function pathSum(root, targetSum) {
  const map = new Map();
  map.set(0, 1);

  function dfs(node, sum) {
    if (!node) return 0;

    sum += node.val;
    let count = map.get(sum - targetSum) || 0;

    map.set(sum, (map.get(sum) || 0) + 1);

    count += dfs(node.left, sum);
    count += dfs(node.right, sum);

    // 回溯
    map.set(sum, map.get(sum) - 1);

    return count;
  }

  return dfs(root, 0);
}
```

---

### 8. LeetCode 238 - 除自身以外数组的乘积 ⭐⭐

**题目**：返回数组 answer，其中 answer[i] 等于 nums 中除 nums[i] 之外其余各元素的乘积。

**技巧**：前缀积 × 后缀积

```javascript
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n);

  // 前缀积
  result[0] = 1;
  for (let i = 1; i < n; i++) {
    result[i] = result[i - 1] * nums[i - 1];
  }

  // 后缀积
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}

// 示例
productExceptSelf([1, 2, 3, 4]); // [24, 12, 8, 6]
```

---

## 🎯 核心技巧

### 技巧 1：前缀和 + 哈希表

```javascript
// 适用于：和为k的子数组、和可被k整除等
const map = new Map();
map.set(0, 1); // 初始化

for (遍历数组) {
    计算前缀和;

    if (map.has(sum - target)) {
        找到答案;
    }

    map.set(sum, count);
}
```

### 技巧 2：变形应用

- 0/1 数组 → 将 0 看作-1，转化为前缀和问题
- 奇偶数 → 统计奇数个数作为前缀和
- 二叉树路径 → DFS + 前缀和 + 回溯

### 技巧 3：二维前缀和公式记忆

```
构建：
preSum[i][j] = preSum[i-1][j] + preSum[i][j-1]
             - preSum[i-1][j-1] + matrix[i-1][j-1]

查询：
sum = preSum[r2+1][c2+1] - preSum[r1][c2+1]
    - preSum[r2+1][c1] + preSum[r1][c1]
```

---

## 💡 面试建议

1. **识别前缀和问题**：

   - 看到"连续子数组"、"区间和" → 考虑前缀和
   - 需要多次查询 → 预处理前缀和

2. **优化方向**：

   - 单纯求区间和 → 一维/二维前缀和
   - 统计满足条件的子数组 → 前缀和 + 哈希表

3. **沟通要点**：
   - "用前缀和可以将查询优化到 O(1)"
   - "配合哈希表可以统计满足条件的子数组"

---

**更新时间**：2024 年
