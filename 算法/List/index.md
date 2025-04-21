# 链表算法题集合

## 链表基础操作 【难度：中】【频率：高】

### 代码实现
```javascript
class ListNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

class LinkedList {
  // 反转链表 - 迭代法 时间O(n)，空间O(1)
  reverseList(head) {
    if(!head || !head.next) return head;
    let prev = null, curr = head;
    
    while (curr) {
      const next = curr.next;  // 临时存储后继节点
      curr.next = prev;        // 反转指针
      prev = curr;             // 移动prev
      curr = next;             // 移动curr
    }
    
    return prev;
  }

  // 检测环 - 快慢指针法 时间O(n)，空间O(1)
  hasCycle(head) {
    if (!head || !head.next) return false;
    
    let slow = head;
    let fast = head;
    
    while (fast && fast.next) {
      slow = slow.next;
      fast = fast.next.next;
      if (slow === fast) return true;
    }
    
    return false;
  }

  // 找出环的入口
  detectCycle(head) {
    if (!head || !head.next) return null;
    
    let slow = head;
    let fast = head;
    let hasCycle = false;
    
    // 第一步：找到相遇点
    while (fast && fast.next) {
      slow = slow.next;
      fast = fast.next.next;
      if (slow === fast) {
        hasCycle = true;
        break;
      }
    }
    
    if (!hasCycle) return null;
    
    // 第二步：从头节点和相遇点同时出发，相遇点即为环入口
    slow = head;
    while (slow !== fast) {
      slow = slow.next;
      fast = fast.next;
    }
    
    return slow;
  }

  // 找出中间节点 - 快慢指针法
  findMiddle(head) {
    if (!head || !head.next) return head;
    
    let slow = head;
    let fast = head;
    
    while (fast && fast.next) {
      slow = slow.next;
      fast = fast.next.next;
    }
    
    return slow;
  }

  // 删除倒数第N个节点 - 快慢指针法
  removeNthFromEnd(head, n) {
    let fast = head, slow = head;
    
    // 快指针先走n步
    while(--n) {
      fast = fast.next;
    }
    if(!fast.next) return head.next;
    
    fast = fast.next;
    // fast、slow 一起前进
    while(fast && fast.next) {
      fast = fast.next;
      slow = slow.next;
    }
    slow.next = slow.next.next;
    return head;
  }

  // 合并两个有序链表 - 递归法
  mergeTwoLists(l1, l2) {
    if(l1 === null) return l2;
    if(l2 === null) return l1;
    
    if(l1.val <= l2.val) {
      l1.next = this.mergeTwoLists(l1.next, l2);
      return l1;
    } else {
      l2.next = this.mergeTwoLists(l2.next, l1);
      return l2;
    }
  }

  // 找出两个相交链表的交点 - 双指针法
  getIntersectionNode(headA, headB) {
    let pA = headA, pB = headB;
    
    while(pA || pB) {
      if(pA === pB) return pA;
      pA = pA === null ? headB : pA.next;
      pB = pB === null ? headA : pB.next;
    }
    
    return null;
  }
}
```
