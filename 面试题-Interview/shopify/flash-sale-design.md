# 秒杀和大促系统设计

> 高并发场景下的电商系统架构与优化方案

---

## 一、秒杀系统核心挑战

### 1. 技术挑战

| 挑战           | 描述           | 影响           |
| -------------- | -------------- | -------------- |
| **高并发**     | 瞬间大量请求   | 服务器崩溃     |
| **超卖问题**   | 库存扣减不准确 | 业务损失       |
| **黄牛党**     | 恶意刷单       | 真实用户体验差 |
| **数据一致性** | 分布式环境     | 库存不准       |

### 2. 系统目标

- ✅ **可用性**：系统不崩溃
- ✅ **准确性**：不超卖
- ✅ **公平性**：防黄牛
- ✅ **体验**：页面不卡顿

---

## 二、前端架构设计

### 1. 页面静态化

**核心思路**：将秒杀页面预先生成静态 HTML，存储到 CDN

```typescript
// Next.js SSG 实现
export async function getStaticProps() {
  const product = await fetchFlashSaleProduct();

  return {
    props: {
      product,
      startTime: "2024-01-01T10:00:00Z",
    },
    revalidate: 60, // ISR: 60秒重新生成
  };
}

export default function FlashSalePage({ product, startTime }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [canBuy, setCanBuy] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const diff = start - now;

      if (diff <= 0) {
        setCanBuy(true);
        clearInterval(interval);
      } else {
        setTimeLeft(diff);
      }
    }, 100); // 100ms 精度

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flash-sale">
      <ProductImage src={product.image} priority />

      {!canBuy ? (
        <Countdown timeLeft={timeLeft} />
      ) : (
        <BuyButton productId={product.id} />
      )}
    </div>
  );
}
```

**CDN 配置**：

```nginx
# nginx 配置
location /flash-sale {
  # 静态资源长缓存
  expires 1h;
  add_header Cache-Control "public, must-revalidate";

  # 开启 gzip
  gzip on;
  gzip_types text/html text/css application/javascript;

  # CDN 回源
  proxy_pass http://origin-server;
}
```

### 2. 倒计时精确实现

```typescript
// hooks/useCountdown.ts
import { useState, useEffect, useRef } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  isFinished: boolean;
}

export function useCountdown(targetDate: Date | string): CountdownResult {
  const targetTime = new Date(targetDate).getTime();
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const remaining = targetTime - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(remaining);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetTime]);

  const isFinished = timeLeft <= 0;

  return {
    days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
    hours: Math.floor((timeLeft / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((timeLeft / (1000 * 60)) % 60),
    seconds: Math.floor((timeLeft / 1000) % 60),
    milliseconds: Math.floor(timeLeft % 1000),
    isFinished,
  };
}

// 使用示例
function CountdownTimer({ startTime }: { startTime: string }) {
  const { hours, minutes, seconds, milliseconds, isFinished } =
    useCountdown(startTime);

  if (isFinished) {
    return <button>立即抢购</button>;
  }

  return (
    <div className="countdown">
      <span>{hours.toString().padStart(2, "0")}</span>:
      <span>{minutes.toString().padStart(2, "0")}</span>:
      <span>{seconds.toString().padStart(2, "0")}</span>.
      <span className="ms">{Math.floor(milliseconds / 10)}</span>
    </div>
  );
}
```

### 3. 防重复点击

```typescript
// hooks/useThrottledClick.ts
import { useRef, useCallback } from "react";

export function useThrottledClick(
  onClick: () => void | Promise<void>,
  delay: number = 3000
) {
  const isProcessing = useRef(false);
  const lastClickTime = useRef(0);

  const handleClick = useCallback(async () => {
    const now = Date.now();

    // 正在处理中
    if (isProcessing.current) {
      console.log("请勿重复点击");
      return;
    }

    // 时间间隔不够
    if (now - lastClickTime.current < delay) {
      console.log("点击过快，请稍候");
      return;
    }

    isProcessing.current = true;
    lastClickTime.current = now;

    try {
      await onClick();
    } finally {
      isProcessing.current = false;
    }
  }, [onClick, delay]);

  return handleClick;
}

// 使用示例
function BuyButton({ productId }: { productId: string }) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleBuy = async () => {
    setStatus("loading");

    try {
      const response = await fetch("/api/flash-sale/buy", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        // 跳转到订单页
        window.location.href = `/orders/${data.orderId}`;
      } else {
        setStatus("error");
        alert(data.message);
      }
    } catch (error) {
      setStatus("error");
      alert("网络错误，请重试");
    }
  };

  const throttledBuy = useThrottledClick(handleBuy, 3000);

  return (
    <button
      onClick={throttledBuy}
      disabled={status === "loading"}
      className={`buy-btn ${status}`}
    >
      {status === "loading" ? "处理中..." : "立即抢购"}
    </button>
  );
}
```

