## 八、前端工程化工具链（资深必备）

### 8.1 React 开发工具

#### React DevTools

- **功能**：组件树查看、Props/State 调试、性能分析
- **Profiler**：记录组件渲染时间、找出性能瓶颈
- **使用场景**：定位不必要的重渲染、调试 Hooks 依赖

#### React Query Devtools

- **功能**：查看缓存状态、请求状态、自动重试机制
- **使用场景**：调试服务端状态管理、优化数据获取

#### Redux DevTools

- **功能**：Action 追踪、State 快照、时间旅行调试
- **使用场景**：复杂状态调试、状态回溯

#### Storybook

- **功能**：组件隔离开发、文档生成、视觉测试
- **使用场景**：组件库开发、设计系统构建、UI 自动化测试

### 8.2 构建工具

#### Webpack

```js
// 高级配置示例
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
      },
    },
    runtimeChunk: "single", // 提取 runtime 代码
  },
  // Tree Shaking
  mode: "production",
  usedExports: true,
};
```

**核心能力**：

- Module Federation（微前端）
- 自定义 Loader/Plugin
- 构建优化（缓存、并行、多进程）

#### Vite

- **优势**：ESM 原生支持、HMR 极速、开箱即用
- **适用场景**：新项目、开发体验优先
- **插件开发**：Rollup 插件生态
- 开发环境用 esbuild (Go 编写)，生产环境用 rollup (Js 编写)

#### Turbopack（Next.js 13+）

- **特点**：Rust 编写、增量计算、极致性能
- **使用场景**：大型项目、Next.js 项目

#### esbuild

- **特点**：Go 编写、构建速度极快
- **使用场景**：依赖预构建（Vite 底层）、简单打包

### 8.3 Bundle 分析工具

