# 单调栈

## 🎯 核心原理

**单调栈**是一种特殊的栈，栈内元素保持单调递增或单调递减。通过维护单调性，可以在 O(n) 时间内解决"下一个更大/更小元素"类问题。

**核心思想**：

- 遍历数组时，维护栈的单调性
- 当前元素破坏单调性时，弹出栈顶元素
- 弹出时就找到了答案

**时间复杂度**：O(n) - 每个元素最多入栈出栈各一次  
**空间复杂度**：O(n) - 栈的空间

---

## 📝 识别特征

看到这些关键词，考虑单调栈：

- **下一个更大/更小元素**
- **第一个满足条件的元素**
- **左边/右边第一个比它大/小的**
- 暴力解法是 O(n²)，需要优化

---

## 🔧 代码模板

### 模板 1：找下一个更大元素（从右向左）

```javascript
function nextGreaterElement(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // 单调递减栈（存储索引）

  // 从右向左遍历
  for (let i = n - 1; i >= 0; i--) {
    // 维护单调性：弹出所有小于等于当前元素的
    while (stack.length && nums[stack[stack.length - 1]] <= nums[i]) {
      stack.pop();
    }

    // 栈顶就是答案
    if (stack.length) {
      result[i] = nums[stack[stack.length - 1]];
    }

    stack.push(i);
  }

  return result;
}
```

### 模板 2：找下一个更小元素（从右向左）

```javascript
function nextSmallerElement(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // 单调递增栈

  for (let i = n - 1; i >= 0; i--) {
    // 维护单调性：弹出所有大于等于当前元素的
    while (stack.length && nums[stack[stack.length - 1]] >= nums[i]) {
      stack.pop();
    }

    if (stack.length) {
      result[i] = nums[stack[stack.length - 1]];
    }

    stack.push(i);
  }

  return result;
}
```

---

## 📌 常见面试题

### 1. LeetCode 739 - 每日温度 ⭐⭐

**题目**：给定每日温度列表，返回需要等多少天才会有更高的温度。

```javascript
function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const result = new Array(n).fill(0);
  const stack = []; // 单调递减栈，存储索引

  for (let i = 0; i < n; i++) {
    // 当前温度比栈顶高，找到了答案
    while (
      stack.length &&
      temperatures[i] > temperatures[stack[stack.length - 1]]
    ) {
      const prevIndex = stack.pop();
      result[prevIndex] = i - prevIndex;
    }
    stack.push(i);
  }

  return result;
}

// 示例
dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]);
// 输出: [1, 1, 4, 2, 1, 1, 0, 0]
```

---

### 2. LeetCode 496 - 下一个更大元素 I ⭐

**题目**：在 nums2 中找到 nums1 每个元素的下一个更大元素。

```javascript
function nextGreaterElement(nums1, nums2) {
  const map = new Map();
  const stack = [];

  // 先处理 nums2，建立映射
  for (let i = nums2.length - 1; i >= 0; i--) {
    while (stack.length && stack[stack.length - 1] <= nums2[i]) {
      stack.pop();
    }
    map.set(nums2[i], stack.length ? stack[stack.length - 1] : -1);
    stack.push(nums2[i]);
  }

  // 查询 nums1
  return nums1.map((num) => map.get(num));
}
```

---

### 3. LeetCode 503 - 下一个更大元素 II ⭐⭐

**题目**：循环数组，找每个元素的下一个更大元素。

```javascript
function nextGreaterElements(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = [];

  // 遍历两遍数组（模拟循环）
  for (let i = 2 * n - 1; i >= 0; i--) {
    const index = i % n;

    while (stack.length && stack[stack.length - 1] <= nums[index]) {
      stack.pop();
    }

    if (i < n && stack.length) {
      result[index] = stack[stack.length - 1];
    }

    stack.push(nums[index]);
  }

  return result;
}
```

---

### 4. LeetCode 42 - 接雨水 ⭐⭐⭐

**题目**：计算能接多少雨水。

**方法 1：单调栈（推荐）**

```javascript
function trap(height) {
  let water = 0;
  const stack = []; // 单调递减栈

  for (let i = 0; i < height.length; i++) {
    // 当前柱子比栈顶高，可以接水
    while (stack.length && height[i] > height[stack[stack.length - 1]]) {
      const top = stack.pop();

      if (!stack.length) break;

      const left = stack[stack.length - 1];
      const width = i - left - 1;
      const h = Math.min(height[left], height[i]) - height[top];
      water += width * h;
    }
    stack.push(i);
  }

  return water;
}
```

**方法 2：双指针（更简洁）**

```javascript
function trap(height) {
  let left = 0,
    right = height.length - 1;
  let leftMax = 0,
    rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }

  return water;
}
```

---

### 5. LeetCode 84 - 柱状图中最大的矩形 ⭐⭐⭐

**题目**：找到柱状图中最大的矩形面积。

```javascript
function largestRectangleArea(heights) {
  const stack = [];
  let maxArea = 0;

  // 在末尾添加0，确保所有柱子都能出栈
  heights.push(0);

  for (let i = 0; i < heights.length; i++) {
    // 当前柱子比栈顶矮，计算以栈顶为高的矩形面积
    while (stack.length && heights[i] < heights[stack[stack.length - 1]]) {
      const h = heights[stack.pop()];
      const w = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      maxArea = Math.max(maxArea, h * w);
    }
    stack.push(i);
  }

  return maxArea;
}

// 示例
largestRectangleArea([2, 1, 5, 6, 2, 3]);
// 输出: 10 (高度为5和6的矩形，宽度为2)
```

---

### 6. LeetCode 316 - 去除重复字母 ⭐⭐⭐

**题目**：去除字符串中重复字母，使结果字典序最小。

```javascript
function removeDuplicateLetters(s) {
  const stack = [];
  const inStack = new Set();
  const lastIndex = new Map();

  // 记录每个字符最后出现的位置
  for (let i = 0; i < s.length; i++) {
    lastIndex.set(s[i], i);
  }

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (inStack.has(char)) continue;

    // 维护字典序：如果栈顶字符比当前大，且后面还会出现，就弹出
    while (
      stack.length &&
      stack[stack.length - 1] > char &&
      lastIndex.get(stack[stack.length - 1]) > i
    ) {
      inStack.delete(stack.pop());
    }

    stack.push(char);
    inStack.add(char);
  }

  return stack.join("");
}

// 示例
removeDuplicateLetters("bcabc"); // 输出: "abc"
removeDuplicateLetters("cbacdcbc"); // 输出: "acdb"
```

---

## 🎯 快速记忆

| 问题           | 栈的单调性 | 遍历方向          |
| -------------- | ---------- | ----------------- |
| 下一个更大元素 | 递减栈     | 从右向左/从左向右 |
| 下一个更小元素 | 递增栈     | 从右向左/从左向右 |
| 接雨水         | 递减栈     | 从左向右          |
| 最大矩形       | 递增栈     | 从左向右          |

**核心技巧**：

1. 栈中通常存储**索引**，而不是值
2. 破坏单调性时弹出，**弹出的元素就找到了答案**
3. 从右向左遍历，栈顶就是"下一个"元素
4. 从左向右遍历，弹出时计算答案

---

## 💡 面试建议

1. **先说思路**：这是单调栈问题，通过维护栈的单调性来优化时间复杂度
2. **画图说明**：用简单例子演示栈的变化过程
3. **说明复杂度**：每个元素最多入栈出栈各一次，所以是 O(n)
4. **注意边界**：栈空时的处理、遍历方向的选择

---

**更新时间**：2024 年
