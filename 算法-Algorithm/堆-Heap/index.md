# 堆算法速查手册

## 🎯 核心思想

堆（Heap）是一种特殊的完全二叉树结构，分为大顶堆和小顶堆：

- **大顶堆**：父节点 ≥ 子节点，根节点是最大值
- **小顶堆**：父节点 ≤ 子节点，根节点是最小值

**核心优势**：

- 快速获取最值：O(1)
- 插入/删除：O(log n)
- 适合动态维护有序数据

---

## 📋 快速识别

### 关键词识别

- **第 K 大/小元素**
- **Top K 问题**
- **数据流中的中位数**
- **合并 K 个有序链表/数组**
- **动态维护最值**

### 适用场景

1. 需要频繁获取最大/最小值
2. 需要维护前 K 个元素
3. 需要对大量数据进行部分排序
4. 需要处理数据流问题

---

## 🔧 JavaScript 中的堆实现

### 最小堆实现（完整版）

```javascript
class MinHeap {
  constructor() {
    this.heap = [];
  }

  // 获取父节点索引
  getParentIndex(i) {
    return Math.floor((i - 1) / 2);
  }

  // 获取左子节点索引
  getLeftChildIndex(i) {
    return 2 * i + 1;
  }

  // 获取右子节点索引
  getRightChildIndex(i) {
    return 2 * i + 2;
  }

  // 交换两个节点
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // 获取堆顶元素（最小值）
  peek() {
    return this.heap[0];
  }

  // 获取堆大小
  size() {
    return this.heap.length;
  }

  // 插入元素
  push(val) {
    this.heap.push(val);
    this.heapifyUp(this.heap.length - 1);
  }

  // 删除堆顶元素
  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return min;
  }

  // 向上调整（插入时使用）
  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex] <= this.heap[index]) break;

      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  // 向下调整（删除时使用）
  heapifyDown(index) {
    while (true) {
      let minIndex = index;
      const leftIndex = this.getLeftChildIndex(index);
      const rightIndex = this.getRightChildIndex(index);

      if (
        leftIndex < this.heap.length &&
        this.heap[leftIndex] < this.heap[minIndex]
      ) {
        minIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.heap[rightIndex] < this.heap[minIndex]
      ) {
        minIndex = rightIndex;
      }

      if (minIndex === index) break;

      this.swap(index, minIndex);
      index = minIndex;
    }
  }
}
```

### 最大堆实现（基于最小堆）

```javascript
class MaxHeap extends MinHeap {
  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex] >= this.heap[index]) break;

      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    while (true) {
      let maxIndex = index;
      const leftIndex = this.getLeftChildIndex(index);
      const rightIndex = this.getRightChildIndex(index);

      if (
        leftIndex < this.heap.length &&
        this.heap[leftIndex] > this.heap[maxIndex]
      ) {
        maxIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.heap[rightIndex] > this.heap[maxIndex]
      ) {
        maxIndex = rightIndex;
      }

      if (maxIndex === index) break;

      this.swap(index, maxIndex);
      index = maxIndex;
    }
  }
}
```

---

## 💡 经典题目

### 1️⃣ LeetCode 215. 数组中的第 K 个最大元素

```javascript
function findKthLargest(nums, k) {
  // 方法1：使用最小堆维护前K大元素
  const minHeap = new MinHeap();

  for (const num of nums) {
    minHeap.push(num);
    if (minHeap.size() > k) {
      minHeap.pop();
    }
  }

  return minHeap.peek();
}

// 方法2：快速选择算法（更优）
function findKthLargest(nums, k) {
  k = nums.length - k; // 转换为第k小

  function quickSelect(left, right) {
    const pivot = nums[right];
    let i = left;

    for (let j = left; j < right; j++) {
      if (nums[j] <= pivot) {
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
```

### 2️⃣ LeetCode 347. 前 K 个高频元素

