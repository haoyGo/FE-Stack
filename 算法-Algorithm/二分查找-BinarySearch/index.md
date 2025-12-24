# 二分查找

## 🎯 核心原理

**二分查找**是在**有序数组**中查找目标值的高效算法，每次将搜索区间缩小一半。

**核心思想**：

- 每次取中间位置 mid
- 根据 `arr[mid]` 与 target 的关系，缩小搜索范围
- 重复直到找到目标或区间为空

**时间复杂度**：O(log n) - 每次折半  
**空间复杂度**：O(1)

---

## 📝 识别特征

看到这些关键词，考虑二分查找：

- **有序数组/序列**
- **查找目标值**
- **查找边界**（第一个/最后一个满足条件的）
- **时间要求 O(log n)**
- **旋转数组、山脉数组**

---

## 🔧 代码模板

### 模板 1：标准二分查找（查找目标值）

```javascript
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1; // 目标在右半部分
    } else {
      right = mid - 1; // 目标在左半部分
    }
  }

  return -1; // 未找到
}
```

### 模板 2：查找左边界（第一个 >= target 的位置）

```javascript
function leftBound(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1; // 继续向左收缩
    }
  }

  return left; // left 就是第一个 >= target 的位置
}
```

### 模板 3：查找右边界（最后一个 <= target 的位置）

```javascript
function rightBound(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] <= target) {
      left = mid + 1; // 继续向右收缩
    } else {
      right = mid - 1;
    }
  }

  return right; // right 就是最后一个 <= target 的位置
}
```

---

## 📌 常见面试题

### 1. LeetCode 704 - 二分查找 ⭐

**题目**：在有序数组中查找目标值。

```javascript
function search(nums, target) {
  let left = 0,
    right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
```

---

### 2. LeetCode 34 - 在排序数组中查找元素的第一个和最后一个位置 ⭐⭐

**题目**：找到目标值的起始和结束位置。

```javascript
function searchRange(nums, target) {
  // 找左边界（第一个 >= target）
  function leftBound() {
    let left = 0,
      right = nums.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return left;
  }

  // 找右边界（最后一个 <= target）
  function rightBound() {
    let left = 0,
      right = nums.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] <= target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return right;
  }

  const start = leftBound();
  const end = rightBound();

  // 判断是否找到
  if (start <= end && nums[start] === target) {
    return [start, end];
  }

  return [-1, -1];
}

// 示例
searchRange([5, 7, 7, 8, 8, 10], 8); // [3, 4]
```

---

### 3. LeetCode 35 - 搜索插入位置 ⭐

**题目**：找到目标值应该插入的位置。

```javascript
function searchInsert(nums, target) {
  let left = 0,
    right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return left; // left 就是插入位置
}

// 示例
searchInsert([1, 3, 5, 6], 5); // 2
searchInsert([1, 3, 5, 6], 2); // 1
```

---

### 4. LeetCode 33 - 搜索旋转排序数组 ⭐⭐⭐

**题目**：在旋转数组中查找目标值。

```javascript
function search(nums, target) {
  let left = 0,
    right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // 判断哪一半是有序的
    if (nums[left] <= nums[mid]) {
      // 左半部分有序
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1; // target 在左半部分
      } else {
        left = mid + 1;
      }
    } else {
      // 右半部分有序
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1; // target 在右半部分
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}

// 示例
search([4, 5, 6, 7, 0, 1, 2], 0); // 4
```

---

### 5. LeetCode 69 - x 的平方根 ⭐

**题目**：计算并返回 x 的平方根（只保留整数部分）。

```javascript
function mySqrt(x) {
  if (x === 0) return 0;

  let left = 1,
    right = x;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const square = mid * mid;

    if (square === x) {
      return mid;
    } else if (square < x) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return right; // right 是最后一个 square <= x 的位置
}

// 示例
mySqrt(8); // 2 (√8 = 2.82...)
```

---

### 6. LeetCode 153 - 寻找旋转排序数组中的最小值 ⭐⭐

