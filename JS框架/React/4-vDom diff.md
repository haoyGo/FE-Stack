# React 虚拟DOM Diff算法详解

## 一、React 15 - Stack Reconciler

### 1. 基本原理
- 采用递归方式对比虚拟DOM树
- 一旦开始无法中断，可能导致主线程阻塞
- 同步更新，不支持优先级调度

### 2. Diff策略
- 只对同层节点进行比较，不跨层级比较
- 不同类型的组件产生不同的树结构
- 通过key属性标记列表中的元素

### 3. 更新流程
1. 从根节点开始，递归对比虚拟DOM
2. 判断节点类型是否相同
   - 不同：直接替换整个子树
   - 相同：更新属性，继续比较子节点
3. 处理列表节点
   - 无key：按序遍历更新
   - 有key：复用已有节点

## 二、React 16 - Fiber Reconciler

### 1. 架构升级
- 引入Fiber架构，将更新过程分片
- 支持任务中断与恢复
- 实现可中断的递归模型

#### 1.1 Fiber节点结构
```js
type Fiber = {
  // 静态数据结构
  tag: WorkTag,           // 标记Fiber类型
  key: null | string,     // 唯一标识
  elementType: any,       // 元素类型
  type: any,             // 具体类型
  stateNode: any,        // DOM节点实例

  // Fiber链表结构
  return: Fiber | null,   // 父Fiber
  child: Fiber | null,    // 第一个子Fiber
  sibling: Fiber | null,  // 下一个兄弟Fiber
  index: number,         // 子节点序号

  // 动态工作单元
  pendingProps: any,    // 新的props
  memoizedProps: any,   // 旧的props
  memoizedState: any,   // 旧的state
  updateQueue: any,     // 更新队列
  
  // 副作用
  flags: Flags,         // 标记更新类型
  subtreeFlags: Flags,  // 子树更新标记
  deletions: Array<Fiber> | null, // 需要删除的子节点
  
  // 调度相关
  lanes: Lanes,         // 优先级
  childLanes: Lanes,    // 子节点优先级
}
```

#### 1.2 工作原理
- 将递归过程拆分成小的工作单元
- 每个工作单元执行完后，检查是否有剩余时间
- 支持根据优先级中断和恢复任务
- 维护工作进度，支持断点恢复

### 2. 双缓存树
- current树：当前页面显示的树
- workInProgress树：正在构建的新树
- 通过alternate属性连接对应节点

#### 2.1 双缓存工作流程
1. 首次渲染
   - 创建fiberRoot和rootFiber
   - 基于current树创建workInProgress树
   - 完成更新后切换fiberRoot.current指针

2. 更新阶段
   - 复用current树对应节点创建workInProgress节点
   - 将变更应用到workInProgress树
   - 完成更新后切换current指针

### 3. Diff改进

#### 3.1 优先级调度
- 采用Lane模型表示优先级
- 支持批处理和优先级插队
- 不同优先级对应不同更新通道：
  ```js
  const SyncLane: Lane = /*                     */ 0b0000000000000000000000000000001;
  const InputContinuousLane: Lane = /*          */ 0b0000000000000000000000000000100;
  const DefaultLane: Lane = /*                  */ 0b0000000000000000000000000010000;
  const IdleLane: Lane = /*                    */ 0b0100000000000000000000000000000;
  ```

#### 3.2 更新阶段
1. render阶段（可中断）
   - beginWork：向下遍历，对比节点差异
   - completeWork：向上回溯，完成节点操作
   - 采用深度优先遍历，可中断和恢复

2. commit阶段（不可中断）
   - before mutation：DOM操作前
   - mutation：执行DOM操作
   - layout：DOM操作后

#### 3.3 Diff算法优化
1. 单节点Diff
   ```js
   function reconcileSingleElement(
     returnFiber: Fiber,
     currentFirstChild: Fiber | null,
     element: ReactElement
   ): Fiber {
     const key = element.key;
     let child = currentFirstChild;
     
     while (child !== null) {
       // 1. 比较key
       if (child.key === key) {
         // 2. 比较type
         if (child.elementType === element.type) {
           // 类型相同则复用节点
           deleteRemainingChildren(returnFiber, child.sibling);
           const existing = useFiber(child, element.props);
           existing.return = returnFiber;
           return existing;
         }
         // key相同但type不同，删除所有旧节点
         deleteRemainingChildren(returnFiber, child);
         break;
       } else {
         deleteChild(returnFiber, child);
       }
       child = child.sibling;
     }
     
     // 创建新节点
     const created = createFiberFromElement(element, returnFiber.mode, lanes);
     created.return = returnFiber;
     return created;
   }
   ```

