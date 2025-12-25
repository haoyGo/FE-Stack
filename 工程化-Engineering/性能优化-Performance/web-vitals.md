# Web Vitals 核心指标

Web Vitals 是 Google 提出的一套衡量网页用户体验的核心指标，主要包括以下几类：

## 1. 核心 Web Vitals（Core Web Vitals）

这三个是最重要的用户体验指标，直接影响 Google 搜索排名：

### LCP (Largest Contentful Paint) - 最大内容绘制

- **定义**：页面主要内容加载完成的时间
- **测量对象**：视口内最大的图片或文本块
- **标准**：
  - 优秀：≤ 2.5s
  - 需要改进：2.5s - 4s
  - 差：> 4s
- **影响因素**：
  - 服务器响应时间
  - CSS/JS 阻塞渲染
  - 资源加载时间
  - 客户端渲染

### FID (First Input Delay) - 首次输入延迟

- **定义**：用户首次与页面交互到浏览器响应的时间
- **测量对象**：点击、触摸、按键等交互
- **标准**：
  - 优秀：≤ 100ms
  - 需要改进：100ms - 300ms
  - 差：> 300ms
- **注意**：FID 已被 INP 逐步替代
- **影响因素**：
  - 主线程繁忙程度
  - JavaScript 执行时间
  - 长任务阻塞

### CLS (Cumulative Layout Shift) - 累积布局偏移

- **定义**：页面生命周期内所有意外布局偏移的总和
- **测量对象**：视觉稳定性
- **标准**：
  - 优秀：≤ 0.1
  - 需要改进：0.1 - 0.25
  - 差：> 0.25
- **计算公式**：`CLS = Σ(影响分数 × 距离分数)`
- **常见原因**：
  - 图片/视频无尺寸
  - 动态插入内容
  - Web 字体加载
  - 异步加载的广告

## 2. 其他重要指标

### FCP (First Contentful Paint) - 首次内容绘制

- **定义**：页面首次绘制任何文本、图像、canvas 等内容的时间
- **标准**：
  - 优秀：≤ 1.8s
  - 需要改进：1.8s - 3s
  - 差：> 3s
- **意义**：用户首次感知到页面加载的时间点

### TTFB (Time to First Byte) - 首字节时间

- **定义**：从请求开始到接收到第一个字节的时间
- **标准**：
  - 优秀：≤ 800ms
  - 需要改进：800ms - 1.8s
  - 差：> 1.8s
- **影响因素**：
  - DNS 查询
  - TCP 连接
  - SSL 握手
  - 服务器处理时间

### TTI (Time to Interactive) - 可交互时间

- **定义**：页面完全可交互的时间
- **标准**：≤ 3.8s（移动设备）
- **要求**：
  - FCP 已触发
  - 大部分可见元素已注册事件
  - 页面在 50ms 内响应用户交互

### TBT (Total Blocking Time) - 总阻塞时间

- **定义**：FCP 到 TTI 之间所有长任务阻塞时间的总和
- **标准**：≤ 200ms
- **长任务定义**：执行时间超过 50ms 的任务

### INP (Interaction to Next Paint) - 交互到下次绘制

- **定义**：测量页面响应用户交互的延迟（页面整个生命周期）
- **标准**：
  - 优秀：≤ 200ms
  - 需要改进：200ms - 500ms
  - 差：> 500ms
- **与 FID 的区别**：
  - FID 只测量首次交互
  - INP 测量所有交互的响应性
- **注意**：正在逐步替代 FID，成为新的核心指标

### SI (Speed Index) - 速度指数

- **定义**：页面内容可见填充的速度
- **标准**：≤ 3.4s
- **计算**：基于视觉完整度的平均时间

## 3. 使用示例

### 3.1 基础使用

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB, onINP } from "web-vitals";

function sendToAnalytics(metric) {
  const { name, value, rating, delta, id } = metric;

  console.log({
    metricName: name, // 指标名称
    value: value, // 指标值
    rating: rating, // 评级：'good' | 'needs-improvement' | 'poor'
    delta: delta, // 与上次的变化量
    id: id, // 唯一标识符
  });

  // 发送到分析服务
  fetch("/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      value,
      rating,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    }),
  });
}

// 监听所有核心指标
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// 监听 INP（新指标）
onINP(sendToAnalytics);
```

### 3.2 React 集成

```javascript
// src/reportWebVitals.js
import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } from "web-vitals";

