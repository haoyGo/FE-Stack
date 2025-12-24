# React Fiber 架构详解

---

## 1. 虚拟 DOM 与 Fiber 的关系

- 虚拟 DOM：用 JS 对象描述 UI 结构，只负责“长什么样”，不包含调度和状态。
- Fiber：React 16+ 的核心数据结构，是“可中断、可恢复的链表树”，每个 Fiber 节点对应一个虚拟 DOM 节点，但包含调度、优先级、状态等运行时信息。
- 渲染流程：JSX → 虚拟 DOM → Fiber 树（diff/调度/更新/提交）→ 真实 DOM。

| 虚拟 DOM     | Fiber（工作单元）       |
| ------------ | ----------------------- |
| 纯数据结构   | 包含数据+调度+状态      |
| 只描述 UI    | 负责调度/更新/优先级    |
| 不可中断     | 可中断/恢复/并发        |
| 没有链表指针 | 有 child/return/sibling |
| 不保存状态   | 保存状态、更新队列      |

---

## 2. 设计动机

- 传统递归渲染无法中断，阻塞主线程，难以实现优先级和并发。
- Fiber 架构支持任务切片、优先级调度、可中断/恢复渲染。

---

## 3. Fiber 节点结构与源码解读

```js
const fiber = {
  tag, key, elementType, type, stateNode, // 静态信息
  return, child, sibling, index,          // 树结构关系
  pendingProps, memoizedProps, memoizedState, updateQueue, // 动态状态
  flags, subtreeFlags, deletions,         // 副作用相关
  lanes, childLanes,                      // 调度优先级
  alternate                               // 双缓存机制
}
```

- 首次渲染递归创建 Fiber 节点，更新时复用 current 树节点，构建 workInProgress 树。
- alternate 属性实现双缓存，保证 UI 无闪烁更新。

---

## 3.1 Fiber 构建与渲染详细流程

### 首次渲染

- React 根据虚拟 DOM 递归创建 Fiber 节点，形成 Fiber 树。
- 每个 Fiber 节点保存 type、props、key、child、sibling、return 等信息。
- 构建完成后进入 commit 阶段，将 Fiber 树映射为真实 DOM。

### 更新流程

- setState/props 触发更新时，React 复用 current 树节点，构建 workInProgress 树。
- alternate 属性实现双缓存，保证 UI 无闪烁更新。
- 只对变更的节点和子树进行 diff 和重建，未变更部分直接复用。

### beginWork 阶段

- 自顶向下遍历 Fiber 树，处理当前节点：
  - 判断类型（函数组件/类组件/原生 DOM）
  - 计算新 props/state，生成子 Fiber 节点
  - 返回第一个子节点，继续递归

### completeWork 阶段

- 自底向上归并 Fiber 节点：
  - 创建/复用真实 DOM 节点
  - 处理 props、事件、样式等
  - 收集副作用（flags/subtreeFlags），向父节点冒泡
  - 返回兄弟节点或父节点，继续归并

### commit 阶段

- 将收集到的副作用链表按顺序提交到 DOM：
  - 插入/移动/删除节点（Placement/Update/Deletion）
  - 执行生命周期和 Hook（LayoutEffect/PassiveEffect）
  - 切换 FiberRoot.current 指针，完成 UI 更新

### 关键源码片段

```js
function performUnitOfWork(fiber) {
  const next = beginWork(fiber);
  fiber.memoizedProps = fiber.pendingProps;
  if (next === null) {
    completeUnitOfWork(fiber);
  } else {
    return next;
  }
}

function completeUnitOfWork(fiber) {
  let node = fiber;
  do {
    completeWork(node);
    if (node.sibling) {
      return node.sibling;
    }
    node = node.return;
  } while (node);
}
```

---

## 4. 双缓存机制

- current 树：已渲染到页面的 Fiber 树
- workInProgress 树：内存中构建的新 Fiber 树
- alternate 属性：两棵树节点互相引用
- 优势：所有 DOM 操作在内存中完成，最后一次性提交，避免闪烁和重排；更新中断时可直接丢弃 workInProgress 树，保证 current 树稳定。

---

## 5. 工作循环与可中断渲染

- React 利用 requestIdleCallback 或自定义 Scheduler 实现时间切片。
- 每次执行一个工作单元（performUnitOfWork），分为 beginWork（自顶向下遍历，处理当前节点，生成子节点）和 completeWork（自底向上归并，处理 DOM 创建/更新，收集副作用）。
- render 阶段可中断，commit 阶段不可中断。

```js
function workLoop(deadline) {
  while (workInProgress && deadline.timeRemaining() > 0) {
    workInProgress = performUnitOfWork(workInProgress);
  }
  if (workInProgress) {
    requestIdleCallback(workLoop);
  } else {
    commitRoot();
  }
}
```

---

## 6. 副作用收集与提交

- 副作用在 completeWork 阶段收集，通过 flags/subtreeFlags 冒泡到父节点。
- commit 阶段分三步：before mutation、mutation、layout，按顺序处理副作用，保证生命周期和 Hook 的正确执行。

