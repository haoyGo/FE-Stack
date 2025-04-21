
### 1. 字符串匹配（KMP算法）【难度：中高】【频率：中】

**问题描述**：实现一个字符串匹配算法，在主串中查找模式串出现的位置。

**解题思路**：使用KMP算法，通过构建部分匹配表（next数组）来避免不必要的比较。

```javascript
function getNext(pattern) {
  const next = [0];
  let prefix = 0;
  let i = 1;
  
  while (i < pattern.length) {
    if (pattern[i] === pattern[prefix]) {
      prefix++;
      next[i] = prefix;
      i++;
    } else if (prefix === 0) {
      next[i] = 0;
      i++;
    } else {
      prefix = next[prefix - 1];
    }
  }
  
  return next;
}

function kmp(text, pattern) {
  if (!pattern) return 0;
  
  const next = getNext(pattern);
  let i = 0; // 主串指针
  let j = 0; // 模式串指针
  
  while (i < text.length) {
    if (text[i] === pattern[j]) {
      if (j === pattern.length - 1) {
        return i - j;
      }
      i++;
      j++;
    } else if (j > 0) {
      j = next[j - 1];
    } else {
      i++;
    }
  }
  
  return -1;
}
```

### 2. 回文串判断 【难度：简单】【频率：高】

**问题描述**：判断一个字符串是否是回文串，只考虑字母和数字字符，忽略大小写。

**解题思路**：使用双指针从两端向中间移动，跳过非字母数字字符。

```javascript
function isPalindrome(s) {
  // 将字符串转换为小写并移除非字母数字字符
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    if (s[left] !== s[right]) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
}

// 进阶：最长回文子串
function longestPalindrome(s) {
  if (s.length < 2) return s;
  
  let start = 0;
  let maxLength = 1;
  
  function expandAroundCenter(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const currentLength = right - left + 1;
      if (currentLength > maxLength) {
        start = left;
        maxLength = currentLength;
      }
      left--;
      right++;
    }
  }
  
  for (let i = 0; i < s.length; i++) {
    expandAroundCenter(i, i); // 奇数长度
    expandAroundCenter(i, i + 1); // 偶数长度
  }
  
  return s.substring(start, start + maxLength);
}
```

### 3. 字符串压缩 【难度：简单】【频率：中】

**问题描述**：实现基本的字符串压缩功能。例如，字符串"aabcccccaaa"会变为"a2b1c5a3"。

**解题思路**：遍历字符串，统计连续相同字符的个数。

```javascript
function compressString(s) {
  if (!s) return '';
  
  let result = '';
  let count = 1;
  let current = s[0];
  
  for (let i = 1; i <= s.length; i++) {
    if (s[i] === current) {
      count++;
    } else {
      result += current + count;
      current = s[i];
      count = 1;
    }
  }
  
  return result.length < s.length ? result : s;
}
```

### 4. 字符串转整数 (atoi) 【难度：中】【频率：中】

**问题描述**：实现一个atoi函数，将字符串转换为整数。需要处理前导空格、正负号、溢出等情况。

**解题思路**：依次处理空格、符号和数字，注意边界条件和溢出情况。

```javascript
function myAtoi(s) {
  let i = 0;
  let result = 0;
  let sign = 1;
  
  // 处理前导空格
  while (s[i] === ' ') {
    i++;
  }
  
  // 处理正负号
  if (s[i] === '+' || s[i] === '-') {
    sign = s[i] === '+' ? 1 : -1;
    i++;
  }
  
  // 处理数字
  while (i < s.length && /\d/.test(s[i])) {
    result = result * 10 + (s[i] - '0');
    
    // 处理溢出
    if (sign === 1 && result > 2147483647) {
      return 2147483647;
    }
    if (sign === -1 && result > 2147483648) {
      return -2147483648;
    }
    
    i++;
  }
  
  return sign * result;
}
```

### 5. 最长公共前缀 【难度：简单】【频率：高】

**问题描述**：编写一个函数来查找字符串数组中的最长公共前缀。

**解题思路**：可以使用水平扫描或垂直扫描方法。

```javascript
// 水平扫描法
function longestCommonPrefix(strs) {
  if (!strs.length) return '';
  
  let prefix = strs[0];
  
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.substring(0, prefix.length - 1);
      if (!prefix) return '';
    }
  }
  
  return prefix;
}

// 垂直扫描法
function longestCommonPrefix2(strs) {
  if (!strs.length) return '';
  
  for (let i = 0; i < strs[0].length; i++) {
    const char = strs[0][i];
    for (let j = 1; j < strs.length; j++) {
      if (i === strs[j].length || strs[j][i] !== char) {
        return strs[0].substring(0, i);
      }
    }
  }
  
  return strs[0];
}
```