export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFID(onPerfEntry);
    onLCP(onPerfEntry);
    onFCP(onPerfEntry);
    onTTFB(onPerfEntry);
    onINP(onPerfEntry);
  }
}

// src/index.js
import { reportWebVitals } from "./reportWebVitals";

reportWebVitals(console.log);
// 或者发送到分析服务
reportWebVitals((metric) => {
  // 发送到 Google Analytics
  gtag("event", metric.name, {
    value: Math.round(
      metric.name === "CLS" ? metric.value * 1000 : metric.value
    ),
    event_label: metric.id,
    non_interaction: true,
  });
});
```

### 3.3 Next.js 集成

```javascript
// pages/_app.js
import { useReportWebVitals } from "next/web-vitals";

export default function MyApp({ Component, pageProps }) {
  useReportWebVitals((metric) => {
    console.log(metric);

    // 发送到分析服务
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
    });
  });

  return <Component {...pageProps} />;
}
```

### 3.4 自定义指标

```javascript
import { onCLS, onFID, onLCP } from "web-vitals";

function sendToAnalytics(metric) {
  // 添加自定义维度
  const body = {
    ...metric,
    // 页面信息
    page: window.location.pathname,
    // 用户信息
    userId: getUserId(),
    // 设备信息
    deviceType: getDeviceType(),
    // 网络信息
    connectionType: navigator.connection?.effectiveType,
    // A/B 测试分组
    experimentGroup: getExperimentGroup(),
  };

  // 使用 beacon API 确保数据发送
  navigator.sendBeacon("/analytics", JSON.stringify(body));
}

// 监听指标
onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

## 4. 优化建议

### 4.1 LCP 优化

| 优化方向       | 具体措施                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| **服务器优化** | • 升级服务器配置<br>• 使用 CDN<br>• 启用 HTTP/2 或 HTTP/3<br>• 优化数据库查询             |
| **资源优化**   | • 压缩图片（WebP、AVIF）<br>• 使用响应式图片<br>• 预加载关键资源<br>• 移除未使用的 CSS/JS |
| **渲染优化**   | • 使用 SSR/SSG<br>• 内联关键 CSS<br>• 延迟加载非关键资源<br>• 避免渲染阻塞                |

```html
<!-- 预加载关键资源 -->
<link rel="preload" as="image" href="/hero.jpg" />
<link rel="preload" as="font" href="/font.woff2" crossorigin />

<!-- 使用响应式图片 -->
<img
  srcset="small.jpg 500w, medium.jpg 1000w, large.jpg 2000w"
  sizes="(max-width: 600px) 500px, (max-width: 1200px) 1000px, 2000px"
  src="large.jpg"
  alt="Hero image"
/>
```

### 4.2 FID/INP 优化

```javascript
// 1. 代码分割
const HeavyComponent = lazy(() => import("./HeavyComponent"));

// 2. 使用 Web Worker 处理计算密集型任务
const worker = new Worker("worker.js");
worker.postMessage({ data: heavyData });

// 3. 使用 requestIdleCallback 延迟非关键任务
requestIdleCallback(() => {
  // 非关键任务
  analyzeUserBehavior();
});

// 4. 事件委托减少事件监听器
document.getElementById("list").addEventListener("click", (e) => {
  if (e.target.matches(".item")) {
    handleItemClick(e.target);
  }
});

// 5. 使用 Scheduler API
if ("scheduler" in window) {
  scheduler.postTask(
    () => {
      // 低优先级任务
    },
    { priority: "background" }
  );
}
```

### 4.3 CLS 优化

```css
/* 1. 为图片/视频设置尺寸 */
img,
video {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9; /* 或指定具体比例 */
}

/* 2. 使用 CSS contain */
.card {
  contain: layout; /* 限制布局影响范围 */
}

/* 3. 使用 font-display 优化字体加载 */
@font-face {
  font-family: "CustomFont";
  src: url("/fonts/custom.woff2") format("woff2");
  font-display: swap; /* 或 optional */
}

/* 4. 为动态内容预留空间 */
.ad-container {
  min-height: 250px; /* 预留广告位高度 */
}

/* 5. 使用 transform 替代 top/left */
.animated {
  transform: translateY(100px); /* 不会触发布局 */
  /* 而不是: top: 100px; */
}
```

