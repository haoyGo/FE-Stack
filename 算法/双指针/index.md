# 双指针算法速查手册

## 🎯 核心思想

双指针是一种利用两个指针在数组/链表中同时遍历，通过移动规则来降低时间复杂度的算法技巧。

**核心优势**：

- 将暴力 O(n²) 优化为 O(n)
- 空间复杂度通常为 O(1)
- 代码简洁，易于实现

---

## 📋 快速识别

### 关键词识别

- 题目要求：**原地操作**、**常数空间**
- 数据结构：**有序数组**、**链表**、**字符串**
- 问题类型：**去重**、**移除元素**、**反转**、**配对**、**判断回文**

### 适用场景

1. 需要在有序数组中查找配对
2. 需要判断回文结构
3. 需要合并两个有序序列
4. 需要原地修改数组/链表
5. 需要快慢指针检测环

---

## 🔧 题型分类与模板

### 1️⃣ 对撞指针（相向双指针）

**适用场景**：

- 有序数组中查找配对（如两数之和）
- 判断回文
- 区间搜索问题

**代码模板**：

```javascript
function twoPointers(arr) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    // 根据条件移动指针
    if (满足某条件) {
      // 处理逻辑
      left++;
      right--;
    } else if (需要增大) {
      left++;
    } else {
      right--;
    }
  }

  return result;
}
```

**经典例题**：

#### LeetCode 167. 两数之和 II（有序数组）

```javascript
function twoSum(numbers, target) {
  let left = 0,
    right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) {
      return [left + 1, right + 1]; // 题目要求从1开始
    } else if (sum < target) {
      left++; // 需要更大的数
    } else {
      right--; // 需要更小的数
    }
  }

  return [-1, -1];
}
```

#### LeetCode 15. 三数之和

```javascript
function threeSum(nums) {
  const result = [];
  nums.sort((a, b) => a - b);

  for (let i = 0; i < nums.length - 2; i++) {
    // 跳过重复元素
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1,
      right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);

        // 跳过重复元素
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}
```

#### LeetCode 11. 盛最多水的容器

```javascript
function maxArea(height) {
  let left = 0,
    right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    maxWater = Math.max(maxWater, width * h);

    // 移动较短的那一侧
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}
```

---

### 2️⃣ 快慢指针（同向双指针）

**适用场景**：

- 链表环检测
- 链表中点查找
- 删除倒数第 N 个节点
- 数组去重/移除元素

**代码模板**：

```javascript
// 链表快慢指针
function fastSlowPointer(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next; // 慢指针走1步
    fast = fast.next.next; // 快指针走2步

    if (slow === fast) {
      // 检测到环
      return true;
    }
  }

  return false;
}

// 数组快慢指针
function removeElement(arr, val) {
  let slow = 0; // 慢指针指向下一个要写入的位置

  for (let fast = 0; fast < arr.length; fast++) {
    if (arr[fast] !== val) {
      arr[slow] = arr[fast];
      slow++;
    }
  }

  return slow; // 新数组长度
}
```

**经典例题**：

#### LeetCode 141. 环形链表

```javascript
function hasCycle(head) {
  if (!head || !head.next) return false;

  let slow = head;
  let fast = head.next;

  while (slow !== fast) {
    if (!fast || !fast.next) return false;
    slow = slow.next;
    fast = fast.next.next;
  }

  return true;
}
```

#### LeetCode 142. 环形链表 II（找环入口）

```javascript
function detectCycle(head) {
  if (!head || !head.next) return null;

  let slow = head,
    fast = head;

  // 阶段1：检测是否有环
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      // 阶段2：找环入口
      let ptr = head;
      while (ptr !== slow) {
        ptr = ptr.next;
        slow = slow.next;
      }
      return ptr;
    }
  }

  return null;
}
```

#### LeetCode 876. 链表的中间结点

```javascript
function middleNode(head) {
  let slow = head,
    fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}
```

#### LeetCode 26. 删除有序数组中的重复项

```javascript
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let slow = 0;

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }

  return slow + 1;
}
```

#### LeetCode 27. 移除元素

```javascript
function removeElement(nums, val) {
  let slow = 0;

  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== val) {
      nums[slow] = nums[fast];
      slow++;
    }
  }

  return slow;
}
```

---

### 3️⃣ 分离双指针（两个数组/链表）

**适用场景**：

- 合并两个有序数组/链表
- 求两个数组交集
- 比较两个序列

**代码模板**：

```javascript
function mergeTwoArrays(arr1, arr2) {
  let i = 0,
    j = 0;
  const result = [];

  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] < arr2[j]) {
      result.push(arr1[i++]);
    } else {
      result.push(arr2[j++]);
    }
  }

  // 处理剩余元素
  while (i < arr1.length) result.push(arr1[i++]);
  while (j < arr2.length) result.push(arr2[j++]);

  return result;
}
```

**经典例题**：

#### LeetCode 88. 合并两个有序数组

