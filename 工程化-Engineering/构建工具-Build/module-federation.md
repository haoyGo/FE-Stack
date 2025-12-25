# Module Federation（模块联邦）

## 一、什么是 Module Federation

Webpack 5 提供的微前端解决方案，允许多个独立构建的应用在**运行时**动态共享和加载代码。

**核心能力**：跨项目共享模块、远程加载、按需加载、版本隔离、独立部署

**典型场景**：微前端架构、组件库共享、大中台系统、渐进式重构

---

## 二、核心原理

### 1. 三大角色

- **Host（消费方）**：加载并使用远程模块的应用
- **Remote（提供方）**：暴露模块供其他应用使用
- **Shared（共享依赖）**：多个应用共享的依赖库（如 React）

### 2. 工作流程

```
1. Remote 构建时生成 remoteEntry.js（入口文件）
2. Host 运行时通过 script 标签加载 remoteEntry.js
3. remoteEntry.js 暴露一个全局变量（如 window.remoteApp）
4. Host 通过该全局变量获取 Remote 的模块
5. Shared 机制确保公共依赖只加载一次
```

### 3. 关键机制

#### 异步边界（Async Boundary）

Module Federation 强制使用异步加载，确保共享依赖在使用前已加载完成。

```js
// ❌ 错误：同步导入
import RemoteButton from "remoteApp/Button";

// ✅ 正确：异步导入
const RemoteButton = lazy(() => import("remoteApp/Button"));
```

#### 依赖共享算法

1. 检查 Host 和 Remote 的 shared 配置
2. 比对版本号（requiredVersion）
3. 若满足条件，使用已加载的版本（避免重复）
4. 若不满足且 strictVersion=false，降级使用本地版本
5. 若 singleton=true，强制只加载一个版本

#### remoteEntry.js 的本质

一个特殊的 Webpack runtime，包含：

- 模块映射表
- 共享依赖配置
- 动态加载逻辑

## 三、配置示例

### Remote（提供方）

```js
// remote-app/webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "remoteApp",
      filename: "remoteEntry.js",
      exposes: {
        "./Button": "./src/components/Button",
        "./utils": "./src/utils",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
      },
    }),
  ],
};
```

### Host（消费方）

```js
// host-app/webpack.config.js
new ModuleFederationPlugin({
  name: "hostApp",
  remotes: {
    remoteApp: "remoteApp@http://localhost:3001/remoteEntry.js",
  },
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
  },
});
```

### 使用远程模块

```jsx
import { Suspense, lazy } from "react";

const RemoteButton = lazy(() => import("remoteApp/Button"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemoteButton />
    </Suspense>
  );
}
```

---

## 四、高级用法

### 1. 动态远程容器（运行时配置远程地址）

```js
new ModuleFederationPlugin({
  name: "host",
  remotes: {
    remoteApp: `promise new Promise(resolve => {
      const url = window.remoteAppUrl || 'http://localhost:3001/remoteEntry.js';
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve(window.remoteApp);
      document.head.appendChild(script);
    })`,
  },
});
```

### 2. 版本控制策略

```js
shared: {
  react: {
    singleton: true,           // 全局单例
    requiredVersion: '^18.0.0', // 要求版本
    strictVersion: false,       // 允许版本不匹配时降级
    eagerly: false,             // 是否立即加载（默认懒加载）
  },
}
```

### 3. 双向依赖（互为 Host 和 Remote）

```js
// app1 和 app2 可互相引用对方模块
// app1
new ModuleFederationPlugin({
  name: "app1",
  exposes: { "./ComponentA": "./src/ComponentA" },
  remotes: { app2: "app2@http://localhost:3002/remoteEntry.js" },
});

// app2
new ModuleFederationPlugin({
  name: "app2",
  exposes: { "./ComponentB": "./src/ComponentB" },
  remotes: { app1: "app1@http://localhost:3001/remoteEntry.js" },
});
```

---

## 六、面试常见问答

### Q1: Module Federation 的核心原理？

**运行时动态加载 + 依赖共享**：

1. Remote 生成 `remoteEntry.js`（包含模块映射）
2. Host 运行时通过 script 加载 remoteEntry.js
3. 通过全局变量获取 Remote 模块
4. Shared 机制通过版本匹配确保依赖单例

### Q2: shared 配置原理？

**避免重复加载，关键配置**：

- `singleton: true`：全局单例
- `requiredVersion`：版本要求
- `strictVersion: false`：版本不匹配时降级
- `eagerly`：是否立即加载

**匹配算法**：版本满足 → 使用已加载；不满足 → 本地版本；singleton→ 强制单例

### Q3: vs iframe vs qiankun？

| 对比项 | Module Federation | iframe      | qiankun |
| ------ | ----------------- | ----------- | ------- |
| 隔离性 | JS 共享           | 完全隔离    | JS 隔离 |
| 性能   | 高                | 低          | 中      |
| 通信   | 直接调用          | postMessage | 事件    |
| 技术栈 | 需同栈            | 无限制      | 无限制  |

### Q4: 版本冲突处理？

1. `singleton + requiredVersion` 单例+版本范围
2. `strictVersion: false` 降级策略
3. 显式锁定 `version: '18.2.0'`
4. 拆分 Remote 隔离不同版本

### Q5: 性能优化？

1. 按需加载：`lazy` + 动态 import
2. 预加载：`webpackPrefetch: true`
3. CDN 加速 remoteEntry.js
4. 缓存策略：`contenthash`
5. 合理配置 shared

### Q6: 常见问题？

**加载失败**：检查 remoteEntry.js 可访问性、CORS
**版本冲突**：统一 shared 配置、`strictVersion: false`
**循环依赖**：避免双向依赖循环、动态 import
**TypeScript**：声明模块类型 `declare module 'remoteApp/Button'`

### Q7: Module Federation 的本质是什么？

"运行时的 npm 包" + 动态 script：

构建时：各应用独立构建，生成 remoteEntry.js
运行时：动态加载 script，通过全局变量获取模块
依赖共享：通过 Shared 机制避免重复加载（如 React 只加载一次）

vs npm 包：
npm 包是构建时打包，Module Federation 是运行时加载
npm 包更新需要重新构建，Module Federation 无需重新构建

---

## 六、最佳实践

1. **统一版本**：Host 和 Remote 的 shared 配置保持一致
2. **异步加载**：始终使用 `lazy` + `Suspense`
3. **错误边界**：`ErrorBoundary` 捕获加载失败
4. **监控告警**：监控 remoteEntry.js 成功率
5. **文档规范**：明确暴露模块、版本、API

---