```javascript
function topKFrequent(nums, k) {
  // 统计频次
  const freqMap = new Map();
  for (const num of nums) {
    freqMap.set(num, (freqMap.get(num) || 0) + 1);
  }

  // 使用最小堆维护前K个高频元素
  const minHeap = new MinHeap();

  for (const [num, freq] of freqMap) {
    minHeap.push({ num, freq });
    if (minHeap.size() > k) {
      minHeap.pop();
    }
  }

  return minHeap.heap.map((item) => item.num);
}

// 需要修改MinHeap的比较逻辑为比较freq
class FreqMinHeap extends MinHeap {
  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex].freq <= this.heap[index].freq) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    while (true) {
      let minIndex = index;
      const leftIndex = this.getLeftChildIndex(index);
      const rightIndex = this.getRightChildIndex(index);

      if (
        leftIndex < this.heap.length &&
        this.heap[leftIndex].freq < this.heap[minIndex].freq
      ) {
        minIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.heap[rightIndex].freq < this.heap[minIndex].freq
      ) {
        minIndex = rightIndex;
      }

      if (minIndex === index) break;
      this.swap(index, minIndex);
      index = minIndex;
    }
  }
}
```

### 3️⃣ LeetCode 23. 合并 K 个升序链表

```javascript
function mergeKLists(lists) {
  if (!lists || lists.length === 0) return null;

  // 使用最小堆
  const minHeap = new MinHeap();

  // 将所有链表的头节点加入堆
  for (const head of lists) {
    if (head) {
      minHeap.push(head);
    }
  }

  const dummy = new ListNode(0);
  let current = dummy;

  while (minHeap.size() > 0) {
    const node = minHeap.pop();
    current.next = node;
    current = current.next;

    if (node.next) {
      minHeap.push(node.next);
    }
  }

  return dummy.next;
}

// 需要修改MinHeap比较链表节点的val
class ListNodeMinHeap extends MinHeap {
  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex].val <= this.heap[index].val) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    while (true) {
      let minIndex = index;
      const leftIndex = this.getLeftChildIndex(index);
      const rightIndex = this.getRightChildIndex(index);

      if (
        leftIndex < this.heap.length &&
        this.heap[leftIndex].val < this.heap[minIndex].val
      ) {
        minIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.heap[rightIndex].val < this.heap[minIndex].val
      ) {
        minIndex = rightIndex;
      }

      if (minIndex === index) break;
      this.swap(index, minIndex);
      index = minIndex;
    }
  }
}
```

### 4️⃣ LeetCode 295. 数据流的中位数

```javascript
class MedianFinder {
  constructor() {
    this.maxHeap = new MaxHeap(); // 存较小的一半
    this.minHeap = new MinHeap(); // 存较大的一半
  }

  addNum(num) {
    // 先加入maxHeap
    this.maxHeap.push(num);

    // 将maxHeap的最大值移到minHeap
    this.minHeap.push(this.maxHeap.pop());

    // 平衡两个堆的大小
    if (this.maxHeap.size() < this.minHeap.size()) {
      this.maxHeap.push(this.minHeap.pop());
    }
  }

  findMedian() {
    if (this.maxHeap.size() > this.minHeap.size()) {
      return this.maxHeap.peek();
    }
    return (this.maxHeap.peek() + this.minHeap.peek()) / 2;
  }
}
```

### 5️⃣ LeetCode 703. 数据流中的第 K 大元素

```javascript
class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.minHeap = new MinHeap();

    for (const num of nums) {
      this.add(num);
    }
  }

  add(val) {
    this.minHeap.push(val);
    if (this.minHeap.size() > this.k) {
      this.minHeap.pop();
    }
    return this.minHeap.peek();
  }
}
```

### 6️⃣ LeetCode 973. 最接近原点的 K 个点