```javascript
function merge(nums1, m, nums2, n) {
  let p1 = m - 1; // nums1 的有效元素末尾
  let p2 = n - 1; // nums2 的末尾
  let p = m + n - 1; // 合并后的末尾

  // 从后往前填充，避免覆盖
  while (p2 >= 0) {
    if (p1 >= 0 && nums1[p1] > nums2[p2]) {
      nums1[p--] = nums1[p1--];
    } else {
      nums1[p--] = nums2[p2--];
    }
  }
}
```

#### LeetCode 21. 合并两个有序链表

```javascript
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
  let current = dummy;

  while (l1 && l2) {
    if (l1.val < l2.val) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }

  current.next = l1 || l2;

  return dummy.next;
}
```

#### LeetCode 349. 两个数组的交集

```javascript
function intersection(nums1, nums2) {
  nums1.sort((a, b) => a - b);
  nums2.sort((a, b) => a - b);

  const result = [];
  let i = 0,
    j = 0;

  while (i < nums1.length && j < nums2.length) {
    if (nums1[i] === nums2[j]) {
      if (result[result.length - 1] !== nums1[i]) {
        result.push(nums1[i]);
      }
      i++;
      j++;
    } else if (nums1[i] < nums2[j]) {
      i++;
    } else {
      j++;
    }
  }

  return result;
}
```

---

### 4️⃣ 回文判断专题

**代码模板**：

```javascript
function isPalindrome(s) {
  let left = 0,
    right = s.length - 1;

  while (left < right) {
    // 跳过非字母数字字符
    while (left < right && !isAlphanumeric(s[left])) left++;
    while (left < right && !isAlphanumeric(s[right])) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}
```

**经典例题**：

#### LeetCode 125. 验证回文串

```javascript
function isPalindrome(s) {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  let left = 0,
    right = s.length - 1;

  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }

  return true;
}
```

#### LeetCode 680. 验证回文串 II（可删除一个字符）

```javascript
function validPalindrome(s) {
  function check(left, right) {
    while (left < right) {
      if (s[left] !== s[right]) return false;
      left++;
      right--;
    }
    return true;
  }

  let left = 0,
    right = s.length - 1;

  while (left < right) {
    if (s[left] !== s[right]) {
      // 尝试删除左边或右边
      return check(left + 1, right) || check(left, right - 1);
    }
    left++;
    right--;
  }

  return true;
}
```

---

## 🎨 进阶技巧

### 技巧 1：三指针/多指针

```javascript
// LeetCode 75. 颜色分类（荷兰国旗问题）
function sortColors(nums) {
  let left = 0; // 下一个0的位置
  let right = nums.length - 1; // 下一个2的位置
  let i = 0; // 当前遍历位置

  while (i <= right) {
    if (nums[i] === 0) {
      [nums[i], nums[left]] = [nums[left], nums[i]];
      left++;
      i++;
    } else if (nums[i] === 2) {
      [nums[i], nums[right]] = [nums[right], nums[i]];
      right--;
      // 注意：交换后i不动，因为从right来的元素还未检查
    } else {
      i++;
    }
  }
}
```

### 技巧 2：间隔双指针

```javascript
// LeetCode 19. 删除链表的倒数第N个结点
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;

  // fast先走n+1步
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }

  // 同时移动，当fast到末尾时，slow在倒数第n+1个节点
  while (fast) {
    fast = fast.next;
    slow = slow.next;
  }

  // 删除倒数第n个节点
  slow.next = slow.next.next;

  return dummy.next;
}
```

### 技巧 3：双指针 + 哈希表

```javascript
// LeetCode 350. 两个数组的交集 II
function intersect(nums1, nums2) {
  const map = new Map();
  const result = [];

  // 统计nums1中每个数字的频次
  for (const num of nums1) {
    map.set(num, (map.get(num) || 0) + 1);
  }

  // 遍历nums2，检查是否在map中
  for (const num of nums2) {
    if (map.get(num) > 0) {
      result.push(num);
      map.set(num, map.get(num) - 1);
    }
  }

  return result;
}
```

---

## 🔍 解题思路 SOP

### Step 1: 识别题型

- 看到**有序数组**、**原地操作**、**链表** → 考虑双指针
- 看到**去重**、**移除元素** → 快慢指针
- 看到**配对**、**和为 target** → 对撞指针
- 看到**回文** → 对撞指针
- 看到**环检测**、**中点** → 快慢指针

### Step 2: 选择指针类型

- **对撞指针**：两端向中间，适合查找配对
- **快慢指针**：同向移动，适合链表问题和原地修改
- **分离双指针**：两个序列，适合合并问题

### Step 3: 确定移动规则

- 根据题目条件，明确什么情况下移动哪个指针
- 注意边界条件（如 `left < right` 还是 `left <= right`）

### Step 4: 处理细节

- **去重**：记得跳过重复元素
- **链表**：使用 dummy 节点简化边界
- **数组**：注意是否需要从后往前处理

---

## ⚠️ 常见错误

### 错误 1：边界条件错误

```javascript
// ❌ 错误：可能漏掉中间元素
while (left < right) { ... }

// ✅ 正确：根据题意决定是否包含相等
while (left <= right) { ... }  // 包含相等
while (left < right) { ... }   // 不包含相等
```

### 错误 2：指针移动逻辑错误

