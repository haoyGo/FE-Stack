# 排序算法速查手册

## 🎯 核心思想

排序算法是计算机科学的基础，面试中既考察排序算法本身，也考察排序的应用。

**常见排序算法**：

- **O(n²)**：冒泡、选择、插入
- **O(n log n)**：快排、归并、堆排序
- **O(n)**：计数、桶、基数排序

**面试重点**：

- **快速排序**：最常考，需掌握各种变体
- **归并排序**：逆序对、链表排序
- **堆排序**：Top K 问题
- **桶排序**：特定场景优化

---

## 📋 快速识别

### 关键词识别

- **排序数组**
- **第 K 大/小元素**
- **逆序对**
- **颜色分类**
- **区间合并**
- **自定义排序**

### 适用场景

1. 直接排序问题
2. 第 K 大/小元素（快速选择）
3. 逆序对计数（归并排序）
4. 链表排序（归并排序）
5. 特殊值域排序（计数/桶排序）

---

## 🔧 核心排序算法模板

### 1. 快速排序（Quick Sort）

```javascript
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return;

  const pivotIndex = partition(arr, left, right);
  quickSort(arr, left, pivotIndex - 1);
  quickSort(arr, pivotIndex + 1, right);
}

function partition(arr, left, right) {
  const pivot = arr[right]; // 选最右边为基准
  let i = left; // 小于pivot的区域的右边界

  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }

  [arr[i], arr[right]] = [arr[right], arr[i]];
  return i;
}

// 时间复杂度：平均O(n log n)，最坏O(n²)
// 空间复杂度：O(log n)
// 不稳定排序
```

### 2. 归并排序（Merge Sort）

```javascript
function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0,
    j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

// 时间复杂度：O(n log n)
// 空间复杂度：O(n)
// 稳定排序
```

### 3. 堆排序（Heap Sort）

```javascript
function heapSort(arr) {
  const n = arr.length;

  // 构建最大堆
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  // 依次取出堆顶元素
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
}

function heapify(arr, n, i) {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n && arr[left] > arr[largest]) {
    largest = left;
  }

  if (right < n && arr[right] > arr[largest]) {
    largest = right;
  }

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}

// 时间复杂度：O(n log n)
// 空间复杂度：O(1)
// 不稳定排序
```

### 4. 计数排序（Counting Sort）

```javascript
function countingSort(arr) {
  if (arr.length === 0) return arr;

  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const range = max - min + 1;

  const count = new Array(range).fill(0);
  const output = new Array(arr.length);

  // 统计频次
  for (const num of arr) {
    count[num - min]++;
  }

  // 累加频次
  for (let i = 1; i < range; i++) {
    count[i] += count[i - 1];
  }

  // 从后向前填充（保持稳定性）
  for (let i = arr.length - 1; i >= 0; i--) {
    const num = arr[i];
    output[count[num - min] - 1] = num;
    count[num - min]--;
  }

  return output;
}

// 时间复杂度：O(n + k)，k为值域范围
// 空间复杂度：O(n + k)
// 稳定排序
// 适用场景：值域较小的整数
```

### 5. 桶排序（Bucket Sort）

```javascript
function bucketSort(arr, bucketSize = 5) {
  if (arr.length === 0) return arr;

  const min = Math.min(...arr);
  const max = Math.max(...arr);

  // 计算桶数量
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;
  const buckets = Array.from({ length: bucketCount }, () => []);

  // 分配到桶
  for (const num of arr) {
    const bucketIndex = Math.floor((num - min) / bucketSize);
    buckets[bucketIndex].push(num);
  }

  // 对每个桶排序并合并
  const result = [];
  for (const bucket of buckets) {
    bucket.sort((a, b) => a - b); // 可用其他排序算法
    result.push(...bucket);
  }

  return result;
}

// 时间复杂度：平均O(n + k)，最坏O(n²)
// 空间复杂度：O(n + k)
// 稳定排序（取决于桶内排序）
// 适用场景：数据均匀分布
```

---

## 💡 经典题目

### 1️⃣ LeetCode 912. 排序数组