### 4. 库存实时更新

**WebSocket 实现**：

```typescript
// lib/flashSaleSocket.ts
import { useEffect, useState } from "react";

interface StockUpdate {
  productId: string;
  stock: number;
  sold: number;
}

export function useFlashSaleStock(productId: string) {
  const [stock, setStock] = useState<number | null>(null);
  const [sold, setSold] = useState<number>(0);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/flash-sale/${productId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data: StockUpdate = JSON.parse(event.data);
      setStock(data.stock);
      setSold(data.sold);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      // 重连逻辑
    };

    return () => {
      ws.close();
    };
  }, [productId]);

  return { stock, sold };
}

// 使用示例
function StockDisplay({ productId }: { productId: string }) {
  const { stock, sold } = useFlashSaleStock(productId);

  if (stock === null) return <div>加载中...</div>;

  const percentage = stock + sold > 0 ? (sold / (stock + sold)) * 100 : 0;

  return (
    <div className="stock-display">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${percentage}%` }} />
      </div>
      <p>
        剩余 <strong>{stock}</strong> 件，已售 {sold} 件
      </p>
      {stock === 0 && <span className="sold-out">已抢光</span>}
    </div>
  );
}
```

**轮询降级方案**：

```typescript
// 当 WebSocket 不可用时，使用轮询
export function usePollingStock(productId: string, interval = 2000) {
  const [stock, setStock] = useState<number | null>(null);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch(`/api/flash-sale/${productId}/stock`);
        const data = await response.json();
        setStock(data.stock);
      } catch (error) {
        console.error("Fetch stock error:", error);
      }
    };

    fetchStock();
    const timer = setInterval(fetchStock, interval);

    return () => clearInterval(timer);
  }, [productId, interval]);

  return { stock };
}
```

---

## 三、后端架构设计（前端需要了解）

### 1. 限流策略

**前端配合**：

```typescript
// 客户端限流（防止恶意刷新）
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, window: number) {
    this.limit = limit; // 最多请求数
    this.window = window; // 时间窗口（ms）
  }

  canRequest(): boolean {
    const now = Date.now();

    // 清理过期请求
    this.requests = this.requests.filter((time) => now - time < this.window);

    if (this.requests.length < this.limit) {
      this.requests.push(now);
      return true;
    }

    return false;
  }
}

// 使用示例
const limiter = new RateLimiter(5, 60000); // 1分钟最多5次