```javascript
// 动态内容插入优化
function insertContent() {
  const container = document.getElementById("container");

  // 1. 使用 DocumentFragment 批量插入
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const el = createItemElement(item);
    fragment.appendChild(el);
  });
  container.appendChild(fragment);

  // 2. 使用 CSS transform 动画
  element.style.transform = "translateY(0)";

  // 3. 图片加载前设置尺寸
  const img = new Image();
  img.width = 800;
  img.height = 600;
  img.src = imageUrl;
}
```

### 4.4 FCP 优化

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- 1. 内联关键 CSS -->
    <style>
      /* Critical CSS */
      body {
        margin: 0;
        font-family: sans-serif;
      }
      .hero {
        height: 100vh;
        background: #f0f0f0;
      }
    </style>

    <!-- 2. 预连接到第三方域名 -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="dns-prefetch" href="https://analytics.example.com" />

    <!-- 3. 异步加载非关键 CSS -->
    <link
      rel="preload"
      href="/styles.css"
      as="style"
      onload="this.onload=null;this.rel='stylesheet'"
    />

    <!-- 4. 使用 font-display -->
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
    />
  </head>
  <body>
    <!-- 内容 -->

    <!-- 5. 延迟加载 JavaScript -->
    <script defer src="/main.js"></script>
  </body>
</html>
```

### 4.5 TTFB 优化

```javascript
// 服务端优化（Node.js 示例）

// 1. 启用 HTTP/2
const http2 = require("http2");
const server = http2.createSecureServer({
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
});

// 2. 启用压缩
const compression = require("compression");
app.use(compression());

// 3. 设置缓存头
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|png|jpg|svg)$/)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});

// 4. 使用 CDN
// 在 HTML 中引用 CDN 资源
// <script src="https://cdn.example.com/app.js"></script>

// 5. 优化数据库查询
// 使用索引、减少查询次数、使用缓存（Redis）
```

## 5. 监控和告警

### 5.1 实时监控系统

```javascript
class WebVitalsMonitor {
  constructor() {
    this.metrics = {};
    this.threshold = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      FCP: 1800,
      TTFB: 800,
      INP: 200,
    };
  }

  init() {
    onCLS(this.handleMetric.bind(this));
    onFID(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
  }

  handleMetric(metric) {
    this.metrics[metric.name] = metric;

    // 检查是否超过阈值
    if (metric.value > this.threshold[metric.name]) {
      this.alert(metric);
    }

    // 发送到监控系统
    this.report(metric);
  }

  alert(metric) {
    console.warn(`⚠️ ${metric.name} 超过阈值:`, {
      current: metric.value,
      threshold: this.threshold[metric.name],
      rating: metric.rating,
    });

    // 发送告警（钉钉、企微、邮件等）
    fetch("/api/alert", {
      method: "POST",
      body: JSON.stringify({
        type: "performance",
        metric: metric.name,
        value: metric.value,
        threshold: this.threshold[metric.name],
        url: location.href,
        timestamp: Date.now(),
      }),
    });
  }

  report(metric) {
    // 发送到监控平台
    navigator.sendBeacon(
      "/api/metrics",
      JSON.stringify({
        ...metric,
        userAgent: navigator.userAgent,
        connection: navigator.connection?.effectiveType,
        memory: performance.memory?.usedJSHeapSize,
      })
    );
  }

  getReport() {
    return Object.entries(this.metrics).map(([name, metric]) => ({
      name,
      value: metric.value,
      rating: metric.rating,
      passed: metric.value <= this.threshold[name],
    }));
  }
}

// 使用
const monitor = new WebVitalsMonitor();
monitor.init();

// 页面卸载时获取报告
window.addEventListener("beforeunload", () => {
  console.table(monitor.getReport());
});
```

### 5.2 性能预算

```javascript
// performance-budget.js
const performanceBudget = {
  LCP: { budget: 2500, actual: 0, passed: true },
  FID: { budget: 100, actual: 0, passed: true },
  CLS: { budget: 0.1, actual: 0, passed: true },
  FCP: { budget: 1800, actual: 0, passed: true },
  bundleSize: { budget: 200 * 1024, actual: 0, passed: true }, // 200KB
};

