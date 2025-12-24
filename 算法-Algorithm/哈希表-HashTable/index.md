# 哈希表

## 🎯 核心原理

**哈希表**通过哈希函数将键映射到数组索引，实现 O(1) 时间的快速查找、插入和删除。

**核心优势**：

- 查找、插入、删除：O(1)
- 去重、计数、分组

**JavaScript 中的哈希表**：

- `Map` - 键值对映射
- `Set` - 唯一值集合
- `Object` - 对象作为哈希表（键只能是字符串）

---

## 📝 识别特征

看到这些关键词，考虑哈希表：

- **快速查找**
- **去重**
- **统计频率**
- **两数之和类问题**
- **分组**、**映射关系**

---

## 🔧 基本用法

### Map 的常用操作

```javascript
const map = new Map();

// 插入
map.set(key, value);

// 查找
map.get(key); // 返回value，不存在返回undefined
map.has(key); // 返回boolean

// 删除
map.delete(key);
map.clear();

// 遍历
for (const [key, value] of map) {
  // ...
}

// 大小
map.size;
```

### Set 的常用操作

```javascript
const set = new Set();

// 插入
set.add(value);

// 查找
set.has(value);

// 删除
set.delete(value);
set.clear();

// 遍历
for (const value of set) {
  // ...
}

// 大小
set.size;
```

---

## 📌 常见面试题

### 1. LeetCode 1 - 两数之和 ⭐⭐⭐

**题目**：找到数组中和为 target 的两个数的索引。

```javascript
function twoSum(nums, target) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i];
    }

    map.set(nums[i], i);
  }

  return [];
}

// 示例
twoSum([2, 7, 11, 15], 9); // [0, 1]
```

---

### 2. LeetCode 49 - 字母异位词分组 ⭐⭐

**题目**：将字母异位词分组。

```javascript
function groupAnagrams(strs) {
  const map = new Map();

  for (const str of strs) {
    // 排序后作为key
    const key = str.split("").sort().join("");

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(str);
  }

  return Array.from(map.values());
}

// 示例
groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]);
// [["eat","tea","ate"], ["tan","nat"], ["bat"]]
```

---

### 3. LeetCode 128 - 最长连续序列 ⭐⭐

**题目**：找出数组中最长连续序列的长度。

```javascript
function longestConsecutive(nums) {
  const set = new Set(nums);
  let maxLen = 0;

  for (const num of set) {
    // 只从序列的起点开始计数
    if (!set.has(num - 1)) {
      let currentNum = num;
      let currentLen = 1;

      while (set.has(currentNum + 1)) {
        currentNum++;
        currentLen++;
      }

      maxLen = Math.max(maxLen, currentLen);
    }
  }

  return maxLen;
}

// 示例
longestConsecutive([100, 4, 200, 1, 3, 2]); // 4 ([1,2,3,4])
```

---

### 4. LeetCode 347 - 前 K 个高频元素 ⭐⭐

**题目**：找出数组中前 k 个出现频率最高的元素。

```javascript
function topKFrequent(nums, k) {
  // 统计频率
  const map = new Map();
  for (const num of nums) {
    map.set(num, (map.get(num) || 0) + 1);
  }

  // 按频率排序
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([num]) => num);
}

// 示例
topKFrequent([1, 1, 1, 2, 2, 3], 2); // [1, 2]
```

---

### 5. LeetCode 242 - 有效的字母异位词 ⭐

**题目**：判断两个字符串是否是字母异位词。

```javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const map = new Map();

  // 统计s中字符频率
  for (const char of s) {
    map.set(char, (map.get(char) || 0) + 1);
  }

  // 检查t
  for (const char of t) {
    if (!map.has(char) || map.get(char) === 0) {
      return false;
    }
    map.set(char, map.get(char) - 1);
  }

  return true;
}

// 示例
isAnagram("anagram", "nagaram"); // true
```

---

### 6. LeetCode 383 - 赎金信 ⭐

**题目**：判断 ransomNote 能否由 magazine 中的字符组成。

```javascript
function canConstruct(ransomNote, magazine) {
  const map = new Map();

  // 统计magazine中字符频率
  for (const char of magazine) {
    map.set(char, (map.get(char) || 0) + 1);
  }

  // 检查ransomNote
  for (const char of ransomNote) {
    if (!map.has(char) || map.get(char) === 0) {
      return false;
    }
    map.set(char, map.get(char) - 1);
  }

  return true;
}
```

---

### 7. LeetCode 217 - 存在重复元素 ⭐

**题目**：判断数组中是否存在重复元素。