async function buyProduct(productId: string) {
  if (!limiter.canRequest()) {
    alert("请求过于频繁，请稍候再试");
    return;
  }

  // 发送请求
  await fetch("/api/buy", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}
```

### 2. 令牌桶（Token）机制

**流程**：

1. 用户访问秒杀页面，获取 token
2. 点击购买时，携带 token
3. 服务端验证 token，一次性使用

```typescript
// 获取购买令牌
async function requestBuyToken(productId: string): Promise<string | null> {
  try {
    const response = await fetch("/api/flash-sale/token", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Request token error:", error);
    return null;
  }
}

// 使用 token 购买
async function buyWithToken(productId: string, token: string) {
  const response = await fetch("/api/flash-sale/buy", {
    method: "POST",
    headers: {
      "X-Flash-Sale-Token": token,
    },
    body: JSON.stringify({ productId }),
  });

  return response.json();
}

// 完整流程
function FlashSaleBuyButton({ productId }: { productId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // 页面加载时获取 token
  useEffect(() => {
    requestBuyToken(productId).then(setToken);
  }, [productId]);

  const handleBuy = async () => {
    if (!token) {
      alert("正在准备中，请稍候");
      return;
    }

    setStatus("loading");

    try {
      const result = await buyWithToken(productId, token);

      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        alert(result.message);

        // 失败后重新获取 token
        const newToken = await requestBuyToken(productId);
        setToken(newToken);
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <button onClick={handleBuy} disabled={!token || status === "loading"}>
      {status === "loading" ? "抢购中..." : "立即抢购"}
    </button>
  );
}
```

---

## 四、大促页面优化

### 1. 首屏优化

**关键指标**：

- FCP < 1s
- LCP < 2s
- TTI < 3s

**优化方案**：

```typescript
// 1. 预加载关键资源
export default function FlashSaleLayout() {
  return (
    <>
      <Head>
        {/* DNS 预解析 */}
        <link rel="dns-prefetch" href="https://cdn.example.com" />
        <link rel="dns-prefetch" href="https://api.example.com" />

        {/* 预连接 */}
        <link
          rel="preconnect"
          href="https://cdn.example.com"
          crossOrigin="anonymous"
        />

        {/* 预加载关键资源 */}
        <link
          rel="preload"
          href="/fonts/main.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/images/banner.webp" as="image" />

        {/* Critical CSS */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </Head>

      {/* 内容 */}
    </>
  );
}

// 2. 组件懒加载
const ProductReviews = lazy(() => import("./ProductReviews"));
const RelatedProducts = lazy(() => import("./RelatedProducts"));
const Footer = lazy(() => import("./Footer"));

function FlashSalePage({ product }: Props) {
  return (
    <div>
      {/* 首屏内容 */}
      <ProductHero product={product} />
      <BuySection product={product} />

      {/* 非首屏懒加载 */}
      <Suspense fallback={<Skeleton />}>
        <ProductReviews productId={product.id} />
      </Suspense>

      <Suspense fallback={null}>
        <RelatedProducts categoryId={product.categoryId} />
      </Suspense>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
```

### 2. 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from "next/image";

function ProductBanner({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt="Flash Sale"
      width={1200}
      height={600}
      priority // 首屏图片优先加载
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/..." // 低质量占位图
    />
  );
}

// 自定义 Image Loader
const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  return `https://cdn.example.com/${src}?w=${width}&q=${quality || 75}`;
};

<Image loader={imageLoader} src="product.jpg" width={800} height={600} />;
```

### 3. 数据预取

```typescript
// 鼠标悬停时预取数据
function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();

  const prefetchProduct = () => {
    queryClient.prefetchQuery({
      queryKey: ["product", product.id],
      queryFn: () => fetchProductDetail(product.id),
    });
  };

  return (
    <Link
      href={`/products/${product.id}`}
      onMouseEnter={prefetchProduct} // 鼠标悬停预取
      onTouchStart={prefetchProduct} // 移动端触摸预取
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
    </Link>
  );
}
```

### 4. 降级方案

```typescript
// 服务降级配置
const DEGRADATION_CONFIG = {
  // 关闭非核心功能
  disableReviews: true,
  disableRecommendations: true,
  disableLiveChat: true,

  // 简化UI
  simplifiedUI: true,

  // 限制并发
  maxConcurrentRequests: 3,
};

function FlashSalePage({ product, isDegraded }: Props) {
  if (isDegraded) {
    // 降级版本：只保留核心功能
    return (
      <div className="simple-layout">
        <ProductImage src={product.image} />
        <ProductInfo product={product} />
        <BuyButton productId={product.id} />
      </div>
    );
  }

  // 完整版本
  return <FullFeaturePage product={product} />;
}
```

---

## 五、监控和告警

### 1. 性能监控

```typescript
// 上报性能指标
import { getCLS, getFID, getLCP } from "web-vitals";

function reportWebVitals(metric: any) {
  // 发送到分析服务
  fetch("/api/analytics/web-vitals", {
    method: "POST",
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      page: window.location.pathname,
      timestamp: Date.now(),
    }),
    keepalive: true,
  });
}

getCLS(reportWebVitals);
getFID(reportWebVitals);
getLCP(reportWebVitals);

// 自定义指标
performance.mark("flash-sale-start");
// ... 秒杀流程
performance.mark("flash-sale-end");
performance.measure(
  "flash-sale-duration",
  "flash-sale-start",
  "flash-sale-end"
);

const measure = performance.getEntriesByName("flash-sale-duration")[0];
reportWebVitals({
  name: "flash-sale-duration",
  value: measure.duration,
});
```

### 2. 错误监控

```typescript
// 全局错误捕获
window.addEventListener("error", (event) => {
  fetch("/api/analytics/error", {
    method: "POST",
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      page: window.location.pathname,
      timestamp: Date.now(),
    }),
    keepalive: true,
  });
});

// Promise 错误捕获
window.addEventListener("unhandledrejection", (event) => {
  fetch("/api/analytics/error", {
    method: "POST",
    body: JSON.stringify({
      message: "Unhandled Promise Rejection",
      reason: event.reason,
      page: window.location.pathname,
      timestamp: Date.now(),
    }),
    keepalive: true,
  });
});
```

### 3. 业务指标监控

```typescript
// 关键业务指标
class FlashSaleMetrics {
  // PV/UV
  trackPageView(productId: string) {
    this.send("page_view", { productId });
  }

  // 点击购买按钮
  trackBuyClick(productId: string) {
    this.send("buy_click", { productId });
  }

  // 加入购物车成功
  trackAddToCartSuccess(productId: string) {
    this.send("add_to_cart_success", { productId });
  }

  // 加入购物车失败
  trackAddToCartFail(productId: string, reason: string) {
    this.send("add_to_cart_fail", { productId, reason });
  }

  // 支付成功
  trackPaymentSuccess(orderId: string, amount: number) {
    this.send("payment_success", { orderId, amount });
  }

  private send(event: string, data: any) {
    fetch("/api/analytics/event", {
      method: "POST",
      body: JSON.stringify({
        event,
        data,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
      }),
      keepalive: true,
    });
  }

  private getSessionId(): string {
    // 从 cookie 或 localStorage 获取
    return localStorage.getItem("sessionId") || "";
  }
}

const metrics = new FlashSaleMetrics();

// 使用
function BuyButton({ productId }: { productId: string }) {
  const handleClick = async () => {
    metrics.trackBuyClick(productId);

    try {
      const result = await buyProduct(productId);

      if (result.success) {
        metrics.trackAddToCartSuccess(productId);
      } else {
        metrics.trackAddToCartFail(productId, result.message);
      }
    } catch (error) {
      metrics.trackAddToCartFail(productId, "network_error");
    }
  };

  return <button onClick={handleClick}>立即抢购</button>;
}
```

---

## 六、面试问答

### Q1：秒杀系统前端如何优化？

**答**：

1. **页面静态化**：SSG + CDN，减少服务器压力
2. **倒计时**：使用 requestAnimationFrame 精确计时
3. **防重复点击**：节流 + loading 状态
4. **库存更新**：WebSocket 实时推送，降级轮询
5. **资源预加载**：preload/prefetch 关键资源
6. **降级方案**：高峰期关闭非核心功能

### Q2：如何防止超卖？

**答**（前端角度）：

1. **乐观更新**：先更新 UI，失败回滚
2. **库存显示**：实时展示剩余库存
3. **限制购买数量**：前端校验 + 后端兜底
4. **token 机制**：每次购买需要有效 token

### Q3：如何处理高并发？

**答**：

1. **CDN 加速**：静态资源分发
2. **客户端限流**：防止单用户频繁请求
3. **请求队列**：串行化请求，避免并发
4. **降级熔断**：服务异常时快速失败

### Q4：大促页面首屏如何优化到 1s 内？

**答**：

1. **SSG/SSR**：服务端渲染
2. **Critical CSS**：内联首屏样式
3. **图片优化**：WebP + CDN + lazy
4. **代码分割**：非首屏组件懒加载
5. **预连接**：DNS/TCP 提前建立
6. **HTTP/2**：多路复用

---

## 七、完整流程示例

```typescript
// pages/flash-sale/[id].tsx
export async function getStaticProps({ params }: GetStaticPropsContext) {
  const product = await fetchFlashSaleProduct(params.id as string);

  return {
    props: { product },
    revalidate: 60, // ISR
  };
}

export default function FlashSalePage({ product }: Props) {
  const { stock, sold } = useFlashSaleStock(product.id);
  const { hours, minutes, seconds, isFinished } = useCountdown(
    product.startTime
  );
  const [status, setStatus] = useState<
    "idle" | "buying" | "success" | "soldout"
  >("idle");

  const handleBuy = useThrottledClick(async () => {
    setStatus("buying");

    try {
      // 1. 获取 token
      const token = await requestBuyToken(product.id);
      if (!token) throw new Error("获取token失败");

      // 2. 调用购买 API
      const result = await buyWithToken(product.id, token);

      if (result.success) {
        setStatus("success");
        // 跳转订单页
        router.push(`/orders/${result.orderId}`);
      } else if (result.code === "SOLD_OUT") {
        setStatus("soldout");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert(error.message);
      setStatus("idle");
    }
  }, 3000);

  return (
    <div className="flash-sale-page">
      {/* 商品信息 */}
      <ProductSection product={product} />

      {/* 库存显示 */}
      <StockDisplay stock={stock} sold={sold} />

      {/* 倒计时 / 购买按钮 */}
      {!isFinished ? (
        <Countdown hours={hours} minutes={minutes} seconds={seconds} />
      ) : stock > 0 ? (
        <button
          onClick={handleBuy}
          disabled={status === "buying"}
          className={`buy-btn ${status}`}
        >
          {status === "buying" ? "抢购中..." : "立即抢购"}
        </button>
      ) : (
        <button disabled className="sold-out-btn">
          已抢光
        </button>
      )}
    </div>
  );
}
```

---

## Checklist

**前端优化**：

- [ ] 页面静态化（SSG/ISR）
- [ ] CDN 配置（静态资源、HTML）
- [ ] 倒计时精确实现（RAF）
- [ ] 防重复点击（节流）
- [ ] 库存实时更新（WebSocket）
- [ ] 图片优化（WebP + lazy）
- [ ] 代码分割（路由 + 组件）
- [ ] 性能监控（Web Vitals）
- [ ] 错误监控（Sentry）
- [ ] 降级方案（简化 UI）

**测试验证**：

- [ ] 压力测试（10000+ 并发）
- [ ] 弱网测试（3G/4G）
- [ ] 降级测试（模拟服务异常）
- [ ] 兼容性测试（iOS/Android）

祝秒杀成功！🎯🚀
