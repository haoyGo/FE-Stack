# 滑动窗口算法详解

## 一、什么是滑动窗口？

滑动窗口是一种用于解决**子数组/子串**问题的算法技巧，通过维护一个窗口（区间）在数组上移动来高效求解。

### 适用场景

✅ **符合以下特征，考虑滑动窗口**：

- 子数组/子串问题
- 连续序列
- 最长/最短/最大/最小
- 满足某种条件

### 核心思想

```plaintext
[1, 2, 3, 4, 5, 6]
 ↑     ↑
left  right  ← 窗口 [left, right]

1. 右指针扩张窗口（寻找可行解）
2. 左指针收缩窗口（优化解）
3. 每次移动更新答案
```

---

## 二、滑动窗口模板

### 固定窗口大小

```javascript
function fixedWindow(arr, k) {
  let sum = 0;

  // 初始化窗口
  for (let i = 0; i < k; i++) {
    sum += arr[i];
  }

  let maxSum = sum;

  // 滑动窗口
  for (let i = k; i < arr.length; i++) {
    sum = sum - arr[i - k] + arr[i]; // 移除左边，加入右边
    maxSum = Math.max(maxSum, sum);
  }

  return maxSum;
}
```

### 可变窗口大小

```javascript
function variableWindow(s, target) {
  let left = 0;
  let right = 0;
  const window = new Map();

  while (right < s.length) {
    // 1. 扩大窗口
    const char = s[right];
    right++;
    // 更新窗口数据
    window.set(char, (window.get(char) || 0) + 1);

    // 2. 判断是否需要收缩窗口
    while (满足收缩条件) {
      // 更新答案

      // 缩小窗口
      const leftChar = s[left];
      left++;
      // 更新窗口数据
      window.set(leftChar, window.get(leftChar) - 1);
    }
  }

  return 答案;
}
```

---

## 三、LeetCode 经典题解

### 3.1 最大子数组和（固定窗口）

**LeetCode 不限 - 示例题**

```javascript
/**
 * 给定数组和窗口大小 k，找最大和的连续子数组
 * 输入: arr = [1, 4, 2, 10, 23, 3, 1, 0, 20], k = 4
 * 输出: 39 (子数组 [4, 2, 10, 23])
 */
function maxSubarraySum(arr, k) {
  if (arr.length < k) return null;

  // 初始化第一个窗口
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;

  // 滑动窗口
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i - k] + arr[i];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}

console.log(maxSubarraySum([1, 4, 2, 10, 23, 3, 1, 0, 20], 4)); // 39
```

---

### 3.2 无重复字符的最长子串

**LeetCode 3**

```javascript
/**
 * 给定字符串，找出不含重复字符的最长子串的长度
 * 输入: s = "abcabcbb"
 * 输出: 3 (子串 "abc")
 */
function lengthOfLongestSubstring(s) {
  const window = new Map();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // 如果字符已存在，收缩窗口
    if (window.has(char)) {
      // left 移动到重复字符的下一位
      left = Math.max(left, window.get(char) + 1);
    }

    // 更新字符位置
    window.set(char, right);

    // 更新最大长度
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

console.log(lengthOfLongestSubstring("abcabcbb")); // 3
console.log(lengthOfLongestSubstring("pwwkew")); // 3 ("wke")
```

**复杂度**：

- 时间：O(n)
- 空间：O(min(m, n))，m 为字符集大小

---

### 3.3 最小覆盖子串

**LeetCode 76** ⭐⭐⭐

