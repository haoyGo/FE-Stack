# 位运算算法速查手册

## 🎯 核心思想

位运算是直接对整数的二进制位进行操作，具有**速度快、效率高**的特点。

**核心运算符**：

- **&（与）**：都为 1 时为 1
- **|（或）**：有 1 时为 1
- **^（异或）**：不同为 1，相同为 0
- **~（取反）**：0 变 1，1 变 0
- **<<（左移）**：乘以 2
- **>>（右移）**：除以 2

**核心特性**：

- **异或**：a ^ a = 0，a ^ 0 = a
- **与**：a & 1 判断奇偶
- **左移**：1 << n 表示 2^n
- **右移**：n >> 1 表示 n/2

---

## 📋 快速识别

### 关键词识别

- **只出现一次的数字**
- **位 1 的个数**
- **2 的幂**
- **成对出现/单独出现**
- **不使用加减乘除**
- **集合的子集**

### 适用场景

1. 判断奇偶性
2. 交换两个数
3. 统计二进制中 1 的个数
4. 找出单独出现的数字
5. 集合的子集枚举
6. 状态压缩 DP

---

## 🔧 核心操作模板

### 1. 基本位运算

```javascript
// 判断奇偶
const isOdd = (n) => (n & 1) === 1;

// 交换两个数（不用临时变量）
function swap(a, b) {
  a = a ^ b;
  b = a ^ b; // b = (a^b)^b = a
  a = a ^ b; // a = (a^b)^a = b
}

// 获取第i位的值
const getBit = (n, i) => (n >> i) & 1;

// 设置第i位为1
const setBit = (n, i) => n | (1 << i);

// 清除第i位（设为0）
const clearBit = (n, i) => n & ~(1 << i);

// 翻转第i位
const toggleBit = (n, i) => n ^ (1 << i);

// 清除最低位的1
const clearLowestBit = (n) => n & (n - 1);

// 获取最低位的1
const getLowestBit = (n) => n & -n;
```

### 2. 统计 1 的个数（Brian Kernighan 算法）

```javascript
function countBits(n) {
  let count = 0;
  while (n) {
    n = n & (n - 1); // 清除最低位的1
    count++;
  }
  return count;
}

// 或使用内置方法
function countBits(n) {
  return n.toString(2).split("0").join("").length;
}
```

### 3. 判断是否为 2 的幂

```javascript
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
```

### 4. 找出最高位的 1

```javascript
function highestBit(n) {
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n - (n >> 1);
}
```

### 5. 子集枚举

```javascript
// 枚举集合的所有子集
function enumerateSubsets(nums) {
  const n = nums.length;
  const result = [];

  // 从0到2^n-1，每个数字代表一个子集
  for (let mask = 0; mask < 1 << n; mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        subset.push(nums[i]);
      }
    }
    result.push(subset);
  }

  return result;
}
```

---

## 💡 经典题目

### 1️⃣ LeetCode 136. 只出现一次的数字

```javascript
function singleNumber(nums) {
  // 异或：相同的数异或为0，0异或任何数为该数
  let result = 0;
  for (const num of nums) {
    result ^= num;
  }
  return result;
}
```

### 2️⃣ LeetCode 191. 位 1 的个数

```javascript
function hammingWeight(n) {
  let count = 0;
  while (n) {
    n = n & (n - 1); // 清除最低位的1
    count++;
  }
  return count;
}
```

### 3️⃣ LeetCode 231. 2 的幂

```javascript
function isPowerOfTwo(n) {
  // 2的幂只有一个1
  return n > 0 && (n & (n - 1)) === 0;
}
```

### 4️⃣ LeetCode 338. 比特位计数

```javascript
function countBits(n) {
  const dp = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    // dp[i] = dp[i >> 1] + (i & 1)
    // i >> 1 相当于去掉最低位
    // i & 1 是最低位的值
    dp[i] = dp[i >> 1] + (i & 1);
  }

  return dp;
}
```

