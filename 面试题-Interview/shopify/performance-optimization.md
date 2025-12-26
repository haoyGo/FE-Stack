# 电商性能优化实战指南

> 针对 Shopify 等电商网站的深度性能优化方案

---

## 一、图片优化（最关键）

### 1. 现代图片格式

**格式对比**：
| 格式 | 压缩率 | 浏览器支持 | 适用场景 |
|------|--------|-----------|---------|
| **AVIF** | 最高（50%+ vs JPEG） | 较新 | 商品主图 |
| **WebP** | 高（30%+ vs JPEG） | 广泛 | 通用场景 |
| **JPEG** | 中 | 全部 | 降级方案 |
| **PNG** | 低 | 全部 | 需要透明度 |

**实战代码**：

```html
<!-- 1. Picture 标签实现渐进降级 -->
<picture>
  <source srcset="product.avif" type="image/avif" />
  <source srcset="product.webp" type="image/webp" />
  <img src="product.jpg" alt="Product" loading="lazy" />
</picture>

<!-- 2. 响应式图片 -->
<img
  srcset="product-400.webp 400w, product-800.webp 800w, product-1200.webp 1200w"
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  src="product-800.webp"
  alt="Product"
  loading="lazy"
/>
```

### 2. 懒加载策略

#### 原生懒加载

```html
<!-- 首屏图片：eager -->
<img src="hero.jpg" loading="eager" fetchpriority="high" />

<!-- 下方图片：lazy -->
<img src="product.jpg" loading="lazy" />
```

#### Intersection Observer 精细控制

```typescript
// hooks/useLazyLoad.ts
import { useEffect, useRef, useState } from "react";

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

export const useLazyLoad = (options: LazyLoadOptions = {}) => {
  const { rootMargin = "200px", threshold = 0.1, once = true } = options;

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, once]);

  return { ref, isVisible };
};

// 使用示例
function ProductImage({ src, alt }: { src: string; alt: string }) {
  const { ref, isVisible } = useLazyLoad({ rootMargin: "100px" });

  return (
    <div ref={ref} className="product-image">
      {isVisible ? <img src={src} alt={alt} /> : <div className="skeleton" />}
    </div>
  );
}
```

#### 渐进式图片加载

```typescript
// components/ProgressiveImage.tsx
import { useState, useEffect } from "react";

interface Props {
  placeholder: string; // 低质量占位图（小）
  src: string; // 高质量图片
  alt: string;
}

export const ProgressiveImage = ({ placeholder, src, alt }: Props) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
  }, [src]);

  return (
    <div className="progressive-image">
      <img
        src={imageSrc}
        alt={alt}
        className={isLoading ? "loading" : "loaded"}
      />
    </div>
  );
};
```

```css
/* 模糊到清晰动画 */
.progressive-image img.loading {
  filter: blur(10px);
  transition: filter 0.3s;
}

.progressive-image img.loaded {
  filter: blur(0);
}
```

### 3. Shopify CDN 优化

**Shopify CDN 参数**：

```javascript
// 图片 URL 转换工具
const shopifyImageUrl = (url: string, size: string) => {
  // Shopify CDN 支持的尺寸
  // pico (16x16), icon (32x32), thumb (50x50), small (100x100)
  // compact (160x160), medium (240x240), large (480x480)
  // grande (600x600), 1024x1024, 2048x2048

  return url.replace(/\.(jpg|jpeg|png|gif|webp)/, `_${size}.$1`);
};

// 使用示例
const productImage = shopifyImageUrl(
  "https://cdn.shopify.com/s/files/1/0001/product.jpg",
  "grande"
);
// => https://cdn.shopify.com/s/files/1/0001/product_grande.jpg
```

**自定义尺寸**：

```javascript
// Shopify Storefront API 支持自定义尺寸
const customSizeUrl = (url: string, width: number, height?: number) => {
  const size = height ? `${width}x${height}` : `${width}x`;
  return `${url}&width=${width}${height ? `&height=${height}` : ""}`;
};
```

---

## 二、Bundle 优化

### 1. 代码分割策略

#### 路由级分割

```typescript
// ✅ 推荐：React.lazy + Suspense
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </Suspense>
  );
}
```

#### 组件级分割

```typescript
// 非首屏组件懒加载
const Reviews = lazy(() => import("./components/Reviews"));
const RelatedProducts = lazy(() => import("./components/RelatedProducts"));

function ProductPage() {
  return (
    <div>
      <ProductHero /> {/* 首屏立即渲染 */}
      <Suspense fallback={<Skeleton />}>
        <Reviews /> {/* 滚动到才加载 */}
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <RelatedProducts />
      </Suspense>
    </div>
  );
}
```

#### 第三方库按需加载