```javascript
function kClosest(points, k) {
  // 计算距离
  const getDistance = ([x, y]) => x * x + y * y;

  // 使用最大堆维护最近的K个点
  const maxHeap = new MaxHeap();

  for (const point of points) {
    const dist = getDistance(point);
    maxHeap.push({ point, dist });

    if (maxHeap.size() > k) {
      maxHeap.pop();
    }
  }

  return maxHeap.heap.map((item) => item.point);
}

// 需要修改MaxHeap比较距离
class DistMaxHeap extends MaxHeap {
  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex].dist >= this.heap[index].dist) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    while (true) {
      let maxIndex = index;
      const leftIndex = this.getLeftChildIndex(index);
      const rightIndex = this.getRightChildIndex(index);

      if (
        leftIndex < this.heap.length &&
        this.heap[leftIndex].dist > this.heap[maxIndex].dist
      ) {
        maxIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.heap[rightIndex].dist > this.heap[maxIndex].dist
      ) {
        maxIndex = rightIndex;
      }

      if (maxIndex === index) break;
      this.swap(index, maxIndex);
      index = maxIndex;
    }
  }
}
```

---

## 🎨 解题技巧

### 技巧 1：Top K 问题的堆选择

```javascript
// 求前K大 → 用最小堆（堆顶是第K大）
// 求前K小 → 用最大堆（堆顶是第K小）

// 示例：前K大元素
function topKLargest(nums, k) {
  const minHeap = new MinHeap();

  for (const num of nums) {
    minHeap.push(num);
    if (minHeap.size() > k) {
      minHeap.pop(); // 移除最小的
    }
  }

  return minHeap.heap;
}
```

### 技巧 2：双堆解决中位数问题

```javascript
// 大顶堆存较小的一半，小顶堆存较大的一半
// 保持大顶堆.size() >= 小顶堆.size()
// 中位数就是大顶堆的堆顶或两个堆顶的平均值

class MedianFinder {
  constructor() {
    this.left = new MaxHeap(); // 较小的一半
    this.right = new MinHeap(); // 较大的一半
  }

  addNum(num) {
    // 保持：left.size() === right.size() 或 left.size() === right.size() + 1
    if (this.left.size() === this.right.size()) {
      this.right.push(num);
      this.left.push(this.right.pop());
    } else {
      this.left.push(num);
      this.right.push(this.left.pop());
    }
  }

  findMedian() {
    return this.left.size() === this.right.size()
      ? (this.left.peek() + this.right.peek()) / 2
      : this.left.peek();
  }
}
```

### 技巧 3：自定义比较器

```javascript
// 根据题目需求自定义堆的比较逻辑

class CustomHeap extends MinHeap {
  constructor(compareFn) {
    super();
    this.compare = compareFn;
  }

  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.compare(this.heap[parentIndex], this.heap[index]) <= 0) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    while (true) {
      let minIndex = index;
      const leftIndex = this.getLeftChildIndex(index);
      const rightIndex = this.getRightChildIndex(index);

      if (
        leftIndex < this.heap.length &&
        this.compare(this.heap[leftIndex], this.heap[minIndex]) < 0
      ) {
        minIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.compare(this.heap[rightIndex], this.heap[minIndex]) < 0
      ) {
        minIndex = rightIndex;
      }

      if (minIndex === index) break;
      this.swap(index, minIndex);
      index = minIndex;
    }
  }
}

// 使用示例：按频次排序
const heap = new CustomHeap((a, b) => a.freq - b.freq);
```

---

## 🔍 解题思路 SOP

### Step 1: 识别题型

- 看到**第 K 大/小** → 堆
- 看到**Top K** → 堆
- 看到**中位数** → 双堆
- 看到**合并 K 个有序序列** → 堆
- 看到**动态维护最值** → 堆

### Step 2: 选择堆类型

- **前 K 大** → 最小堆（保留较大的）
- **前 K 小** → 最大堆（保留较小的）
- **中位数** → 双堆（大顶堆+小顶堆）
- **合并有序序列** → 最小堆（取最小的）

### Step 3: 确定堆操作

- **插入**：push() + heapifyUp()
- **删除**：pop() + heapifyDown()
- **查看堆顶**：peek()
- **维护堆大小**：size() > k 时 pop()

### Step 4: 处理自定义逻辑

- 需要自定义比较器时，继承堆类并重写 heapifyUp/Down
- 注意比较的是对象的哪个属性

---