### 5️⃣ LeetCode 461. 汉明距离

```javascript
function hammingDistance(x, y) {
  // 先异或，再统计1的个数
  let xor = x ^ y;
  let count = 0;

  while (xor) {
    xor = xor & (xor - 1);
    count++;
  }

  return count;
}
```

### 6️⃣ LeetCode 268. 丢失的数字

```javascript
function missingNumber(nums) {
  let xor = 0;

  // 异或所有索引
  for (let i = 0; i <= nums.length; i++) {
    xor ^= i;
  }

  // 异或所有数字
  for (const num of nums) {
    xor ^= num;
  }

  // 剩下的就是缺失的
  return xor;
}
```

### 7️⃣ LeetCode 137. 只出现一次的数字 II（其他数字出现 3 次）

```javascript
function singleNumber(nums) {
  let ones = 0,
    twos = 0;

  for (const num of nums) {
    // ones记录出现1次的位
    // twos记录出现2次的位
    // 出现3次时清零

    twos |= ones & num;
    ones ^= num;

    const threes = ones & twos;
    ones &= ~threes;
    twos &= ~threes;
  }

  return ones;
}
```

### 8️⃣ LeetCode 260. 只出现一次的数字 III（有两个单独数字）

```javascript
function singleNumber(nums) {
  // 先异或得到两个单独数字的异或结果
  let xor = 0;
  for (const num of nums) {
    xor ^= num;
  }

  // 找到异或结果中任意一个为1的位
  // 这一位在两个单独数字中必然不同
  const diff = xor & -xor; // 获取最低位的1

  let num1 = 0,
    num2 = 0;
  for (const num of nums) {
    if (num & diff) {
      num1 ^= num;
    } else {
      num2 ^= num;
    }
  }

  return [num1, num2];
}
```

### 9️⃣ LeetCode 201. 数字范围按位与

```javascript
function rangeBitwiseAnd(left, right) {
  // 找公共前缀
  let shift = 0;

  while (left < right) {
    left >>= 1;
    right >>= 1;
    shift++;
  }

  return left << shift;
}
```

### 🔟 LeetCode 318. 最大单词长度乘积

```javascript
function maxProduct(words) {
  const n = words.length;
  const masks = new Array(n).fill(0);

  // 用位掩码表示单词包含的字母
  for (let i = 0; i < n; i++) {
    for (const char of words[i]) {
      const bit = char.charCodeAt(0) - 97; // 'a' = 97
      masks[i] |= 1 << bit;
    }
  }

  let maxLen = 0;

  // 检查所有单词对
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // 如果两个单词没有公共字母（与为0）
      if ((masks[i] & masks[j]) === 0) {
        const len = words[i].length * words[j].length;
        maxLen = Math.max(maxLen, len);
      }
    }
  }

  return maxLen;
}
```

### 1️⃣1️⃣ LeetCode 78. 子集

```javascript
function subsets(nums) {
  const n = nums.length;
  const result = [];

  // 用位掩码枚举所有子集
  for (let mask = 0; mask < 1 << n; mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        subset.push(nums[i]);
      }
    }
    result.push(subset);
  }

  return result;
}
```

### 1️⃣2️⃣ LeetCode 89. 格雷编码

```javascript
function grayCode(n) {
  const result = [];

  for (let i = 0; i < 1 << n; i++) {
    // 格雷码公式：i ^ (i >> 1)
    result.push(i ^ (i >> 1));
  }

  return result;
}
```

---

## 🎨 解题技巧

### 技巧 1：异或的自反性

```javascript
// a ^ a = 0, a ^ 0 = a
// 用于找出单独出现的数字

function findSingle(nums) {
  let xor = 0;
  for (const num of nums) {
    xor ^= num;
  }
  return xor;
}
```

### 技巧 2：n & (n-1) 清除最低位的 1