```typescript
// ❌ 避免：一次性导入所有 icons
import { IconHome, IconCart, IconUser } from "huge-icon-library";

// ✅ 推荐：按需导入
import IconHome from "huge-icon-library/IconHome";
import IconCart from "huge-icon-library/IconCart";

// 或使用动态导入
const loadIcon = async (name: string) => {
  const module = await import(`huge-icon-library/${name}`);
  return module.default;
};
```

### 2. Tree Shaking 优化

```javascript
// package.json 配置
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}

// ✅ ESM 导出（支持 tree shaking）
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// ❌ CommonJS（不支持）
module.exports = { add, subtract };
```

### 3. Bundle 分析

```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# Next.js
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // 配置
});

// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

**优化目标**：

- 首次加载 JS < 200KB（gzip）
- 单个 chunk < 100KB
- 关键路径 chunks < 50KB

---

## 三、缓存策略

### 1. HTTP 缓存

```nginx
# nginx 配置
location ~* \.(jpg|jpeg|png|gif|ico|webp|avif)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location ~* \.(css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location / {
  add_header Cache-Control "public, max-age=3600, must-revalidate";
}
```

**Next.js 配置**：

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
```

### 2. Service Worker 缓存

```typescript
// sw.ts
const CACHE_NAME = "shopify-store-v1";
const STATIC_ASSETS = ["/", "/styles/main.css", "/scripts/main.js"];

// 安装时缓存静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 网络优先策略（商品数据）
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/products")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// 缓存优先策略（图片）
self.addEventListener("fetch", (event) => {
  if (event.request.url.match(/\.(jpg|png|webp|gif)$/)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

### 3. 本地存储缓存

```typescript
// utils/storage.ts
interface CacheOptions {
  ttl?: number; // 毫秒
}

class StorageCache {
  set(key: string, value: any, options: CacheOptions = {}) {
    const { ttl = 5 * 60 * 1000 } = options; // 默认5分钟

    const item = {
      value,
      expiry: Date.now() + ttl,
    };

    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error("Storage cache set error:", e);
    }
  }

  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);

      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (e) {
      console.error("Storage cache get error:", e);
      return null;
    }
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}

export const storageCache = new StorageCache();

// 使用示例
storageCache.set("product:123", productData, { ttl: 10 * 60 * 1000 }); // 10分钟
const cached = storageCache.get<Product>("product:123");
```

---

## 四、关键渲染路径优化

### 1. 资源优先级

```html
<!-- 1. DNS 预解析 -->
<link rel="dns-prefetch" href="https://cdn.shopify.com" />

<!-- 2. 预连接 -->
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin />

<!-- 3. 预加载关键资源 -->
<link
  rel="preload"
  href="/fonts/main.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link rel="preload" href="/styles/critical.css" as="style" />
<link rel="preload" href="/images/hero.webp" as="image" />

<!-- 4. 预取下一页资源 -->
<link rel="prefetch" href="/products/bestseller" />

<!-- 5. 预渲染 -->
<link rel="prerender" href="/checkout" />
```

**Next.js 自动优化**：

```typescript
// Next.js 自动处理 prefetch
import Link from "next/link";

<Link href="/product/123" prefetch={true}>
  View Product
</Link>;
```

### 2. Critical CSS

```typescript
// 提取首屏 CSS
// 使用工具：critical, critters

// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true, // 自动内联 critical CSS
  },
};
```

**手动实现**：

```html
<head>
  <!-- 内联关键 CSS -->
  <style>
    /* 首屏样式 */
    .hero {
      ...;
    }
    .header {
      ...;
    }
  </style>

  <!-- 异步加载完整 CSS -->
  <link
    rel="preload"
    href="/styles/main.css"
    as="style"
    onload="this.onload=null;this.rel='stylesheet'"
  />
  <noscript><link rel="stylesheet" href="/styles/main.css" /></noscript>
</head>
```

### 3. JavaScript 加载优化

```html
<!-- 1. defer：保持顺序，DOMContentLoaded 前执行 -->
<script defer src="/scripts/analytics.js"></script>

<!-- 2. async：不保证顺序，下载完立即执行 -->
<script async src="/scripts/third-party.js"></script>

<!-- 3. type="module"：自动 defer -->
<script type="module" src="/scripts/main.js"></script>
```

**动态加载非关键脚本**：

```typescript
// 延迟加载第三方脚本
function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// 空闲时加载
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => {
    loadScript("https://analytics.example.com/script.js");
  });
} else {
  setTimeout(() => {
    loadScript("https://analytics.example.com/script.js");
  }, 2000);
}
```

---

## 五、Web Vitals 优化实战

### 1. LCP（Largest Contentful Paint）优化

**目标**：< 2.5s

**优化点**：

```typescript
// 1. 优化主图加载
<img
  src="hero.webp"
  loading="eager"           // 立即加载
  fetchpriority="high"      // 高优先级
  width="1200"
  height="800"