```javascript
// 方法1：快速排序
function sortArray(nums) {
  quickSort(nums, 0, nums.length - 1);
  return nums;
}

function quickSort(arr, left, right) {
  if (left >= right) return;

  // 随机选择pivot（避免最坏情况）
  const randomIndex = left + Math.floor(Math.random() * (right - left + 1));
  [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];

  const pivotIndex = partition(arr, left, right);
  quickSort(arr, left, pivotIndex - 1);
  quickSort(arr, pivotIndex + 1, right);
}

function partition(arr, left, right) {
  const pivot = arr[right];
  let i = left;

  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }

  [arr[i], arr[right]] = [arr[right], arr[i]];
  return i;
}

// 方法2：归并排序
function sortArray(nums) {
  if (nums.length <= 1) return nums;

  function mergeSort(arr, temp, left, right) {
    if (left >= right) return;

    const mid = left + Math.floor((right - left) / 2);
    mergeSort(arr, temp, left, mid);
    mergeSort(arr, temp, mid + 1, right);
    merge(arr, temp, left, mid, right);
  }

  function merge(arr, temp, left, mid, right) {
    let i = left,
      j = mid + 1,
      k = left;

    while (i <= mid && j <= right) {
      if (arr[i] <= arr[j]) {
        temp[k++] = arr[i++];
      } else {
        temp[k++] = arr[j++];
      }
    }

    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];

    for (let p = left; p <= right; p++) {
      arr[p] = temp[p];
    }
  }

  const temp = new Array(nums.length);
  mergeSort(nums, temp, 0, nums.length - 1);
  return nums;
}
```

### 2️⃣ LeetCode 215. 数组中的第 K 个最大元素（快速选择）

```javascript
function findKthLargest(nums, k) {
  k = nums.length - k; // 转换为第k小

  function quickSelect(left, right) {
    const pivot = nums[right];
    let i = left;

    for (let j = left; j < right; j++) {
      if (nums[j] < pivot) {
        [nums[i], nums[j]] = [nums[j], nums[i]];
        i++;
      }
    }

    [nums[i], nums[right]] = [nums[right], nums[i]];

    if (i === k) return nums[i];
    if (i < k) return quickSelect(i + 1, right);
    return quickSelect(left, i - 1);
  }

  return quickSelect(0, nums.length - 1);
}

// 时间复杂度：平均O(n)，最坏O(n²)
```

### 3️⃣ LeetCode 75. 颜色分类（荷兰国旗问题）

```javascript
function sortColors(nums) {
  let left = 0; // 0的右边界
  let right = nums.length - 1; // 2的左边界
  let curr = 0; // 当前遍历位置

  while (curr <= right) {
    if (nums[curr] === 0) {
      [nums[left], nums[curr]] = [nums[curr], nums[left]];
      left++;
      curr++;
    } else if (nums[curr] === 2) {
      [nums[curr], nums[right]] = [nums[right], nums[curr]];
      right--;
      // 注意：curr不移动，因为交换来的元素未检查
    } else {
      curr++;
    }
  }
}

// 时间复杂度：O(n)
// 空间复杂度：O(1)
```

### 4️⃣ LeetCode 148. 排序链表

```javascript
function sortList(head) {
  if (!head || !head.next) return head;

  // 快慢指针找中点
  let slow = head,
    fast = head,
    prev = null;
  while (fast && fast.next) {
    prev = slow;
    slow = slow.next;
    fast = fast.next.next;
  }

  prev.next = null; // 断开链表

  const left = sortList(head);
  const right = sortList(slow);

  return merge(left, right);
}

function merge(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1;
      l1 = l1.next;
    } else {
      curr.next = l2;
      l2 = l2.next;
    }
    curr = curr.next;
  }

  curr.next = l1 || l2;
  return dummy.next;
}

// 时间复杂度：O(n log n)
// 空间复杂度：O(log n)
```

### 5️⃣ LeetCode 493. 翻转对（归并排序应用）

```javascript
function reversePairs(nums) {
  let count = 0;

  function mergeSort(arr, temp, left, right) {
    if (left >= right) return;

    const mid = left + Math.floor((right - left) / 2);
    mergeSort(arr, temp, left, mid);
    mergeSort(arr, temp, mid + 1, right);

    // 统计翻转对
    let j = mid + 1;
    for (let i = left; i <= mid; i++) {
      while (j <= right && arr[i] > 2 * arr[j]) {
        j++;
      }
      count += j - (mid + 1);
    }

    merge(arr, temp, left, mid, right);
  }

  function merge(arr, temp, left, mid, right) {
    let i = left,
      j = mid + 1,
      k = left;

    while (i <= mid && j <= right) {
      if (arr[i] <= arr[j]) {
        temp[k++] = arr[i++];
      } else {
        temp[k++] = arr[j++];
      }
    }

    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];

    for (let p = left; p <= right; p++) {
      arr[p] = temp[p];
    }
  }

  const temp = new Array(nums.length);
  mergeSort(nums, temp, 0, nums.length - 1);
  return count;
}
```

### 6️⃣ LeetCode 56. 合并区间

```javascript
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // 按起始位置排序
  intervals.sort((a, b) => a[0] - b[0]);

  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const curr = intervals[i];
    const last = result[result.length - 1];

    if (curr[0] <= last[1]) {
      // 重叠，合并
      last[1] = Math.max(last[1], curr[1]);
    } else {
      // 不重叠，添加
      result.push(curr);
    }
  }

  return result;
}
```

