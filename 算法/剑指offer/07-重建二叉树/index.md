**[重建二叉树](https://leetcode-cn.com/problems/zhong-jian-er-cha-shu-lcof/)**

输入某二叉树的前序遍历和中序遍历的结果，请构建该二叉树并返回其根节点。
假设输入的前序遍历和中序遍历的结果中都不含重复的数字。

```
Input: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
Output: [3,9,20,null,null,15,7]
```

**解法**
``` js
function TreeNode(val) {
  this.val = val;
  this.left = this.right = null;
}

var buildTree = function(preorder, inorder) {
  if (!preorder || !preorder.length) return null

  const inorderMap = Object.create(null)
  inorder.forEach((v, idx) => inorderMap[v] = idx)

  /**
   * @param rootIndex  先序遍历的索引
   * @param leftIndex  中序遍历的索引
   * @param rightIndex 中序遍历的索引
   */
  const recur = (rootIndex, leftIndex, rightIndex) => {
    if (leftIndex > rightIndex) return null

    const rootVal = preorder[rootIndex]
    const root = new TreeNode(rootVal)
    const idx = inorderMap[rootVal]
    root.left = recur(rootIndex + 1, leftIndex, idx - 1)
    root.right = recur(rootIndex + idx - leftIndex + 1, idx + 1, rightIndex)

    return root
  }

  return recur(0, 0, preorder.length -1)
}
```