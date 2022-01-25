**[反向打印链表](https://leetcode-cn.com/problems/cong-wei-dao-tou-da-yin-lian-biao-lcof/)**

输入一个链表的头节点，从尾到头反过来返回每个节点的值（用数组返回）。

```
输入：head = [1,3,2]
输出：[2,3,1]
```

**解法**
``` js
// 递归法
var reversePrint = function(head) {
  const res = []
  const recur = (tmp, res) => {
      if (!tmp) return
      recur(tmp.next, res)
      res.push(tmp.val)
  }
  
  recur(head, res)

  return res
}
```