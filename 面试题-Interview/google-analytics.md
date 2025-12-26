# Google Analytics (GA) 前端实践与面试指南

## 一、Google Analytics 基础

### 1. 什么是 Google Analytics？

Google Analytics（GA）是 Google 提供的免费网站分析工具，帮助网站所有者了解用户行为、流量来源、转化率等数据。

**主要版本**：

- **Universal Analytics (UA)**：传统版本（2023 年 7 月停止收集数据）
- **Google Analytics 4 (GA4)**：最新版本，基于事件驱动模型

### 2. GA4 vs Universal Analytics

| 特性         | Universal Analytics | Google Analytics 4     |
| ------------ | ------------------- | ---------------------- |
| **数据模型** | 基于会话和页面浏览  | 基于事件和参数         |
| **跨平台**   | Web 和 App 分开     | 统一跨平台跟踪         |
| **隐私合规** | 较弱                | 更强（无 Cookie 模式） |
| **机器学习** | 有限                | 深度集成               |
| **状态**     | 已停用              | 当前主流               |

### 3. 核心概念

#### 事件（Events）

GA4 的核心是事件驱动模型，所有交互都是事件。

```javascript
// 事件结构
{
  event_name: 'purchase',        // 事件名称
  event_params: {                // 事件参数
    currency: 'USD',
    value: 99.99,
    items: [...]
  }
}
```

**事件类型**：

- **自动收集事件**：page_view, session_start, first_visit 等
- **增强型测量事件**：scroll, click, file_download, video_start 等
- **推荐事件**：login, sign_up, purchase, search 等
- **自定义事件**：业务特定事件

#### 参数（Parameters）

每个事件可以附带多个参数：

```javascript
gtag("event", "purchase", {
  transaction_id: "T12345", // 订单 ID
  value: 99.99, // 订单金额
  currency: "USD", // 货币
  items: [
    // 商品列表
    {
      item_id: "SKU123",
      item_name: "Product A",
      price: 99.99,
      quantity: 1,
    },
  ],
});
```

#### 用户属性（User Properties）

描述用户特征的持久化属性：

```javascript
gtag("set", "user_properties", {
  user_type: "premium", // 用户类型
  account_age: "2_years", // 账户年龄
  preferred_language: "en", // 偏好语言
});
```

#### 维度和指标（Dimensions & Metrics）

- **维度**：描述性数据（如页面路径、城市、设备类型）
- **指标**：数值数据（如会话数、转化率、收入）

---

## 二、GA4 集成实现

### 1. 基础安装

#### 方法一：Global Site Tag (gtag.js)

```html
<!-- 在 <head> 中添加 -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

#### 方法二：Google Tag Manager (GTM) - 推荐

```html
<!-- 在 <head> 中添加 -->
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-XXXXXXX");
</script>

<!-- 在 <body> 开始处添加 -->
<noscript
  ><iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
  ></iframe
></noscript>
```

### 2. Next.js 集成

#### 使用 next/script

```typescript
// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### 封装 GA 工具函数

```typescript
// lib/analytics.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// 页面浏览事件
export const pageview = (url: string) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// 通用事件
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// GA4 推荐事件
export const trackPurchase = (data: {
  transaction_id: string;
  value: number;
  currency: string;
  items: any[];
}) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", "purchase", data);
  }
};

export const trackSearch = (searchTerm: string) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", "search", {
      search_term: searchTerm,
    });
  }
};

export const trackLogin = (method: string) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", "login", {
      method: method,
    });
  }
};
```

#### 路由变化监听

```typescript
// app/layout.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as gtag from "@/lib/analytics";

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url =
        pathname + (searchParams?.toString() ? `?${searchParams}` : "");
      gtag.pageview(url);
    }
  }, [pathname, searchParams]);

  return null;
}
```

### 3. React 组件中使用

```typescript
// components/ProductCard.tsx
import { event } from "@/lib/analytics";

export function ProductCard({ product }) {
  const handleAddToCart = () => {
    // 业务逻辑
    addToCart(product);

    // 发送 GA 事件
    event({
      action: "add_to_cart",
      category: "ecommerce",
      label: product.name,
      value: product.price,
    });
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>加入购物车</button>
    </div>
  );
}
```

### 4. 电商事件跟踪（增强型电子商务）

```typescript
// lib/ecommerce-analytics.ts

// 查看商品
export const trackViewItem = (item: Product) => {
  gtag("event", "view_item", {
    currency: "USD",
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
      },
    ],
  });
};

// 添加到购物车
export const trackAddToCart = (item: Product, quantity: number) => {
  gtag("event", "add_to_cart", {
    currency: "USD",
    value: item.price * quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        quantity: quantity,
        price: item.price,
      },
    ],
  });
};

// 开始结账
export const trackBeginCheckout = (items: CartItem[], total: number) => {
  gtag("event", "begin_checkout", {
    currency: "USD",
    value: total,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
};

// 完成购买
export const trackPurchase = (order: Order) => {
  gtag("event", "purchase", {
    transaction_id: order.id,
    value: order.total,
    currency: "USD",
    tax: order.tax,
    shipping: order.shipping,
    items: order.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
};
```

