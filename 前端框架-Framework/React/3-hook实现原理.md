# React Hook 实现原理精讲

---

## 1. 为什么需要 Hook？

- 解决 class 组件复杂、逻辑分散、难复用的问题。
- 函数组件 + Hook 让状态和副作用逻辑聚合、易复用、代码更简洁。

---

## 2. Hook 的本质与链表结构

- Hook 本质：为每个组件保存一组状态变量（useState/useEffect 等）。
- React 用链表（而非数组）保存每个组件的 Hook 状态，支持灵活扩展和并发。
- 每次渲染，按顺序遍历 Hook 链表，依次读取和更新状态。
- Hook 必须按相同顺序调用，不能在 if/循环中使用。

```js
// Hook 链表结构
const hook1 = { state: 0, next: hook2 };
const hook2 = { state: "", next: hook3 };
const hook3 = { callback: fn, next: null };
```

---

## 3. useState/useEffect 实现原理

### useState

- 每个 useState 对应一个 Hook 节点，保存 state 和更新队列。
- setState 触发时，将更新加入队列，安排组件重新渲染。
- 渲染时遍历队列，批量处理所有更新。

```js
function useState(initialState) {
  // 获取当前 Hook
  const hook = getCurrentHook();
  // 初始化或获取状态
  if (!hook) initHook(initialState);
  // 处理更新队列
  processQueue(hook);
  // 返回状态和 setState
  return [hook.state, setState];
}
```

### useEffect

- 每个 useEffect 对应一个 Hook 节点，保存回调和依赖。
- 渲染阶段收集 effect，提交阶段按依赖变化执行/清理。
- 依赖比较用 Object.is，只有变化才重新执行 effect。

```js
function useEffect(callback, deps) {
  const hook = getCurrentHook();
  if (!hook || depsChanged(hook.deps, deps)) {
    scheduleEffect(callback);
    hook.deps = deps;
  }
}
```

---

## 4. 顺序调用原因与陷阱

- React 通过调用顺序匹配 Hook 节点，顺序错乱会导致状态错乱。
- 不能在条件/循环/嵌套函数中调用 Hook。
- 常见陷阱：闭包陷阱、无限循环。

```jsx
// 闭包陷阱
useEffect(() => {
  setInterval(() => {
    setCount(count + 1); // count 可能不是最新值
  }, 1000);
}, []);
// 正确写法：setCount(c => c + 1)
```

---

## 5. 依赖收集机制与 Object.is

- useEffect/useMemo/useCallback 的依赖数组，React 用 Object.is 严格比较每一项。
- 依赖项变化才会重新执行 effect。
- 最佳实践：依赖数组必须包含所有用到的外部变量。

---

## 6. 并发特性与自动批处理

- React 18 支持并发渲染，Hook 链表结构天然适配。
- setState/dispatch 支持自动批处理，减少多次渲染。
- startTransition 标记非紧急更新，提升响应性。

---

## 7. 深度面试问答

### 1. 为什么 React 用链表实现 Hook？

- 链表结构支持动态扩展、插入和删除，适配 Fiber 架构和并发渲染。
- 并发模式下可同时构建多条 Hook 链表，保证状态一致性。
- 数组方式虽然简单，但不适合复杂调度和多版本并行。

### 2. 为什么 Hook 必须顺序调用？源码原理是什么？

- React 渲染时按调用顺序遍历 Hook 链表，顺序错乱会导致状态错乱。
- 源码通过 hookIndex 或 next 指针定位当前 Hook，条件/循环中调用会破坏链表结构。
- 这样保证每次渲染都能正确匹配状态。

### 3. useState/useEffect 的底层实现如何保证批处理和性能？

- setState/dispatch 不会立即更新，而是将更新加入队列，统一批量处理。
- useEffect 渲染阶段只收集副作用，提交阶段统一执行/清理，避免多次重排。
- React 18 自动批处理多次 setState，减少渲染次数。

### 4. 依赖收集与 Object.is 的设计动机？

- Object.is 能区分 NaN、+0/-0，保证依赖比较的准确性。
- 依赖数组必须包含所有外部变量，才能保证副作用的正确性和性能。
- 源码层面逐项比较依赖，只有变化才重新执行 effect。

### 5. 并发模式下 Hook 如何保证一致性？

- 每个 Fiber 节点维护独立的 Hook 链表，支持多版本并行构建。
- 只有 commit 阶段才切换 current 指针，保证 UI 一致。
- 并发渲染时，未提交的 Hook 状态不会影响已渲染的 UI。

### 6. 常见陷阱与源码层解决方案

- 闭包陷阱：setState 推荐用函数式更新，保证拿到最新值。
- 无限循环：依赖数组不全或 setState 写在 effect 内部。
- 源码通过依赖比较和 effect 清理机制规避这些问题。

---