```javascript
// 用于统计1的个数或判断2的幂

// 统计1的个数
function countOnes(n) {
  let count = 0;
  while (n) {
    n = n & (n - 1);
    count++;
  }
  return count;
}

// 判断2的幂（只有一个1）
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
```

### 技巧 3：n & (-n) 获取最低位的 1

```javascript
// 用于分离最低位的1

function getLowestBit(n) {
  return n & -n;
}

// 应用：分组异或
function singleNumber(nums) {
  let xor = 0;
  for (const num of nums) xor ^= num;

  const diff = xor & -xor; // 获取区分位

  let a = 0,
    b = 0;
  for (const num of nums) {
    if (num & diff) {
      a ^= num;
    } else {
      b ^= num;
    }
  }

  return [a, b];
}
```

### 技巧 4：位掩码表示集合

```javascript
// 用位的0/1表示元素是否在集合中

// 判断第i个元素是否在集合中
const has = (mask, i) => (mask >> i) & 1;

// 添加第i个元素
const add = (mask, i) => mask | (1 << i);

// 删除第i个元素
const remove = (mask, i) => mask & ~(1 << i);

// 枚举所有子集
for (let mask = 0; mask < 1 << n; mask++) {
  // mask代表一个子集
}
```

### 技巧 5：右移除以 2，左移乘以 2

```javascript
// 快速计算除以2的幂
const divideBy2 = (n) => n >> 1;
const divideBy4 = (n) => n >> 2;
const divideBy8 = (n) => n >> 3;

// 快速计算乘以2的幂
const multiplyBy2 = (n) => n << 1;
const multiplyBy4 = (n) => n << 2;
const multiplyBy8 = (n) => n << 3;

// 计算2^n
const powerOf2 = (n) => 1 << n;
```

---

## 🔍 解题思路 SOP

### Step 1: 识别题型

- 看到**单独出现** → 异或
- 看到**1 的个数** → n & (n-1)
- 看到**2 的幂** → n & (n-1) === 0
- 看到**子集** → 位掩码枚举
- 看到**状态压缩** → 位运算 DP

### Step 2: 选择位运算

- **异或**：消除成对元素
- **与**：判断位是否为 1
- **或**：设置位为 1
- **左移/右移**：乘除 2
- **取反**：翻转所有位

### Step 3: 应用技巧

- **n & (n-1)**：清除最低位 1
- **n & (-n)**：获取最低位 1
- **位掩码**：表示集合状态
- **分组异或**：找两个单独数字

### Step 4: 优化

- 用位运算代替乘除法
- 用位掩码压缩状态
- 用异或避免额外空间

---

## ⚠️ 常见错误

### 错误 1：有符号数的右移

```javascript
// ❌ 错误：负数右移会填充符号位
const n = -8;
console.log(n >> 1); // -4（算术右移）

// ✅ 正确：使用无符号右移
console.log(n >>> 1); // 2147483644（逻辑右移）
```

### 错误 2：位运算优先级低

```javascript
// ❌ 错误：位运算优先级低于比较运算符
if (n & 1 === 0) // 错误！等价于 n & (1 === 0)

// ✅ 正确：加括号
if ((n & 1) === 0)
```

### 错误 3：忘记处理负数

```javascript
// ❌ 错误：未检查n是否为正
function isPowerOfTwo(n) {
  return (n & (n - 1)) === 0; // n=0时也为true
}

// ✅ 正确：检查n > 0
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
```

### 错误 4：溢出问题

```javascript
// ❌ 错误：左移可能溢出
const n = 1 << 32; // 溢出！结果是1

// ✅ 正确：注意范围
const n = Math.pow(2, 32); // 正确计算2^32
```

---

## 📝 位运算速查表

### 常用操作

