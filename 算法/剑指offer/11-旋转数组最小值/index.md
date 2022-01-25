**[旋转数组最小值](https://leetcode-cn.com/problems/xuan-zhuan-shu-zu-de-zui-xiao-shu-zi-lcof/)**

把一个数组最开始的若干个元素搬到数组的末尾，我们称之为数组的旋转。

给你一个可能存在 重复 元素值的数组 numbers ，它原来是一个升序排列的数组，并按上述情形进行了一次旋转。请返回旋转数组的最小元素。例如，数组 [3,4,5,1,2] 为 [1,2,3,4,5] 的一次旋转，该数组的最小值为1。  

```
输入：[3,4,5,1,2]
输出：1
```

**解法**
``` js
// 二分法，中值与右值做比较
var minArray = function(numbers) {
  if (!numbers || !numbers.length) return null

  let left = 0, right = numbers.length - 1, mid
  while (left < right) {
    mid = left + ((right - left) >> 1)
    if (numbers[mid] < numbers[right]) {
      right = mid
    } else if (numbers[mid] > numbers[right]) {
      left = mid + 1
    } else {
        right--
    }
  }

  return numbers[left]
}
```