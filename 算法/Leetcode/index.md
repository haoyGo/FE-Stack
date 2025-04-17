## Array
### 二分查找
* 左闭右闭
  如果区间是左闭右闭，则结束条件必须是 `l <= r`，不能是 `l < r`。
  ``` javascript
  const binarySearch = (nums, target) => {
    let l = 0, r = nums.length - 1, mid
    while (l <= r) {
        // mid = Math.floor((l + r) / 2)
        mid = l + (r - l) >> 1 // 避免值溢出
        if (nums[mid] === target) return mid
        else if (nums[mid] < target) l = mid + 1
        else r = mid - 1
    }

    return -1
  }
  ```

### 快慢指针
* L26 - 移除已排序数组重复元素，返回新数组长度
  [0,0,1,1,1,2,2,3,3,4] -> [0,1,2,3,4]
  ``` javascript
  const removeDuplicates = (arr) => {
    const len = arr.length
    if (len <= 1) return len

    let count = 1
    for (let i=1; i<len; ++i) {
        if (arr[i] !== arr[i-1]) {
            arr[count++] = arr[i]
        }
    }

    arr.length = count
    return count
  }
  ```

* L283 - 移除数组0值，并插到数组尾
  [0,1,0,3,12] -> [1,3,12,0,0]
  ``` javascript
  const removeZeros = (arr) => {
    const len = arr.length
    let count = 0
    for (let i=0; i<len; ++i) {
        if (arr[i] !== 0) {
            arr[count++] = arr[i]
        }
    }
    while (len - count) {
        arr[count++] = 0
    }

    return arr
  }
  ```

### 双指针
* L977 - 已排序数组（含负数），对其平方数进行排序
  ``` javascript
  const sortedSquares = (arr) => {
    const res = []
    let len = arr.length, l = 0, r = len - 1
    while (l <= r) {
        Math.abs(arr[l]) > Math.abs(arr[r]) ? res.unshift(arr[l++] ** 2) : res.unshift(arr[r--] ** 2)
    }
  }
  ```

* L11 - 计算最大储水量。
  ``` javascript
  const maxArea = (lines) => {
    let left = 0, right = lines.lenght - 1
    let area = 0
    while (left < right) {
        area = Math.max(area, (right - left) * Math.min(lines[left], lines[right]))
        if (lines[left] < lines[right]) ++left
        else --right
    }

    return area
  }
  ```

### 分治
* L4 - 求两排序数组中位数
  [1,2] [3,4] -> 2.5
  ``` javascript
  const findMedianSortedArrays = (arr1, arr2) => {
    if (nums1.length > nums2.length) {
        return findMedianSortedArrays(nums2, nums1)
    }
    
    const l1 = nums1.length, l2 = nums2.length
    const isEven = (l1 + l2) % 2 === 0
    let low = 0, high = l1
    let midX, midY 
    while (low <= high) {
        midX = (low + high) >> 1
        midY = ((l1 + l2 + 1) >> 1) - midX
        
        const maxX = midX === 0 ? Number.NEGATIVE_INFINITY : nums1[midX - 1]
        const maxY = midY === 0 ? Number.NEGATIVE_INFINITY : nums2[midY - 1]
        
        const minX = midX === l1 ? Number.POSITIVE_INFINITY : nums1[midX]
        const minY = midY === l2 ? Number.POSITIVE_INFINITY : nums2[midY]
        
        if (maxX <= minY && maxY <= minX) {
            return isEven ? (Math.max(maxX, maxY) + Math.min(minX, minY)) / 2 : Math.max(maxX, maxY)
        } else if (maxX > minY) {
            high = midX - 1
        } else {
            low = midX + 1
        }
    }
  }
  ```