```javascript
// ❌ 错误：可能陷入死循环
while (left < right) {
  if (condition) {
    // 忘记移动指针
  }
}

// ✅ 正确：确保每次循环都有指针移动
while (left < right) {
  if (condition) {
    left++;
  } else {
    right--;
  }
}
```

### 错误 3：快慢指针未考虑空指针

```javascript
// ❌ 错误：未检查fast.next
while (fast) {
  fast = fast.next.next; // 可能抛出异常
}

// ✅ 正确：检查fast和fast.next
while (fast && fast.next) {
  fast = fast.next.next;
}
```

### 错误 4：数组去重时未更新 slow 指针

```javascript
// ❌ 错误：slow未更新
for (let fast = 1; fast < nums.length; fast++) {
  if (nums[fast] !== nums[slow]) {
    nums[slow] = nums[fast]; // 忘记slow++
  }
}

// ✅ 正确：先更新slow再赋值
for (let fast = 1; fast < nums.length; fast++) {
  if (nums[fast] !== nums[slow]) {
    slow++;
    nums[slow] = nums[fast];
  }
}
```

---

## 📝 高频题目清单

### 必做题（按难度排序）

| 题号 | 题目                      | 难度   | 类型       | 关键点              |
| ---- | ------------------------- | ------ | ---------- | ------------------- |
| 27   | 移除元素                  | Easy   | 快慢指针   | 原地修改数组        |
| 26   | 删除有序数组中的重复项    | Easy   | 快慢指针   | 原地去重            |
| 88   | 合并两个有序数组          | Easy   | 分离双指针 | 从后往前            |
| 125  | 验证回文串                | Easy   | 对撞指针   | 跳过非字母数字      |
| 141  | 环形链表                  | Easy   | 快慢指针   | 环检测              |
| 167  | 两数之和 II               | Easy   | 对撞指针   | 有序数组            |
| 344  | 反转字符串                | Easy   | 对撞指针   | 原地反转            |
| 876  | 链表的中间结点            | Easy   | 快慢指针   | 找中点              |
| 19   | 删除链表的倒数第 N 个结点 | Medium | 间隔双指针 | 先让 fast 走 n 步   |
| 15   | 三数之和                  | Medium | 对撞指针   | 排序+去重           |
| 11   | 盛最多水的容器            | Medium | 对撞指针   | 移动短板            |
| 142  | 环形链表 II               | Medium | 快慢指针   | 找环入口            |
| 75   | 颜色分类                  | Medium | 三指针     | 荷兰国旗            |
| 680  | 验证回文串 II             | Medium | 对撞指针   | 允许删除一个字符    |
| 42   | 接雨水                    | Hard   | 对撞指针   | 双指针+记录最大高度 |

---

## 🎯 面试沟通要点

### 开始时

1. **确认输入**：

   - "数组是有序的吗？"
   - "链表会有环吗？"
   - "需要原地修改吗？"

2. **说明思路**：
   - "我看到这是一个有序数组，可以用对撞指针..."
   - "这个问题需要原地修改，我打算用快慢指针..."

### 编码时

1. **说明边界**：

   - "这里用 `left < right` 是因为..."
   - "需要检查 `fast.next` 防止空指针异常"

2. **解释移动规则**：
   - "当和小于 target 时，需要增大，所以 left++"
   - "慢指针指向下一个要写入的位置"

### 结束时

1. **分析复杂度**：

   - 时间：O(n) - 每个元素最多访问一次
   - 空间：O(1) - 只用了两个指针

2. **测试用例**：
   - 空数组/链表
   - 单元素
   - 所有元素相同
   - 目标在边界

---

## 🔗 相关算法

- **滑动窗口**：也是双指针，但更关注窗口内的状态
- **二分查找**：也有左右指针，但是折半查找
- **快速排序**：分区时使用双指针思想

---

## 💡 总结

### 核心要点

1. **对撞指针**：两端向中间，适合有序数组查找
2. **快慢指针**：同向移动，适合链表和原地修改
3. **分离双指针**：处理两个序列的合并
4. **移动规则**：根据条件明确什么时候移动哪个指针
5. **边界处理**：注意空指针、数组越界、循环条件

### 记忆口诀

```
对撞指针找配对，快慢指针检测环
分离双指针合两链，原地修改效率高
有序数组首选它，空间O(1)人人夸
```

---

## 🔖 快速查询表

| 问题特征        | 推荐方法   | 代码特征                       |
| --------------- | ---------- | ------------------------------ |
| 有序数组找配对  | 对撞指针   | `left++` / `right--`           |
| 判断回文        | 对撞指针   | `s[left] === s[right]`         |
| 原地去重/移除   | 快慢指针   | `slow` 指向写入位置            |
| 链表环检测      | 快慢指针   | `fast.next.next`               |
| 链表找中点      | 快慢指针   | `slow.next` / `fast.next.next` |
| 合并有序序列    | 分离双指针 | 比较 `arr1[i]` 和 `arr2[j]`    |
| 删除倒数第 N 个 | 间隔双指针 | `fast` 先走 n 步               |

---

**最后更新时间**：2024 年
