[garfish 架构](https://www.garfishjs.org/blog/architecture.html)

## 核心原理

### 一、Garfish 架构设计

Garfish 是一个**基于微前端架构的前端框架**，核心目标是实现多个独立前端应用的整合与协同工作。

#### 1. 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      主应用（Base App）                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Garfish 核心调度层                      │  │
│  │  ┌─────────┬─────────┬─────────┬──────────────┐  │  │
│  │  │ Router  │ Loader  │ Sandbox │LifeCycle Mgr │  │  │
│  │  └─────────┴─────────┴─────────┴──────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  子应用 A     │  │  子应用 B     │  │  子应用 C     │  │
│  │ (React)      │  │ (Vue)        │  │ (Angular)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 2. 核心模块

**（1）Router - 路由劫持与分发**

- 劫持主应用的路由事件（`history.pushState`、`popstate`）
- 根据路由规则匹配并激活对应的子应用
- 支持主子应用路由嵌套

```javascript
Garfish.router.registerApp({
  name: "app1",
  activeWhen: "/app1",
  entry: "http://localhost:3001",
});
```

**（2）Loader - 资源加载器**

核心职责：

- 获取子应用的 HTML 入口
- 解析 HTML，提取 JS/CSS 资源
- 下载并缓存资源
- 将资源转换为可执行代码

```javascript
// 加载流程
fetch(entry)
  → parseHTML()
  → extractAssets(js, css)
  → download()
  → transform()
  → cache
```

关键技术：

- **增量更新**：只加载变化的资源
- **并行加载**：JS/CSS 并行下载
- **预加载**：`prefetch` 提前加载资源

**（3）Sandbox - 沙箱隔离**

Garfish 提供三种沙箱模式：

① **Snapshot 快照沙箱**（兜底方案）

```javascript
class SnapshotSandbox {
  active() {
    this.snapshot = {};
    for (let key in window) {
      this.snapshot[key] = window[key];
    }
  }

  inactive() {
    for (let key in this.snapshot) {
      window[key] = this.snapshot[key];
    }
  }
}
```

② **Proxy 代理沙箱**（推荐，现代浏览器）

```javascript
class ProxySandbox {
  constructor() {
    this.fakeWindow = {};
    this.proxy = new Proxy(this.fakeWindow, {
      get: (target, key) => {
        return target[key] || window[key];
      },
      set: (target, key, value) => {
        target[key] = value;
        return true;
      },
    });
  }
}
```

③ **VM 沙箱**（最强隔离）

- 使用 `with + new Function` 创建独立作用域
- 完全隔离 window 对象
- 性能开销较大

**（4）LifeCycle Manager - 生命周期管理**

子应用必须导出标准生命周期钩子：

```javascript
// 子应用导出
export async function bootstrap(props) {
  // 初始化：创建实例、注册插件
}

export async function mount(props) {
  // 挂载：渲染 DOM
  ReactDOM.render(<App />, props.container);
}

export async function unmount(props) {
  // 卸载：清理 DOM、事件、定时器
  ReactDOM.unmountComponentAtNode(props.container);
}
```

主应用调度：

```javascript
loadApp → bootstrap → mount → [active] → unmount → destroy
```

#### 3. 样式隔离方案

**方案一：CSS Scoped**

```javascript
// 给所有 CSS 选择器添加前缀
.title { color: red; }
↓
.garfish-app-name .title { color: red; }
```

**方案二：Shadow DOM**

```javascript
const shadowRoot = container.attachShadow({ mode: "open" });
shadowRoot.innerHTML = appHTML;
```

**方案三：CSS Modules**

- 构建时生成唯一 className
- 子应用需要配置 webpack/vite

#### 4. 通信机制

**（1）Props 注入**

```javascript
Garfish.loadApp("app1", {
  props: {
    data: { user: "admin" },
    onEvent: (data) => console.log(data),
  },
});
```

**（2）全局事件总线**

```javascript
// 主应用
Garfish.eventCenter.on("message", (data) => {});

// 子应用
window.Garfish.eventCenter.emit("message", { type: "update" });
```

**（3）共享状态**

```javascript
// 共享 store
const store = Garfish.registerGlobalValue("store", createStore());
```

### 二、核心流程解析

#### 1. 应用加载流程

```
1. 路由匹配 (Router.match)
   ↓
2. 创建沙箱 (Sandbox.create)
   ↓
3. 加载资源 (Loader.fetch)
   ↓
4. 解析 HTML (Parser.parseHTML)
   ↓
5. 提取资源 (extractJS, extractCSS)
   ↓
6. 执行 JS (evalCode in sandbox)
   ↓
7. 调用 bootstrap (provider.bootstrap)
   ↓
8. 调用 mount (provider.mount)
   ↓
9. 渲染完成
```

#### 2. 资源加载策略

**预加载（Prefetch）**

```javascript
Garfish.run({
  apps: [
    {
      name: "app1",
      entry: "http://localhost:3001",
      cache: true,
      prefetch: true, // 空闲时预加载
    },
  ],
});
```

**资源缓存**

```javascript
// 内存缓存
const cache = new Map();
cache.set(url, { html, js, css });

// 版本管理
manifest.json → { app1: 'v1.0.1', app2: 'v1.2.0' }
```

#### 3. 沙箱执行机制

```javascript
// 代理沙箱执行流程
function execCode(code, sandbox) {
  const { proxy, fakeWindow } = sandbox;

  // 1. 包装代码
  const wrappedCode = `
    (function(window) {
      with(window) {
        ${code}
      }
    }).call(window, proxy)
  `;

  // 2. 执行
  const fn = new Function("window", wrappedCode);
  fn.call(proxy, proxy);

  // 3. 返回导出
  return proxy.exports || {};
}
```

### 三、关键技术点

#### 1. 路由劫持

```javascript
// 重写 history API
const rawPushState = window.history.pushState;
window.history.pushState = function (...args) {
  const result = rawPushState.apply(this, args);
  Garfish.router.reroute(); // 触发重新路由
  return result;
};

// 监听 popstate
window.addEventListener("popstate", () => {
  Garfish.router.reroute();
});
```

#### 2. JS 隔离

```javascript
// 隔离 window 全局变量
const iframe = document.createElement("iframe");
iframe.style.display = "none";
document.body.appendChild(iframe);

const sandboxWindow = iframe.contentWindow;
// 使用 iframe 的 window 作为沙箱环境
```

#### 3. CSS 作用域

```javascript
// 动态添加作用域
function scopeCSS(css, prefix) {
  return css.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, (match, selector) => {
    return `${prefix} ${selector}${match.slice(selector.length)}`;
  });
}

// 使用
const scopedCSS = scopeCSS(originalCSS, ".garfish-app-name");
```

---

## 性能指标采集方案（主应用与子应用）

### 1. 原理与隔离方式

在微前端架构下，主应用和子应用需独立采集 Web Vitals（如 LCP、FCP、CLS、INP），避免互相干扰。常见隔离方式：

- 通过生命周期钩子（mount/unmount）在各自容器内采集
- 采集时限定 container 区域，避免跨应用 DOM 干扰
- 指标上报接口分离，主/子应用分别上报

### 2. 问题与解决方案

**问题：**

1. `metric.element` 可能为 `null`，导致 `container.contains()` 判断失败，漏报
2. web-vitals 回调只触发一次，无法覆盖异步渲染、路由切换场景
3. 某些指标（如 CLS、INP）无 element 属性，或 element 不属于当前 container

**解决方案：**

- 容错处理：element 为 null 时仍上报时间数据
- 延迟采集：等待关键 DOM 渲染后再调用 web-vitals
- 区域标记：通过 appName 标记指标归属，避免依赖 element 判断
- 轮询补报：结合 MutationObserver 监听 DOM 变化，补充采集

### 3. 完整实现代码

#### （1）主应用采集 - 带容错与延迟

```javascript
import { onLCP, onFCP, onCLS, onINP, onFID } from "web-vitals";

class MainAppVitals {
  constructor(appName = "main-app") {
    this.appName = appName;
    this.container = document.querySelector("#main-app");
    this.reported = new Set(); // 防止重复上报
  }

  init() {
    // 等待主应用 DOM 渲染完成后采集
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.startCollect());
    } else {
      this.startCollect();
    }
  }

  startCollect() {
    const reportHandler = (metric) => this.reportMetric(metric);

    onLCP(reportHandler);
    onFCP(reportHandler);
    onCLS(reportHandler);
    onINP(reportHandler);
    onFID(reportHandler);
  }

  reportMetric(metric) {
    const key = `${metric.name}-${metric.id}`;
    if (this.reported.has(key)) return;

    // 容错：element 可能为 null，或不在 container 内
    const belongsToApp =
      !metric.entries?.length ||
      metric.entries.some((entry) => {
        const element =
          entry.element || document.elementFromPoint(entry.startTime, 0);
        return !element || !this.container || this.container.contains(element);
      });

    if (belongsToApp) {
      this.reported.add(key);
      fetch("/api/main-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: this.appName,
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          timestamp: Date.now(),
        }),
      });
    }
  }
}

// 使用
const mainVitals = new MainAppVitals("main-app");
mainVitals.init();
```

#### （2）子应用采集 - 生命周期钩子 + 延迟采集

```javascript
import { onLCP, onFCP, onCLS, onINP, onFID } from "web-vitals";

class SubAppVitals {
  constructor(appName, container) {
    this.appName = appName;
    this.container = container;
    this.reported = new Set();
    this.observers = []; // 存储 observer 实例，用于卸载清理
  }

  // 在 mount 钩子中调用
  mount() {
    // 延迟采集：等待子应用关键内容渲染
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.startCollect();
      }, 100); // 延迟 100ms，确保首屏内容已渲染
    });
  }

  startCollect() {
    const reportHandler = (metric) => this.reportMetric(metric);

    // 注册 web-vitals 回调
    const lcpObserver = onLCP(reportHandler);
    const fcpObserver = onFCP(reportHandler);
    const clsObserver = onCLS(reportHandler);
    const inpObserver = onINP(reportHandler);
    const fidObserver = onFID(reportHandler);

    // 部分 web-vitals API 返回 disconnect 方法
    this.observers.push({
      disconnect: () => {
        // web-vitals v3+ 支持 disconnect
      },
    });

    // 补充：监听 DOM 变化，触发 LCP 重新计算（针对异步渲染）
    this.observeDOMMutations();
  }

  observeDOMMutations() {
    const mutationObserver = new MutationObserver(() => {
      // DOM 变化时可以触发自定义 LCP 计算逻辑
      // 简化示例：仅记录时间戳
      this.reportCustomMetric("DOM_MUTATION", performance.now());
    });

    mutationObserver.observe(this.container, {
      childList: true,
      subtree: true,
    });

    this.observers.push(mutationObserver);
  }

  reportMetric(metric) {
    const key = `${metric.name}-${metric.id}`;
    if (this.reported.has(key)) return;

    // 方案1：通过 entries 判断（推荐）
    let belongsToApp = false;
    if (metric.entries?.length) {
      belongsToApp = metric.entries.some((entry) => {
        // LCP/FCP 有 element 属性
        if (entry.element) {
          return this.container.contains(entry.element);
        }
        // CLS/INP 可能无 element，通过其他属性判断
        return true; // 简化：默认属于当前子应用
      });
    } else {
      // 无 entries 时（如 FID），默认上报
      belongsToApp = true;
    }

    // 方案2：容错兜底 - element 为 null 时也上报
    if (!metric.entries?.length || !metric.entries.some((e) => e.element)) {
      belongsToApp = true;
    }

    if (belongsToApp) {
      this.reported.add(key);
      fetch("/api/sub-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: this.appName,
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          timestamp: Date.now(),
        }),
      });
    }
  }

  reportCustomMetric(name, value) {
    fetch("/api/sub-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: this.appName,
        name,
        value,
        timestamp: Date.now(),
      }),
    });
  }

  // 在 unmount 钩子中调用
  unmount() {
    // 清理所有 observer，防止内存泄漏
    this.observers.forEach((observer) => {
      if (observer && typeof observer.disconnect === "function") {
        observer.disconnect();
      }
    });
    this.observers = [];
    this.reported.clear();
  }
}

// 子应用导出
let vitalsInstance = null;

export async function mount(props) {
  const { container, appName = "sub-app-1" } = props;

  // 创建性能采集实例
  vitalsInstance = new SubAppVitals(appName, container);
  vitalsInstance.mount();

  // 渲染逻辑
  ReactDOM.render(<App />, container);
}

export async function unmount(props) {
  // 清理性能采集
  if (vitalsInstance) {
    vitalsInstance.unmount();
    vitalsInstance = null;
  }

  // 卸载逻辑
  ReactDOM.unmountComponentAtNode(props.container);
}
```

#### （3）SPA 路由切换场景 - 重新采集

```javascript
// 子应用路由钩子中重新采集
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();

  useEffect(() => {
    // 路由切换时重新采集 LCP（仅针对 SPA）
    if (vitalsInstance) {
      vitalsInstance.reported.clear(); // 清空已上报记录
      vitalsInstance.startCollect(); // 重新采集
    }
  }, [location.pathname]);

  return <div>...</div>;
}
```

#### （4）高级方案 - PerformanceObserver 自定义采集

```javascript
class CustomVitals {
  constructor(appName, container) {
    this.appName = appName;
    this.container = container;
    this.lcpValue = 0;
  }

  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      // 只统计 container 内的元素
      if (lastEntry.element && this.container.contains(lastEntry.element)) {
        this.lcpValue = lastEntry.renderTime || lastEntry.loadTime;
        this.report("LCP", this.lcpValue);
      }
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });
    return observer;
  }

  report(name, value) {
    fetch("/api/custom-vitals", {
      method: "POST",
      body: JSON.stringify({ appName: this.appName, name, value }),
    });
  }
}
```

### 4. 核心问题与解决策略

#### 问题 1：`metric.element` 为 `null` 导致漏报

**原因：**

- FCP/LCP 等指标的 `element` 可能不存在（如图片未加载、文本节点）
- `container.contains(null)` 返回 `false`，导致 `if` 条件失败

**解决：**

```javascript
// 容错方案 1：element 为 null 时默认上报
if (!metric.entries?.length || !metric.entries.some((e) => e.element)) {
  belongsToApp = true;
}

// 容错方案 2：通过 entries 遍历判断
const belongsToApp =
  metric.entries?.some((entry) => {
    return !entry.element || container.contains(entry.element);
  }) ?? true; // 默认上报
```

#### 问题 2：web-vitals 回调只触发一次，无法覆盖 SPA 路由切换

**原因：**

- web-vitals 基于 PerformanceObserver，只在页面生命周期内触发一次
- SPA 路由切换不会触发新的 `onLCP`/`onFCP` 回调

**解决：**

```javascript
// 方案 1：路由切换时清空已上报记录，重新采集
useEffect(() => {
  vitalsInstance.reported.clear();
  vitalsInstance.startCollect();
}, [location.pathname]);

// 方案 2：使用 PerformanceObserver 自定义采集
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (container.contains(entry.element)) {
      report("LCP", entry.renderTime);
    }
  });
});
observer.observe({ type: "largest-contentful-paint", buffered: true });
```

#### 问题 3：某些指标（CLS、INP）无 `element` 属性

**原因：**

- CLS（累积布局偏移）是累加值，不对应单个元素
- INP（交互延迟）对应事件，可能无明确的 DOM 元素

**解决：**

```javascript
// 通过 appName 标记归属，不依赖 element 判断
reportMetric(metric) {
  fetch('/api/vitals', {
    body: JSON.stringify({
      appName: this.appName, // 明确标记归属
      name: metric.name,
      value: metric.value,
    }),
  });
}
```

### 5. 方案对比

| 方案                           | 优点                          | 缺点                              | 适用场景             |
| ------------------------------ | ----------------------------- | --------------------------------- | -------------------- |
| **web-vitals + 容错**          | 简单易用，官方支持            | 需手动处理 element 为 null 的情况 | 主/子应用首屏采集    |
| **PerformanceObserver 自定义** | 精确控制，可覆盖 SPA 路由切换 | 需手动实现指标计算逻辑            | 高度定制化场景       |
| **MutationObserver 补报**      | 覆盖异步渲染                  | 性能开销大，可能重复上报          | 异步加载内容多的应用 |
| **路由钩子重新采集**           | 覆盖 SPA 场景                 | 需与路由库集成                    | SPA 子应用           |

### 6. 最佳实践建议

1. **容错优先**：始终检查 `metric.element` 是否存在，null 时默认上报
2. **延迟采集**：等待关键 DOM 渲染后再调用 web-vitals（如 `setTimeout` 100ms）
3. **清理资源**：在 `unmount` 钩子中 disconnect 所有 observer，防止内存泄漏
4. **标记归属**：通过 `appName` 明确指标归属，避免依赖 DOM 判断
5. **分离上报**：主/子应用分别上报到不同接口，后端按 `appName` 聚合分析

### 7. 参考资料

- [web-vitals 官方文档](https://github.com/GoogleChrome/web-vitals)
- [PerformanceObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [微前端性能监控实践](https://web.dev/vitals/)
- [Garfish 生命周期文档](https://www.garfishjs.org/guide/lifecycle)

---

## 补充：LCP 时间点判断详解

### 1. LCP 是什么时候计算的？

**LCP（Largest Contentful Paint）** 是浏览器**自动计算**的，不需要手动判断时间点。

#### 浏览器自动计算流程：

```
页面加载 → 浏览器持续监听 DOM 渲染 → 找到视口内最大的内容元素 → 记录渲染时间 → 用户交互后停止计算
```

**关键点：**

1. **浏览器自动追踪**：通过 `PerformanceObserver` API，浏览器持续监听 `largest-contentful-paint` 类型的性能条目
2. **动态更新**：如果有更大的元素渲染，LCP 会更新为新的值
3. **停止时机**：用户首次交互（点击、滚动、键盘输入）后，LCP 停止更新并固定

**LCP 候选元素：**

- `<img>` 图片
- `<video>` 视频的封面
- 带背景图的块级元素（通过 CSS `background-image`）
- 包含文本节点的块级元素（如 `<p>`、`<div>`）

### 2. useEffect 可以作为 LCP 时间点吗？

**不可以！** useEffect 执行时机与 LCP 无关。

#### 对比：useEffect vs LCP

| 对比项               | useEffect                      | LCP                                    |
| -------------------- | ------------------------------ | -------------------------------------- |
| **触发时机**         | React 渲染完成后（DOM 更新后） | 浏览器检测到视口内最大内容元素渲染完成 |
| **是否等待图片**     | ❌ 不等待（图片可能还在加载）  | ✅ 等待（图片/视频加载完成后才计算）   |
| **是否等待异步数据** | ❌ 不等待（可能还在请求接口）  | ✅ 等待（数据渲染后才计算）            |
| **是否等待字体**     | ❌ 不等待                      | ✅ 等待（Web Fonts 加载后才计算）      |

#### 错误示例：用 useEffect 当 LCP

```javascript
// ❌ 错误：useEffect 触发时，最大内容可能还没渲染完成
useEffect(() => {
  const lcpTime = performance.now(); // 这个时间不准确
  report("LCP", lcpTime);
}, []); // 此时图片可能还在加载中
```

#### 正确做法：使用浏览器 API

```javascript
// ✅ 正确：让浏览器自动计算 LCP
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1]; // 最新的 LCP
  console.log("LCP 时间:", lastEntry.renderTime || lastEntry.loadTime);
  console.log("LCP 元素:", lastEntry.element);
});

observer.observe({ type: "largest-contentful-paint", buffered: true });
```

### 3. 微前端场景下的 LCP 判断逻辑

#### 核心问题：如何判断 LCP 元素属于哪个子应用？

**方案 1：通过 container.contains() 判断（推荐）**

```javascript
class SubAppLCP {
  constructor(appName, container) {
    this.appName = appName;
    this.container = container; // 子应用容器 DOM
    this.lcpValue = null;
  }

  startObserve() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      // 判断 LCP 元素是否在当前子应用容器内
      if (lastEntry.element && this.container.contains(lastEntry.element)) {
        this.lcpValue = lastEntry.renderTime || lastEntry.loadTime;

        console.log("子应用 LCP:", {
          appName: this.appName,
          value: this.lcpValue,
          element: lastEntry.element,
          size: lastEntry.size, // 元素大小（像素）
        });

        this.report("LCP", this.lcpValue);
      }
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });
    return observer;
  }

  report(name, value) {
    fetch("/api/vitals", {
      method: "POST",
      body: JSON.stringify({ appName: this.appName, name, value }),
    });
  }
}

// 使用示例：在子应用 mount 钩子中
export async function mount(props) {
  const { container, appName } = props;

  // 启动 LCP 监听
  const lcpObserver = new SubAppLCP(appName, container);
  const observer = lcpObserver.startObserve();

  // 渲染子应用
  ReactDOM.render(<App />, container);

  // 保存 observer 用于清理
  window.__subAppObserver = observer;
}

export async function unmount(props) {
  // 清理 observer
  if (window.__subAppObserver) {
    window.__subAppObserver.disconnect();
    window.__subAppObserver = null;
  }
  ReactDOM.unmountComponentAtNode(props.container);
}
```

**方案 2：通过 data-app 属性标记（更严格）**

```javascript
// 子应用渲染时给容器加标记
export async function mount(props) {
  const { container, appName } = props;

  // 标记容器
  container.setAttribute("data-app", appName);

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

    // 判断 LCP 元素是否在当前 data-app 标记的容器内
    const appContainer = lastEntry.element?.closest("[data-app]");
    if (appContainer?.getAttribute("data-app") === appName) {
      const lcpValue = lastEntry.renderTime || lastEntry.loadTime;
      report("LCP", lcpValue, appName);
    }
  });

  observer.observe({ type: "largest-contentful-paint", buffered: true });
}
```

#### 场景 3：监控异步渲染的 LCP

```javascript
// 问题：子应用 mount 后，关键内容通过接口异步加载
function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      {data && <HeroImage src={data.imageUrl} />} {/* LCP 元素 */}
    </div>
  );
}

// ✅ 解决：PerformanceObserver 会自动追踪到图片加载完成后的 LCP
// 无需手动在 useEffect 中计算
```

### 4. 完整的子应用 LCP 采集方案

```javascript
// subapp-vitals.js
export class SubAppVitalsCollector {
  constructor(appName, container) {
    this.appName = appName;
    this.container = container;
    this.observers = [];
    this.metrics = {};
  }

  init() {
    // 等待子应用首屏内容渲染后再开始采集
    requestIdleCallback(() => {
      this.observeLCP();
      this.observeFCP();
    });
  }

  observeLCP() {
    let largestContentfulPaint = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        // 只统计当前子应用容器内的元素
        if (entry.element && this.container.contains(entry.element)) {
          largestContentfulPaint = entry.renderTime || entry.loadTime;

          this.metrics.LCP = {
            value: largestContentfulPaint,
            element: entry.element.tagName,
            size: entry.size,
            url: entry.url || "",
          };

          console.log(`[${this.appName}] LCP 更新:`, this.metrics.LCP);
        }
      });
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });
    this.observers.push(observer);

    // 用户首次交互后上报最终 LCP
    const reportFinalLCP = () => {
      if (this.metrics.LCP) {
        this.report("LCP", this.metrics.LCP);
      }
      ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((type) => {
        window.removeEventListener(type, reportFinalLCP, {
          once: true,
          capture: true,
        });
      });
    };

    ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((type) => {
      window.addEventListener(type, reportFinalLCP, {
        once: true,
        capture: true,
      });
    });
  }

  observeFCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.FCP = {
          value: entry.startTime,
          name: entry.name,
        };
        console.log(`[${this.appName}] FCP:`, this.metrics.FCP);
        this.report("FCP", this.metrics.FCP);
      });
    });

    observer.observe({ type: "paint", buffered: true });
    this.observers.push(observer);
  }

  report(name, data) {
    fetch("/api/sub-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: this.appName,
        name: name,
        value: data.value,
        rating: data.rating,
        id: data.id,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }),
    });
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics = {};
  }
}

// 使用
export async function mount(props) {
  const { container, appName = "sub-app" } = props;

  // 创建性能采集器
  const vitals = new SubAppVitalsCollector(appName, container);
  vitals.init();

  // 保存实例
  window.__vitalsCollector = vitals;

  // 渲染应用
  ReactDOM.render(<App />, container);
}

export async function unmount(props) {
  // 清理采集器
  if (window.__vitalsCollector) {
    window.__vitalsCollector.destroy();
    window.__vitalsCollector = null;
  }

  ReactDOM.unmountComponentAtNode(props.container);
}
```

### 5. 关键要点总结

| 问题                            | 答案                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| **LCP 何时计算？**              | 浏览器自动计算，持续更新直到用户首次交互                   |
| **useEffect 可以作为 LCP 吗？** | ❌ 不可以，useEffect 不等待图片/字体/异步数据              |
| **如何获取 LCP？**              | 使用 `PerformanceObserver` 监听 `largest-contentful-paint` |
| **如何判断属于哪个子应用？**    | 通过 `container.contains(entry.element)` 判断              |
| **异步渲染怎么办？**            | PerformanceObserver 会自动追踪，无需手动干预               |
| **何时上报 LCP？**              | 用户首次交互时上报最终值，或实时上报每次更新               |

### 6. 调试技巧

```javascript
// Chrome DevTools Console 中查看 LCP
new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log("LCP Element:", entry.element);
    console.log("LCP Time:", entry.renderTime || entry.loadTime);
    console.log("LCP Size:", entry.size);

    // 高亮 LCP 元素
    if (entry.element) {
      entry.element.style.outline = "3px solid red";
    }
  });
}).observe({ type: "largest-contentful-paint", buffered: true });
```

---

## 补充：MutationObserver vs IntersectionObserver

### 1. 核心区别

| 对比项       | MutationObserver             | IntersectionObserver       |
| ------------ | ---------------------------- | -------------------------- |
| **监听目标** | **DOM 结构变化**（增删改）   | **元素与视口的交叉状态**   |
| **触发时机** | DOM 节点增加/删除/属性变化时 | 元素进入/离开视口时        |
| **使用场景** | 异步渲染监控、动态内容追踪   | 懒加载、曝光埋点、虚拟列表 |
| **性能开销** | 较大（频繁 DOM 变化时）      | 较小（浏览器优化）         |

### 2. 为什么性能监控用 MutationObserver？

#### 场景：异步渲染导致 LCP 元素延迟出现

```javascript
// 问题：子应用 mount 后，关键内容通过接口异步加载
function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      {data && <HeroImage src={data.imageUrl} />} {/* LCP 元素 */}
    </div>
  );
}

// ✅ MutationObserver：监听 DOM 变化，检测到新增元素时触发
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "IMG") {
        console.log("检测到新增图片，可能是 LCP 元素");
        // 可以补充自定义逻辑，如记录时间戳
      }
    });
  });
});

observer.observe(container, { childList: true, subtree: true });

// ❌ IntersectionObserver：只能监听元素是否进入视口
// 无法检测「DOM 何时新增」，只能检测「已存在的元素何时可见」
```

#### 核心原因：

**MutationObserver 的作用：**

- 监听 **DOM 结构变化**（子应用动态插入内容时触发）
- 可以检测到 **异步渲染的关键元素何时添加到 DOM**
- 配合 PerformanceObserver，可以补充采集时机

**IntersectionObserver 的局限：**

- 只能监听 **已存在元素** 是否进入视口
- 无法检测「元素何时被添加到 DOM」
- 适用于懒加载，而非性能监控

### 3. 使用场景对比

#### 场景 1：监控异步渲染（用 MutationObserver）

```javascript
// ✅ MutationObserver：检测 DOM 新增节点
class AsyncRenderMonitor {
  constructor(container) {
    this.container = container;
    this.renderTimestamps = [];
  }

  start() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          const timestamp = performance.now();
          this.renderTimestamps.push(timestamp);
          console.log(
            `DOM 变化：新增 ${mutation.addedNodes.length} 个节点，时间: ${timestamp}`
          );
        }
      });
    });

    observer.observe(this.container, {
      childList: true, // 监听子节点增删
      subtree: true, // 监听所有后代节点
      attributes: false, // 不监听属性变化（性能优化）
    });

    return observer;
  }
}

// 使用：监控子应用异步渲染
export async function mount(props) {
  const monitor = new AsyncRenderMonitor(props.container);
  monitor.start();

  ReactDOM.render(<App />, props.container);
}
```

#### 场景 2：图片懒加载（用 IntersectionObserver）

```javascript
// ✅ IntersectionObserver：检测图片进入视口时加载
class LazyImageLoader {
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src; // 加载真实图片
            this.observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: "100px", // 提前 100px 开始加载
      }
    );
  }

  observe(images) {
    images.forEach((img) => this.observer.observe(img));
  }
}

// 使用：懒加载图片
const loader = new LazyImageLoader();
loader.observe(document.querySelectorAll("img[data-src]"));
```

#### 场景 3：曝光埋点（用 IntersectionObserver）

```javascript
// ✅ IntersectionObserver：检测元素曝光
class ExposureTracker {
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const element = entry.target;
            const exposureData = {
              elementId: element.id,
              timestamp: Date.now(),
              visibleRatio: entry.intersectionRatio,
            };
            this.report(exposureData);
            this.observer.unobserve(element); // 曝光一次后停止监听
          }
        });
      },
      {
        threshold: 0.5, // 元素 50% 可见时触发
      }
    );
  }

  report(data) {
    fetch("/api/exposure", { method: "POST", body: JSON.stringify(data) });
  }
}
```

### 4. 为什么不在性能监控中用 IntersectionObserver？

#### 问题 1：IntersectionObserver 无法检测 DOM 新增

```javascript
// ❌ 错误用法：用 IntersectionObserver 监控异步渲染
export async function mount(props) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log("元素进入视口");
        // 问题：无法检测「元素何时被添加到 DOM」
        // 只能检测「已存在的元素何时可见」
      }
    });
  });

  // 此时 container 内可能还没有任何元素
  observer.observe(props.container); // ❌ 无效

  ReactDOM.render(<App />, props.container);
  // 渲染后新增的元素，IntersectionObserver 监听不到！
}
```

#### 问题 2：IntersectionObserver 触发时机与 LCP 无关

```javascript
// ❌ 错误理解：以为元素进入视口 = LCP
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const lcpTime = performance.now(); // ❌ 这不是真正的 LCP
      report("LCP", lcpTime);
      // 问题：
      // 1. 元素可能早就在视口内，只是刚创建
      // 2. 元素可见 ≠ 内容渲染完成（图片可能还在加载）
    }
  });
});
```

### 5. 正确的组合使用

#### 场景：监控子应用异步渲染 + LCP 采集

```javascript
class SubAppPerformanceMonitor {
  constructor(appName, container) {
    this.appName = appName;
    this.container = container;
    this.observers = [];
  }

  init() {
    // 1. PerformanceObserver：监听浏览器计算的 LCP
    this.observeLCP();

    // 2. MutationObserver：监听 DOM 变化，记录异步渲染时间
    this.observeDOMMutations();

    // 3. IntersectionObserver：监听关键元素曝光（可选）
    this.observeKeyElementExposure();
  }

  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.element && this.container.contains(entry.element)) {
          console.log("[LCP]", entry.renderTime || entry.loadTime);
          this.report("LCP", entry.renderTime || entry.loadTime);
        }
      });
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });
    this.observers.push(observer);
  }

  observeDOMMutations() {
    let mutationCount = 0;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutationCount++;
          const timestamp = performance.now();

          // 记录 DOM 变化时间，用于分析异步渲染性能
          console.log("[DOM_MUTATION]", {
            count: mutationCount,
            timestamp,
            addedNodes: mutation.addedNodes.length,
          });

          // 可选：上报 DOM 变化指标
          if (mutationCount === 1) {
            this.report("FIRST_DOM_MUTATION", timestamp);
          }
        }
      });
    });

    observer.observe(this.container, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  observeKeyElementExposure() {
    // 可选：监听关键元素曝光（如首屏大图）
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            entry.target.classList.contains("hero-image")
          ) {
            console.log("[HERO_IMAGE_VISIBLE]", performance.now());
            this.report("HERO_IMAGE_VISIBLE", performance.now());
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    // 监听已存在的关键元素
    setTimeout(() => {
      const heroImages = this.container.querySelectorAll(".hero-image");
      heroImages.forEach((img) => observer.observe(img));
    }, 100);

    this.observers.push(observer);
  }

  report(name, value) {
    fetch("/api/vitals", {
      method: "POST",
      body: JSON.stringify({
        appName: this.appName,
        metricName: name,
        value,
        timestamp: Date.now(),
      }),
    });
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}
```

### 6. 三种 Observer 的使用场景总结

| Observer                 | 监听目标       | 使用场景                   | 性能监控中的作用                                 |
| ------------------------ | -------------- | -------------------------- | ------------------------------------------------ |
| **PerformanceObserver**  | 浏览器性能指标 | LCP/FCP/CLS/INP 采集       | ✅ **核心**：获取浏览器计算的性能指标            |
| **MutationObserver**     | DOM 结构变化   | 异步渲染监控、动态内容追踪 | ✅ **辅助**：记录 DOM 变化时间，分析异步渲染性能 |
| **IntersectionObserver** | 元素与视口交叉 | 懒加载、曝光埋点、虚拟列表 | ⚠️ **可选**：监听关键元素曝光（非性能指标）      |

### 7. 最佳实践建议

#### ✅ 推荐做法

```javascript
// 1. 用 PerformanceObserver 采集 LCP（浏览器自动计算）
const perfObserver = new PerformanceObserver((list) => {
  // 获取真实的 LCP
});
perfObserver.observe({ type: "largest-contentful-paint", buffered: true });

// 2. 用 MutationObserver 监控异步渲染（补充信息）
const mutationObserver = new MutationObserver((mutations) => {
  // 记录 DOM 变化时间
});
mutationObserver.observe(container, { childList: true, subtree: true });

// 3. 用 IntersectionObserver 监听曝光（可选）
const intersectionObserver = new IntersectionObserver((entries) => {
  // 监听关键元素曝光
});
```

#### ❌ 错误做法

```javascript
// ❌ 不要用 IntersectionObserver 替代 PerformanceObserver
const observer = new IntersectionObserver((entries) => {
  if (entry.isIntersecting) {
    const lcpTime = performance.now(); // ❌ 这不是真实的 LCP
  }
});

// ❌ 不要用 MutationObserver 代替 IntersectionObserver 做懒加载
const observer = new MutationObserver(() => {
  // 每次 DOM 变化都触发，性能差
  const images = container.querySelectorAll("img");
  images.forEach((img) => {
    if (isInViewport(img)) {
      // ❌ 需要手动判断，效率低
      img.src = img.dataset.src;
    }
  });
});
```

### 8. 总结

**为什么性能监控用 MutationObserver 而不是 IntersectionObserver？**

1. **MutationObserver**：监听 **DOM 结构变化**，可以检测到异步渲染的元素何时被添加到 DOM
2. **IntersectionObserver**：监听 **元素可见性**，只能检测已存在元素是否进入视口，无法检测新增元素

**正确的组合：**

- **PerformanceObserver**：核心，采集 LCP/FCP/CLS/INP 等浏览器自动计算的性能指标
- **MutationObserver**：辅助，监控异步渲染，记录 DOM 变化时间
- **IntersectionObserver**：可选，监听关键元素曝光，用于曝光埋点或懒加载

**一句话总结：**

> 性能监控关心「DOM 何时变化」，而不是「元素是否可见」，所以用 MutationObserver。IntersectionObserver 适合懒加载和曝光埋点。
