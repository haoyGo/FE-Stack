* 实现最小栈（实现 getMin 方法）
``` js
class MyStack {
  items = []
  min = null

  push(val) {
    this.items.push(val)
    this.min = this.min ? Math.min(this.min, val) : val

    return this.items.length
  }

  pop() {
    const top = this.items.pop()
    this.min = this.items.length ? this.itemsMath.min(...this.items) : null
    return top
  }

  top() {
    if (!this.items.length) return null
    return this.items[this.items.length - 1]
  }

  getMin() {
    return this.min
  }
}
```
---

* 判断字符串括号是否匹配
``` js
// 可以用正则循环判断是否有合法的括号匹配，通过 replace 去除正常匹配的括号，最后没剩下字符就是正确的，代码简单效率不行

// 通过栈来解，时间O(n)，空间O(n)
const isValid = (s) => {
  const map = {
    '{': '}',
    '(': ')',
    '[': ']'
  }
  const stack = []
  let ch
  for (let i = 0; i < s.length ; i++) {
    ch = s[i]
    if (map[ch]) {
        stack.push(ch)
    } else if (ch !== map[stack.pop()]){
        return false
    }
  }
  return stack.length === 0
};
```
---

* 删除字符串相邻重复字符
跟括号匹配思路是一致的
``` js
// 时间O(n)，空间O(n)
const removeDuplicates = (str) => {
  const stack = []
  let c, prev
  for (c of str) {
    prev = stack.pop()
    if (prev !== c) {
        stack.push(prev)
        stack.push(c)
    }
  }
  return stack.join('')
};
```
---

* 删除字符串相邻k个重复字符（上一题变形）
``` js
// 时间O(n)，空间O(n)
const removeDuplicates = (str, k) => {
  const stack = []
  let c, prev
  for (c of str) {
    prev = stack.pop()
    if(!prev || prev[0] !== c) {
      stack.push(prev)
      stack.push(c)
    } else if (prev.length < k - 1) {
      stack.push(prev+c) // 相同字符放一起
    }
  }
  return stack.join('')
};
```

* 删除字符串中出现次数 >= 2 次的相邻字符
``` js
const removeDuplicates = (str) => {
  const stack = []
  let i = 0, len = str.length, c, top
  while (i < len) {
    c = str[i]
    top = stack[stack.length - 1]

    if (top === c) {
      // 字符串中出现了相邻字符
      // 1. 移除栈顶字符
      stack.pop()

      // 2. 移动指针, 指向下一个不同的字符
      while (str[++i] === top) {}
    } else {
      stack.push(c)
      i++
    }
  }
  return stack.join('')
}
```