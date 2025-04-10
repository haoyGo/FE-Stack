## Vue2 Diff 算法

### patch 流程
1. `vnode` 不存在，则销毁 `oldVnode`
2. `vnode` 存在且 `oldVnode` 不存在，表示组件初次渲染，添加标识且创建根节点
3. `vnode` 和 `oldVnode` 都存在时
   * `oldVnode` 不是真实节点表示更新阶段（都是虚拟节点），执行 `patchVnode`，生成 `vnode`
   * `oldVnode` 是真实元素，表示初始化渲染，执行 `createElm` 基于 `vnode` 创建整棵 `DOM` 树并插入到 `body` 元素下，递归更新父占位符节点元素，完成更新后移除 `oldnode`
4. 最后 `vnode` 插入队列并生成返回 `vnode`

### patch 方法实现
```js
function patch(oldVnode, vnode, hydrating, removeOnly) {
  // 1. vnode不存在，oldVnode存在，销毁oldVnode
  if (isUndef(vnode)) {
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
    return
  }

  let isInitialPatch = false
  const insertedVnodeQueue = []

  // 2. oldVnode不存在，vnode存在，说明是组件初次渲染
  if (isUndef(oldVnode)) {
    isInitialPatch = true
    createElm(vnode, insertedVnodeQueue)
  } else {
    // 3. 判断oldVnode是否为真实DOM节点
    const isRealElement = isDef(oldVnode.nodeType)
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // 3.1 不是真实节点且为相同节点，执行更新
      patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly)
    } else {
      if (isRealElement) {
        // 3.2 是真实节点，表示初始化渲染
        if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
          // 服务端渲染相关
          oldVnode.removeAttribute(SSR_ATTR)
          hydrating = true
        }
        if (hydrating) {
          if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
            invokeInsertHook(vnode, insertedVnodeQueue, true)
            return oldVnode
          }
        }
        // 不是服务端渲染或hydrate失败，创建新的DOM元素
        oldVnode = emptyNodeAt(oldVnode)
      }
      // 获取oldVnode的父节点用于后续替换
      const oldElm = oldVnode.elm
      const parentElm = nodeOps.parentNode(oldElm)

      // 基于vnode创建新的DOM树
      createElm(vnode, insertedVnodeQueue,
        oldElm._leaveCb ? null : parentElm,
        nodeOps.nextSibling(oldElm)
      )

      // 递归更新父占位符节点元素
      if (isDef(vnode.parent)) {
        let ancestor = vnode.parent
        const patchable = isPatchable(vnode)
        while (ancestor) {
          for (let i = 0; i < cbs.destroy.length; ++i) {
            cbs.destroy[i](ancestor)
          }
          ancestor.elm = vnode.elm
          if (patchable) {
            for (let i = 0; i < cbs.create.length; ++i) {
              cbs.create[i](emptyNode, ancestor)
            }
          }
          ancestor = ancestor.parent
        }
      }

      // 移除旧节点
      if (isDef(parentElm)) {
        removeVnodes(parentElm, [oldVnode], 0, 0)
      }
    }
  }

  // 4. 最后执行insert钩子并返回vnode
  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
  return vnode.elm
}
```

### sameVnode 函数实现
```js
function sameVnode(a, b) {
  return (
    // key相同
    a.key === b.key &&
    // 标签名相同
    a.tag === b.tag &&
    // 是否都是注释节点
    a.isComment === b.isComment &&
    // 是否都定义了data
    isDef(a.data) === isDef(b.data) &&
    // input标签特殊处理
    sameInputType(a, b)
  )
}

// input标签的type是否相同
function sameInputType(a, b) {
  if (a.tag !== 'input') return true
  let i
  const typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type
  const typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type
  return typeA === typeB
}
```

### patch 方法参数
`patch(oldVnode, vnode, hydrating, removeOnly)`，`patch` 方法共有四个参数，最后两个参数为 `hydrating` 和 `removeOnly`。它们的作用分别为：
* `hydrating` 判断是否服务器渲染执行。在 `patch` 阶段时，`oldVnode` 是真实元素，初始化渲染时，若 `oldVnode` 是元素节点且有服务器渲染的属性，则设置 `hydrating` 为 `true`，表示服务端渲染。
* `removeOnly` 判断节点是否被 `<transition-group>` 包裹着。在 `updateChildren` 中判断插入执行 `nodeOps.insertBefore()`，如轮播图等案例。

### patchVnode 详解
patchVnode 是 Vue2 diff 算法的核心函数之一，主要负责对比和更新两个 VNode 节点。其执行流程如下：

1. **静态节点判断**：
   - 如果新旧节点完全相同，直接返回
   - 如果是静态节点且 key 相同，复用旧节点的 elm
   - 复制节点属性，更新事件监听器

