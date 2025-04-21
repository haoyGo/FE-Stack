二分查找
``` js
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}
```


#### 5.1 快速排序

**问题描述**：实现快速排序算法，要求时间复杂度为O(nlogn)。

**解题思路**：
1. 选择基准元素（pivot）：可以是数组中的任意元素，常见的选择方式有：
   - 选择第一个或最后一个元素
   - 选择中间位置的元素
   - 随机选择（最佳实践）
2. 分区过程：
   - 将数组分为两部分：小于基准的元素和大于基准的元素
   - 基准元素放在最终位置
3. 递归处理：
   - 对基准元素左右两部分分别进行快速排序
   - 直到子数组长度为1或0

**性能分析**：
- 时间复杂度：平均O(nlogn)，最坏O(n²)，最好O(nlogn)
- 空间复杂度：原地排序O(logn)，非原地排序O(n)
- 稳定性：不稳定排序

```javascript
// 实现1：简单版本（非原地排序）
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const middle = []; // 存储等于pivot的元素
  const right = [];
  
  for (const item of arr) {
    if (item < pivot) {
      left.push(item);
    } else if (item > pivot) {
      right.push(item);
    } else {
      middle.push(item);
    }
  }
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// 实现2：原地排序（优化空间复杂度）
function quickSortInPlace(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr;
  
  const pivotIndex = partition(arr, left, right);
  quickSortInPlace(arr, left, pivotIndex - 1);
  quickSortInPlace(arr, pivotIndex + 1, right);
  
  return arr;
}

function partition(arr, left, right) {
  // 随机选择基准元素（优化）
  const randomIndex = Math.floor(Math.random() * (right - left + 1)) + left;
  [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];
  
  const pivot = arr[right];
  let i = left - 1; // i表示小于pivot的元素的边界
  
  for (let j = left; j < right; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}

// 使用示例
const arr1 = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
const arr2 = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];

console.log(quickSort(arr1)); // [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
console.log(quickSortInPlace(arr2)); // [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
```

**优化技巧**：
1. 随机选择基准元素，避免最坏情况
2. 对于小规模数组（长度<10），使用插入排序
3. 三路快排：将数组分为小于、等于、大于三部分，适合处理有大量重复元素的数组
4. 使用尾递归优化，减少递归调用栈的深度