**题目**：找旋转数组中的最小值。

```javascript
function findMin(nums) {
  let left = 0,
    right = nums.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] > nums[right]) {
      // 最小值在右半部分
      left = mid + 1;
    } else {
      // 最小值在左半部分（包括mid）
      right = mid;
    }
  }

  return nums[left];
}

// 示例
findMin([3, 4, 5, 1, 2]); // 1
```

---

### 7. LeetCode 162 - 寻找峰值 ⭐⭐

**题目**：找到数组中的峰值元素（比相邻元素都大）。

```javascript
function findPeakElement(nums) {
  let left = 0,
    right = nums.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] < nums[mid + 1]) {
      // 峰值在右侧
      left = mid + 1;
    } else {
      // 峰值在左侧（包括mid）
      right = mid;
    }
  }

  return left;
}
```

---

### 8. LeetCode 875 - 爱吃香蕉的珂珂 ⭐⭐

**题目**：求最小的吃香蕉速度 k，使得能在 h 小时内吃完所有香蕉。

```javascript
function minEatingSpeed(piles, h) {
  // 判断以速度k能否在h小时内吃完
  function canFinish(k) {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / k);
    }
    return hours <= h;
  }

  let left = 1;
  let right = Math.max(...piles);

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (canFinish(mid)) {
      right = mid - 1; // 尝试更小的速度
    } else {
      left = mid + 1;
    }
  }

  return left;
}

// 示例
minEatingSpeed([3, 6, 7, 11], 8); // 4
```

---

### 9. LeetCode 278 - 第一个错误的版本 ⭐

**题目**：找到第一个错误的版本。

```javascript
function solution(isBadVersion) {
  return function (n) {
    let left = 1,
      right = n;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (isBadVersion(mid)) {
        right = mid - 1; // 第一个错误可能在左边
      } else {
        left = mid + 1;
      }
    }

    return left;
  };
}
```

---

### 10. LeetCode 374 - 猜数字大小 ⭐

**题目**：猜数字游戏。

```javascript
function guessNumber(n) {
  let left = 1,
    right = n;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const result = guess(mid);

    if (result === 0) {
      return mid;
    } else if (result === -1) {
      right = mid - 1; // 猜大了
    } else {
      left = mid + 1; // 猜小了
    }
  }
}
```

---

## 🎯 关键点总结

### 1. 边界问题

```javascript
// 两种常见写法
// 写法1：left <= right（推荐，更通用）
while (left <= right) {
  const mid = Math.floor((left + right) / 2);
  // ...
  left = mid + 1; // 或 right = mid - 1
}

// 写法2：left < right（找边界时常用）
while (left < right) {
  const mid = Math.floor((left + right) / 2);
  // ...
  left = mid + 1; // 或 right = mid
}
```

### 2. mid 的计算

```javascript
// 避免溢出
const mid = left + Math.floor((right - left) / 2);
// 或
const mid = Math.floor((left + right) / 2);
```

### 3. 查找类型对应的模板

| 查找类型   | right 更新 | left 更新 | 返回值        |
| ---------- | ---------- | --------- | ------------- |
| 查找目标值 | `mid - 1`  | `mid + 1` | `mid` 或 `-1` |
| 查找左边界 | `mid - 1`  | `mid + 1` | `left`        |
| 查找右边界 | `mid - 1`  | `mid + 1` | `right`       |

---

## 💡 面试技巧

1. **明确题意**：

   - 数组是否有序？
   - 是否有重复元素？
   - 查找什么？（目标值/边界/满足条件的）

2. **说明思路**：

   - "这是有序数组查找问题，用二分查找可以达到 O(log n)"
   - "需要找左边界/右边界，用对应的模板"

3. **注意边界**：

   - 循环条件是 `<=` 还是 `<`
   - left 和 right 的更新方式
   - 返回 left 还是 right

4. **扩展应用**：
   - 二分不仅用于查找，还可以用于"答案"
   - 如：速度、容量等的最小值/最大值问题

---

**更新时间**：2024 年