2. 多节点Diff
   - 第一轮：处理更新节点
   - 第二轮：处理剩余节点
   - 优化：将节点按key映射，减少比较次数

## 三、React 18 - 并发特性

### 1. 并发渲染
#### 1.1 基本原理
- 引入并发模式（Concurrent Mode）
- 支持多个版本的UI同时存在
- 实现可中断的渲染

#### 1.2 时间切片
```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function shouldYield() {
  // 通过调度器判断是否需要让出执行权
  return scheduler.shouldYield();
}
```

#### 1.3 并发更新
- 支持多个版本的UI同时准备
- 可以中断当前更新，优先处理紧急更新
- 支持放弃已经计算的更新

### 2. 自动批处理
#### 2.1 实现原理
```js
function batchedUpdates(fn) {
  const prevIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = true;
  try {
    return fn();
  } finally {
    isBatchingUpdates = prevIsBatchingUpdates;
    if (!isBatchingUpdates) {
      flushSyncCallbacks();
    }
  }
}
```

#### 2.2 优化效果
- 自动合并多个状态更新
- 减少不必要的重渲染
- 支持跨事件批处理
- 通过transition降低更新优先级

### 3. Diff算法优化
#### 3.1 启发式更新
1. 基于历史信息
   ```js
   function cloneChildFibers(current, workInProgress) {
     if (workInProgress.child === null) {
       return;
     }
     
     let currentChild = workInProgress.child;
     let newChild = createWorkInProgress(
       currentChild,
       currentChild.pendingProps
     );
     workInProgress.child = newChild;
     
     // 基于历史信息克隆Fiber树
     while (currentChild.sibling !== null) {
       currentChild = currentChild.sibling;
       newChild.sibling = createWorkInProgress(
         currentChild,
         currentChild.pendingProps
       );
       newChild = newChild.sibling;
     }
   }
   ```

2. 优先级调度
   - 优先处理用户交互区域
   - 支持基于Lane模型的优先级排序
   - 允许高优先级任务打断低优先级任务

#### 3.2 选择性注水（Selective Hydration）
1. 实现原理
   ```js
   function hydrateRoot(container, initialChildren) {
     const root = createHydrateContainer(initialChildren);
     
     // 创建选择性注水的Fiber根节点
     const hydrationCallbacks = {
       onHydrated: (suspenseNode) => {
         // 注水完成回调
       },
       onDeleted: (suspenseNode) => {
         // 节点删除回调
       }
     };
     
     return new ReactDOMRoot(root, hydrationCallbacks);
   }
   ```

2. 优化效果
   - 支持部分内容优先注水
   - 提升首屏交互性能
   - 允许用户交互打断注水
   - 根据视口优先级注水

## 四、版本对比

### 1. 更新机制
| 特性 | React 15 | React 16 | React 18 |
|------|----------|-----------|----------|
| 更新模型 | 同步递归 | Fiber | 并发渲染 |
| 任务中断 | 不支持 | 支持 | 支持 |
| 优先级控制 | 无 | 基础支持 | 完整支持 |
| 批处理 | 部分支持 | 事件内支持 | 全局支持 |

### 2. 性能表现
| 方面 | React 15 | React 16 | React 18 |
|------|----------|-----------|----------|
| 大型应用 | 可能卡顿 | 流畅 | 更流畅 |
| 动画处理 | 易丢帧 | 较好 | 优秀 |
| 首屏加载 | 一般 | 较快 | 快速 |
| CPU使用 | 集中 | 分散 | 智能调度 |

## 五、最佳实践

### 1. key的使用
- 使用稳定的业务id作为key
- 避免使用数组索引作为key
- 不同列表使用不同key前缀

### 2. 性能优化
- 合理使用React.memo避免不必要渲染
- 使用useMemo缓存计算结果
- 采用useCallback缓存事件处理函数

### 3. 组件设计
- 保持组件纯粹性
- 合理拆分组件层级
- 避免过深的组件嵌套