### 7️⃣ LeetCode 179. 最大数

```javascript
function largestNumber(nums) {
  // 自定义排序：比较拼接后的结果
  const strs = nums.map(String);

  strs.sort((a, b) => {
    const order1 = a + b;
    const order2 = b + a;
    return order2.localeCompare(order1); // 降序
  });

  // 处理全0的情况
  if (strs[0] === "0") return "0";

  return strs.join("");
}
```

### 8️⃣ LeetCode 164. 最大间距（桶排序）

```javascript
function maximumGap(nums) {
  if (nums.length < 2) return 0;

  const n = nums.length;
  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (min === max) return 0;

  // 桶大小至少为 ceiling[(max-min)/(n-1)]
  const bucketSize = Math.ceil((max - min) / (n - 1));
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;

  const buckets = Array.from({ length: bucketCount }, () => ({
    min: Infinity,
    max: -Infinity,
  }));

  // 分配到桶
  for (const num of nums) {
    const idx = Math.floor((num - min) / bucketSize);
    buckets[idx].min = Math.min(buckets[idx].min, num);
    buckets[idx].max = Math.max(buckets[idx].max, num);
  }

  // 计算最大间距
  let maxGap = 0;
  let prevMax = min;

  for (const bucket of buckets) {
    if (bucket.min === Infinity) continue;

    maxGap = Math.max(maxGap, bucket.min - prevMax);
    prevMax = bucket.max;
  }

  return maxGap;
}
```

---

## 🎨 解题技巧

### 技巧 1：快速选择优化

```javascript
// 随机选择pivot，避免最坏情况
function partition(arr, left, right) {
  // 随机选择pivot
  const randomIndex = left + Math.floor(Math.random() * (right - left + 1));
  [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];

  const pivot = arr[right];
  let i = left;

  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }

  [arr[i], arr[right]] = [arr[right], arr[i]];
  return i;
}
```

### 技巧 2：归并排序的应用（逆序对、翻转对）

```javascript
// 在merge过程中统计
function mergeSort(arr, temp, left, right) {
  if (left >= right) return 0;

  const mid = left + Math.floor((right - left) / 2);
  let count = 0;

  count += mergeSort(arr, temp, left, mid);
  count += mergeSort(arr, temp, mid + 1, right);

  // 统计跨区间的对
  let j = mid + 1;
  for (let i = left; i <= mid; i++) {
    while (j <= right && arr[i] > arr[j]) {
      j++;
    }
    count += j - (mid + 1);
  }

  merge(arr, temp, left, mid, right);
  return count;
}
```

### 技巧 3：三路快排（处理重复元素）

```javascript
function threeWayPartition(arr, left, right) {
  if (left >= right) return;

  const pivot = arr[left];
  let lt = left; // [left+1, lt] < pivot
  let gt = right; // [gt, right] > pivot
  let i = left + 1; // [lt+1, i) = pivot

  while (i <= gt) {
    if (arr[i] < pivot) {
      [arr[lt + 1], arr[i]] = [arr[i], arr[lt + 1]];
      lt++;
      i++;
    } else if (arr[i] > pivot) {
      [arr[i], arr[gt]] = [arr[gt], arr[i]];
      gt--;
    } else {
      i++;
    }
  }

  [arr[left], arr[lt]] = [arr[lt], arr[left]];

  threeWayPartition(arr, left, lt - 1);
  threeWayPartition(arr, gt + 1, right);
}
```

### 技巧 4：自定义比较器

```javascript
// 示例：按特定规则排序
const customSort = (arr) => {
  return arr.sort((a, b) => {
    // 自定义比较逻辑
    if (条件1) return -1;
    if (条件2) return 1;
    return 0;
  });
};

// 示例：最大数问题
nums.sort((a, b) => {
  const order1 = String(a) + String(b);
  const order2 = String(b) + String(a);
  return order2.localeCompare(order1);
});
```

---

## 🔍 算法选择指南

### 按场景选择

| 场景        | 推荐算法 | 理由              |
| ----------- | -------- | ----------------- |
| 一般排序    | 快速排序 | 平均最快          |
| 需要稳定    | 归并排序 | 稳定且 O(n log n) |
| 空间受限    | 堆排序   | O(1)空间          |
| 链表排序    | 归并排序 | 适合链表          |
| 小范围整数  | 计数排序 | O(n+k)线性时间    |
| 数据均匀    | 桶排序   | 接近 O(n)         |
| 第 K 大元素 | 快速选择 | 平均 O(n)         |
| 重复元素多  | 三路快排 | 避免退化          |

### 按复杂度选择

