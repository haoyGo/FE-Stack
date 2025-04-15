* 字符串全排序
``` js
// 时间O(n!n)，空间O(n^2)
var swap = (arr, left, right) => {
  let tmp = arr[left]
  arr[left] = arr[right]
  arr[right] = tmp
}

var allPermutation = (arr, from, to) => {
  if (from === to) console.log(arr.join('')) // 时间O(n)

  const set = new Set() // 空间O(n-1)

  for (let i = from; i <= to; i++) { // 时间O(n)
    if (set.has(arr[i])) continue
    set.add(arr[i])

    swap(arr, from, i)
    allPermutation(arr, from + 1, to) // 时间O(n-1)，空间O(n)
    swap(arr, from, i)
  }
}

var main = (str) => {
  const arr = str.split('')
  const len = arr.length
  return allPermutation(arr, 0, len - 1)
}

console.log(main('abcd'))

// 2
var permutation = function(s) {
    const res = [], len = s.length, arr = s.split('')

    const swap = (i, j) => [arr[i], arr[j]] = [arr[j], arr[i]]

    const backtrack = (from) => {
        if (from === len - 1) {
            res.push(arr.join(''))
            return
        }

        const set = new Set()
        for (let i = from; i < len; i++) {
            if (set.has(arr[i])) continue

            set.add(arr[i])
            swap(i, from)
            backtrack(from + 1)
            swap(i, from)
        }
    }

    backtrack(0)

    return res
};
```