## ⚠️ 常见错误

### 错误 1：Top K 问题堆选择错误

```javascript
// ❌ 错误：求前K大用了最大堆
function topKLargest(nums, k) {
  const maxHeap = new MaxHeap();
  for (const num of nums) {
    maxHeap.push(num);
    if (maxHeap.size() > k) {
      maxHeap.pop(); // 弹出的是最大的，错误！
    }
  }
}

// ✅ 正确：求前K大用最小堆
function topKLargest(nums, k) {
  const minHeap = new MinHeap();
  for (const num of nums) {
    minHeap.push(num);
    if (minHeap.size() > k) {
      minHeap.pop(); // 弹出最小的，保留较大的
    }
  }
}
```

### 错误 2：双堆中位数大小不平衡

```javascript
// ❌ 错误：未维护两个堆的大小关系
addNum(num) {
    if (num < this.left.peek()) {
        this.left.push(num);
    } else {
        this.right.push(num);
    }
    // 忘记平衡！
}

// ✅ 正确：始终维护堆大小
addNum(num) {
    this.left.push(num);
    this.right.push(this.left.pop());

    if (this.left.size() < this.right.size()) {
        this.left.push(this.right.pop());
    }
}
```

### 错误 3：堆为空时未检查

```javascript
// ❌ 错误：未检查堆是否为空
findMedian() {
    return this.heap.heap[0]; // 可能为undefined
}

// ✅ 正确：检查边界
findMedian() {
    if (this.heap.size() === 0) return null;
    return this.heap.peek();
}
```

---

## 📝 高频题目清单

| 题号 | 题目                    | 难度   | 类型     | 关键点            |
| ---- | ----------------------- | ------ | -------- | ----------------- |
| 703  | 数据流中的第 K 大元素   | Easy   | Top K    | 最小堆维护前 K 大 |
| 215  | 数组中的第 K 个最大元素 | Medium | Top K    | 堆或快速选择      |
| 347  | 前 K 个高频元素         | Medium | Top K    | 统计频次+堆       |
| 973  | 最接近原点的 K 个点     | Medium | Top K    | 距离比较          |
| 23   | 合并 K 个升序链表       | Hard   | 合并     | 最小堆            |
| 295  | 数据流的中位数          | Hard   | 双堆     | 大顶堆+小顶堆     |
| 239  | 滑动窗口最大值          | Hard   | 动态最值 | 单调队列或堆      |
| 502  | IPO                     | Hard   | 贪心+堆  | 双堆              |

---

## 🎯 面试沟通要点

### 开始时

1. **确认题型**：

   - "这是求第 K 大的问题，我可以用堆来解决"
   - "需要动态维护中位数，我打算用两个堆"

2. **说明堆选择**：
   - "求前 K 大用最小堆，堆顶是第 K 大元素"
   - "用大顶堆存较小的一半，小顶堆存较大的一半"

### 编码时

1. **解释操作**：

   - "每次插入后，如果堆大小超过 K，就弹出最小的"
   - "需要平衡两个堆的大小，保证左边不少于右边"

2. **说明复杂度**：
   - "堆的插入和删除都是 O(log n)"
   - "维护大小为 K 的堆，空间是 O(K)"

### 结束时

- **时间复杂度**：O(n log k) - n 个元素，堆大小为 k
- **空间复杂度**：O(k) - 堆的大小

---

## 💡 总结

### 核心要点

1. **堆的本质**：完全二叉树，父子节点有大小关系
2. **Top K 问题**：前 K 大用最小堆，前 K 小用最大堆
3. **双堆技巧**：大顶堆+小顶堆维护中位数
4. **自定义比较**：根据题意修改 heapifyUp/Down
5. **时间复杂度**：插入/删除 O(log n)，查看堆顶 O(1)

### 记忆口诀

```
堆顶最值O(1)取，插入删除对数级
前K大用小顶堆，前K小用大顶堆
中位数问题双堆解，左大右小分两边
合并K链用小堆，动态最值堆最优
```

---

**最后更新时间**：2024 年
