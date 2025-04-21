
### 1. 二叉树遍历 【难度：中】【频率：高】

**问题描述**：实现二叉树的前序、中序、后序遍历，包括递归和非递归实现。

**解题思路**：
- 前序遍历：根节点 -> 左子树 -> 右子树
- 中序遍历：左子树 -> 根节点 -> 右子树
- 后序遍历：左子树 -> 右子树 -> 根节点
- 使用栈来实现非递归版本

```javascript
// 二叉树节点定义
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

class BinaryTree {
  // 前序遍历（递归）
  preorderTraversal(root) {
    const result = [];
    const preorder = (node) => {
      if (!node) return;
      result.push(node.val);
      preorder(node.left);
      preorder(node.right);
    };
    preorder(root);
    return result;
  }

  // 中序遍历（递归）
  inorderTraversal(root) {
    const result = [];
    const inorder = (node) => {
      if (!node) return;
      inorder(node.left);
      result.push(node.val);
      inorder(node.right);
    };
    inorder(root);
    return result;
  }

  // 后序遍历（递归）
  postorderTraversal(root) {
    const result = [];
    const postorder = (node) => {
      if (!node) return;
      postorder(node.left);
      postorder(node.right);
      result.push(node.val);
    };
    postorder(root);
    return result;
  }

  // 前序遍历（非递归）
  preorderIterative(root) {
    if (!root) return [];
    
    const result = [];
    const stack = [root];
    
    while (stack.length) {
      const node = stack.pop();
      result.push(node.val);
      
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }
    
    return result;
  }

  // 中序遍历（非递归）
  inorderIterative(root) {
    if (!root) return [];
    
    const result = [];
    const stack = [];
    let current = root;
    
    while (current || stack.length) {
      // 先把所有左子节点入栈
      while (current) {
        stack.push(current);
        current = current.left;
      }
      
      // 处理栈顶节点
      current = stack.pop();
      result.push(current.val);
      
      // 转向右子树
      current = current.right;
    }
    
    return result;
  }

  // 后序遍历（非递归）
  postorderIterative(root) {
    if (!root) return [];
    
    const result = [];
    const stack = [root];
    
    while (stack.length) {
      const node = stack.pop();
      result.unshift(node.val); // 在头部插入
      
      if (node.left) stack.push(node.left);
      if (node.right) stack.push(node.right);
    }
    
    return result;
  }
}

// 使用示例
const tree = new TreeNode(1);
tree.left = new TreeNode(2);
tree.right = new TreeNode(3);
tree.left.left = new TreeNode(4);
tree.left.right = new TreeNode(5);

const bt = new BinaryTree();
console.log('前序遍历：', bt.preorderTraversal(tree)); // [1, 2, 4, 5, 3]
console.log('中序遍历：', bt.inorderTraversal(tree)); // [4, 2, 5, 1, 3]
console.log('后序遍历：', bt.postorderTraversal(tree)); // [4, 5, 2, 3, 1]
```


### 2. 二叉树的层序遍历 【难度：中】【频率：高】

**问题描述**：从上到下按层打印二叉树，同一层的节点按从左到右的顺序打印。

**解题思路**：使用队列实现广度优先搜索。

```javascript
function levelOrder(root) {
  if (!root) return [];
  
  const result = [];
  const queue = [root];
  
  while (queue.length) {
    const level = [];
    const size = queue.length;
    
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    result.push(level);
  }
  
  return result;
}
```

### 3. 二叉树的最大深度 【难度：简单】【频率：高】

**问题描述**：计算二叉树的最大深度（根节点到最远叶子节点的最长路径上的节点数）。

**解题思路**：可以使用递归或迭代的方式，这里展示递归解法。

```javascript
function maxDepth(root) {
  if (!root) return 0;
  
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  
  return Math.max(leftDepth, rightDepth) + 1;
}
```

### 4. 路径总和 【难度：简单】【频率：中】

**问题描述**：判断二叉树中是否存在根节点到叶子节点的路径，使得路径上所有节点值相加等于目标和。

**解题思路**：使用递归，每次减去当前节点的值，判断叶子节点时是否剩余为0。

```javascript
function hasPathSum(root, targetSum) {
  if (!root) return false;
  
  // 到达叶子节点
  if (!root.left && !root.right) {
    return targetSum === root.val;
  }
  
  return hasPathSum(root.left, targetSum - root.val) ||
         hasPathSum(root.right, targetSum - root.val);
}
```

### 5. 二叉树的最近公共祖先 【难度：中】【频率：高】

**问题描述**：找到二叉树中两个指定节点的最近公共祖先。

**解题思路**：后序遍历，自底向上查找。

```javascript
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  
  if (!left) return right; // p和q都在右子树
  if (!right) return left; // p和q都在左子树
  
  return root; // p和q分别在左右子树
}
```