```javascript
function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}

// 或使用Map
function containsDuplicate(nums) {
  const set = new Set();

  for (const num of nums) {
    if (set.has(num)) return true;
    set.add(num);
  }

  return false;
}
```

---

### 8. LeetCode 219 - 存在重复元素 II ⭐

**题目**：判断是否存在两个不同索引 i 和 j，使得 nums[i] = nums[j]，且 |i - j| <= k。

```javascript
function containsNearbyDuplicate(nums, k) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    if (map.has(nums[i]) && i - map.get(nums[i]) <= k) {
      return true;
    }
    map.set(nums[i], i);
  }

  return false;
}
```

---

### 9. LeetCode 290 - 单词规律 ⭐

**题目**：判断字符串 s 是否遵循 pattern 的规律。

```javascript
function wordPattern(pattern, s) {
  const words = s.split(" ");
  if (pattern.length !== words.length) return false;

  const charToWord = new Map();
  const wordToChar = new Map();

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const word = words[i];

    if (charToWord.has(char)) {
      if (charToWord.get(char) !== word) return false;
    } else {
      charToWord.set(char, word);
    }

    if (wordToChar.has(word)) {
      if (wordToChar.get(word) !== char) return false;
    } else {
      wordToChar.set(word, char);
    }
  }

  return true;
}

// 示例
wordPattern("abba", "dog cat cat dog"); // true
```

---

### 10. LeetCode 454 - 四数相加 II ⭐⭐

**题目**：计算有多少个四元组 (i, j, k, l)，使得 A[i] + B[j] + C[k] + D[l] = 0。

```javascript
function fourSumCount(nums1, nums2, nums3, nums4) {
  const map = new Map();
  let count = 0;

  // 统计A+B的所有可能和
  for (const a of nums1) {
    for (const b of nums2) {
      const sum = a + b;
      map.set(sum, (map.get(sum) || 0) + 1);
    }
  }

  // 查找C+D能否配对
  for (const c of nums3) {
    for (const d of nums4) {
      const target = -(c + d);
      if (map.has(target)) {
        count += map.get(target);
      }
    }
  }

  return count;
}
```

---

### 11. LeetCode 202 - 快乐数 ⭐

**题目**：判断一个数是否是快乐数。

```javascript
function isHappy(n) {
  const seen = new Set();

  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = getNext(n);
  }

  return n === 1;
}

function getNext(n) {
  let sum = 0;
  while (n > 0) {
    const digit = n % 10;
    sum += digit * digit;
    n = Math.floor(n / 10);
  }
  return sum;
}
```

---

### 12. LeetCode 205 - 同构字符串 ⭐

**题目**：判断两个字符串是否同构。

```javascript
function isIsomorphic(s, t) {
  if (s.length !== t.length) return false;

  const mapS = new Map();
  const mapT = new Map();

  for (let i = 0; i < s.length; i++) {
    const charS = s[i];
    const charT = t[i];

    if (mapS.has(charS)) {
      if (mapS.get(charS) !== charT) return false;
    } else {
      mapS.set(charS, charT);
    }

    if (mapT.has(charT)) {
      if (mapT.get(charT) !== charS) return false;
    } else {
      mapT.set(charT, charS);
    }
  }

  return true;
}
```

---

## 🎯 常用技巧

### 技巧 1：频率统计

```javascript
const freq = new Map();
for (const item of arr) {
  freq.set(item, (freq.get(item) || 0) + 1);
}
```

### 技巧 2：数组去重

```javascript
const unique = [...new Set(arr)];
// 或
const unique = Array.from(new Set(arr));
```

### 技巧 3：双向映射

```javascript
// 需要同时维护两个方向的映射
const map1 = new Map(); // A -> B
const map2 = new Map(); // B -> A
```

### 技巧 4：哈希表 + 其他算法

```javascript
// 哈希表 + 双指针（两数之和）
// 哈希表 + 前缀和（和为K的子数组）
// 哈希表 + 滑动窗口
```

---

## 💡 面试建议

1. **选择合适的数据结构**：

   - 需要键值对 → `Map`
   - 只需要唯一值 → `Set`
   - 键是字符串 → `Object` 或 `Map`

2. **常见模式**：

   - 查找配对 → 边遍历边查找
   - 统计频率 → 先统计，再处理
   - 去重 → `Set`

3. **沟通要点**：

   - "用哈希表可以 O(1)查找"
   - "空间换时间，用 O(n)空间换 O(1)查找"

4. **注意点**：
   - Map 的键可以是任何类型
   - 检查键是否存在：`map.has(key)`
   - 获取默认值：`map.get(key) || defaultValue`

---

**更新时间**：2024 年
