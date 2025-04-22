
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
// 解法一：中心扩展法
// 时间复杂度：O(n²)，空间复杂度：O(1)
function longestPalindrome(s) {
  // 处理边界情况：字符串长度小于2时，整个字符串就是回文串
  if (s.length < 2) return s;
  
  let start = 0;      // 记录最长回文子串的起始位置
  let maxLength = 1;  // 记录最长回文子串的长度
  
  // 从中心向两边扩展，检查是否是回文串
  function expandAroundCenter(left, right) {
    // 当左右指针都在有效范围内，且对应字符相等时，继续扩展
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const currentLength = right - left + 1;
      // 如果当前回文串长度大于之前记录的最大长度，更新记录
      if (currentLength > maxLength) {
        start = left;
        maxLength = currentLength;
      }
      // 向两边扩展
      left--;
      right++;
    }
  }
  
  // 遍历每个字符，以其为中心点扩展
  for (let i = 0; i < s.length; i++) {
    expandAroundCenter(i, i);     // 处理奇数长度的回文串，如 "aba"
    expandAroundCenter(i, i + 1); // 处理偶数长度的回文串，如 "abba"
  }
  
  return s.substring(start, start + maxLength);
}

// 解法二：动态规划
// 时间复杂度：O(n²)，空间复杂度：O(n²)
/*
动态规划解法详解：
1. 状态定义：
   dp[i][j] 表示字符串s从索引i到j的子串是否为回文串
   - 当 dp[i][j] = true 时，表示s[i...j]是回文串
   - 当 dp[i][j] = false 时，表示s[i...j]不是回文串

2. 状态转移方程：
   dp[i][j] = true 的条件：
   - 当s[i] === s[j]时（两端字符相等）：
     a) 如果子串长度 <= 3，则必定是回文串
     b) 如果子串长度 > 3，需要判断去掉两端后的子串是否为回文串，即dp[i+1][j-1]是否为true

3. 示例演示：
   对于字符串 "babad"：
   - 初始化所有单字符为true：dp[i][i] = true
   - 长度为2的子串："ba", "ab", "ba", "ad" 都不是回文串
   - 长度为3的子串："bab", "aba", "bad" 中，"aba"是回文串
   - 长度为4和5的子串都不是回文串
   最终找到最长回文子串 "aba"
*/
function longestPalindromeDP(s) {
  const n = s.length;
  if (n < 2) return s;

  // 创建二维dp数组，初始化为false
  const dp = Array(n).fill().map(() => Array(n).fill(false));
  
  // 初始化：所有单个字符都是回文串
  for (let i = 0; i < n; i++) {
    dp[i][i] = true;
  }
  
  let start = 0;    // 记录最长回文子串的起始位置
  let maxLength = 1; // 记录最长回文子串的长度
  
  // 枚举所有可能的子串长度（从2开始）
  for (let len = 2; len <= n; len++) {
    // 枚举所有可能的起始位置
    for (let i = 0; i < n - len + 1; i++) {
      // 计算子串的结束位置
      const j = i + len - 1;
      
      // 判断当前子串是否为回文串
      if (s[i] === s[j] && (len <= 3 || dp[i + 1][j - 1])) {
        dp[i][j] = true;
        // 更新最长回文子串的信息
        if (len > maxLength) {
          start = i;
          maxLength = len;
        }
      }
    }
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

### 6. 最长公共子串 【难度：中】【频率：中】

**问题描述**：给定两个字符串str1和str2，找到它们的最长公共子串（要求子串在原字符串中是连续的）。

**解题思路**：使用动态规划，dp[i][j]表示以str1[i-1]和str2[j-1]结尾的最长公共子串长度。

```javascript
/*
动态规划解法详解：
1. 状态定义：
   dp[i][j] 表示以str1的第i个字符和str2的第j个字符结尾的最长公共子串长度
   - 当str1[i-1] === str2[j-1]时，dp[i][j] = dp[i-1][j-1] + 1
   - 否则，dp[i][j] = 0

2. 状态转移方程：
   if (str1[i-1] === str2[j-1]) {
     dp[i][j] = dp[i-1][j-1] + 1;
   } else {
     dp[i][j] = 0;
   }

3. 示例演示：
   str1 = "abcde", str2 = "bcdef"
   - dp[1][0] 到 dp[5][0] 和 dp[0][1] 到 dp[0][6] 都初始化为0
   - 当遍历到str1[1]=b和str2[0]=b时，dp[2][1] = 1
   - 当遍历到str1[2]=c和str2[1]=c时，dp[3][2] = 2
   - 当遍历到str1[3]=d和str2[2]=d时，dp[4][3] = 3
   - 当遍历到str1[4]=e和str2[3]=e时，dp[5][4] = 4
   最长公共子串为"bcde"，长度为4
*/
function longestCommonSubstring(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  let maxLength = 0;  // 记录最长公共子串的长度
  let endIndex = 0;   // 记录最长公共子串在str1中的结束位置
  
  // 填充dp数组
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i-1] === str2[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
        // 更新最长公共子串的信息
        if (dp[i][j] > maxLength) {
          maxLength = dp[i][j];
          endIndex = i - 1;
        }
      }
    }
  }
  
  // 返回最长公共子串
  return str1.substring(endIndex - maxLength + 1, endIndex + 1);
}

// 空间优化版本
// 由于dp[i][j]只依赖于dp[i-1][j-1]，可以使用一维数组优化空间复杂度
function longestCommonSubstringOptimized(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(n + 1).fill(0);
  
  let maxLength = 0;
  let endIndex = 0;
  
  for (let i = 1; i <= m; i++) {
    let prev = 0;  // 记录dp[i-1][j-1]的值
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (str1[i-1] === str2[j-1]) {
        dp[j] = prev + 1;
        if (dp[j] > maxLength) {
          maxLength = dp[j];
          endIndex = i - 1;
        }
      } else {
        dp[j] = 0;
      }
      prev = temp;
    }
  }
  
  return str1.substring(endIndex - maxLength + 1, endIndex + 1);
}
```

时间复杂度：O(m*n)，其中m和n分别是两个字符串的长度。
空间复杂度：基础版本O(m*n)，优化版本O(n)。
