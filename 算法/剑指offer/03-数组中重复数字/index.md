**[找出数组中重复的数字](https://leetcode-cn.com/problems/shu-zu-zhong-zhong-fu-de-shu-zi-lcof/)**

在一个长度为 n 的数组 nums 里的所有数字都在 0～n-1 的范围内。数组中某些数字是重复的，但不知道有几个数字重复了，也不知道每个数字重复了几次。请找出数组中任意一个重复的数字。

```
输入：
[2, 3, 1, 0, 2, 5, 3]
输出：2 或 3 

限制：
2 <= n <= 100000
```

**解法**
``` js
// 方法一，利用 map
// 时间O(n)、空间O(n)
var findRepeatNumber = function(nums) {
  const map = Object.create(null)

  for (const itm of nums) {
    if (map[itm]) return itm

    map[itm] = 1
  }

  return -1
}

// 方法二，利用所有数字都在 0～n-1 的范围内，通过值映射索引
// 时间O(n)、空间O(1)
var findRepeatNumber = function(nums) {
  var swap = (i, j) => {
    const tmp = nums[i]
    nums[i] = nums[j]
    nums[j] = tmp
  }

  let i = 0, len = nums.length
  while (i < len) {
    const itm = nums[i]

    if (itm === i) {
      i++
      continue
    }
    
    if (itm === nums[itm]) return itm


    swap(i, itm)
  }

  return -1
}
```