| 操作            | 表达式                       | 说明              |
| --------------- | ---------------------------- | ----------------- |
| 判断奇偶        | `n & 1`                      | 1 为奇，0 为偶    |
| 获取第 i 位     | `(n >> i) & 1`               | 获取从右数第 i 位 |
| 设置第 i 位为 1 | `n \| (1 << i)`              | 将第 i 位设为 1   |
| 清除第 i 位     | `n & ~(1 << i)`              | 将第 i 位设为 0   |
| 翻转第 i 位     | `n ^ (1 << i)`               | 翻转第 i 位       |
| 清除最低位 1    | `n & (n - 1)`                | 去掉最右边的 1    |
| 获取最低位 1    | `n & (-n)`                   | 只保留最右边的 1  |
| 判断 2 的幂     | `n > 0 && (n & (n-1)) === 0` | 只有一个 1        |
| 乘以 2          | `n << 1`                     | 左移 1 位         |
| 除以 2          | `n >> 1`                     | 右移 1 位         |
| 计算 2^n        | `1 << n`                     | 2 的 n 次方       |

### 异或性质

| 性质   | 表达式                      | 说明          |
| ------ | --------------------------- | ------------- |
| 自反性 | `a ^ a = 0`                 | 相同为 0      |
| 恒等性 | `a ^ 0 = a`                 | 与 0 异或不变 |
| 交换律 | `a ^ b = b ^ a`             | 顺序无关      |
| 结合律 | `(a ^ b) ^ c = a ^ (b ^ c)` | 可任意组合    |

---

## 📝 高频题目清单

| 题号 | 题目                 | 难度   | 类型      | 关键点               |
| ---- | -------------------- | ------ | --------- | -------------------- |
| 136  | 只出现一次的数字     | Easy   | 异或      | a^a=0                |
| 191  | 位 1 的个数          | Easy   | 统计      | n&(n-1)              |
| 231  | 2 的幂               | Easy   | 判断      | n&(n-1)=0            |
| 338  | 比特位计数           | Easy   | DP        | dp[i]=dp[i>>1]+(i&1) |
| 461  | 汉明距离             | Easy   | 异或+统计 | xor 后统计 1         |
| 268  | 丢失的数字           | Easy   | 异或      | 全部异或             |
| 137  | 只出现一次的数字 II  | Medium | 位运算    | ones/twos            |
| 260  | 只出现一次的数字 III | Medium | 分组异或  | n&(-n)               |
| 201  | 数字范围按位与       | Medium | 公共前缀  | 右移对齐             |
| 318  | 最大单词长度乘积     | Medium | 位掩码    | 26 位表示字母        |
| 78   | 子集                 | Medium | 枚举      | 位掩码枚举           |
| 89   | 格雷编码             | Medium | 格雷码    | i^(i>>1)             |

---

## 🎯 面试沟通要点

### 开始时

1. **确认题型**：

   - "这是找单独元素的问题，我用异或来解决"
   - "需要统计 1 的个数，我用 n&(n-1)方法"

2. **说明思路**：
   - "异或有自反性，相同的数异或为 0"
   - "n&(n-1)可以清除最低位的 1，用于统计"

### 编码时

1. **解释操作**：

   - "这里用异或消除成对出现的数字"
   - "用位掩码表示元素是否在集合中"

2. **说明复杂度**：
   - "位运算的时间复杂度是 O(1)"
   - "只用常数空间，空间复杂度 O(1)"

### 结束时

- **时间复杂度**：通常 O(n)或 O(n log n)
- **空间复杂度**：O(1)

---

## 💡 总结

### 核心要点

1. **异或自反性**：a ^ a = 0, a ^ 0 = a
2. **n & (n-1)**：清除最低位 1，统计 1 的个数
3. **n & (-n)**：获取最低位 1，用于分组
4. **位掩码**：表示集合状态，枚举子集
5. **左移/右移**：快速乘除 2

### 记忆口诀

```
异或消对找单独，n减1与统计1
2的幂次只一位，位掩码中藏集合
左移乘2右移除，与或非异要分清
优先级低加括号，负数右移需谨慎
```

---

**最后更新时间**：2024 年
