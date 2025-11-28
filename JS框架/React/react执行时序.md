# 前端渲染与 React 执行时序全流程（节点/事件/时机一览）

---

## 1. 浏览器 & React 全流程时序（含节点说明）

```
[HTML 解析]                // 页面加载，构建 DOM
   ↓
[<script async> 执行]      // 下载完成后立即执行，可能早于 DOM 解析完成
   ↓
[CSS 解析]                 // 并行或串行，构建 CSSOM
   ↓
[<script defer> 执行]      // DOM 解析完毕后、DOMContentLoaded 前执行
   ↓
[合成渲染树]               // DOM + CSSOM → 渲染树
   ↓
[DOMContentLoaded]         // DOM 树构建完成，defer 脚本已执行
   ↓
[window.onload]            // 所有资源（图片、样式、脚本等）加载完成
   ↓
[ReactDOM.render]          // JS 入口，挂载 React 根组件
   ↓
[构建 Fiber 树]            // 递归遍历组件，生成 Fiber 节点
   ↓
[组件执行 & Hook 调用]      // 执行函数/类组件，依次调用所有 Hook（useState/useEffect/useMemo 等）
   ↓
[虚拟 DOM 构建]            // JSX → 虚拟 DOM
   ↓
[Diff & Reconcile]         // 新旧 Fiber 树对比，标记变化
   ↓
[Effect 收集]              // 收集 useEffect/useLayoutEffect
   ↓
[提交更新]                 // 执行 DOM 操作（插入/更新/删除）
   ↓
[useLayoutEffect]          // DOM 更新后，绘制前（同步）
   ↓
[requestAnimationFrame]    // 下一帧绘制前，动画/布局相关回调
   ↓
[浏览器绘制（layout/paint）] // 页面真正渲染
   ↓
[微任务队列]                // Promise.then、MutationObserver、queueMicrotask 等
   ↓
[宏任务队列]                // setTimeout、setInterval、MessageChannel、useEffect 等
   ↓
[useEffect]                // React：绘制后，异步执行（宏任务）
   ↓
[setState/dispatch 更新]    // 用户交互/数据变化，触发更新
   ↓
[调度/优先级/并发]         // React Scheduler、startTransition
   ↓
[Suspense/Promise 等待]     // 组件抛出 Promise，等待异步数据
   ↓
[卸载/清理]                // 组件卸载/依赖变化，清理副作用
```

---

## 2. 典型执行时序（带节点/事件/时机）

1. 浏览器解析 HTML，遇到 async 脚本，下载完成立即执行
2. 浏览器继续解析 HTML，遇到 defer 脚本，下载但延迟执行
3. DOMContentLoaded 前，defer 脚本全部执行完毕
4. DOM 树构建完成，触发 DOMContentLoaded
5. 所有资源加载完成，触发 window.onload
6. ReactDOM.render 挂载根组件，递归构建 Fiber 树
7. 执行组件函数/类方法，依次调用所有 Hook
8. 生成虚拟 DOM，diff 新旧 Fiber 树，标记变化
9. 收集 Effect，准备副作用
10. 提交 DOM 更新，执行 useLayoutEffect（同步）
11. 浏览器 requestAnimationFrame 回调，准备绘制
12. 浏览器完成 layout/paint，页面可见
13. 微任务队列执行，Promise.then 等微任务
14. 宏任务队列执行，setTimeout、useEffect 等宏任务
15. 用户交互触发事件（React 合成事件/原生事件），setState 更新
16. React Scheduler 调度优先级，批量更新 Fiber
17. Suspense 组件抛出 Promise，等待异步数据
18. 组件卸载或依赖变化时，执行清理函数

---

## 3. 父子组件生命周期时序（挂载/更新/卸载）

### 挂载阶段

```
[父组件 constructor]
   ↓
[父组件 render]
   ↓
[子组件 constructor]
   ↓
[子组件 render]
   ↓
[子组件 componentDidMount / useLayoutEffect]
   ↓
[父组件 componentDidMount / useLayoutEffect]
   ↓
[浏览器绘制]
   ↓
[子组件 useEffect]
   ↓
[父组件 useEffect]
```

### 更新阶段（父组件 setState 或 props 变化）

```
[父组件 shouldComponentUpdate]
   ↓
[父组件 render]
   ↓
[子组件 shouldComponentUpdate]
   ↓
[子组件 render]
   ↓
[子组件 componentDidUpdate / useLayoutEffect]
   ↓
[父组件 componentDidUpdate / useLayoutEffect]
   ↓
[浏览器绘制]
   ↓
[子组件 useEffect]
   ↓
[父组件 useEffect]
```

### 卸载阶段

```
[父组件卸载]
   ↓
[子组件 componentWillUnmount / useEffect cleanup]
   ↓
[父组件 componentWillUnmount / useEffect cleanup]
```

---

## 4. 补充说明

- React 挂载/更新时，先递归渲染父组件，再渲染子组件。
- 挂载/更新生命周期钩子（componentDidMount/useLayoutEffect/useEffect）先执行子组件，再执行父组件。
- 卸载时，先卸载父组件，再卸载子组件，先执行子组件的清理函数。
- useLayoutEffect 总是同步执行在 DOM 更新后、浏览器绘制前；useEffect 异步执行在浏览器绘制后（宏任务）。

---
