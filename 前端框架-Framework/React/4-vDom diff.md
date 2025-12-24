# React Diff 算法原理与源码深度解析

---

## 一、设计动机与核心目标

- 解决虚拟 DOM 树高效对比与最小化 DOM 操作问题。
- 保证 UI 一致性、性能最优、支持高频交互和大规模列表。
- 支持可中断、优先级调度、并发渲染。

---

## 二、架构演进与对比（版本区别详解）

| 版本     | Diff 模型  | 设计特点               | 性能表现 | 并发/优先级 | 适用场景        |
| -------- | ---------- | ---------------------- | -------- | ----------- | --------------- |
| React 15 | Stack 递归 | 同步递归，无法中断     | 一般     | 无          | 小型应用        |
| React 16 | Fiber 分片 | 可中断/恢复，双缓存    | 流畅     | 基础支持    | 中大型应用      |
| React 18 | 并发 Fiber | 多版本并行，自动批处理 | 优秀     | 完整支持    | 高并发/复杂交互 |

- React 15：递归遍历虚拟 DOM 树，遇到变更直接替换整棵子树，无法中断，性能瓶颈明显。
- React 16：Fiber 架构，更新过程分片，可中断/恢复，支持优先级调度和双缓存，性能大幅提升。
- React 18：并发模式，支持多版本 Fiber 树并行构建，自动批处理，智能调度，极大提升交互流畅度和首屏性能。

---

## 三、React Diff 算法原理细化

### 1. 同层对比原则

- 只对同一层级的节点进行比较，不跨层级递归。
- 节点类型不同直接替换整棵子树。

### 2. key/type 策略

- 列表节点通过 key 唯一标识，优先复用 key/type 都相同的节点。
- key 相同 type 不同，删除旧节点，插入新节点。
- 无 key 时按顺序遍历，易导致性能问题。

### 3. 列表优化与 Map 加速

- 构建 key 到旧节点的 Map，遍历新节点时快速查找复用。
- 未匹配节点删除，剩余新节点插入。
- 支持节点移动和插入优化，减少 DOM 操作。

### 4. 深度优先遍历与分片执行

- beginWork/completeWork 分片遍历 Fiber 树，支持任务切片和断点恢复。
- render 阶段可中断，commit 阶段不可中断，保证 DOM 操作原子性。

### 5. 双缓存与优先级调度

- current/workInProgress 双树，alternate 属性连接。
- Lane 模型表示优先级，Scheduler 调度高优先级任务插队。
- 所有 DOM 操作在内存中完成，最后一次性提交，避免闪烁和重排。

### 6. 并发切片与自动批处理

- workLoopConcurrent/shouldYield 实现时间切片，主线程流畅。
- 多次 setState 自动批处理，减少渲染次数。
- transition 降低优先级，提升交互体验。

---

## 四、源码伪代码与流程图

### Diff 主流程伪代码

```js
function reconcileChildren(currentFiber, newChildren) {
  // 1. 单节点/多节点分流
  if (isSingleElement(newChildren)) {
    return reconcileSingleElement(
      currentFiber,
      currentFiber.child,
      newChildren
    );
  } else if (isArray(newChildren)) {
    return reconcileChildrenArray(
      currentFiber,
      currentFiber.child,
      newChildren
    );
  }
}
```

### 列表 Diff 伪代码

```js
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
  // 1. 构建key到旧节点的映射
  const existingChildren = new Map();
  let oldFiber = currentFirstChild;
  while (oldFiber !== null) {
    if (oldFiber.key !== null) {
      existingChildren.set(oldFiber.key, oldFiber);
    }
    oldFiber = oldFiber.sibling;
  }
  // 2. 遍历新节点，复用/新建
  let prevNewFiber = null;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const key = newChild.key;
    let matchedFiber = existingChildren.get(key);
    if (matchedFiber && matchedFiber.elementType === newChild.type) {
      // 复用
      const newFiber = useFiber(matchedFiber, newChild.props);
      newFiber.return = returnFiber;
      if (prevNewFiber) prevNewFiber.sibling = newFiber;
      prevNewFiber = newFiber;
      existingChildren.delete(key);
    } else {
      // 新建
      const newFiber = createFiberFromElement(
        newChild,
        returnFiber.mode,
        lanes
      );
      newFiber.return = returnFiber;
      if (prevNewFiber) prevNewFiber.sibling = newFiber;
      prevNewFiber = newFiber;
    }
  }
  // 3. 删除剩余旧节点
  existingChildren.forEach((child) => deleteChild(returnFiber, child));
}
```

---

## 五、性能优化策略与最佳实践

- key 必须稳定唯一，避免数组索引。
- React.memo、useMemo、useCallback 减少不必要渲染。
- 组件拆分，合理分层，避免过深嵌套。
- 列表节点按业务 id 分组，提升 diff 效率。

---

## 六、深度面试问答

### 1. React Diff 算法复杂度是多少？极端场景如何优化？

- 理论复杂度 O(n)，通过 key 映射和同层比较避免 O(n^3)。
- 极端场景如大规模列表/频繁移动，建议分片渲染、虚拟列表。

### 2. Fiber Diff 如何支持优先级和并发？

- Lane 模型和 Scheduler 调度，支持高优先级插队和任务切片。
- 并发模式下多版本 Fiber 树并行，保证 UI 一致性。

### 3. Diff 源码中如何处理节点复用与删除？

- 先按 key/type 复用，未匹配节点删除，剩余新节点插入。
- 采用 Map 加速查找，减少遍历。

### 4. 双缓存机制对 Diff 性能的提升？

- 所有变更在 workInProgress 树内存中完成，最后一次性提交。
- 避免多次 DOM 操作和页面闪烁。

### 5. Diff 算法在并发和自动批处理下的表现？

- 多次 setState 自动批处理，减少渲染次数。
- 并发渲染时可随时中断和恢复，保证主线程流畅。

---

## 七、React Diff 与 Vue Diff 的区别

| 维度     | React Diff                         | Vue Diff                               |
| -------- | ---------------------------------- | -------------------------------------- |
| 对比策略 | 同层对比，key/type 优先，深度优先  | 同层对比，双端指针，最长递增子序列     |
| 列表处理 | key 映射+Map 加速，复用/插入/删除  | 双端比较+LIS 优化，移动/复用/插入/删除 |
| 节点复用 | key/type 复用，未匹配直接删除      | key 复用，LIS 优化移动，减少 DOM 操作  |
| 性能优化 | Fiber 分片、双缓存、优先级调度     | Patch 算法、LIS、静态提升              |
| 并发支持 | 完整支持（Fiber/Concurrent）       | Vue3 支持异步渲染/调度                 |
| 设计理念 | 以调度和可中断为核心，适配复杂场景 | 以最小 DOM 操作为核心，适配响应式场景  |
| 场景适配 | 大型应用、复杂交互、并发渲染       | 响应式 UI、动画、轻量级应用            |

- React Diff 更关注调度、优先级和可中断，适合高并发和复杂交互场景。
- Vue Diff 更关注最小 DOM 操作和响应式性能，列表 Diff 采用双端指针+LIS 优化，移动节点更高效。
- React 采用 Fiber 链表结构，支持多版本并行和任务切片；Vue 采用 Patch 递归和静态提升，适合响应式数据流。

---

> 本文系统梳理了 React Diff 算法的底层原理、源码流程、性能优化和深度面试答疑，适合面试和深入学习。