```javascript
/**
 * 给定字符串 s 和 t，找 s 中包含 t 所有字符的最小子串
 * 输入: s = "ADOBECODEBANC", t = "ABC"
 * 输出: "BANC"
 */
function minWindow(s, t) {
  // 记录 t 中字符的需求量
  const need = new Map();
  for (const char of t) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  const window = new Map();
  let left = 0;
  let right = 0;
  let valid = 0; // 已满足的字符种类数

  let start = 0;
  let minLen = Infinity;

  while (right < s.length) {
    // 扩大窗口
    const char = s[right];
    right++;

    if (need.has(char)) {
      window.set(char, (window.get(char) || 0) + 1);
      // 字符数量满足需求
      if (window.get(char) === need.get(char)) {
        valid++;
      }
    }

    // 收缩窗口
    while (valid === need.size) {
      // 更新最小覆盖子串
      if (right - left < minLen) {
        start = left;
        minLen = right - left;
      }

      // 移除左边字符
      const leftChar = s[left];
      left++;

      if (need.has(leftChar)) {
        if (window.get(leftChar) === need.get(leftChar)) {
          valid--;
        }
        window.set(leftChar, window.get(leftChar) - 1);
      }
    }
  }

  return minLen === Infinity ? "" : s.substr(start, minLen);
}

console.log(minWindow("ADOBECODEBANC", "ABC")); // "BANC"
```

**核心思路**：

1. 用 `need` 记录目标字符需求
2. 用 `window` 记录窗口内字符数量
3. 右指针扩张直到覆盖所有字符
4. 左指针收缩寻找最小窗口

---

### 3.4 字符串的排列

**LeetCode 567**

```javascript
/**
 * 判断 s2 是否包含 s1 的排列
 * 输入: s1 = "ab", s2 = "eidbaooo"
 * 输出: true (s2 包含 s1 的排列 "ba")
 */
function checkInclusion(s1, s2) {
  const need = new Map();
  for (const char of s1) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  const window = new Map();
  let left = 0;
  let right = 0;
  let valid = 0;

  while (right < s2.length) {
    const char = s2[right];
    right++;

    if (need.has(char)) {
      window.set(char, (window.get(char) || 0) + 1);
      if (window.get(char) === need.get(char)) {
        valid++;
      }
    }

    // 窗口大小固定为 s1.length
    while (right - left >= s1.length) {
      // 找到排列
      if (valid === need.size) {
        return true;
      }

      const leftChar = s2[left];
      left++;

      if (need.has(leftChar)) {
        if (window.get(leftChar) === need.get(leftChar)) {
          valid--;
        }
        window.set(leftChar, window.get(leftChar) - 1);
      }
    }
  }

  return false;
}

console.log(checkInclusion("ab", "eidbaooo")); // true
```

---

### 3.5 找到字符串中所有字母异位词

**LeetCode 438**

```javascript
/**
 * 找到 s 中所有 p 的字母异位词的起始索引
 * 输入: s = "cbaebabacd", p = "abc"
 * 输出: [0, 6] ("cba", "bac")
 */
function findAnagrams(s, p) {
  const need = new Map();
  for (const char of p) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  const window = new Map();
  let left = 0;
  let right = 0;
  let valid = 0;
  const result = [];

  while (right < s.length) {
    const char = s[right];
    right++;

    if (need.has(char)) {
      window.set(char, (window.get(char) || 0) + 1);
      if (window.get(char) === need.get(char)) {
        valid++;
      }
    }

    // 固定窗口大小
    while (right - left >= p.length) {
      if (valid === need.size) {
        result.push(left);
      }

      const leftChar = s[left];
      left++;

      if (need.has(leftChar)) {
        if (window.get(leftChar) === need.get(leftChar)) {
          valid--;
        }
        window.set(leftChar, window.get(leftChar) - 1);
      }
    }
  }

  return result;
}

console.log(findAnagrams("cbaebabacd", "abc")); // [0, 6]
```

---

### 3.6 最长重复子数组

**LeetCode 209 - 长度最小的子数组**

```javascript
/**
 * 找出数组中满足和 >= target 的最短连续子数组
 * 输入: target = 7, nums = [2,3,1,2,4,3]
 * 输出: 2 (子数组 [4,3])
 */
function minSubArrayLen(target, nums) {
  let left = 0;
  let sum = 0;
  let minLen = Infinity;

  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];

    // 收缩窗口
    while (sum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      sum -= nums[left];
      left++;
    }
  }

  return minLen === Infinity ? 0 : minLen;
}

console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2
```

---