---

## 三、高级功能

### 1. 自定义维度和指标

```typescript
// 设置用户 ID（登录用户跟踪）
gtag("config", "G-XXXXXXXXXX", {
  user_id: "USER123",
});

// 设置自定义维度
gtag("set", "user_properties", {
  membership_level: "premium", // 自定义维度：会员等级
  signup_date: "2024-01-01", // 自定义维度：注册日期
});

// 发送带自定义参数的事件
gtag("event", "video_play", {
  video_title: "Product Demo", // 自定义参数
  video_duration: 120, // 自定义参数
  video_provider: "youtube", // 自定义参数
});
```

### 2. 转化跟踪

```typescript
// 定义转化事件
const trackConversion = (action: string, value?: number) => {
  gtag("event", "conversion", {
    send_to: "G-XXXXXXXXXX/xxxxx",
    value: value,
    currency: "USD",
    transaction_id: generateTransactionId(),
  });
};

// 示例：表单提交转化
const handleFormSubmit = (formData) => {
  // 提交表单
  submitForm(formData);

  // 跟踪转化
  trackConversion("lead_form_submit");

  // 或使用推荐事件
  gtag("event", "generate_lead", {
    currency: "USD",
    value: 50.0, // 预估价值
  });
};
```

### 3. 异常跟踪

```typescript
// 跟踪 JavaScript 错误
window.addEventListener("error", (event) => {
  gtag("event", "exception", {
    description: event.message,
    fatal: false,
    stack_trace: event.error?.stack,
  });
});

// 跟踪未处理的 Promise 拒绝
window.addEventListener("unhandledrejection", (event) => {
  gtag("event", "exception", {
    description: event.reason,
    fatal: false,
  });
});

// React Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    gtag("event", "exception", {
      description: error.toString(),
      fatal: true,
      stack_trace: errorInfo.componentStack,
    });
  }

  render() {
    return this.props.children;
  }
}
```

### 4. 性能监控

```typescript
// 跟踪页面加载时间
window.addEventListener("load", () => {
  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

  gtag("event", "timing_complete", {
    name: "page_load",
    value: pageLoadTime,
    event_category: "performance",
  });
});

// 跟踪 Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToGoogleAnalytics({ name, delta, id }) {
  gtag("event", name, {
    value: Math.round(name === "CLS" ? delta * 1000 : delta),
    event_category: "Web Vitals",
    event_label: id,
    non_interaction: true,
  });
}

getCLS(sendToGoogleAnalytics);
getFID(sendToGoogleAnalytics);
getFCP(sendToGoogleAnalytics);
getLCP(sendToGoogleAnalytics);
getTTFB(sendToGoogleAnalytics);
```

---

## 四、隐私与合规

### 1. GDPR / Cookie 同意

```typescript
// Cookie 同意管理
const CookieConsent = () => {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // 检查本地存储的同意状态
    const consent = localStorage.getItem("ga-consent");
    if (consent === "granted") {
      setHasConsent(true);
      initializeGA();
    }
  }, []);

  const handleAccept = () => {
    // 更新同意状态
    gtag("consent", "update", {
      analytics_storage: "granted",
    });

    localStorage.setItem("ga-consent", "granted");
    setHasConsent(true);
    initializeGA();
  };

  const handleDecline = () => {
    gtag("consent", "update", {
      analytics_storage: "denied",
    });

    localStorage.setItem("ga-consent", "denied");
  };

  if (hasConsent) return null;

  return (
    <div className="cookie-banner">
      <p>我们使用 Cookie 来改善您的体验</p>
      <button onClick={handleAccept}>接受</button>
      <button onClick={handleDecline}>拒绝</button>
    </div>
  );
};
```

### 2. 同意模式（Consent Mode）

```typescript
// 在加载 GA 之前设置默认同意状态
gtag("consent", "default", {
  analytics_storage: "denied", // 分析 Cookie
  ad_storage: "denied", // 广告 Cookie
  functionality_storage: "granted", // 功能性 Cookie
  personalization_storage: "denied", // 个性化 Cookie
  security_storage: "granted", // 安全 Cookie
  wait_for_update: 500, // 等待更新（毫秒）
});

// 用户同意后更新
gtag("consent", "update", {
  analytics_storage: "granted",
  ad_storage: "granted",
});
```

### 3. IP 匿名化

```typescript
// GA4 默认进行 IP 匿名化
// 如需明确设置：
gtag("config", "G-XXXXXXXXXX", {
  anonymize_ip: true,
});
```

### 4. 数据保留设置

在 GA4 管理界面中设置：

- 数据保留期限：2 个月 / 14 个月 / 26 个月 / 38 个月 / 50 个月
- 重置用户数据间隔：每次新活动 / 不重置

---