/>

// 2. 预加载 LCP 资源
<link rel="preload" as="image" href="hero.webp" fetchpriority="high">

// 3. 使用 CDN
const imageUrl = `https://cdn.shopify.com/product_${size}.webp`;

// 4. SSR 渲染关键内容
// Next.js 使用 getServerSideProps 或 Server Components
```

### 2. CLS（Cumulative Layout Shift）优化

**目标**：< 0.1

**优化点**：

```html
<!-- 1. 为所有图片设置尺寸 -->
<img src="product.jpg" width="800" height="600" alt="Product" />

<!-- 2. 使用 aspect-ratio -->
<style>
  .product-image {
    aspect-ratio: 4 / 3;
    width: 100%;
  }
</style>

<!-- 3. 为动态内容预留空间 -->
<div class="skeleton" style="min-height: 200px;">
  <!-- 加载后的内容 -->
</div>

<!-- 4. 避免在现有内容上方插入 -->
<!-- ❌ 避免 -->
<div id="banner"></div>
<div id="content">...</div>

<!-- ✅ 使用 position: fixed -->
<div id="banner" style="position: fixed; top: 0;"></div>
```

```typescript
// 监控 CLS
import { getCLS } from "web-vitals";

getCLS((metric) => {
  console.log("CLS:", metric.value);

  // 上报到分析服务
  analytics.track("web-vitals", {
    name: metric.name,
    value: metric.value,
  });
});
```

### 3. FID/INP 优化

**目标**：FID < 100ms, INP < 200ms

**优化点**：

```typescript
// 1. 减少主线程阻塞
// ❌ 避免：长任务
for (let i = 0; i < 1000000; i++) {
  // 耗时操作
}

// ✅ 分片执行
async function processInChunks(items: any[], chunkSize = 100) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await processChunk(chunk);

    // 让出主线程
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

// 2. 使用 Web Workers
// worker.ts
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};

// main.ts
const worker = new Worker("/worker.js");
worker.postMessage(data);
worker.onmessage = (e) => {
  console.log("Result:", e.data);
};

// 3. 防抖/节流用户输入
const debouncedSearch = useMemo(
  () =>
    debounce((query: string) => {
      searchProducts(query);
    }, 300),
  []
);
```

---

## 六、性能监控

### 1. 实时监控

```typescript
// lib/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: any) {
  // 发送到分析服务
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(metric),
    keepalive: true, // 确保在页面卸载时也能发送
  });
}

// 监控所有核心指标
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// 自定义指标
performance.mark("cart-render-start");
// ... 购物车渲染
performance.mark("cart-render-end");
performance.measure("cart-render", "cart-render-start", "cart-render-end");

const measure = performance.getEntriesByName("cart-render")[0];
sendToAnalytics({
  name: "cart-render",
  value: measure.duration,
});
```

### 2. Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm install -g @lhci/cli
      - run: lhci autorun
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000", "http://localhost:3000/products/1"],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

---

## 七、面试问答

### Q1：如何优化商品列表的图片加载？

**答**：

1. 使用懒加载（Intersection Observer）
2. 响应式图片（srcset + sizes）
3. 现代格式（WebP/AVIF）
4. Shopify CDN 自动优化
5. 渐进式加载（低质量占位图）

### Q2：如何减少 Bundle 大小？

**答**：

1. 代码分割（路由、组件）
2. Tree Shaking（ESM 模块）
3. 按需导入（第三方库）
4. 移除未使用代码
5. 压缩混淆（Terser）

### Q3：如何优化 LCP？

**答**：

1. 优化服务器响应时间（SSR）
2. 预加载关键资源（preload）
3. 优化主图加载（eager + high priority）
4. 使用 CDN
5. 移除渲染阻塞资源

### Q4：缓存策略如何设计？

**答**：

1. 静态资源：长期缓存 + hash
2. API 数据：短期缓存 + stale-while-revalidate
3. 用户数据：LocalStorage + TTL
4. Service Worker：网络优先 + 缓存降级

---

## 性能优化 Checklist

- [ ] 图片使用 WebP/AVIF
- [ ] 实现懒加载
- [ ] 配置响应式图片
- [ ] 路由级代码分割
- [ ] Bundle 大小 < 200KB
- [ ] 配置 HTTP 缓存
- [ ] 实现 Critical CSS
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FID < 100ms
- [ ] 配置性能监控
- [ ] Lighthouse 分数 > 90

---

## 推荐工具

- [web-vitals](https://github.com/GoogleChrome/web-vitals) - Web Vitals 监控
- [next/image](https://nextjs.org/docs/api-reference/next/image) - Next.js 图片优化
- [sharp](https://sharp.pixelplumbing.com/) - 图片处理
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - CI/CD 性能测试
- [Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) - Bundle 分析
