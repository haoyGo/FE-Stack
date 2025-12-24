# IntensitySegments 实现详解

## 📖 一句话说明

**就像给数轴涂颜色，可以叠加涂，只记录每个关键位置的颜色深度。**

---

## 🎨 图解示例（最容易理解）

想象你有一条数轴，初始都是 0：

```
位置: 0   10   20   30   40   50
值:   0    0    0    0    0    0
```

### 操作 1：`add(10, 30, 1)` - 在 10~30 之间涂一层颜色

```
位置: 0   10   20   30   40   50
值:   0    1    1    1    0    0
           ↑---------↑
         开始涂    停止涂
```

**记录结果**：`[[10,1], [30,0]]`

- `[10,1]` 表示：从位置 10 开始，颜色深度变为 1
- `[30,0]` 表示：到位置 30，颜色深度变回 0

---

### 操作 2：`add(20, 40, 1)` - 在 20~40 之间再涂一层

```
之前: 0   10   20   30   40   50
      0    1    1    1    0    0

新涂:           1    1    1
                ↑---------↑

结果: 0    1    2    1    0    0
           ↑    ↑    ↑    ↑
```

**记录结果**：`[[10,1], [20,2], [30,1], [40,0]]`

- `[10,1]`：位置 10，深度 1
- `[20,2]`：位置 20，深度变为 2（两层叠加）
- `[30,1]`：位置 30，深度变为 1（只剩一层）
- `[40,0]`：位置 40，深度变为 0（没有涂色）

---

### 操作 3：`add(10, 40, -2)` - 在 10~40 之间擦掉 2 层

```
之前: 0    1    2    1    0    0

擦除:      -2   -2   -2
           ↑---------↑

结果: 0   -1    0   -1    0    0
          ↑    ↑    ↑    ↑
```

**记录结果**：`[[10,-1], [20,0], [30,-1], [40,0]]`

- `[10,-1]`：1 - 2 = -1
- `[20,0]`：2 - 2 = 0
- `[30,-1]`：1 - 2 = -1
- `[40,0]`：-1 + 1 = 0

---

## 💡 核心思想

**只记录"变化点"，不需要记录每个位置的值。**

---

## 🔧 代码实现

### 方法 1：推荐实现（差分数组） ⭐⭐⭐

```javascript
class IntensitySegments {
  constructor() {
    this.map = new Map(); // 存储位置 -> 强度变化量
  }

  add(start, end, value) {
    // 差分思想：在 start 位置标记 +value，在 end 位置标记 -value
    this.map.set(start, (this.map.get(start) || 0) + value);
    this.map.set(end, (this.map.get(end) || 0) - value);

    // 重建 segments
    this.rebuild();
  }

  rebuild() {
    // 按位置排序
    const positions = Array.from(this.map.keys()).sort((a, b) => a - b);
    const segments = [];
    let currentIntensity = 0;

    for (const pos of positions) {
      // 累加到当前位置的强度变化
      currentIntensity += this.map.get(pos);

      // 跳过相同强度（合并连续段）
      if (
        segments.length > 0 &&
        segments[segments.length - 1][1] === currentIntensity
      ) {
        continue;
      }

      segments.push([pos, currentIntensity]);
    }

    // 去除末尾的 0
    while (segments.length > 0 && segments[segments.length - 1][1] === 0) {
      segments.pop();
    }

    this.segments = segments;
  }

  toString() {
    return JSON.stringify(this.segments || []);
  }
}
```

### 方法 2：超简化版（理解用）

```javascript
class IntensitySegments {
  constructor() {
    this.map = new Map(); // 便利贴位置 → 变化量
  }

  add(start, end, value) {
    // 1. 贴便利贴
    this.map.set(start, (this.map.get(start) || 0) + value);
    this.map.set(end, (this.map.get(end) || 0) - value);

    // 2. 从左到右走，一边走一边累加
    const positions = [...this.map.keys()].sort((a, b) => a - b);
    const result = [];
    let sum = 0;

    for (const pos of positions) {
      sum += this.map.get(pos); // 累加便利贴的数字
      result.push([pos, sum]); // 记录当前位置的总和
    }

    this.segments = result;
  }

  toString() {
    return JSON.stringify(this.segments);
  }
}
```

### 方法 3：完整实现（参考用）