## 五、调试与测试

### 1. 使用 Google Analytics Debugger

```javascript
// 启用调试模式
gtag("config", "G-XXXXXXXXXX", {
  debug_mode: true,
});

// 或在浏览器控制台
window.gtag("config", "G-XXXXXXXXXX", { debug_mode: true });
```

### 2. Chrome 扩展

- **Google Analytics Debugger**：查看实时事件
- **Tag Assistant**：验证标签配置
- **GA4 DebugView**：在 GA4 界面实时查看事件

### 3. 测试环境隔离

```typescript
// 根据环境使用不同的 GA ID
const GA_ID =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_GA_ID_PROD
    : process.env.NEXT_PUBLIC_GA_ID_DEV;

// 或者在开发环境禁用
const isDev = process.env.NODE_ENV === "development";

export const pageview = (url: string) => {
  if (isDev) {
    console.log("GA Pageview:", url);
    return;
  }

  window.gtag("config", GA_ID, {
    page_path: url,
  });
};
```

### 4. 事件验证

```typescript
// 开发环境下验证事件
const trackEvent = (eventName: string, params: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 GA Event:", eventName, params);
  }

  if (typeof window.gtag !== "undefined") {
    window.gtag("event", eventName, params);
  } else {
    console.warn("GA not loaded");
  }
};
```

---

## 六、性能优化

### 1. 延迟加载

```typescript
// 使用 next/script 的 strategy
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="lazyOnload" // 页面加载后再加载
/>
```

### 2. 批量发送事件

```typescript
// 事件缓冲
class AnalyticsBuffer {
  private buffer: any[] = [];
  private timer: NodeJS.Timeout | null = null;

  add(eventName: string, params: any) {
    this.buffer.push({ eventName, params });

    // 延迟发送
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 1000);
  }

  flush() {
    if (this.buffer.length === 0) return;

    this.buffer.forEach(({ eventName, params }) => {
      window.gtag("event", eventName, params);
    });

    this.buffer = [];
  }
}

const analyticsBuffer = new AnalyticsBuffer();

// 使用
analyticsBuffer.add("button_click", { button_name: "cta" });
```

### 3. 避免阻塞主线程

```typescript
// 使用 requestIdleCallback
const trackEventAsync = (eventName: string, params: any) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      window.gtag("event", eventName, params);
    });
  } else {
    // 降级方案
    setTimeout(() => {
      window.gtag("event", eventName, params);
    }, 0);
  }
};
```

---

我先补充到这里，接下来继续补充面试题部分。需要我继续吗？

---

## 七、面试高频问题

### Q1: Google Analytics 4 和 Universal Analytics 的主要区别是什么？

**答**：

**1. 数据模型**：

- **UA**：基于会话（Session）和页面浏览（Pageview）
  ```javascript
  // UA 跟踪页面
  ga("send", "pageview", "/products");
  ```
- **GA4**：基于事件（Event）和参数（Parameter）
  ```javascript
  // GA4 所有交互都是事件
  gtag("event", "page_view", {
    page_location: "/products",
    page_title: "Products",
  });
  ```

**2. 跨平台跟踪**：

- **UA**：Web 和 App 分开，需要不同的属性
- **GA4**：统一的数据流，Web + App + 其他平台

**3. 机器学习**：

- **UA**：基础的智能功能
- **GA4**：深度集成 AI，预测指标（购买可能性、流失概率）

**4. 隐私合规**：

- **UA**：依赖 Cookie
- **GA4**：支持无 Cookie 跟踪，更符合 GDPR

**5. 报告结构**：

- **UA**：固定的报告视图
- **GA4**：灵活的探索分析，自定义报告

**面试亮点**：

> "我们项目从 UA 迁移到 GA4 时，主要挑战是重构事件跟踪逻辑。UA 的 event category/action/label 模式改为 GA4 的 event_name + parameters 模式，需要重新设计数据层结构。"

---

### Q2: 前端如何集成 Google Analytics？有哪些方式？

**答**：

**方式一：Global Site Tag (gtag.js)**

```html
<!-- 直接在 HTML 中添加 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXX");
</script>
```

**优点**：简单直接，适合小型项目  
**缺点**：难以管理多个标签，需要修改代码

**方式二：Google Tag Manager (GTM) - 推荐**

```html
<!-- GTM 容器代码 -->
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-XXXXXXX");
</script>

<!-- 在 <body> 开始处添加 -->
<noscript
  ><iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
  ></iframe
></noscript>
```

**优点**：

- 无需修改代码即可添加/修改标签
- 支持触发器和变量，灵活性高
- 版本控制和预览功能
- 适合大型项目和多团队协作

**方式三：NPM 包（React/Next.js）**

```bash
npm install react-ga4
# 或
npm install @next/third-parties
```

```typescript
// 使用 react-ga4
import ReactGA from "react-ga4";

ReactGA.initialize("G-XXX");
ReactGA.send("pageview");
```

**面试加分项**：

