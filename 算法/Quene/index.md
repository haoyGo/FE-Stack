* 翻转句子单词顺序
``` js
const reverseWords = (s) => {
  let left = 0
  let right = s.length - 1
  // 去除前后空格
  while (s.charAt(left) === ' ') left++
  while (s.charAt(right) === ' ') right--

  const queue = []
  let word = ''
  let ch
  while (left <= right) {
    ch = s.charAt(left)
    if (ch === ' ' && word) {
      queue.unshift(word)
      word = ''
    } else if (ch !== ' '){
      word += ch
    }
    left++
  }
  queue.unshift(word)
  return queue.join(' ')
};
```

* 滑动窗口最大值问题
``` js

```