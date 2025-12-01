- 合并两个有序数组

```js
const mergeArr = (arr1, arr2) => {
  let len1 = arr1.length;
  let len2 = arr2.length;
  let idx = len1 + len2 - 1;

  len1--;
  len2--;

  while (len2 >= 0) {
    if (len1 < 0) {
      arr1[idx--] = arr2[len2--];
    }

    arr1[idx--] = arr1[len1] >= arr2[len2] ? arr1[len1--] : arr2[len2--];
  }

  return arr1;
};
```

---

- 手写数组去重、扁平化函数、排序

```js
// 扁平化
const flattenDeep = (array) => array.flat(Infinity);

// 去重
const unique = (array) => Array.from(new Set(array));

// 排序
const sort = (array) => array.sort((a, b) => a - b);

// 函数组合
const compose =
  (...fns) =>
  (initValue) =>
    fns.reduceRight((y, fn) => fn(y), initValue);

// 组合后函数
const flatten_unique_sort = compose(sort, unique, flattenDeep);

// 测试
var arr = [[1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14]]]], 10];
console.log(flatten_unique_sort(arr));
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
```

---

- 实现 Array.prototype.flat()

```js
// reduce 方式
function flat(arr, depth = 1) {
  return depth > 0
    ? arr.reduce(
        (acc, cur) =>
          acc.concat(Array.isArray(cur) ? flat(cur, depth - 1) : cur),
        []
      )
    : arr;
}

// 使用扩展运算符
function flat(arr) {
  while (arr.some((item) => Array.isArray(item))) {
    arr = [].concat(...arr);
  }
  return arr;
}

// 栈方式
function flattenDeep(arr) {
  const result = [];
  // 将数组元素拷贝至栈，直接赋值会改变原数组
  const stack = [...arr];
  // 如果栈不为空，则循环遍历
  while (stack.length !== 0) {
    const val = stack.pop();
    if (Array.isArray(val)) {
      // 如果是数组再次入栈，并且展开了一层
      stack.push(...val);
    } else {
      // 如果不是数组，就用头插法插入到结果数组中
      result.unshift(val);
    }
  }
  return result;
}
```

- L26 - 移除已排序数组重复元素，返回新数组长度
  [0,0,1,1,1,2,2,3,3,4] -> [0,1,2,3,4]

  ```javascript
  const removeDuplicates = (arr) => {
    const len = arr.length;
    if (len <= 1) return len;

    let count = 1;
    for (let i = 1; i < len; ++i) {
      if (arr[i] !== arr[i - 1]) {
        arr[count++] = arr[i];
      }
    }

    arr.length = count;
    return count;
  };
  ```

- L283 - 移除数组 0 值，并插到数组尾
  [0,1,0,3,12] -> [1,3,12,0,0]

```javascript
const removeZeros = (arr) => {
  const len = arr.length;
  let count = 0;
  for (let i = 0; i < len; ++i) {
    if (arr[i] !== 0) {
      arr[count++] = arr[i];
    }
  }
  while (len - count) {
    arr[count++] = 0;
  }

  return arr;
};
```

- 判断字符串括号是否匹配

```js
// 可以用正则循环判断是否有合法的括号匹配，通过 replace 去除正常匹配的括号，最后没剩下字符就是正确的，代码简单效率不行

// 通过栈来解，时间O(n)，空间O(n)
const isValid = (s) => {
  const map = {
    "{": "}",
    "(": ")",
    "[": "]",
  };
  const stack = [];
  let ch;
  for (let i = 0; i < s.length; i++) {
    ch = s[i];
    if (map[ch]) {
      stack.push(ch);
    } else if (ch !== map[stack.pop()]) {
      return false;
    }
  }
  return stack.length === 0;
};
```

---

- L11 - 计算最大储水量。

  ```javascript
  const maxArea = (lines) => {
    let left = 0,
      right = lines.lenght - 1;
    let area = 0;
    while (left < right) {
      area = Math.max(
        area,
        (right - left) * Math.min(lines[left], lines[right])
      );
      if (lines[left] < lines[right]) ++left;
      else --right;
    }

    return area;
  };
  ```

---

- 找出后面第一个比它小的元素的距离

**题目**：给定数组，找出每个元素后面第一个比它小的元素的距离。

```
输入: [72, 73, 74, 71, 75]
输出: [3, 2, 1, 0, 0]
```

**单调栈解法（O(n)）**

```javascript
function findNextSmaller(arr) {
  const n = arr.length;
  const result = new Array(n).fill(0);
  const stack = []; // 存储索引，维护单调递增栈

  // 从右向左遍历
  for (let i = n - 1; i >= 0; i--) {
    // 弹出所有 >= 当前元素的索引
    while (stack.length > 0 && arr[stack[stack.length - 1]] >= arr[i]) {
      stack.pop();
    }

    // 栈顶就是第一个比当前元素小的
    if (stack.length > 0) {
      result[i] = stack[stack.length - 1] - i;
    }

    stack.push(i);
  }

  return result;
}
```

**核心思想**：

- 维护**单调递增栈**（从栈底到栈顶递增）
- 从右向左遍历，栈中存储索引
- 弹出所有 >= 当前元素的值，因为它们不可能是答案
- 时间 O(n)，空间 O(n)

**变体**：

```javascript
// 找后面第一个更大的元素距离（单调递减栈）
function findNextGreater(arr) {
  const n = arr.length;
  const result = new Array(n).fill(0);
  const stack = [];

  for (let i = n - 1; i >= 0; i--) {
    while (stack.length > 0 && arr[stack[stack.length - 1]] <= arr[i]) {
      stack.pop();
    }
    if (stack.length > 0) {
      result[i] = stack[stack.length - 1] - i;
    }
    stack.push(i);
  }
  return result;
}
```

---

- 飞机射击游戏

**题目**：飞机往下飞，每秒只能射击一次。如果飞机落地游戏结束，返回最多击落的飞机数量。

```
输入:
heights = [5, 3, 4]  // 初始高度
speeds = [1, 2, 1]   // 每秒下降速度

输出: 2
解释:
t=0: 飞机高度 [5, 3, 4]
t=1: 飞机高度 [4, 1, 3] → 射击飞机1（高度1）
t=2: 飞机高度 [3, -1(落地), 2] → 射击飞机2（高度2）
飞机0在 t=3 落地前无法射击，总共击落2架
```

**贪心解法（O(n log n)）**

```javascript
function maxShootPlanes(heights, speeds) {
  const n = heights.length;
  const planes = [];

  // 计算每架飞机落地时间
  for (let i = 0; i < n; i++) {
    const landTime = Math.ceil(heights[i] / speeds[i]);
    planes.push({ landTime, index: i });
  }

  // 按落地时间排序（贪心：先处理快落地的）
  planes.sort((a, b) => a.landTime - b.landTime);

  let count = 0;
  let currentTime = 0;

  for (const plane of planes) {
    // 如果还有时间射击
    if (currentTime < plane.landTime) {
      count++;
      currentTime++; // 消耗1秒射击
    }
  }

  return count;
}

// 测试
console.log(maxShootPlanes([5, 3, 4], [1, 2, 1])); // 2
console.log(maxShootPlanes([4, 3, 2, 1], [1, 1, 1, 1])); // 4
```

**核心思想**：

- 计算每架飞机的**落地时间** = ceil(高度 / 速度)
- **贪心策略**：优先射击快落地的飞机
- 按落地时间排序，依次射击（如果还有时间）
- 时间 O(n log n)，空间 O(n)