> "我推荐使用 GTM，因为可以让营销团队独立管理标签，不需要每次都发版。我们还设置了 GTM 的工作区和版本控制，确保改动可追溯。"

---

### Q3: 如何在 SPA（单页应用）中跟踪页面浏览？

**答**：

**问题**：SPA 路由切换不会触发页面重载，默认的 pageview 只在首次加载时触发。

**解决方案**：

**React + React Router**：

```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();

  useEffect(() => {
    // 路由变化时发送 pageview
    gtag("config", "G-XXX", {
      page_path: location.pathname + location.search,
    });
  }, [location]);

  return <Routes>...</Routes>;
}
```

**Next.js App Router**：

```typescript
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    gtag("config", "G-XXX", {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}
```

**Vue Router**：

```typescript
router.afterEach((to) => {
  gtag("config", "G-XXX", {
    page_path: to.fullPath,
  });
});
```

**注意事项**：

- 避免重复发送（使用防抖或检查 URL 是否真的变化）
- 包含 query 参数（如有需要）
- 在 GTM 中可以使用 History Change 触发器

**面试亮点**：

> "我们项目中还实现了虚拟页面跟踪，比如 Modal 弹窗和 Tab 切换，通过发送自定义 pageview 事件来跟踪用户在特定内容上的停留时间。"

---

### Q4: 如何跟踪电商转化？请给出完整示例。

**答**：

**完整的电商漏斗**：

```typescript
// 1. 查看商品列表
gtag('event', 'view_item_list', {
  item_list_id: 'related_products',
  item_list_name: 'Related Products',
  items: [
    {
      item_id: 'SKU001',
      item_name: 'Product A',
      price: 99.99,
      item_category: 'Electronics',
      index: 0
    }
  ]
});

// 2. 点击商品
gtag('event', 'select_item', {
  item_list_id: 'related_products',
  items: [{ item_id: 'SKU001', item_name: 'Product A' }]
});

// 3. 查看商品详情
gtag('event', 'view_item', {
  currency: 'USD',
  value: 99.99,
  items: [
    {
      item_id: 'SKU001',
      item_name: 'Product A',
      price: 99.99,
      item_category: 'Electronics',
      quantity: 1
    }
  ]
});

// 4. 添加到购物车
gtag('event', 'add_to_cart', {
  currency: 'USD',
  value: 99.99,
  items: [
    {
      item_id: 'SKU001',
      item_name: 'Product A',
      price: 99.99,
      quantity: 1
    }
  ]
});

// 5. 开始结账
gtag('event', 'begin_checkout', {
  currency: 'USD',
  value: 99.99,
  coupon: 'SUMMER2024',
  items: [...]
});

// 6. 添加支付信息
gtag('event', 'add_payment_info', {
  currency: 'USD',
  value: 99.99,
  payment_type: 'Credit Card',
  items: [...]
});

// 7. 完成购买
gtag('event', 'purchase', {
  transaction_id: 'T12345',
  value: 99.99,
  currency: 'USD',
  tax: 8.00,
  shipping: 5.99,
  items: [
    {
      item_id: 'SKU001',
      item_name: 'Product A',
      price: 99.99,
      quantity: 1
    }
  ]
});
```

**封装为可复用函数**：

```typescript
// lib/ecommerce-tracking.ts
export const ecommerceEvents = {
  viewItem: (product: Product) => {
    gtag("event", "view_item", {
      currency: "USD",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  },

  addToCart: (product: Product, quantity: number) => {
    gtag("event", "add_to_cart", {
      currency: "USD",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: quantity,
        },
      ],
    });
  },

  purchase: (order: Order) => {
    gtag("event", "purchase", {
      transaction_id: order.id,
      value: order.total,
      currency: "USD",
      tax: order.tax,
      shipping: order.shipping,
      items: order.items.map((item) => ({
        item_id: item.product_id,
        item_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  },
};
```

**面试加分项**：

> "我们还会跟踪退款事件 `refund`，并在后端订单状态改变时通过 Measurement Protocol API 发送服务端事件，确保数据准确性。"

---

### Q5: 如何处理 GDPR 和用户隐私合规？

**答**：

**1. 实现 Cookie 同意横幅**：

```typescript
// components/CookieConsent.tsx
export function CookieConsent() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    // 检查本地存储
    const saved = localStorage.getItem("cookie-consent");
    setConsent(saved);

    if (saved === "accepted") {
      initializeGA();
    }
  }, []);

  const handleAccept = () => {
    // 更新同意模式
    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
    });

    localStorage.setItem("cookie-consent", "accepted");
    setConsent("accepted");
    initializeGA();
  };

  const handleReject = () => {
    gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
    });

    localStorage.setItem("cookie-consent", "rejected");
    setConsent("rejected");
  };

  if (consent) return null;

  return (
    <div className="cookie-banner">
      <p>我们使用 Cookie 来改善您的体验。</p>
      <button onClick={handleAccept}>接受所有</button>
      <button onClick={handleReject}>仅必要</button>
      <a href="/privacy">隐私政策</a>
    </div>
  );
}
```