```js
function bubbleProperties(fiber) {
  let subtreeFlags = 0;
  let child = fiber.child;
  while (child) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  fiber.subtreeFlags = subtreeFlags;
}
```

### 副作用收集和提交的底层流程

#### 1. 副作用标记来源

- 每个 Fiber 节点在渲染时会根据变更类型打上 flags（Placement/Update/Deletion/LayoutEffect/PassiveEffect 等）。
- 这些 flags 标记了本节点需要在 commit 阶段执行的副作用。

#### 2. completeWork 阶段收集副作用

- 在 completeWork 阶段，Fiber 节点会将自身和子节点的副作用标记（flags/subtreeFlags）向父节点冒泡。
- 形成一条副作用链表，便于后续统一处理。

```js
function bubbleProperties(fiber) {
  let subtreeFlags = 0;
  let child = fiber.child;
  while (child) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  fiber.subtreeFlags = subtreeFlags;
}
```

#### 3. commit 阶段三步处理

- commit 阶段分为：
  1. before mutation（DOM 变更前，处理生命周期如 getSnapshotBeforeUpdate）
  2. mutation（执行 DOM 插入/更新/删除等操作）
  3. layout（DOM 变更后，执行 layout effect、ref、componentDidMount/Update 等）

#### 4. 副作用链表遍历与执行

- commit 阶段会遍历副作用链表，按顺序执行所有副作用。
- 先处理 Placement/Update/Deletion，再处理 Effect/Ref。

```js
function commitRoot(root) {
  commitBeforeMutationEffects(root);
  commitMutationEffects(root);
  commitLayoutEffects(root);
  root.current = root.finishedWork;
}

function commitMutationEffects(fiber) {
  let effect = fiber.firstEffect;
  while (effect) {
    if (effect.flags & Placement) commitPlacement(effect);
    if (effect.flags & Update) commitUpdate(effect);
    if (effect.flags & Deletion) commitDeletion(effect);
    effect = effect.nextEffect;
  }
}
```

#### 5. 时序说明

- 副作用收集在 completeWork 阶段完成，所有变更暂存于内存。
- commit 阶段统一批量执行副作用，保证 DOM 操作原子性和生命周期顺序。
- 这样可以避免多次重排和闪烁，提升性能。

---

## 7. 并发特性与优先级调度

- 时间切片：把长任务拆分成小片，调度器控制执行节奏，保证响应性。
- 并发模式：支持多个版本同时构建，更新可中断和恢复，高优先级任务可插队。
- 自动批处理：合并同一优先级的多次更新，减少重渲染，提高性能。
- 优先级调度：React 用 lanes 二进制位表示优先级，事件类型决定优先级，高优先级任务可打断低优先级任务，低优先级任务饥饿时会提升优先级。

```js
const SyncLane = 0b1; // 最高优先级
const DefaultLane = 0b10000; // 默认优先级
const IdleLane = 0b1000000000000000000000000000000; // 最低优先级
```

---

## 8. 深度面试问答

### 1. Fiber 架构相比传统递归渲染的最大优势是什么？

- 支持任务切片和可中断渲染，避免长任务阻塞主线程。
- 优先级调度，能让高优先级任务（如用户输入）插队，提升响应性。
- 并发模式下可随时中断和恢复，保证 UI 流畅。

### 2. 双缓存机制的底层原理和实际场景？

- Fiber 节点通过 alternate 属性实现 current/workInProgress 双树。
- 所有 DOM 操作在内存中完成，最后一次性提交，避免闪烁和多次重排。
- 更新中断时可直接丢弃 workInProgress 树，保证 current 树稳定。
- 场景：大规模 UI 更新、动画、并发渲染。

### 3. 副作用收集与提交的源码流程如何优化性能？

- completeWork 阶段收集所有副作用，形成链表，避免多次遍历。
- commit 阶段批量执行副作用，保证 DOM 操作原子性和生命周期顺序。
- 只处理变更节点，未变更部分直接复用，减少不必要的渲染。

### 4. 并发调度与优先级机制的底层实现？

- React 用 lanes（31 位二进制）表示优先级，事件类型决定优先级。
- Scheduler 负责分发任务，高优先级任务可打断低优先级任务。
- 低优先级任务饥饿时会自动提升优先级，保证所有任务最终被处理。

### 5. Fiber 与虚拟 DOM 的本质区别？

- 虚拟 DOM 只描述 UI 结构，Fiber 是运行时调度和状态的载体。
- Fiber 节点包含链表指针、状态、优先级、调度等信息，支持并发和中断。
- 虚拟 DOM 不可中断，Fiber 可中断/恢复/插队。

### 6. React 并发模式下 Fiber 如何保证一致性？

- 双缓存机制保证 current 树始终稳定，workInProgress 树可随时丢弃。
- 并发渲染时，只有 commit 阶段才会切换 current 指针，保证 UI 一致。
- 多版本 Fiber 树并行构建，最终只提交最新版本。

---