| 算法     | 最好       | 平均       | 最坏       | 空间     | 稳定性 |
| -------- | ---------- | ---------- | ---------- | -------- | ------ |
| 快速排序 | O(n log n) | O(n log n) | O(n²)      | O(log n) | 不稳定 |
| 归并排序 | O(n log n) | O(n log n) | O(n log n) | O(n)     | 稳定   |
| 堆排序   | O(n log n) | O(n log n) | O(n log n) | O(1)     | 不稳定 |
| 计数排序 | O(n+k)     | O(n+k)     | O(n+k)     | O(n+k)   | 稳定   |
| 桶排序   | O(n+k)     | O(n+k)     | O(n²)      | O(n+k)   | 稳定   |
| 基数排序 | O(d·n)     | O(d·n)     | O(d·n)     | O(n+k)   | 稳定   |

---

## ⚠️ 常见错误

### 错误 1：忘记处理空数组

```javascript
// ❌ 错误
function sortArray(nums) {
  const mid = Math.floor(nums.length / 2);
  // 未检查空数组
}

// ✅ 正确
function sortArray(nums) {
  if (nums.length <= 1) return nums;
  // ...
}
```

### 错误 2：快排 pivot 选择不当

```javascript
// ❌ 错误：总是选第一个（已排序数组会退化）
const pivot = arr[left];

// ✅ 正确：随机选择
const randomIndex = left + Math.floor(Math.random() * (right - left + 1));
[arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];
const pivot = arr[right];
```

### 错误 3：归并排序边界错误

```javascript
// ❌ 错误
const mid = Math.floor(arr.length / 2);
mergeSort(arr, left, mid); // 缺少参数
mergeSort(arr, mid, right); // mid应该+1

// ✅ 正确
const mid = left + Math.floor((right - left) / 2);
mergeSort(arr, left, mid);
mergeSort(arr, mid + 1, right);
```

### 错误 4：链表排序未断开

```javascript
// ❌ 错误：未断开链表
let slow = head,
  fast = head;
while (fast && fast.next) {
  slow = slow.next;
  fast = fast.next.next;
}
const left = sortList(head);
const right = sortList(slow); // 链表未断开！

// ✅ 正确：断开链表
let slow = head,
  fast = head,
  prev = null;
while (fast && fast.next) {
  prev = slow;
  slow = slow.next;
  fast = fast.next.next;
}
prev.next = null; // 断开
```

---

## 📝 高频题目清单

| 题号 | 题目                    | 难度   | 类型       | 关键点    |
| ---- | ----------------------- | ------ | ---------- | --------- |
| 912  | 排序数组                | Medium | 基础       | 快排/归并 |
| 215  | 数组中的第 K 个最大元素 | Medium | 快速选择   | O(n)平均  |
| 75   | 颜色分类                | Medium | 三路快排   | 荷兰国旗  |
| 148  | 排序链表                | Medium | 归并       | 链表归并  |
| 493  | 翻转对                  | Hard   | 归并应用   | 统计对数  |
| 56   | 合并区间                | Medium | 排序应用   | 先排序    |
| 179  | 最大数                  | Medium | 自定义排序 | 比较拼接  |
| 164  | 最大间距                | Hard   | 桶排序     | 线性时间  |
| 147  | 对链表进行插入排序      | Medium | 插入排序   | 链表插入  |
| 274  | H 指数                  | Medium | 计数排序   | 特殊场景  |

---

## 🎯 面试沟通要点

### 开始时

1. **确认需求**：

   - "需要稳定排序吗？"
   - "数据范围是多少？"
   - "是否有重复元素？"

2. **说明选择**：
   - "我用快速排序，平均 O(n log n)"
   - "链表排序用归并，空间复杂度低"

### 编码时

1. **解释操作**：

   - "partition 将数组分为小于和大于 pivot 两部分"
   - "merge 合并两个有序数组"

2. **说明优化**：
   - "随机选择 pivot 避免最坏情况"
   - "三路快排处理大量重复元素"

### 结束时

- **时间复杂度**：通常 O(n log n)
- **空间复杂度**：快排 O(log n)，归并 O(n)

---

## 💡 总结

### 核心要点

1. **快速排序**：最常用，需掌握 partition 和优化
2. **归并排序**：稳定，适合链表和统计问题
3. **堆排序**：空间 O(1)，适合 Top K
4. **快速选择**：找第 K 大，平均 O(n)
5. **特殊排序**：计数、桶、基数适用特定场景

### 记忆口诀

```
快排平均最优秀，归并稳定用链表
堆排空间仅O(1)，第K元素快速选
计数桶排值域小，三路快排重复多
链表归并找中点，自定义排看需求
```

---

**最后更新时间**：2024 年