**2. 默认拒绝模式（Consent Mode v2）**：

```html
<script>
  // 在加载 GA 之前设置
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }

  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });

  gtag("js", new Date());
  gtag("config", "G-XXX");
</script>
```

**3. 提供退出选项**：

```typescript
// 允许用户撤回同意
const revokeConsent = () => {
  gtag("consent", "update", {
    analytics_storage: "denied",
  });

  localStorage.removeItem("cookie-consent");

  // 删除 GA Cookie
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (name.startsWith("_ga")) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }
  });
};
```

**4. IP 匿名化和数据保留**：

GA4 默认进行 IP 匿名化，并可在管理后台设置：

- 数据保留期限：2-50 个月
- 用户数据和事件数据分别设置
- 自动删除过期数据

**面试亮点**：

> "我们实现了分级同意机制：必要 Cookie 总是启用，统计 Cookie 需要同意，营销 Cookie 需要额外同意。还提供了同意管理面板，用户可以随时修改偏好。"

---

### Q6: 如何调试和测试 Google Analytics？

**答**：

**1. 启用调试模式**：

```javascript
// 方法1：代码中启用
gtag("config", "G-XXX", {
  debug_mode: true,
});

// 方法2：URL 参数
// https://yoursite.com?gtm_debug=true

// 方法3：浏览器控制台
localStorage.setItem("gtag_debug", "true");
```

**2. 使用浏览器扩展**：

- **GA Debugger**：Chrome 扩展，显示所有 GA 请求
- **Tag Assistant**：验证标签配置
- **GA4 DebugView**：GA4 后台实时查看事件

**3. 开发环境隔离**：

```typescript
// config/analytics.ts
export const GA_CONFIG = {
  // 生产环境使用真实 ID
  measurementId:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_GA_ID_PROD
      : process.env.NEXT_PUBLIC_GA_ID_DEV,

  // 开发环境启用调试
  debug_mode: process.env.NODE_ENV !== "production",
};

// 封装跟踪函数
export const trackEvent = (eventName: string, params?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log("📊 GA Event:", eventName, params);
  }

  if (typeof window.gtag !== "undefined") {
    window.gtag("event", eventName, params);
  }
};
```

**4. 自动化测试**：

```typescript
// __tests__/analytics.test.ts
import { trackEvent } from "@/lib/analytics";

describe("Analytics", () => {
  beforeEach(() => {
    // Mock gtag
    window.gtag = jest.fn();
  });

  it("should track purchase event", () => {
    trackEvent("purchase", {
      transaction_id: "T123",
      value: 99.99,
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "purchase", {
      transaction_id: "T123",
      value: 99.99,
    });
  });
});
```

**5. 验证数据完整性**：

```typescript
// 创建测试清单
const validateEcommerceEvent = (event: any) => {
  const required = ['transaction_id', 'value', 'currency', 'items'];
  const missing = required.filter(field => !event[field]);

  if (missing.length > 0) {
    console.error('Missing required fields:', missing);
    return false;
  }

  return true;
};

// 使用
const purchaseData = {
  transaction_id: 'T123',
  value: 99.99,
  currency: 'USD',
  items: [...]
};

if (validateEcommerceEvent(purchaseData)) {
  gtag('event', 'purchase', purchaseData);
}
```

**面试亮点**：

> "我们建立了完整的 GA 测试流程：开发环境使用独立的 GA 属性，每次发版前在 staging 环境验证关键事件，还编写了 E2E 测试覆盖核心转化漏斗。"

---

### Q7: Google Analytics 对性能有什么影响？如何优化？

**答**：

**性能影响**：

1. **JavaScript 文件大小**：

   - gtag.js：~47KB（gzip 后 ~17KB）
   - GTM 容器：~28KB（gzip 后 ~10KB）

2. **网络请求**：

   - 初始加载：2-3 个请求
   - 每个事件：1 个请求

3. **主线程阻塞**：
   - gtag.js 执行时间：~10-20ms
   - 事件发送：~2-5ms

**优化策略**：

**1. 延迟加载**：

```typescript
// Next.js - 使用 lazyOnload 策略
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="lazyOnload" // 页面完全加载后再加载
/>;

// 或自定义延迟
useEffect(() => {
  const timer = setTimeout(() => {
    loadGoogleAnalytics();
  }, 3000); // 3秒后加载

  return () => clearTimeout(timer);
}, []);
```

**2. 使用 requestIdleCallback**：

```typescript
const trackEventAsync = (eventName: string, params: any) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        window.gtag("event", eventName, params);
      },
      { timeout: 2000 }
    );
  } else {
    setTimeout(() => {
      window.gtag("event", eventName, params);
    }, 0);
  }
};
```

**3. 事件批处理**：