### 3.7 最大连续 1 的个数 III

**LeetCode 1004**

```javascript
/**
 * 最多可以翻转 k 个 0，求最长连续 1 的长度
 * 输入: nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2
 * 输出: 6 (翻转两个 0: [1,1,1,0,0,1,1,1,1,1,1])
 */
function longestOnes(nums, k) {
  let left = 0;
  let zeroCount = 0;
  let maxLen = 0;

  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) {
      zeroCount++;
    }

    // 0 的个数超过 k，收缩窗口
    while (zeroCount > k) {
      if (nums[left] === 0) {
        zeroCount--;
      }
      left++;
    }

    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

console.log(longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2)); // 6
```

---

## 四、滑动窗口题型总结

### 题型分类

| 类型              | 特征                   | 代表题目           |
| ----------------- | ---------------------- | ------------------ |
| **固定窗口**      | 窗口大小固定           | 最大子数组和       |
| **可变窗口-最大** | 找最长满足条件的窗口   | 无重复字符最长子串 |
| **可变窗口-最小** | 找最短满足条件的窗口   | 最小覆盖子串       |
| **计数问题**      | 统计满足条件的窗口数量 | 找到字母异位词     |

### 识别技巧

```plaintext
看到这些关键词 → 考虑滑动窗口：
  ✅ 连续子数组/子串
  ✅ 最长/最短/最大/最小
  ✅ 满足某个条件
  ✅ K 个...
```

### 复杂度

- **时间**：O(n) - 每个元素最多访问两次（left 和 right）
- **空间**：O(k) - k 为字符集大小或窗口大小

---

## 五、常见错误

### ❌ 错误 1：忘记更新窗口数据

```javascript
// ❌ 错误
while (right < s.length) {
  const char = s[right];
  right++;
  // 忘记更新 window
}

// ✅ 正确
while (right < s.length) {
  const char = s[right];
  right++;
  window.set(char, (window.get(char) || 0) + 1); // 更新窗口
}
```

### ❌ 错误 2：收缩条件判断错误

```javascript
// ❌ 错误：用 if
if (窗口满足条件) {
  left++;
}

// ✅ 正确：用 while
while (窗口满足条件) {
  left++;
}
```

### ❌ 错误 3：更新答案的时机不对

```javascript
// ❌ 错误：在外层更新
while (right < s.length) {
  // 扩大窗口
  maxLen = Math.max(maxLen, right - left + 1); // 可能不满足条件
}

// ✅ 正确：在满足条件时更新
while (right < s.length) {
  // 扩大窗口
  if (满足条件) {
    maxLen = Math.max(maxLen, right - left + 1);
  }
}
```

---

## 六、练习题目

### 入门级

- ✅ LeetCode 643: 子数组最大平均数 I
- ✅ LeetCode 1456: 定长子串中元音的最大数目

### 中等级

- ✅ LeetCode 3: 无重复字符的最长子串
- ✅ LeetCode 209: 长度最小的子数组
- ✅ LeetCode 438: 找到字符串中所有字母异位词
- ✅ LeetCode 567: 字符串的排列

### 困难级

- ✅ LeetCode 76: 最小覆盖子串 ⭐⭐⭐
- ✅ LeetCode 239: 滑动窗口最大值（单调队列）
- ✅ LeetCode 992: K 个不同整数的子数组

---

## 七、面试技巧

### 解题步骤

1. **明确窗口含义**：窗口内元素满足什么条件？
2. **确定扩张条件**：right 什么时候移动？
3. **确定收缩条件**：left 什么时候移动？
4. **更新答案时机**：在扩张时还是收缩时？

### 沟通要点

```plaintext
面试官：这道题怎么做？

你：
1. 这是一个连续子数组问题，可以用滑动窗口
2. 维护窗口 [left, right]，用 Map 记录窗口内元素
3. right 扩张窗口直到满足条件
4. left 收缩窗口优化解
5. 时间复杂度 O(n)，空间复杂度 O(k)
```

掌握滑动窗口，轻松解决子数组/子串问题！🎯