```javascript
class IntensitySegments {
  constructor() {
    this.segments = []; // [[position, intensity], ...]
  }

  /**
   * 在区间 [start, end) 添加强度 value
   * @param {number} start - 起始位置（包含）
   * @param {number} end - 结束位置（不包含）
   * @param {number} value - 强度增量
   */
  add(start, end, value) {
    const changes = new Map(); // 记录每个位置的变化

    // 1. 收集所有关键点
    changes.set(start, 0);
    changes.set(end, 0);

    for (const [pos, intensity] of this.segments) {
      if (!changes.has(pos)) {
        changes.set(pos, 0);
      }
    }

    // 2. 计算每个位置的当前强度
    let currentIntensity = 0;
    const sortedPositions = Array.from(changes.keys()).sort((a, b) => a - b);
    let segmentIndex = 0;

    for (const pos of sortedPositions) {
      // 更新到当前位置的强度值
      while (
        segmentIndex < this.segments.length &&
        this.segments[segmentIndex][0] <= pos
      ) {
        if (this.segments[segmentIndex][0] === pos) {
          currentIntensity = this.segments[segmentIndex][1];
        }
        segmentIndex++;
      }

      // 如果在 [start, end) 区间内，添加 value
      if (pos >= start && pos < end) {
        changes.set(pos, currentIntensity + value);
      } else if (pos === end) {
        // end 位置恢复到之前的强度
        changes.set(pos, currentIntensity);
      } else {
        changes.set(pos, currentIntensity);
      }
    }

    // 3. 重建 segments，去除强度为 0 的段
    this.segments = [];
    for (const [pos, intensity] of changes) {
      // 跳过相同强度的相邻点（合并）
      if (
        this.segments.length > 0 &&
        this.segments[this.segments.length - 1][1] === intensity
      ) {
        continue;
      }

      // 只保留非零强度的点，或者是强度变化点
      if (intensity !== 0 || this.segments.length > 0) {
        this.segments.push([pos, intensity]);
      }
    }

    // 4. 清理末尾的 0
    while (
      this.segments.length > 0 &&
      this.segments[this.segments.length - 1][1] === 0
    ) {
      this.segments.pop();
    }
  }

  toString() {
    return JSON.stringify(this.segments);
  }
}
```

---

## 📚 核心原理详解

### 差分数组思想

**本质**：用"变化量"代替"绝对值"

```
原数组:      [0, 0, 0, 1, 1, 1, 0, 0]
差分数组:    [0, 0, 0, +1, 0, 0, -1, 0]
             ↑           ↑         ↑
           位置0      位置3开始+1  位置6结束-1
```

**关键**：

- 区间起点 `start` 标记 `+value`
- 区间终点 `end` 标记 `-value`
- 从左到右累加 = 每个位置的实际值

---

### 完整执行过程示例

**示例：依次执行 `add(10, 30, 1)` → `add(20, 40, 1)` → `add(10, 40, -2)`**

#### 第 1 步：`add(10, 30, 1)`

```javascript
// 1. 在差分 map 中标记变化点
map.set(10, 0 + 1); // 位置 10: +1
map.set(30, 0 - 1); // 位置 30: -1

// 此时 map: { 10: +1, 30: -1 }

// 2. rebuild() - 重建 segments
positions = [10, 30]; // 排序后的位置
currentIntensity = 0;

// 遍历位置 10:
currentIntensity += map.get(10); // 0 + 1 = 1
segments.push([10, 1]);

// 遍历位置 30:
currentIntensity += map.get(30); // 1 + (-1) = 0
segments.push([30, 0]);

// 结果: [[10,1],[30,0]]
```

**可视化**：

```
位置:  0   5   10  15  20  25  30  35  40
强度:  0   0   1   1   1   1   0   0   0
            ↑-----------↑
         开始(+1)    结束(-1)
```

---

#### 第 2 步：`add(20, 40, 1)`

```javascript
// 1. 在原有 map 基础上累加
map.set(20, (map.get(20) || 0) + 1); // 位置 20: 0 + 1 = 1
map.set(40, (map.get(40) || 0) - 1); // 位置 40: 0 - 1 = -1

// 此时 map: { 10: +1, 20: +1, 30: -1, 40: -1 }

// 2. rebuild()
positions = [10, 20, 30, 40];
currentIntensity = 0;

// 位置 10:
currentIntensity += 1; // 0 + 1 = 1
segments = [[10, 1]];

// 位置 20:
currentIntensity += 1; // 1 + 1 = 2
segments = [
  [10, 1],
  [20, 2],
];

// 位置 30:
currentIntensity += -1; // 2 + (-1) = 1
segments = [
  [10, 1],
  [20, 2],
  [30, 1],
];

// 位置 40:
currentIntensity += -1; // 1 + (-1) = 0
segments = [
  [10, 1],
  [20, 2],
  [30, 1],
  [40, 0],
];

// 结果: [[10,1],[20,2],[30,1],[40,0]]
```

**可视化**：

```
位置:  0   5   10  15  20  25  30  35  40
强度:  0   0   1   1   2   2   1   1   0
            ↑-------↑-------↑
         [10,30)区间     +1
                    ↑-----------↑
                  [20,40)区间  +1

合并结果:
[10,20) = 1
[20,30) = 1+1 = 2 (重叠)
[30,40) = 1
```

---

#### 第 3 步：`add(10, 40, -2)`

```javascript
// 1. 在 map 上继续累加
map.set(10, 1 + -2); // 位置 10: 1 - 2 = -1
map.set(40, -1 - -2); // 位置 40: -1 + 2 = 1

// 此时 map: { 10: -1, 20: +1, 30: -1, 40: +1 }

// 2. rebuild()
positions = [10, 20, 30, 40];
currentIntensity = 0;

// 位置 10:
currentIntensity += -1; // 0 + (-1) = -1
segments = [[10, -1]];

// 位置 20:
currentIntensity += 1; // -1 + 1 = 0
segments = [
  [10, -1],
  [20, 0],
];

// 位置 30:
currentIntensity += -1; // 0 + (-1) = -1
segments = [
  [10, -1],
  [20, 0],
  [30, -1],
];

// 位置 40:
currentIntensity += 1; // -1 + 1 = 0
segments = [
  [10, -1],
  [20, 0],
  [30, -1],
  [40, 0],
];

// 结果: [[10,-1],[20,0],[30,-1],[40,0]]
```

