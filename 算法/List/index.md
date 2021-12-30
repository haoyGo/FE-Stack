* 合并两个有序链表
``` js
function mergeTwoLists(l1, l2) {
  if(l1 === null) {
    return l2
  }
  if(l2 === null) {
    return l1
  }
  if(l1.val <= l2.val) {
    l1.next = mergeTwoLists(l1.next, l2)
    return l1
  } else {
    l2.next = mergeTwoLists(l2.next, l1)
    return l2
  }
}
```
---

* 判断单链表是否有环
``` js
// 标记法，时间O(n)，空间O(n)
const hasCycle = function (head) {
  while(head) {
    if (head.flag) return true
    head.flag = true
    head = head.next
  }
  return false
};

// JSON.stringify，
const hasCycle = function (head) {
  try{
    JSON.stringify(head);
    return false;
  } catch (err){
    return true;
  }
};

// 快慢指针，时间O(n)，空间O(1)
const hasCycle = function(head) {
  if(!head || !head.next) {
    return false
  }
  let fast = head.next.next, slow = head.next
  while(fast !== slow) {
    if(!fast || !fast.next) return false
    fast = fast.next.next
    slow = slow.next
  }
  return true
};
```
---

* 反转链表
``` js
// 时间O(n)，空间O(1)
const reverseList = function(head) {
  if(!head || !head.next) return head
  var prev = null, curr = head
  while(curr) {
    // 用于临时存储 curr 后继节点
    var next = curr.next
    // 反转 curr 的后继指针
    curr.next = prev
    // 变更prev、curr 
    // 待反转节点指向下一个节点 
    prev = curr
    curr = next
  }
  head = prev
  return head
};

// 尾递归，时间O(n)，空间O(n)
const reverseList = function(head) {
  if(!head || !head.next) return head
  head = reverse(null, head)
  return head
};
const reverse = function(prev, curr) {
  if(!curr) return prev
  var next = curr.next
  curr.next = prev
  return reverse(curr, next)
};

// 递归，时间O(n)，空间O(n)
const reverseList = function(head) {
  if(!head || !head.next) return head
  var next = head.next
  // 递归反转
  var reverseHead = reverseList(next)
  // 变更指针
  next.next = head
  head.next = null
  return reverseHead
};
```
---

* 获取中间节点
``` js
// 快慢指针，时间O(n)，空间O(1)
const middleNode = function(head) {
  let fast = head, slow = head
  while(fast && fast.next) {
    slow = slow.next
    fast = fast.next.next
  }
  return slow
};
```
---

* 删除倒数第n个节点
``` js
const removeNthFromEnd = function(head, n) {
  let fast = head, slow = head
  // 快先走 n 步
  while(--n) {
      fast = fast.next
  }
  if(!fast.next) return head.next
  fast = fast.next
  // fast、slow 一起前进
  while(fast && fast.next) {
      fast = fast.next
      slow = slow.next
  }
  slow.next = slow.next.next
  return head
};
```

* 两个相交链表节点
``` js
// 双指针，
const getIntersectionNode = function(headA, headB) {
  // 清除高度差
  let pA = headA, pB = headB
  while(pA || pB) {
    if(pA === pB) return pA
    pA = pA === null ? headB : pA.next
    pB = pB === null ? headA : pB.next
  }
  return null
};
```

* 链表求和
``` js
const addTwoNumbers = function(l1, l2) {
  let carry = 0
  let root = new ListNode(0)
  let p = root
  while (l1 || l2) {
    let sum = 0
    if (l1) {
      sum += l1.val
      l1 = l1.next
    }
    if (l2) {
      sum += l2.val
      l2 = l2.next
    }
    sum += carry
    carry = Math.floor(sum / 10)
    p.next = new ListNode(sum % 10)
    p = p.next
  }
  if (carry === 1) {
    p.next = new ListNode(carry)
    p = p.next
  }
  return root.next
};
```