```typescript
class EventBuffer {
  private queue: Array<[string, any]> = [];
  private timer: NodeJS.Timeout | null = null;

  track(eventName: string, params: any) {
    this.queue.push([eventName, params]);

    if (this.timer) clearTimeout(this.timer);

    // 500ms 内的事件批量发送
    this.timer = setTimeout(() => this.flush(), 500);
  }

  flush() {
    this.queue.forEach(([name, params]) => {
      window.gtag("event", name, params);
    });
    this.queue = [];
  }
}
```

**4. 减少事件数量**：

```typescript
// ❌ 不好：过度跟踪
window.addEventListener("scroll", () => {
  trackEvent("scroll"); // 每次滚动都发送
});

// ✅ 好：节流
import { throttle } from "lodash";

const trackScroll = throttle(() => {
  trackEvent("scroll", {
    depth: Math.round((window.scrollY / document.body.scrollHeight) * 100),
  });
}, 5000); // 5秒最多发送1次

window.addEventListener("scroll", trackScroll);
```

**5. 条件加载**：

```typescript
// 只在生产环境加载
if (process.env.NODE_ENV === "production") {
  loadGoogleAnalytics();
}

// 根据用户行为加载（交互后）
const handleUserInteraction = () => {
  if (!window.gtag) {
    loadGoogleAnalytics();
  }
  document.removeEventListener("click", handleUserInteraction);
};

document.addEventListener("click", handleUserInteraction, { once: true });
```

**性能指标对比**：

| 优化前     | 优化后     |
| ---------- | ---------- |
| FCP: 2.1s  | FCP: 1.8s  |
| LCP: 3.2s  | LCP: 2.9s  |
| TBT: 350ms | TBT: 280ms |

**面试亮点**：

> "我们通过延迟加载 GA 并使用 requestIdleCallback，将 TBT 降低了 20%。还实现了智能批处理，在用户快速交互时避免频繁发送请求。"

---

### Q8: 如何在服务端发送 Google Analytics 事件？

**答**：

使用 **Measurement Protocol API**（适用于 GA4）。

**场景**：

- 服务端订单处理
- 支付回调
- 定时任务
- 后台管理操作

**实现**：

```typescript
// lib/server-analytics.ts
export async function sendServerEvent(
  clientId: string,
  eventName: string,
  eventParams: Record<string, any>
) {
  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;

  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: eventName,
            params: eventParams,
          },
        ],
      }),
    }
  );

  return response.ok;
}

// 使用示例：订单完成后发送
export async function handleOrderComplete(order: Order, userId: string) {
  // 业务逻辑
  await processOrder(order);

  // 发送服务端事件
  await sendServerEvent(
    userId, // client_id
    "purchase",
    {
      transaction_id: order.id,
      value: order.total,
      currency: "USD",
      items: order.items.map((item) => ({
        item_id: item.product_id,
        item_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      })),
    }
  );
}
```

**Next.js API Route 示例**：

```typescript
// app/api/webhook/payment/route.ts
import { sendServerEvent } from "@/lib/server-analytics";

export async function POST(request: Request) {
  const payload = await request.json();

  if (payload.event === "payment.succeeded") {
    // 发送购买事件到 GA
    await sendServerEvent(payload.customer_id, "purchase", {
      transaction_id: payload.transaction_id,
      value: payload.amount / 100,
      currency: payload.currency,
    });
  }

  return Response.json({ received: true });
}
```

**获取 API Secret**：

1. GA4 管理界面 → 数据流 → 选择数据流
2. Measurement Protocol API secrets → 创建

**注意事项**：

- `client_id` 应该是持久化的用户标识（不是会话 ID）
- 事件名称和参数要与前端保持一致
- 服务端事件可能有延迟（几分钟到几小时）

**面试亮点**：

> "我们的支付流程使用服务端事件确保转化数据准确性。即使用户在支付后关闭页面，服务端仍能通过 webhook 发送 purchase 事件。"

---

## 八、最佳实践

### 1. 数据层设计

```typescript
// 定义统一的数据层接口
interface DataLayer {
  event: string;
  user?: {
    id: string;
    type: "guest" | "registered" | "premium";
    segment?: string;
  };
  page?: {
    type: "home" | "product" | "cart" | "checkout";
    category?: string;
  };
  ecommerce?: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>;
  };
}

// 使用
const pushDataLayer = (data: DataLayer) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
};
```

### 2. 事件命名规范

```typescript
// 推荐：使用 snake_case，与 GA4 推荐事件一致
const EVENTS = {
  // 页面相关
  PAGE_VIEW: "page_view",

  // 用户相关
  SIGN_UP: "sign_up",
  LOGIN: "login",
  LOGOUT: "logout",

  // 电商相关
  VIEW_ITEM: "view_item",
  ADD_TO_CART: "add_to_cart",
  PURCHASE: "purchase",

  // 交互相关
  BUTTON_CLICK: "button_click",
  FORM_SUBMIT: "form_submit",

  // 自定义业务
  FILTER_APPLIED: "filter_applied",
  WISHLIST_ADD: "wishlist_add",
} as const;

// 使用
trackEvent(EVENTS.ADD_TO_CART, { item_id: "SKU123" });
```

