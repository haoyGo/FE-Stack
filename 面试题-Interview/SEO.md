# 前端 SEO 优化完全指南

> 高级/资资深前端必备：从基础到实战的 SEO 优化方案

---

## 目录

1. [SEO 基础概念](#一seo-基础概念)
2. [技术 SEO 基础](#二技术-seo-基础)
3. [HTML 优化](#三html-优化)
4. [Meta 标签优化](#四meta-标签优化)
5. [结构化数据](#五结构化数据-schema)
6. [性能优化与 SEO](#六性能优化与-seo)
7. [SSR/SSG 与 SEO](#七ssrssg-与-seo)
8. [移动端 SEO](#八移动端-seo)
9. [内容优化](#九内容优化)
10. [链接优化](#十链接优化)
11. [常见问题排查](#十一常见问题排查)
12. [工具和监控](#十二工具和监控)
13. [面试高频问题](#十三面试高频问题)

---

## 一、SEO 基础概念

### 1. 什么是 SEO？

**SEO (Search Engine Optimization)** - 搜索引擎优化

**核心目标**：

- 提升网站在搜索引擎中的排名
- 增加自然流量（Organic Traffic）
- 提高用户体验
- 提升品牌曝光度

### 2. SEO 三大支柱

```
SEO
├── 技术 SEO (Technical SEO)
│   ├── 网站结构
│   ├── 页面性能
│   ├── 移动友好
│   └── 可索引性
│
├── 站内 SEO (On-Page SEO)
│   ├── 内容质量
│   ├── 关键词优化
│   ├── Meta 标签
│   └── 结构化数据
│
└── 站外 SEO (Off-Page SEO)
    ├── 外链建设
    ├── 社交信号
    └── 品牌提及
```

**前端主要负责**：技术 SEO + 站内 SEO

### 3. 搜索引擎工作原理

```
爬取 (Crawling)
    ↓
索引 (Indexing)
    ↓
排名 (Ranking)
    ↓
展示 (Display)
```

**关键点**：

1. **Crawling**：爬虫访问页面
2. **Indexing**：提取内容建立索引
3. **Ranking**：根据算法计算排名
4. **Display**：展示在搜索结果中

---

## 二、技术 SEO 基础

### 1. robots.txt

**作用**：告诉搜索引擎哪些页面可以抓取

```txt
# 允许所有爬虫
User-agent: *
Allow: /

# 禁止特定路径
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# 禁止特定文件
Disallow: /*.json$
Disallow: /*.pdf$

# Google 特定规则
User-agent: Googlebot
Allow: /api/public/

# Sitemap 位置
Sitemap: https://example.com/sitemap.xml
```

**最佳实践**：

```typescript
// Next.js 动态生成 robots.txt
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/private/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/api/public/"],
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

### 2. Sitemap

**作用**：提供网站所有页面的地图，帮助搜索引擎发现内容

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/products/iphone-14</loc>
    <lastmod>2024-01-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**动态生成 Sitemap**：

```typescript
// Next.js 动态生成 sitemap
// app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 获取所有产品
  const products = await fetchAllProducts();

  // 静态页面
  const routes = ["", "/about", "/contact"].map((route) => ({
    url: `https://example.com${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // 动态页面
  const productRoutes = products.map((product) => ({
    url: `https://example.com/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...routes, ...productRoutes];
}
```

### 3. Canonical URL

**作用**：指定页面的规范版本，避免重复内容

```html
<!-- 原始页面 -->
<link rel="canonical" href="https://example.com/products/iphone-14" />

<!-- 分页 -->
<!-- https://example.com/products?page=2 -->
<link rel="canonical" href="https://example.com/products" />

<!-- 多语言 -->
<!-- https://example.com/zh/products -->
<link rel="canonical" href="https://example.com/products" />
<link rel="alternate" hreflang="en" href="https://example.com/en/products" />
<link rel="alternate" hreflang="zh" href="https://example.com/zh/products" />
```

**React 实现**：

```typescript
// components/SEO.tsx
import Head from "next/head";

interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}

export function SEO({ title, description, canonical, ogImage }: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {ogImage && <meta property="og:image" content={ogImage} />}
    </Head>
  );
}
```

---

## 三、HTML 优化

### 1. 语义化 HTML

```html
<!-- ❌ 错误：缺少语义 -->
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
  </div>
</div>
<div class="content">
  <div class="article">
    <div class="title">Title</div>
    <div class="text">Content...</div>
  </div>
</div>

<!-- ✅ 正确：语义化标签 -->
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>

<main>
  <article>
    <h1>Title</h1>
    <p>Content...</p>
  </article>
</main>

<footer>
  <p>&copy; 2024 Example</p>
</footer>
```

**常用语义化标签**：

```html
<header>
  - 页头
  <nav>
    - 导航
    <main>
      - 主要内容（每页只有一个）
      <article>
        - 独立文章
        <section>
          - 章节
          <aside>
            - 侧边栏
            <footer>
              - 页脚
              <figure>
                - 图片/图表
                <figcaption>
                  - 图片说明 <time> - 时间 <mark> - 高亮文本</mark></time>
                </figcaption>
              </figure>
            </footer>
          </aside>
        </section>
      </article>
    </main>
  </nav>
</header>
```

### 2. 标题层级（H1-H6）

```html
<!-- ✅ 正确：清晰的层级结构 -->
<article>
  <h1>iPhone 14 Pro 评测</h1>
  <!-- 页面主标题，只有一个 -->

  <section>
    <h2>外观设计</h2>
    <!-- 二级标题 -->
    <h3>屏幕</h3>
    <!-- 三级标题 -->
    <h3>机身材质</h3>
  </section>

  <section>
    <h2>性能表现</h2>
    <h3>CPU 性能</h3>
    <h3>GPU 性能</h3>
  </section>

  <section>
    <h2>相机</h2>
    <h3>主摄</h3>
    <h3>超广角</h3>
  </section>
</article>

<!-- ❌ 错误：跳级、多个 H1 -->
<h1>标题1</h1>
<h3>标题2</h3>
<!-- 跳过了 h2 -->
<h1>标题3</h1>
<!-- 多个 h1 -->
```

**最佳实践**：

- 每页只有一个 `<h1>`
- 不要跳级（h1 → h3）
- 层级清晰，符合内容结构
- 包含关键词，但不堆砌

### 3. 图片优化

```html
<!-- ✅ 完整的图片 SEO -->
<img
  src="iphone-14-pro.jpg"
  alt="iPhone 14 Pro 深空黑色，展示正面和背面设计"
  width="800"
  height="600"
  loading="lazy"
  decoding="async"
/>

<!-- 响应式图片 -->
<picture>
  <source
    media="(max-width: 767px)"
    srcset="iphone-mobile.jpg"
    type="image/webp"
  />
  <source
    media="(min-width: 768px)"
    srcset="iphone-desktop.jpg"
    type="image/webp"
  />
  <img
    src="iphone-desktop.jpg"
    alt="iPhone 14 Pro 产品图"
    width="1200"
    height="800"
  />
</picture>
```

**Alt 文本最佳实践**：

```html
<!-- ❌ 错误 -->
<img src="img1.jpg" alt="图片" />
<img src="img2.jpg" alt="" />
<img src="img3.jpg" />

<!-- ✅ 正确 -->
<img src="product.jpg" alt="iPhone 14 Pro 深空黑色 256GB" />
<img src="chart.jpg" alt="2024年智能手机市场份额图表" />
<img src="decorative.jpg" alt="" role="presentation" />
<!-- 装饰性图片 -->
```

### 4. 链接优化

```html
<!-- ❌ 错误 -->
<a href="/products/123">点击这里</a>
<a href="/products/123">more</a>
<a href="javascript:void(0)" onclick="...">查看详情</a>

<!-- ✅ 正确 -->
<a href="/products/iphone-14-pro">iPhone 14 Pro 详细规格</a>
<a href="/articles/seo-guide" title="完整的 SEO 优化指南">SEO 指南</a>

<!-- 外链 -->
<a href="https://external.com" rel="noopener noreferrer" target="_blank">
  外部链接
</a>

<!-- 不需要传递权重的链接 -->
<a href="/login" rel="nofollow">登录</a>
<a href="/affiliate-link" rel="nofollow sponsored">赞助链接</a>
```

**rel 属性说明**：

- `nofollow`：不传递权重
- `noopener`：安全性（target="\_blank" 必加）
- `noreferrer`：不发送 referrer
- `sponsored`：赞助链接
- `ugc`：用户生成内容

---

## 四、Meta 标签优化

### 1. 基础 Meta 标签

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- 标题（最重要！） -->
    <title>iPhone 14 Pro 256GB 深空黑 - Apple 官方商城</title>

    <!-- 描述 -->
    <meta
      name="description"
      content="iPhone 14 Pro 搭载 A16 仿生芯片，4800万像素主摄，支持灵动岛。立即购买享受免费送货和退货服务。"
    />

    <!-- 关键词（现在不太重要） -->
    <meta name="keywords" content="iPhone 14 Pro, Apple, 智能手机, A16" />

    <!-- 作者 -->
    <meta name="author" content="Apple Inc." />

    <!-- 搜索引擎指令 -->
    <meta name="robots" content="index, follow" />
    <!-- 或 -->
    <meta name="robots" content="noindex, nofollow" />

    <!-- Canonical -->
    <link rel="canonical" href="https://example.com/iphone-14-pro" />
  </head>
</html>
```

**Title 优化技巧**：

```html
<!-- 格式：主关键词 - 修饰词 - 品牌 -->
<title>iPhone 14 Pro 深空黑 256GB - Apple 官方商城</title>

<!-- 长度：50-60 字符（中文 25-30） -->
<!-- ❌ 太长会被截断 -->
<title>
  iPhone 14 Pro 深空黑色 256GB 存储 A16 仿生芯片 4800万像素摄像头 灵动岛 Pro
  Motion 显示屏 - Apple 官方在线商店
</title>

<!-- ✅ 简洁明了 -->
<title>iPhone 14 Pro 256GB - Apple 商城</title>
```

**Description 优化**：

```html
<!-- 长度：120-160 字符 -->
<!-- ✅ 包含关键词，吸引点击 -->
<meta
  name="description"
  content="iPhone 14 Pro 搭载全新 A16 芯片，4800万像素主摄，灵动岛设计。立即购买享 24 期免息，免费送货退货。"
/>

<!-- ❌ 关键词堆砌 -->
<meta
  name="description"
  content="iPhone iPhone 14 Pro Apple 手机 智能手机 苹果 iPhone14 Pro Max"
/>
```

### 2. Open Graph（社交分享）

```html
<!-- Facebook/LinkedIn -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Apple" />
<meta property="og:title" content="iPhone 14 Pro - Apple" />
<meta property="og:description" content="全新 iPhone 14 Pro" />
<meta property="og:url" content="https://example.com/iphone-14-pro" />
<meta
  property="og:image"
  content="https://example.com/images/iphone-14-pro-og.jpg"
/>
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="zh_CN" />

<!-- 文章类型 -->
<meta property="og:type" content="article" />
<meta property="article:published_time" content="2024-01-01T00:00:00Z" />
<meta property="article:author" content="John Doe" />
<meta property="article:section" content="Technology" />
<meta property="article:tag" content="iPhone" />

<!-- 产品类型 -->
<meta property="og:type" content="product" />
<meta property="product:price:amount" content="999" />
<meta property="product:price:currency" content="USD" />
```

### 3. Twitter Card

```html
<!-- Summary Card -->
<meta name="twitter:card" content="summary" />
<meta name="twitter:site" content="@apple" />
<meta name="twitter:title" content="iPhone 14 Pro" />
<meta name="twitter:description" content="全新 iPhone 14 Pro" />
<meta
  name="twitter:image"
  content="https://example.com/images/iphone-twitter.jpg"
/>

<!-- Large Image Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:image"
  content="https://example.com/images/iphone-large.jpg"
/>
```

### 4. React/Next.js Meta 标签

```typescript
// Next.js 13+ (App Router)
// app/products/[slug]/page.tsx
import { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct(params.slug);

  return {
    title: `${product.name} - Apple 商城`,
    description: product.description,
    keywords: product.tags.join(", "),

    alternates: {
      canonical: `https://example.com/products/${params.slug}`,
    },

    openGraph: {
      title: product.name,
      description: product.description,
      url: `https://example.com/products/${params.slug}`,
      siteName: "Apple",
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: "zh_CN",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.image],
      creator: "@apple",
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function ProductPage({ params }: Props) {
  // 页面内容
  return <div>Product Page</div>;
}
```

---

## 五、结构化数据 (Schema.org)

### 1. 什么是结构化数据？

**作用**：帮助搜索引擎理解页面内容，展示富媒体搜索结果（Rich Snippets）

**效果**：

- ⭐ 评分星级
- 💰 价格信息
- 📅 活动日期
- 🍞 面包屑导航
- 🔍 搜索框
- ❓ FAQ 折叠

### 2. JSON-LD 格式（推荐）

**为什么用 JSON-LD？**

- ✅ 不影响页面结构
- ✅ 易于维护
- ✅ Google 推荐

#### 产品 Schema

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "iPhone 14 Pro",
    "image": [
      "https://example.com/images/iphone-1.jpg",
      "https://example.com/images/iphone-2.jpg"
    ],
    "description": "iPhone 14 Pro 搭载 A16 仿生芯片",
    "sku": "IPHONE14PRO256",
    "mpn": "MPXU3CH/A",
    "brand": {
      "@type": "Brand",
      "name": "Apple"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://example.com/products/iphone-14-pro",
      "priceCurrency": "CNY",
      "price": "7999",
      "priceValidUntil": "2024-12-31",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Apple Store"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1234"
    }
  }
</script>
```

#### 文章 Schema

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "2024 年前端 SEO 优化指南",
    "image": "https://example.com/images/seo-guide.jpg",
    "author": {
      "@type": "Person",
      "name": "李四"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Tech Blog",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      }
    },
    "datePublished": "2024-01-01",
    "dateModified": "2024-01-15"
  }
</script>
```

### 3. React 组件封装

```typescript
// components/StructuredData.tsx
interface StructuredDataProps {
  data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

---

## 六、性能优化与 SEO

### 1. Core Web Vitals

| 指标    | 说明         | 目标    |
| ------- | ------------ | ------- |
| **LCP** | 最大内容绘制 | < 2.5s  |
| **FID** | 首次输入延迟 | < 100ms |
| **CLS** | 累积布局偏移 | < 0.1   |

### 2. 优化策略

```typescript
// 预加载关键资源
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />

// 为图片设置尺寸（防止 CLS）
<img src="product.jpg" width="800" height="600" alt="Product" />

// 代码分割
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

---

## 七、SSR/SSG 与 SEO

### 1. 服务端渲染（SSR）

```typescript
// Next.js SSR
export default async function ProductsPage() {
  const products = await fetchProducts();
  return <div>{/* 渲染产品 */}</div>;
}
```

### 2. 静态生成（SSG）

```typescript
export async function getStaticProps() {
  const products = await fetchProducts();
  return {
    props: { products },
    revalidate: 3600, // ISR
  };
}
```

---

## 八、移动端 SEO

```html
<!-- viewport 设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

## 九、内容优化

### E-E-A-T 原则

- **Experience** - 经验
- **Expertise** - 专业性
- **Authoritativeness** - 权威性
- **Trustworthiness** - 可信度

---

## 十、链接优化

### 内部链接

```html
<nav aria-label="Breadcrumb">
  <a href="/">首页</a> > <a href="/products">产品</a> >
  <span>iPhone 14 Pro</span>
</nav>
```

---

## 十一、常见问题排查

### 1. 页面未被收录

**排查步骤**：

```typescript
// 1. 检查 robots.txt
// 访问：https://example.com/robots.txt
User-agent: *
Allow: /

// 2. 检查 meta robots
<meta name="robots" content="index, follow">  // ✅
<meta name="robots" content="noindex">        // ❌ 禁止索引

// 3. 检查 canonical 标签
<link rel="canonical" href="https://example.com/correct-url">

// 4. 提交 sitemap
// Google Search Console > Sitemaps > 提交

// 5. 请求索引
// Google Search Console > URL检查 > 请求编入索引
```

### 2. 页面排名低

**常见原因和解决方案**：

| 问题         | 解决方案                        |
| ------------ | ------------------------------- |
| 内容质量低   | 增加内容深度，添加原创图片/视频 |
| 缺少关键词   | 优化标题、描述、H1 标签         |
| 页面加载慢   | 优化 Core Web Vitals            |
| 移动端体验差 | 响应式设计，移动优先            |
| 缺少外链     | 创建高质量内容，自然获取外链    |
| 网站结构混乱 | 优化 URL 结构，添加面包屑       |

### 3. 重复内容

```typescript
// 问题：多个 URL 指向相同内容
https://example.com/product
https://example.com/product?ref=email
https://example.com/product?utm_source=google

// 解决方案 1：Canonical 标签
<link rel="canonical" href="https://example.com/product">

// 解决方案 2：301 重定向
// Next.js middleware
export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // 移除查询参数
  if (url.searchParams.has('ref')) {
    url.searchParams.delete('ref');
    return NextResponse.redirect(url);
  }
}

// 解决方案 3：参数处理
// Google Search Console > URL 参数 > 配置
```

### 4. 爬虫抓取错误

```typescript
// 查看爬虫日志
// Google Search Console > 设置 > 抓取统计信息

// 常见错误：
// 1. 服务器错误 (5xx)
//    → 提升服务器稳定性

// 2. 超时
//    → 优化页面性能

// 3. 重定向链过长
//    → 减少重定向层级

// 4. 软 404
//    → 返回正确的 404 状态码
export default function Custom404() {
  return (
    <div>
      <h1>404 - 页面未找到</h1>
    </div>
  );
}
```

---

## 十二、工具和监控

### 1. 必备工具

#### Google Search Console

```typescript
// 添加网站验证
// 1. HTML 文件验证
// 下载文件放到 public/ 目录

// 2. HTML 标签验证
<meta name="google-site-verification" content="your-code">

// 3. Google Analytics 验证
// 4. Google Tag Manager 验证
// 5. DNS 验证
```

**关键功能**：

- 📊 性能报告（点击、展示、CTR）
- 🔍 覆盖率（已索引的页面）
- 🐛 问题排查（错误、警告）
- 🚀 Core Web Vitals
- 🗺️ Sitemap 提交

#### Google Analytics 4

```typescript
// Next.js 集成 GA4
// lib/gtag.ts
export const GA_TRACKING_ID = "G-XXXXXXXXXX";

export const pageview = (url: string) => {
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: any) => {
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// _app.tsx
import { useRouter } from "next/router";
import { useEffect } from "react";
import * as gtag from "../lib/gtag";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
}
```

### 2. SEO 检测工具

**在线工具**：

- **Lighthouse** - Chrome DevTools
- **PageSpeed Insights** - https://pagespeed.web.dev/
- **GTmetrix** - https://gtmetrix.com/
- **Screaming Frog** - 网站爬虫
- **Ahrefs** - SEO 综合分析
- **SEMrush** - 竞品分析

**命令行工具**：

```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse https://example.com --output html --output-path ./report.html

# 持续集成
lighthouse https://example.com --preset=desktop --quiet --chrome-flags="--headless"
```

### 3. 监控和告警

```typescript
// 监控 SEO 指标
class SEOMonitor {
  // 监控 Meta 标签
  checkMetaTags() {
    const title = document.title;
    const description = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    const canonical = document
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");

    const issues = [];

    if (!title || title.length > 60) {
      issues.push("Title 缺失或过长");
    }

    if (!description || description.length > 160) {
      issues.push("Description 缺失或过长");
    }

    if (!canonical) {
      issues.push("缺少 canonical 标签");
    }

    return issues;
  }

  // 监控结构化数据
  checkStructuredData() {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    if (scripts.length === 0) {
      return ["缺少结构化数据"];
    }

    const issues = [];
    scripts.forEach((script) => {
      try {
        JSON.parse(script.textContent || "");
      } catch (e) {
        issues.push("结构化数据格式错误");
      }
    });

    return issues;
  }

  // 监控图片 alt 属性
  checkImageAlt() {
    const images = document.querySelectorAll("img");
    const withoutAlt = Array.from(images).filter((img) => !img.alt);

    return withoutAlt.length > 0
      ? [`${withoutAlt.length} 张图片缺少 alt 属性`]
      : [];
  }

  // 上报问题
  report(issues: string[]) {
    if (issues.length > 0) {
      fetch("/api/seo-monitoring", {
        method: "POST",
        body: JSON.stringify({
          url: window.location.href,
          issues,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  }

  // 运行检查
  run() {
    const allIssues = [
      ...this.checkMetaTags(),
      ...this.checkStructuredData(),
      ...this.checkImageAlt(),
    ];

    if (allIssues.length > 0) {
      console.warn("SEO Issues:", allIssues);
      this.report(allIssues);
    }
  }
}

// 在开发环境中运行
if (process.env.NODE_ENV === "development") {
  const monitor = new SEOMonitor();
  monitor.run();
}
```

---

## 十三、面试高频问题

### Q1：前端如何做 SEO 优化？

**回答框架**：

**1. 技术 SEO**：

- robots.txt 和 sitemap.xml 配置
- 合理的 URL 结构（语义化、短链接）
- Canonical 标签避免重复内容
- 网站性能优化（Core Web Vitals）

**2. HTML 优化**：

- 语义化 HTML 标签（header、nav、main、article）
- 标题层级（H1-H6）清晰
- 图片 alt 属性
- 合理的内部链接结构

**3. Meta 标签**：

- Title 和 Description 优化
- Open Graph 标签（社交分享）
- 结构化数据（Schema.org）

**4. 渲染策略**：

- 使用 SSR/SSG 代替纯 CSR
- Next.js、Nuxt.js 等框架
- 关键内容服务端渲染

**5. 性能优化**：

- 图片优化（WebP、懒加载）
- 代码分割
- CDN 加速
- 缓存策略

---

### Q2：SPA 如何做 SEO？

**答**：

**问题**：

- SPA 默认是 CSR，爬虫看到的是空白页
- JavaScript 渲染内容不利于 SEO

**解决方案**：

1. **SSR（服务端渲染）**

```typescript
// Next.js App Router
export default async function Page() {
  const data = await fetchData();
  return <div>{data.title}</div>;
}
```

2. **SSG（静态生成）**

```typescript
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data } };
}
```

3. **预渲染（Prerendering）**

- 使用 Prerender.io 或 rendertron
- 检测爬虫，返回预渲染的 HTML

4. **动态渲染（Dynamic Rendering）**

```typescript
// 检测爬虫
const isBot = /bot|crawler|spider/i.test(req.headers["user-agent"]);

if (isBot) {
  // 返回服务端渲染的 HTML
  return renderToString(<App />);
} else {
  // 返回 SPA
  return <App />;
}
```

---

### Q3：如何提升页面在搜索引擎的排名？

**答**：

**1. 内容质量**（最重要）：

- 原创、深度、有价值的内容
- 满足用户搜索意图
- 定期更新

**2. 技术优化**：

- 页面加载速度 < 3s
- 移动端友好
- HTTPS
- 结构化数据

**3. 关键词优化**：

- 标题、描述包含目标关键词
- H1 标签包含主关键词
- 内容自然分布关键词（不堆砌）

**4. 用户体验**：

- 低跳出率
- 高停留时间
- 清晰的导航

**5. 外链建设**：

- 获取高质量外链
- 相关性强的外链
- 自然的锚文本

---

### Q4：Core Web Vitals 是什么？如何优化？

**答**：

**定义**：Google 用来衡量网页用户体验的三个核心指标。

**指标**：

1. **LCP（最大内容绘制）**：< 2.5s

   - 优化：预加载关键图片、CDN、SSR

2. **FID（首次输入延迟）**：< 100ms

   - 优化：减少 JS 执行时间、代码分割

3. **CLS（累积布局偏移）**：< 0.1
   - 优化：为图片设置尺寸、避免动态插入内容

**优化方法**：

```typescript
// 1. 预加载 LCP 图片
<link rel="preload" as="image" href="/hero.jpg" fetchpriority="high">

// 2. 图片设置尺寸
<img src="product.jpg" width="800" height="600" alt="Product">

// 3. 代码分割
const Heavy = lazy(() => import('./Heavy'));

// 4. 监控
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

---

### Q5：什么是结构化数据？为什么重要？

**答**：

**定义**：使用 Schema.org 标准标记网页内容，帮助搜索引擎理解页面语义。

**作用**：

- 展示富媒体搜索结果（Rich Snippets）
- 提高点击率（CTR）
- 提升排名

**常用类型**：

- Product：产品信息
- Article：文章
- Organization：组织
- BreadcrumbList：面包屑
- FAQPage：常见问题

**实现**：

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "iPhone 14 Pro",
    "price": "7999",
    "priceCurrency": "CNY"
  }
</script>
```

---

### Q6：SSR 和 SSG 的区别？哪个更利于 SEO？

**答**：

| 特性           | SSR              | SSG                |
| -------------- | ---------------- | ------------------ |
| **渲染时机**   | 请求时           | 构建时             |
| **性能**       | 较慢（每次请求） | 最快（静态文件）   |
| **内容实时性** | 实时             | 延迟（需重新构建） |
| **服务器压力** | 高               | 低                 |
| **SEO**        | ✅ 好            | ✅✅ 最好          |

**选择建议**：

- **SSG**：博客、文档、产品页（内容变化少）
- **SSR**：新闻、社交媒体、个性化内容
- **ISR**：电商（静态 + 增量更新）

```typescript
// SSG + ISR
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 60, // 60秒后重新生成
  };
}
```

---

### Q7：如何检测和修复 SEO 问题？

**答**：

**检测工具**：

1. **Google Search Console**

   - 查看索引状态
   - 发现错误

2. **Lighthouse**

   - SEO 分数
   - 性能指标

3. **Screaming Frog**
   - 爬取整站
   - 发现断链、重复内容

**常见问题**：

```typescript
// 1. 缺少 Title/Description
<title>首页</title>  // ❌ 太简单
<title>iPhone 14 Pro 256GB - Apple 商城</title>  // ✅

// 2. 图片缺少 alt
<img src="product.jpg">  // ❌
<img src="product.jpg" alt="iPhone 14 Pro">  // ✅

// 3. 重复内容
// 使用 canonical 标签

// 4. 移动端不友好
// 响应式设计

// 5. 页面加载慢
// 优化 Core Web Vitals
```

---

### Q8：如何优化电商网站的 SEO？

**答**：

**1. 产品页优化**：

```typescript
// 标题：品牌 + 型号 + 规格
<title>Apple iPhone 14 Pro 256GB 深空黑 - 官方商城</title>

// 描述：价格、特性、促销
<meta name="description" content="iPhone 14 Pro 256GB，A16芯片，4800万主摄。现价¥7999，享24期免息。">

// 结构化数据
<script type="application/ld+json">
{
  "@type": "Product",
  "name": "iPhone 14 Pro",
  "offers": {
    "price": "7999",
    "availability": "InStock"
  },
  "aggregateRating": {
    "ratingValue": "4.8",
    "reviewCount": "1234"
  }
}
</script>
```

**2. 分类页优化**：

- 清晰的分类结构
- 筛选器不影响 SEO（使用 # 或 canonical）
- 分页处理

**3. 用户评论**：

- 展示评分和评论（UGC 内容）
- 使用 Review Schema

**4. 面包屑导航**：

```html
<nav aria-label="Breadcrumb">首页 > 手机 > iPhone > iPhone 14 Pro</nav>
```

**5. 内部链接**：

- 相关产品推荐
- 最近浏览
- 类似产品

---

## 十四、SEO Checklist

### 页面级别

- [ ] Title 独特、包含关键词（50-60 字符）
- [ ] Description 吸引人（120-160 字符）
- [ ] H1 标签唯一、包含主关键词
- [ ] H2-H6 层级清晰
- [ ] 所有图片有 alt 属性
- [ ] URL 语义化、简洁
- [ ] 内部链接合理
- [ ] 结构化数据（Schema.org）
- [ ] Canonical 标签
- [ ] Open Graph 标签

### 技术层面

- [ ] robots.txt 配置正确
- [ ] sitemap.xml 提交
- [ ] HTTPS
- [ ] 移动端友好
- [ ] 页面加载 < 3s
- [ ] Core Web Vitals 达标
- [ ] 404 页面优化
- [ ] 无断链
- [ ] 无重复内容

### 内容层面

- [ ] 原创、高质量内容
- [ ] 满足搜索意图
- [ ] 适当的内容长度
- [ ] 定期更新
- [ ] 多媒体内容（图片、视频）

---

## 十五、总结

### 前端 SEO 核心要点

**技术基础**：

- 🚀 使用 SSR/SSG 代替纯 CSR
- 📄 完整的 HTML 语义化
- 🏎️ 优化 Core Web Vitals
- 📱 移动端友好

**内容优化**：

- 📝 高质量原创内容
- 🔑 合理的关键词布局
- 🏷️ 完整的 Meta 标签
- 📊 结构化数据标记

**持续优化**：

- 📈 使用 Google Search Console 监控
- 🔍 定期 SEO 审计
- 🐛 及时修复问题
- 📊 分析数据，调整策略

**记住**：SEO 是长期工程，需要持续优化！

---

## 资源链接

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Web.dev](https://web.dev/)
- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)

面试加油！🎯