function checkPerformanceBudget() {
  onLCP((metric) => {
    performanceBudget.LCP.actual = metric.value;
    performanceBudget.LCP.passed = metric.value <= performanceBudget.LCP.budget;
  });

  onFID((metric) => {
    performanceBudget.FID.actual = metric.value;
    performanceBudget.FID.passed = metric.value <= performanceBudget.FID.budget;
  });

  onCLS((metric) => {
    performanceBudget.CLS.actual = metric.value;
    performanceBudget.CLS.passed = metric.value <= performanceBudget.CLS.budget;
  });

  // 检查是否通过预算
  const allPassed = Object.values(performanceBudget).every(
    (item) => item.passed
  );

  if (!allPassed) {
    console.error("❌ 性能预算检查失败:", performanceBudget);
    // CI/CD 中可以让构建失败
    // process.exit(1);
  } else {
    console.log("✅ 性能预算检查通过");
  }
}
```

## 6. 工具推荐

| 工具                   | 用途         | 特点                         |
| ---------------------- | ------------ | ---------------------------- |
| **Chrome DevTools**    | 本地调试     | Performance 面板、Lighthouse |
| **Lighthouse CI**      | CI/CD 集成   | 自动化性能检查               |
| **WebPageTest**        | 真实设备测试 | 多地域、多设备、瀑布图       |
| **PageSpeed Insights** | 线上分析     | Google 官方、真实用户数据    |
| **Sentry**             | 错误监控     | 支持 Web Vitals 监控         |
| **Datadog RUM**        | 性能监控     | 企业级、全链路追踪           |
| **Vercel Analytics**   | Vercel 平台  | 与 Next.js 深度集成          |

## 7. 最佳实践

### 7.1 监控策略

```javascript
// 1. 采样策略（避免过多请求）
const sampleRate = 0.1; // 10% 采样率
if (Math.random() < sampleRate) {
  reportWebVitals(sendToAnalytics);
}

// 2. 按环境区分
const isDev = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  reportWebVitals(sendToAnalytics);
} else if (isDev) {
  reportWebVitals(console.log);
}

// 3. 按用户分组
const userSegment = getUserSegment(); // 'new' | 'returning' | 'premium'
reportWebVitals((metric) => {
  sendToAnalytics({
    ...metric,
    userSegment,
  });
});
```

### 7.2 持续优化流程

1. **建立基线**：收集当前性能数据
2. **设定目标**：定义性能预算和优化目标
3. **实施优化**：根据数据分析结果进行优化
4. **监控验证**：持续监控优化效果
5. **告警响应**：性能劣化时及时告警
6. **迭代改进**：定期回顾和调整策略

### 7.3 A/B 测试

```javascript
// 测试不同优化策略的效果
const experimentGroup = getExperimentGroup(); // 'control' | 'variant-a' | 'variant-b'

reportWebVitals((metric) => {
  sendToAnalytics({
    ...metric,
    experiment: {
      group: experimentGroup,
      version: "1.0",
    },
  });
});

// 分析不同组的性能差异
// 例如：测试图片懒加载、预加载策略、代码分割方案等
```

## 8. 面试重点

### Q1: Core Web Vitals 三个核心指标是什么？

- **LCP**：最大内容绘制（≤ 2.5s）- 衡量加载性能
- **FID/INP**：首次输入延迟/交互延迟（≤ 100ms/200ms）- 衡量交互性
- **CLS**：累积布局偏移（≤ 0.1）- 衡量视觉稳定性

### Q2: 如何优化 LCP？

1. 优化服务器响应时间（TTFB）
2. 使用 CDN 加速资源加载
3. 预加载关键资源（preload）
4. 压缩和优化图片（WebP/AVIF）
5. 使用 SSR/SSG 提前渲染内容

### Q3: CLS 常见原因和解决方案？

- **原因**：图片无尺寸、动态插入内容、Web 字体闪烁
- **解决**：设置 `width/height` 或 `aspect-ratio`、预留空间、使用 `font-display: swap`

### Q4: 如何在项目中集成 Web Vitals 监控？

1. 安装 `web-vitals` 库
2. 监听核心指标（`onCLS`、`onFID`、`onLCP`等）
3. 将数据发送到分析平台
4. 设置告警和性能预算
5. 定期分析和优化

---

**参考资料**：

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [web-vitals 库](https://github.com/GoogleChrome/web-vitals)
- [Core Web Vitals 指南](https://web.dev/articles/vitals)