### 3. 错误监控

```typescript
// 全局错误处理
window.addEventListener("error", (event) => {
  trackEvent("exception", {
    description: event.message,
    fatal: false,
    stack: event.error?.stack?.substring(0, 500), // 限制长度
  });
});

// React Error Boundary
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackEvent("exception", {
      description: error.toString(),
      fatal: true,
      component: errorInfo.componentStack?.substring(0, 500),
    });
  }
}
```

### 4. A/B 测试集成

```typescript
// 结合 A/B 测试工具
const experimentVariant = getExperimentVariant("checkout_flow");

gtag("event", "experiment_impression", {
  experiment_id: "checkout_flow_v2",
  variant_id: experimentVariant,
});

// 设置用户属性
gtag("set", "user_properties", {
  experiment_checkout_flow: experimentVariant,
});

// 后续事件会自动关联实验
gtag("event", "purchase", {
  transaction_id: "T123",
  value: 99.99,
});
```

### 5. 自定义维度

```typescript
// 设置自定义维度
const setCustomDimensions = (user: User) => {
  gtag("set", "user_properties", {
    membership_level: user.membership, // 会员等级
    account_age_days: user.accountAgeDays, // 账户年龄
    lifetime_value: user.ltv, // 生命周期价值
    user_segment: user.segment, // 用户分群
  });
};

// 在登录后调用
setCustomDimensions(currentUser);
```

---

## 九、常见问题与解决方案

### 1. 事件未发送

**问题**：控制台没有错误，但事件未出现在 GA 中。

**排查步骤**：

```typescript
// 1. 检查 gtag 是否加载
console.log(typeof window.gtag); // 应该是 'function'

// 2. 检查 dataLayer
console.log(window.dataLayer);

// 3. 启用调试模式
gtag("config", "G-XXX", { debug_mode: true });

// 4. 使用 GA Debugger 扩展查看网络请求

// 5. 检查事件名称是否合法
// ❌ 不合法：大写字母、空格
gtag("event", "Button Click");

// ✅ 合法：小写、下划线
gtag("event", "button_click");
```

### 2. 重复事件

**问题**：同一个事件被发送多次。

**解决方案**：

```typescript
// 使用防抖
import { debounce } from "lodash";

const trackPageView = debounce((url: string) => {
  gtag("config", "G-XXX", { page_path: url });
}, 300);

// 或手动去重
let lastTrackedUrl = "";

const trackPageViewOnce = (url: string) => {
  if (url === lastTrackedUrl) return;

  gtag("config", "G-XXX", { page_path: url });
  lastTrackedUrl = url;
};
```

### 3. 数据采样

**问题**：高流量网站数据被采样（不完整）。

**解决方案**：

- 升级到 GA4（采样率比 UA 低）
- 使用 BigQuery 导出（无采样）
- 购买 GA360（企业版，无采样）

```typescript
// 降低事件频率
const trackScrollDepth = throttle((depth: number) => {
  // 只在 25%, 50%, 75%, 100% 时跟踪
  if ([25, 50, 75, 100].includes(depth)) {
    trackEvent("scroll_depth", { depth });
  }
}, 1000);
```

### 4. 跨域跟踪

**问题**：用户在多个域名间跳转，会话被中断。

**解决方案**：

```typescript
// 配置跨域跟踪
gtag("config", "G-XXX", {
  linker: {
    domains: ["example.com", "shop.example.com", "checkout.example.com"],
  },
});

// 手动添加 linker 参数
const url = new URL("https://checkout.example.com");
gtag("get", "G-XXX", "linker_param", (linkerParam) => {
  url.searchParams.append("_gl", linkerParam);
  window.location.href = url.toString();
});
```

---

## 十、实战案例

### 案例 1：完整的电商网站跟踪

```typescript
// hooks/useEcommerceTracking.ts
export function useEcommerceTracking() {
  // 产品曝光
  const trackProductImpression = (products: Product[]) => {
    gtag("event", "view_item_list", {
      item_list_id: "search_results",
      item_list_name: "Search Results",
      items: products.slice(0, 10).map((p, index) => ({
        item_id: p.id,
        item_name: p.name,
        price: p.price,
        index: index,
      })),
    });
  };

  // 产品点击
  const trackProductClick = (product: Product, listName: string) => {
    gtag("event", "select_item", {
      item_list_name: listName,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
        },
      ],
    });
  };

  // 查看产品详情
  const trackProductView = (product: Product) => {
    gtag("event", "view_item", {
      currency: "USD",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  };

  // 添加到购物车
  const trackAddToCart = (product: Product, quantity: number) => {
    gtag("event", "add_to_cart", {
      currency: "USD",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: quantity,
        },
      ],
    });
  };

  // 开始结账
  const trackBeginCheckout = (cart: CartItem[]) => {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    gtag("event", "begin_checkout", {
      currency: "USD",
      value: total,
      items: cart.map((item) => ({
        item_id: item.product_id,
        item_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  };

  // 购买完成
  const trackPurchase = (order: Order) => {
    gtag("event", "purchase", {
      transaction_id: order.id,
      value: order.total,
      currency: "USD",
      tax: order.tax,
      shipping: order.shipping,
      coupon: order.coupon_code,
      items: order.items.map((item) => ({
        item_id: item.product_id,
        item_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  };

  return {
    trackProductImpression,
    trackProductClick,
    trackProductView,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
  };
}
```

