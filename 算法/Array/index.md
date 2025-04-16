* 合并两个有序数组
``` js
const mergeArr = (arr1, arr2) => {
  let len1 = arr1.length
  let len2 = arr2.length
  let idx = len1 + len2 - 1

  len1--
  len2--

  while (len2 >= 0) {
    if (len1 < 0) {
      arr1[idx--] = arr2[len2--]
    }

    arr1[idx--] = arr1[len1] >= arr2[len2] ? arr1[len1--] : arr2[len2--]
  }

  return arr1
}
```
---

* 手写数组去重、扁平化函数、排序
``` js
// 扁平化
const flattenDeep = (array) => array.flat(Infinity)

// 去重
const unique = (array) => Array.from(new Set(array))

// 排序
const sort = (array) => array.sort((a, b) => a-b)

// 函数组合
const compose = (...fns) => (initValue) => fns.reduceRight((y, fn) => fn(y), initValue)

// 组合后函数
const flatten_unique_sort = compose(sort, unique, flattenDeep)

// 测试
var arr = [ [1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14] ] ] ], 10]
console.log(flatten_unique_sort(arr))
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
```
---

* 实现 Array.prototype.flat()
``` js
// reduce 方式
function flat(arr, depth = 1) {
  return depth > 0
    ? arr.reduce((acc, cur) => acc.concat(Array.isArray(cur) ? flat(cur, depth-1) : cur), [])
    : arr
}

// 栈方式
function flattenDeep(arr) {
  const result = [] 
  // 将数组元素拷贝至栈，直接赋值会改变原数组
  const stack = [...arr]
  // 如果栈不为空，则循环遍历
  while (stack.length !== 0) {
    const val = stack.pop() 
    if (Array.isArray(val)) {
      // 如果是数组再次入栈，并且展开了一层
      stack.push(...val) 
    } else {
      // 如果不是数组，就用头插法插入到结果数组中
      result.unshift(val)
    }
  }
  return result
}
```