#### webpack-bundle-analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
```

**功能**：

- 可视化 Bundle 体积
- 识别重复依赖
- 找出大体积模块

**优化策略**：

- 代码分割（Dynamic Import）
- 移除未使用的依赖
- 替换大体积库（moment → dayjs）

#### source-map-explorer

```bash
npm install --save-dev source-map-explorer
source-map-explorer build/static/js/*.js
```

**功能**：基于 source map 分析代码占比

#### Rollup Plugin Visualizer

```js
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [visualizer({ open: true })],
};
```

### 8.4 依赖分析工具

#### npm-check / npm-check-updates

```bash
# 检查过期依赖
npm-check -u

# 更新到最新版本
ncu -u
```

#### depcheck

```bash
# 检测未使用的依赖
npx depcheck
```

**功能**：

- 识别未使用的依赖
- 检测缺失的依赖
- 清理 package.json

#### Dependency Cruiser

```bash
npx depcruise --include-only "^src" --output-type dot src | dot -T svg > dependency-graph.svg
```

**功能**：

- 依赖关系图可视化
- 循环依赖检测
- 架构规则验证

### 8.5 构建产物分析

#### 产物体积优化

```bash
# Gzip 压缩
npm install --save-dev compression-webpack-plugin

# Brotli 压缩（更高压缩率）
npm install --save-dev brotli-webpack-plugin
```

#### 产物结构分析

```
dist/
├── index.html          # 入口 HTML
├── static/
│   ├── js/
│   │   ├── main.[hash].js       # 主入口
│   │   ├── vendor.[hash].js     # 第三方库
│   │   ├── runtime.[hash].js    # Webpack runtime
│   │   └── [name].[hash].js     # 异步 chunk
│   ├── css/
│   │   └── main.[hash].css
│   └── media/
│       └── [name].[hash].[ext]
```

#### 产物加载优化

```html
<!-- 预加载关键资源 -->
<link rel="preload" as="script" href="/static/js/main.js" />
<link rel="prefetch" href="/static/js/async-chunk.js" />

<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://api.example.com" />
```

---

### 8.6 代码质量与安全扫描

#### ESLint

```js
// .eslintrc.js 高级配置
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
  },
};
```

#### 自定义 ESLint 规则

```js
// 禁止使用特定 API
module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.name === "dangerousAPI") {
          context.report({
            node,
            message: "禁止使用 dangerousAPI",
          });
        }
      },
    };
  },
};
```

#### SonarQube

- **功能**：代码质量、安全漏洞、技术债务分析
- **指标**：圈复杂度、重复率、覆盖率

#### Snyk

```bash
npm install -g snyk
snyk test # 检测安全漏洞
```

**功能**：

- 依赖漏洞扫描
- 自动修复建议
- License 合规检查

#### npm audit

```bash
npm audit # 检查漏洞
npm audit fix # 自动修复
```

### 8.7 性能分析工具

#### Chrome DevTools Performance

**核心指标**：

- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTI (Time to Interactive)
- TBT (Total Blocking Time)
- CLS (Cumulative Layout Shift)

**使用步骤**：

1. 录制页面加载
2. 分析火焰图（找出长任务）
3. 定位性能瓶颈（JS 执行、渲染、网络）

#### Lighthouse

```bash
npm install -g lighthouse
lighthouse https://example.com --view
```

**功能**：

- Performance 性能评分
- Accessibility 无障碍检查
- Best Practices 最佳实践
- SEO 优化建议

#### Web Vitals

```js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

#### React DevTools Profiler

```jsx
<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
```

**功能**：

- 记录组件渲染时间
- 找出频繁重渲染的组件
- 优化 memo/useMemo/useCallback

#### Bundle Size 监控

```bash
# 使用 bundlesize
npm install --save-dev bundlesize

# package.json
{
  "bundlesize": [
    {
      "path": "./dist/main.*.js",
      "maxSize": "200 kB"
    }
  ]
}
```

### 8.8 重复代码检测

#### jscpd

```bash
npx jscpd src/
```

**功能**：

- 检测重复代码
- 支持多种语言
- 生成报告

#### ESLint Plugin (no-duplicate-code)

```js
// .eslintrc.js
module.exports = {
  plugins: ["sonarjs"],
  rules: {
    "sonarjs/no-duplicate-string": "error",
    "sonarjs/no-identical-functions": "error",
  },
};
```

#### SonarQube Duplication

- **阈值设置**：重复代码率 < 3%
- **重构建议**：提取公共函数、组件

## 九、其他重要工具和流程

### 9.1 测试工具链

#### 单元测试

- **Jest**：React 官方推荐、快照测试
- **Vitest**：Vite 生态、兼容 Jest API、速度更快

```js
// Jest 配置
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### 组件测试

- **React Testing Library**：用户行为导向测试
- **Enzyme**（逐渐淘汰）：组件实现细节测试

```js
import { render, screen, fireEvent } from "@testing-library/react";

test("button click", () => {
  render(<Button onClick={handleClick}>Click</Button>);
  fireEvent.click(screen.getByText("Click"));
  expect(handleClick).toHaveBeenCalled();
});
```

#### E2E 测试

- **Playwright**：跨浏览器、现代化 API
- **Cypress**：开发体验好、调试友好

```js
// Playwright 示例
test("login flow", async ({ page }) => {
  await page.goto("https://example.com");
  await page.fill("#username", "admin");
  await page.fill("#password", "123456");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

#### 视觉回归测试

- **Percy**：自动化截图对比
- **Chromatic**：Storybook 集成
- **BackstopJS**：开源方案

### 9.2 CI/CD 工具

#### GitHub Actions

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
```

#### GitLab CI

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm test
    - npm run lint

deploy:
  stage: deploy
  script:
    - npm run build
    - aws s3 sync dist/ s3://bucket
```

### 9.3 代码审查工具

#### Danger

```js
// dangerfile.js
import { danger, warn } from "danger";

// PR 描述检查
if (danger.github.pr.body.length < 10) {
  warn("请补充 PR 描述");
}

// 文件修改检查
const bigPRThreshold = 500;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  warn("PR 改动过大，建议拆分");
}
```

#### Commitlint

```js
// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
    ],
  },
};
```

### 9.4 监控与错误追踪

#### Sentry

```js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

**功能**：

- 错误捕获与聚合
- Source Map 支持
- 用户会话回放
- 性能监控

#### 自建监控系统

```js
// 性能监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // 上报性能数据
    sendToAnalytics({
      type: entry.entryType,
      name: entry.name,
      duration: entry.duration,
    });
  }
});

observer.observe({ entryTypes: ["navigation", "resource", "paint"] });
```

### 9.5 文档工具

#### TypeDoc

```bash
npx typedoc --out docs src/
```

**功能**：从 TypeScript 代码生成 API 文档

#### VitePress / Docusaurus

- **VitePress**：Vue 生态、轻量级
- **Docusaurus**：React 生态、功能丰富

#### Swagger / OpenAPI

```yaml
openapi: 3.0.0
info:
  title: API Documentation
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get all users
      responses:
        "200":
          description: Success
```

### 9.6 版本管理工具

#### Semantic Release

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git"
  ]
}
```

**功能**：

- 自动化版本发布
- 基于 Commit 生成 CHANGELOG
- 自动打 Tag

#### Changesets

```bash
npx changeset
npx changeset version
npx changeset publish
```

**适用场景**：Monorepo 多包管理

### 9.7 Monorepo 工具

#### Turborepo

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**优势**：

- 增量构建
- 远程缓存
- 并行任务执行

#### Nx

- **功能**：依赖图分析、受影响的项目检测
- **适用**：大型 Monorepo

#### pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
```

**优势**：

- 磁盘空间节省
- 安装速度快
- 依赖隔离严格

### 9.8 性能预算工具

#### Bundlesize（CI 集成）

```json
{
  "scripts": {
    "test:size": "bundlesize"
  },
  "bundlesize": [
    {
      "path": "./dist/**/*.js",
      "maxSize": "100 kB"
    }
  ]
}
```

#### Size Limit

```json
{
  "size-limit": [
    {
      "path": "dist/index.js",
      "limit": "10 KB"
    }
  ]
}
```

### 9.9 无障碍检查工具

#### axe DevTools

- Chrome 扩展
- 自动化 A11y 检查

#### eslint-plugin-jsx-a11y

```js
module.exports = {
  extends: ["plugin:jsx-a11y/recommended"],
};
```

### 9.10 其他工具

#### 包管理器选择

- **npm**：官方、稳定
- **yarn**：速度快、离线支持
- **pnpm**：节省空间、严格依赖

#### 代码生成工具

- **Plop**：模板生成（组件、页面）
- **Hygen**：代码脚手架

```js
// plopfile.js
module.exports = function (plop) {
  plop.setGenerator("component", {
    description: "Create a component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Component name",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/index.tsx",
        templateFile: "templates/component.hbs",
      },
    ],
  });
};
```

---

## 十、完整工程化流程（最佳实践）

### 开发阶段

1. **代码编写**：VSCode + ESLint + Prettier
2. **本地调试**：React DevTools + Chrome DevTools
3. **单元测试**：Jest + React Testing Library
4. **Commit**：Husky + Commitlint

### 代码审查阶段

1. **自动化检查**：ESLint + Prettier + Danger
2. **依赖安全**：Snyk / npm audit
3. **代码重复**：jscpd / SonarQube
4. **Bundle 分析**：webpack-bundle-analyzer

### CI/CD 阶段

1. **构建**：Webpack / Vite
2. **测试**：单元测试 + E2E 测试
3. **代码质量**：SonarQube
4. **性能预算**：Size Limit / Bundlesize
5. **部署**：自动化部署到 CDN

### 监控阶段

1. **错误监控**：Sentry
2. **性能监控**：自建系统 / Lighthouse CI
3. **用户行为**：埋点系统
4. **告警机制**：钉钉/企微机器人

---

## 面试高频问题

### Q1：如何搭建一个完整的前端工程化体系？

**回答框架**：

1. **代码规范**：ESLint + Prettier + Husky
2. **构建工具**：Webpack/Vite + 优化配置
3. **测试体系**：Jest + Playwright
4. **CI/CD**：GitHub Actions + 自动化部署
5. **监控体系**：Sentry + 性能监控
6. **文档体系**：Storybook + TypeDoc

### Q2：如何做前端性能优化？

**完整链路**：

1. **构建优化**：代码分割、Tree Shaking、压缩
2. **网络优化**：HTTP/2、CDN、缓存策略
3. **加载优化**：懒加载、预加载、SSR
4. **运行时优化**：虚拟列表、防抖节流、Web Worker
5. **监控优化**：持续监控 + 自动告警

### Q3：如何保证代码质量？

1. **开发阶段**：ESLint + TypeScript
2. **提交阶段**：Husky + Commitlint
3. **Review 阶段**：Code Review + Danger
4. **测试阶段**：单元测试（80%+ 覆盖率）
5. **上线阶段**：灰度发布 + 监控