### 案例 2：用户旅程跟踪

```typescript
// 跟踪用户完整旅程
export class UserJourneyTracker {
  private sessionStart: number;
  private interactions: Array<{ event: string; timestamp: number }> = [];

  constructor() {
    this.sessionStart = Date.now();
    this.trackSessionStart();
  }

  private trackSessionStart() {
    gtag("event", "session_start", {
      engagement_time_msec: 0,
    });
  }

  trackInteraction(eventName: string, params?: any) {
    const timestamp = Date.now();
    this.interactions.push({ event: eventName, timestamp });

    gtag("event", eventName, {
      ...params,
      session_duration: Math.round((timestamp - this.sessionStart) / 1000),
      interaction_count: this.interactions.length,
    });
  }

  trackEngagement() {
    const engagementTime = Date.now() - this.sessionStart;

    gtag("event", "user_engagement", {
      engagement_time_msec: engagementTime,
      interaction_count: this.interactions.length,
    });
  }

  getJourneySummary() {
    return {
      duration: Date.now() - this.sessionStart,
      interactions: this.interactions.length,
      events: this.interactions.map((i) => i.event),
    };
  }
}

// 使用旅程跟踪
const journeyTracker = new UserJourneyTracker();

// 在各个交互点调用
journeyTracker.trackInteraction("button_click", { button_name: "cta" });
journeyTracker.trackInteraction("form_submit", { form_name: "contact" });

// 页面离开时
window.addEventListener("beforeunload", () => {
  journeyTracker.trackEngagement();
});
```

### 案例 3：性能监控集成

```typescript
// lib/performance-tracking.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

export function initPerformanceTracking() {
  function sendToGoogleAnalytics({ name, delta, id, rating }) {
    gtag("event", name, {
      value: Math.round(name === "CLS" ? delta * 1000 : delta),
      metric_id: id,
      metric_value: delta,
      metric_delta: delta,
      metric_rating: rating,
      event_category: "Web Vitals",
      non_interaction: true,
    });
  }

  getCLS(sendToGoogleAnalytics);
  getFID(sendToGoogleAnalytics);
  getFCP(sendToGoogleAnalytics);
  getLCP(sendToGoogleAnalytics);
  getTTFB(sendToGoogleAnalytics);

  // 自定义性能指标
  if (typeof window.performance !== "undefined") {
    window.addEventListener("load", () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domContentLoadedTime =
        perfData.domContentLoadedEventEnd - perfData.navigationStart;

      gtag("event", "performance_timing", {
        page_load_time: pageLoadTime,
        dom_content_loaded: domContentLoadedTime,
        event_category: "Performance",
        non_interaction: true,
      });
    });
  }
}
```

---

## 十一、总结与检查清单

### 实施检查清单

#### 基础设置

- [ ] GA4 属性已创建
- [ ] 数据流已配置
- [ ] gtag.js 或 GTM 已安装
- [ ] 基本 pageview 跟踪正常

#### 事件跟踪

- [ ] 核心转化事件已配置（purchase, sign_up, login 等）
- [ ] 电商事件完整（view_item → purchase）
- [ ] 自定义事件符合命名规范
- [ ] 事件参数完整且有意义

#### 隐私合规

- [ ] Cookie 同意横幅已实现
- [ ] Consent Mode 已配置
- [ ] 隐私政策已更新
- [ ] 数据保留政策已设置

#### 测试验证

- [ ] Debug 模式验证事件
- [ ] DebugView 查看实时数据
- [ ] 多环境隔离（dev/staging/prod）
- [ ] 关键漏斗端到端测试

#### 性能优化

- [ ] 延迟加载策略
- [ ] 事件数量控制
- [ ] 批处理机制（如需要）
- [ ] Core Web Vitals 未受影响

### 面试准备要点

1. **理解核心概念**：事件驱动模型、参数、维度、指标
2. **实战经验**：能讲出具体实现细节和遇到的问题
3. **性能优化**：知道如何减少对性能的影响
4. **隐私合规**：了解 GDPR、Cookie 同意、Consent Mode
5. **调试能力**：能快速定位和解决 GA 问题
6. **业务理解**：知道如何用 GA 数据驱动业务决策

---

**文档版本**：v1.0  
**最后更新**：2025-12-29  
**适用版本**：Google Analytics 4 (GA4)
