* 合并两个有序数组
```
const mergeArr = (arr1, arr2) => {
  let len1 = arr1.length
  let len2 = arr2.length
  let idx = len1 + len2 - 1

  len1--
  len2--

  while (len2 >= 0) {
    if (len1 < 0) {
      arr1[len--] = arr2[len2--]
    }

    arr1[idx--] = arr1[len1] >= arr2[len2] ? arr1[len1--] : arr2[len2--]
  }

  return arr1
}
```

* 两数之和
``` js

```