2. **子节点更新策略**：
   ```js
   // 新节点是文本节点
   if (isTextNode(vnode)) {
     // 当新旧文本不同时才更新，避免不必要的DOM操作
     if (oldVnode.text !== vnode.text) {
       nodeOps.setTextContent(elm, vnode.text)
     }
   } 
   // 新旧节点都有子节点
   else if (oldCh && ch) {
     // 只有当子节点不完全相同时才更新
     if (oldCh !== ch) updateChildren(elm, oldCh, ch)
   }
   // 只有新节点有子节点
   else if (ch) {
     // 如果旧节点是文本节点，先清空文本
     if (oldVnode.text) nodeOps.setTextContent(elm, '')
     // 添加所有新子节点
     addVnodes(elm, null, ch, 0, ch.length - 1)
   }
   // 只有旧节点有子节点
   else if (oldCh) {
     // 移除所有旧子节点
     removeVnodes(elm, oldCh, 0, oldCh.length - 1)
   }
   // 旧节点是文本节点
   else if (oldVnode.text) {
     // 清空文本内容
     nodeOps.setTextContent(elm, '')
   }
   ```

3. **边界情况处理**：
   - 组件占位符节点：需要递归更新组件内部的真实DOM
   - 异步组件：等待组件加载完成后再进行diff
   - 函数式组件：直接对比渲染结果
   - 带有v-show指令：保持DOM元素，只切换display属性
   - 带有v-if指令：可能涉及完整的DOM树创建和销毁

### updateChildren 实现
updateChildren 采用了双端比较的优化算法，通过四个指针在新旧子节点的两端进行对比，尽可能复用已有节点。

1. **双端比较算法**：
   ```js
   while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
     if (sameVnode(oldStartVnode, newStartVnode)) {
       // 头部节点相同
       patchVnode(oldStartVnode, newStartVnode)
       oldStartVnode = oldCh[++oldStartIdx]
       newStartVnode = newCh[++newStartIdx]
     } else if (sameVnode(oldEndVnode, newEndVnode)) {
       // 尾部节点相同
       patchVnode(oldEndVnode, newEndVnode)
       oldEndVnode = oldCh[--oldEndIdx]
       newEndVnode = newCh[--newEndIdx]
     } else if (sameVnode(oldStartVnode, newEndVnode)) {
       // 旧头和新尾相同
       patchVnode(oldStartVnode, newEndVnode)
       nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
       oldStartVnode = oldCh[++oldStartIdx]
       newEndVnode = newCh[--newEndIdx]
     } else if (sameVnode(oldEndVnode, newStartVnode)) {
       // 旧尾和新头相同
       patchVnode(oldEndVnode, newStartVnode)
       nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
       oldEndVnode = oldCh[--oldEndIdx]
       newStartVnode = newCh[++newStartIdx]
     } else {
       // 四个位置都不匹配，通过key查找
       let elmToMove = oldCh[idxInOld]
       if (!oldKeyToIdx) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
       idxInOld = newStartVnode.key ? oldKeyToIdx[newStartVnode.key] : null
       if (!idxInOld) {
         // 找不到可复用的节点，创建新节点
         createElm(newStartVnode, parentElm)
         newStartVnode = newCh[++newStartIdx]
       } else {
         // 找到可复用的节点，移动到对应位置
         elmToMove = oldCh[idxInOld]
         patchVnode(elmToMove, newStartVnode)
         oldCh[idxInOld] = undefined
         nodeOps.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm)
         newStartVnode = newCh[++newStartIdx]
       }
     }
   }
   ```

### 实际场景示例与性能优化

1. **列表更新场景**：
```html
<template>
  <ul>
    <li v-for="item in list" :key="item.id">{{ item.text }}</li>
  </ul>
</template>
```
当列表顺序变化时，通过 key 快速定位节点，仅移动 DOM 位置而不重新创建。

性能优化建议：
- 总是为列表项提供稳定唯一的 key
- 避免使用索引作为 key
- 不要在不同组件上使用相同的 key

2. **动态组件更新**：
```html
<template>
  <component :is="currentComponent" :prop="dynamicProp">
    <template #default="{ data }">
      {{ data }}
    </template>
  </component>
</template>
```
```js
export default {
  data() {
    return {
      currentComponent: 'ComponentA',
      dynamicProp: 'initial'
    }
  },
  methods: {
    switchComponent() {
      // 切换组件时触发完整的组件生命周期
      this.currentComponent = this.currentComponent === 'ComponentA' 
        ? 'ComponentB' 
        : 'ComponentA'
    },
    updateProp() {
      // 只更新属性时复用组件实例
      this.dynamicProp = 'updated'
    }
  }
}
```

性能优化建议：
- 使用 keep-alive 缓存不活跃的组件实例
- 减少不必要的节点层级，使用扁平的节点结构
- 将大型组件拆分为小型组件，提高复用性和维护性