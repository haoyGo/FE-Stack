# React Hook 实现原理详解

## 核心概念

### Hook 链表结构
React 使用链表结构来管理 Hook，每个函数组件对应的 Fiber 节点都有一个 `memoizedState` 属性，指向该组件的 Hook 链表。

**链表结构详解**：
1. 每个Hook都是一个链表节点，通过`next`指针连接
2. 链表顺序严格对应Hook的调用顺序
3. React通过这个链表来追踪Hook的状态和更新

```js
// Hook 类型定义
type Hook = {
  memoizedState: any, // 当前状态
  baseState: any,    // 初始状态
  baseQueue: Update<any, any> | null, // 更新队列
  queue: UpdateQueue<any, any> | null, // 更新队列
  next: Hook | null  // 下一个 Hook
}
```

**链表操作示例**：
```js
// 组件中的Hook调用
function Example() {
  const [count, setCount] = useState(0); // Hook节点1
  const [name, setName] = useState('');  // Hook节点2
  useEffect(() => {});                  // Hook节点3
  
  // 对应的Hook链表：
  // Hook1 -> Hook2 -> Hook3 -> null
}
```

## useState 实现原理

### 初始化阶段
1. 首次渲染时，React 会创建 Hook 对象并初始化状态
2. 返回状态值和更新函数

```js
function mountState<S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] {
  // 1. 创建新的Hook对象并添加到链表末尾
  const hook = mountWorkInProgressHook();
  
  // 2. 处理函数式初始状态
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  
  // 3. 初始化Hook的状态值
  hook.memoizedState = hook.baseState = initialState;
  
  // 4. 创建更新队列
  const queue = {
    pending: null,       // 未处理的更新
    dispatch: null,      // 更新函数
    lastRenderedReducer: basicStateReducer, // 上一次使用的reducer
    lastRenderedState: (initialState: any) // 上一次渲染后的状态
  };
  hook.queue = queue;
  
  // 5. 创建并绑定dispatch函数
  const dispatch = (queue.dispatch = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue
  ): any));
  b
  // 6. 返回当前状态和更新函数
  return [hook.memoizedState, dispatch];
}
```

### 更新阶段
1. 获取当前 Hook
2. 应用更新队列中的更新
3. 返回新状态和更新函数

```js
function updateState<S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] {
  // 1. 获取当前Hook
  const hook = updateWorkInProgressHook();
  
  // 2. 获取更新队列b
  const queue = hook.queue;
  
  // 3. 获取当前reducer
  queue.lastRenderedReducer = basicStateReducer;
  
  // 4. 处理所有待处理的更新
  if (queue.pending !== null) {
    const first = queue.pending.next;
    let newState = hook.memoizedState;
    let update = first;
    
    do {
      // 5. 应用每个更新
      const action = update.action;
      newState = basicStateReducer(newState, action);
      update = update.next;
    } while (update !== first);
    
    // 6. 更新状态
    hook.memoizedState = newState;
    queue.lastRenderedState = newState;
    queue.pending = null;
  }
  
  // 7. 返回新状态和dispatch函数
  return [hook.memoizedState, queue.dispatch];
}
```

## useEffect 实现原理

### 初始化阶段
1. 创建 Effect 对象
2. 将 Effect 添加到 Fiber 的 updateQueue

```js
function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  // 1. 创建Effect对象
  const hook = mountWorkInProgressHook();
  
  // 2. 处理依赖项
  const nextDeps = deps === undefined ? null : deps;
  
  // 3. 标记当前Hook为有副作用
  hook.memoizedState = pushEffect(
    HookHasEffect | HookPassive, // 副作用标记
    create,                     // 创建函数
    undefined,                  // 销毁函数(首次渲染时为空)
    nextDeps                    // 依赖项
  );
}
```

### 更新阶段
1. 比较依赖项
2. 决定是否需要重新执行 effect

```js
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  // 1. 获取当前Hook
  const hook = updateWorkInProgressHook();
  
  // 2. 处理依赖项
  const nextDeps = deps === undefined ? null : deps;
  
  // 3. 获取上一次的Effect
  const prevEffect = hook.memoizedState;
  
  // 4. 比较依赖项是否变化
  if (nextDeps !== null) {
    const prevDeps = prevEffect.deps;
    
    // 5. 如果依赖项未变化，则复用上一次的Effect
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      pushEffect(HookPassive, create, undefined, nextDeps);
      return;
    }
  }
  
  // 6. 依赖项变化，标记需要重新执行Effect
  hook.memoizedState = pushEffect(
    HookHasEffect | HookPassive,
    create,
    undefined,
    nextDeps
  );
}
```

## 调度流程

1. **渲染阶段**：
   - 构建 Hook 链表
   - 收集 effect
   - 确定哪些effect需要执行(通过依赖比较)
   
2. **提交阶段**：
   - 执行本次渲染的effect创建函数
   - 保存返回的清理函数
   - 对于layout effect，同步执行
   
3. **清理阶段**：
   - 执行上次effect的清理函数
   - 只在依赖项变化或组件卸载时执行
   
**流程图示例**：
```
[组件渲染] → [构建Hook链表] → [收集effect]
    ↓
[React提交更新] → [执行effect创建函数] → [保存清理函数]
    ↓
[组件更新/卸载] → [执行上次清理函数]
```

## 依赖收集机制

React 使用 Object.is 比较依赖项数组中的每个值，如果发现变化则重新执行 effect。

**依赖比较原理**：
1. 首次渲染时，保存初始依赖项
2. 后续渲染时，逐个比较新旧依赖项
3. 使用Object.is进行严格相等比较
4. 依赖项变化会触发effect重新执行

```js
function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null
) {
  if (prevDeps === null) {
    return false;
  }

  // 依赖项数量变化直接返回false
  if (nextDeps.length !== prevDeps.length) {
    return false;
  }

  // 逐个比较依赖项
  for (let i = 0; i < prevDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
```

**最佳实践**：
1. 包含所有effect中用到的值
2. 对于对象/数组，考虑使用useMemo/useCallback
3. 空数组[]表示effect只运行一次

## 闭包陷阱

由于 Hook 依赖闭包来保存状态，在异步操作中可能会遇到闭包陷阱。解决方案是使用 ref 或函数式更新。

```js
// 闭包陷阱示例
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // 这里 count 始终是初始值
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 依赖项为空

  // 正确写法
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1); // 使用函数式更新
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}
```

## 并发模式下的处理

React 18 引入了并发特性，Hook 的实现也做了相应调整：
1. 优先级调度
2. 过渡更新
3. 自动批处理

```js
// 使用 startTransition 标记非紧急更新
function App() {
  const [resource, setResource] = useState(initialResource);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      setResource(fetchNextResource());
    });
  }

  return (
    <>
      <button disabled={isPending} onClick={handleClick}>
        {isPending ? '加载中...' : '下一页'}
      </button>
      <Suspense fallback={<Spinner />}>
        <ProfilePage resource={resource} />
      </Suspense>
    </>
  );
}
```