**可视化**：

```
之前状态:
[10,20) = 1
[20,30) = 2
[30,40) = 1

加上 [10,40) -2 后:
[10,20) = 1 - 2 = -1
[20,30) = 2 - 2 = 0
[30,40) = 1 - 2 = -1

位置:  0   5   10  15  20  25  30  35  40
强度:  0   0  -1  -1   0   0  -1  -1   0
            ↑-------↑-------↑-------↑
```

---

### 示例 2：为什么会出现 `[[20,1],[30,0]]`？

```javascript
// 初始状态: [[10,1],[20,2],[30,1],[40,0]]
// map: { 10: +1, 20: +1, 30: -1, 40: -1 }

// 执行 add(10, 40, -1)
map.set(10, 1 + -1); // 10: 0
map.set(40, -1 - -1); // 40: 0

// map: { 10: 0, 20: +1, 30: -1, 40: 0 }

// rebuild():
currentIntensity = 0;

// 位置 10: 0 + 0 = 0 (强度为0，不记录或被合并)
// 位置 20: 0 + 1 = 1 → 记录 [20, 1]
// 位置 30: 1 + (-1) = 0 → 记录 [30, 0]
// 位置 40: 0 + 0 = 0 (末尾的0会被去除)

// 结果: [[20,1],[30,0]]
```

**关键理解**：

- 位置 10 的变化量变成 0，从起点变成了"普通位置"
- 位置 20 成为新的起点（强度从 0 变为 1）
- 位置 30 是终点（强度从 1 回到 0）

---

## ⏱️ 复杂度分析

```

add(start, end, value):

- 更新 map: O(1)
- rebuild():
  - 排序位置: O(n log n) n = map.size
  - 遍历构建: O(n)
- 总计: O(n log n)

```

---

## ❓ 常见问题 FAQ

### Q1: 为什么 end 位置要 -value？

**答**：因为区间是 `[start, end)`，end 不包含在内。

```javascript
add(10, 30, 1); // [10, 30) 表示 10~29，不包括 30

// 所以：
map[10] = +1; // 从 10 开始 +1
map[30] = -1; // 从 30 开始取消 +1（因为 30 不在区间内）
```

**类比**：开关灯

- 位置 10：开灯（+1）
- 位置 30：关灯（-1）
- 中间 10~29 都亮着，不需要每个都记录

---

### Q2: 为什么要累加？为什么不直接替换？

**答**：因为可能有多个区间重叠。

```javascript
add(10, 30, 1)  // 第一层
add(20, 40, 1)  // 第二层，与第一层重叠

// 如果直接替换：
map[20] = 1  // 错误！忽略了第一层

// 应该累加：
map[20] = 0 + 1 = 1  // 正确！保留了第一层的 +1
```

---

### Q3: 为什么要"从左到右累加"？

**答**：因为便利贴记录的是"从这里开始的变化"，不是"这里的具体值"。

```javascript
map = { 10: +1, 20: +1, 30: -1 }

// 扫描过程（就像走路，一边走一边看便利贴）：
位置 0:  sum = 0
位置 10: 看到便利贴 "+1"，sum = 0 + 1 = 1
位置 15: 没便利贴，sum 保持 1
位置 20: 看到便利贴 "+1"，sum = 1 + 1 = 2
位置 25: 没便利贴，sum 保持 2
位置 30: 看到便利贴 "-1"，sum = 2 - 1 = 1
```

---

### Q4: 什么时候记录到 segments？

**答**：只在"值发生变化"的位置记录。

```javascript
// 从左到右扫描：
位置 10: sum = 1  → 记录 [10, 1]（从 0 变成 1）
位置 20: sum = 2  → 记录 [20, 2]（从 1 变成 2）
位置 30: sum = 1  → 记录 [30, 1]（从 2 变成 1）
位置 40: sum = 0  → 记录 [40, 0]（从 1 变成 0）

// 中间的位置（11, 12, 13...）值不变，不需要记录
```

---

## 📝 总结

| 特性           | 说明                     |
| -------------- | ------------------------ |
| **数据结构**   | Map 存储位置 → 变化量    |
| **核心思想**   | 差分数组（只记录变化点） |
| **区间特性**   | 左闭右开 `[start, end)`  |
| **重叠处理**   | 自动累加强度值           |
| **时间复杂度** | O(n log n)               |
| **空间复杂度** | O(n)                     |
| **适用场景**   | 区间更新、区间查询       |

---

## 🔗 相关 LeetCode 题目

- **370. 区间加法**（差分数组）
- **1109. 航班预订统计**（差分数组）
- **1094. 拼车**（差分数组）
- **56. 合并区间**
- **57. 插入区间**
- **253. 会议室 II**（扫描线算法）
