**[删除链表节点](https://leetcode-cn.com/problems/shan-chu-lian-biao-de-jie-dian-lcof/)**

给定单向链表的头指针和一个要删除的节点的值，定义一个函数删除该节点。
返回删除后的链表的头节点。

```
输入: head = [4,5,1,9], val = 5
输出: [4,1,9]
解释: 给定你链表中值为 5 的第二个节点，那么在调用了你的函数之后，该链表应变为 4 -> 1 -> 9.

输入: head = [4,5,1,9], val = 1
输出: [4,5,9]
解释: 给定你链表中值为 1 的第三个节点，那么在调用了你的函数之后，该链表应变为 4 -> 5 -> 9.

题目保证链表中节点的值互不相同
```

**解法**
``` js
var deleteNode = function(head, val) {
  let tmp = head, prev, next
  while (tmp) {
    if (tmp.val === val) {
      if (tmp === head) {
        return head.next
      }
      prev.next = tmp.next
    }
    prev = tmp
    tmp = tmp.next
  }

  return head
}
```