# React 框架详解

## 一、基础概念

### 1. JSX
- JSX是JavaScript的语法扩展，允许在JavaScript中编写类HTML代码
- React 17+中JSX自动转换，无需显式导入React
- JSX编译为_jsx()调用（替代React.createElement）
- JSX支持表达式、属性传递和子元素嵌套
- React 18变化：
  - 新的JSX运行时
  - 改进的开发模式警告
  - 更严格的类型检查

### 2. 组件
- 函数组件：接收props返回React元素的纯函数（推荐使用）
- 类组件：继承React.Component，包含生命周期和状态管理
- 组件通信：props传递、状态提升、Context、Redux等
- 严格模式：使用StrictMode检查不安全生命周期和过时API
- React 18变化：
  - 新的Root API（createRoot替换ReactDOM.render）
  - 改进的严格模式行为（模拟卸载和重新挂载）
  - 并发渲染下的组件生命周期变化

### 3. Props
- 只读性：组件不能修改自身props
- 数据流：单向数据流，从父组件流向子组件
- 默认值：函数组件使用解构赋值设置默认值
- PropTypes：开发环境下的类型检查（建议使用TypeScript）

### 4. State
- 状态管理：组件内部可变数据
- setState：自动批处理所有更新（React 18+）
  - React 18前：仅在React事件处理程序中进行批处理
    ```jsx
    // React 17及之前版本
    function handleClick() {
      setCount(c => c + 1); // 不会立即触发渲染
      setFlag(f => !f);    // 与上面的setCount一起批处理
      // 最终只会触发一次重新渲染
    }
    
    setTimeout(() => {
      setCount(c => c + 1); // 立即触发渲染
      setFlag(f => !f);    // 立即触发另一次渲染
      // 会触发两次重新渲染
    }, 1000);
    ```
  - React 18后：所有更新默认自动批处理（包括promise、setTimeout等）
    ```jsx
    // React 18及之后版本
    function handleClick() {
      setCount(c => c + 1); // 不会立即触发渲染
      setFlag(f => !f);    // 与上面的setCount一起批处理
      // 最终只会触发一次重新渲染
    }
    
    setTimeout(() => {
      setCount(c => c + 1); // 不会立即触发渲染
      setFlag(f => !f);    // 与上面的setCount一起批处理
      // 最终只会触发一次重新渲染
    }, 1000);
    ```
  - 手动控制批处理：
    - `flushSync`：强制同步更新，退出批处理
    ```jsx
    import { flushSync } from 'react-dom';
    
    flushSync(() => {
      setCount(c => c + 1); // 立即触发渲染
    });
    setFlag(f => !f);      // 上面的更新已提交，这个会单独批处理
    ```
  - 批处理原理：
    1. React将多个状态更新收集到队列中
    2. 在事件循环的同一"tick"中合并相同优先级的更新
    3. 一次性计算最新状态并触发重新渲染
    4. 减少不必要的渲染次数，提高性能
- 不可变性：直接修改state不会触发重新渲染
- 状态提升：共享状态提升至最近共同父组件

## 二、核心原理

### 1. Fiber架构
- 可中断的更新过程
- 优先级调度
- 双缓存机制
- 副作用链表
- 并发渲染支持（React 18+）
  - 并发模式（Concurrent Mode）
  - 可中断渲染
  - 时间切片（Time Slicing）
  - 过渡更新（Transition Updates）

### 2. 调度机制
- 任务优先级
- 时间分片
- Scheduler调度器
- 并发特性支持（React 18+）
  - startTransition API
  - useTransition Hook
  - useDeferredValue Hook
- 自动批处理优化

### 3. Diff算法
- 单节点Diff
- 多节点Diff
- key的作用
- 算法优化策略
- 并发更新处理

## 三、Hooks机制

### 1. 常用Hooks
- useState：状态管理
- useEffect：副作用处理
- useContext：上下文获取
- useReducer：复杂状态管理
- useCallback：函数记忆
- useMemo：值记忆
- useRef：引用保持
- useTransition：并发渲染控制（React 18+）
- useDeferredValue：延迟更新（React 18+）

### 2. 实现原理
- Hook队列
- 依赖收集
- 闭包陷阱
- 更新机制
- 并发环境下的处理

### 3. 自定义Hooks
- 状态逻辑复用
- 最佳实践
- 常见场景
- 并发安全考虑

## 四、性能优化

### 1. 渲染优化
- React.memo
- useMemo/useCallback
- 虚拟列表
- 懒加载
- Suspense和React.lazy

### 2. 并发特性（React 18+）
- startTransition
- useTransition
- useDeferredValue
- Suspense
- 自动批处理

### 3. 状态管理优化
- 合理的状态粒度
- 避免不必要的重渲染
- Context优化
- Redux性能优化
- 服务端状态管理

## 五、最佳实践

### 1. 组件设计
- 单一职责
- 可复用性
- 合理的props设计
- 错误边界处理
- 并发安全设计

### 2. 状态管理
- 本地状态vs全局状态
- 状态归属
- 状态同步
- 异步状态处理
- 并发状态管理

### 3. 性能优化实践
- React DevTools使用
- 性能监控
- 常见性能问题解决
- 优化checklist
- 并发模式优化

### 4. 工程化实践
- 项目结构组织
- 组件库开发
- 测试策略
- 构建优化
- TypeScript集成