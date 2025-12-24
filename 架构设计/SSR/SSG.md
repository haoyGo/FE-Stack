# SSG (Static Site Generation)

## 核心概念

SSG（静态站点生成）是在**构建时**预渲染页面生成静态 HTML 文件，部署后直接提供给用户。与 SSR 的主要区别是**渲染时机**：SSG 在构建时渲染，SSR 在请求时渲染。

### 特点对比

| 特性 | SSG | SSR | CSR |
|------|-----|-----|-----|
| 渲染时机 | 构建时 | 请求时 | 浏览器运行时 |
| 首屏加载 | 最快 | 快 | 慢 |
| SEO | 完美 | 完美 | 差 |
| 服务器压力 | 无 | 高 | 无 |
| 数据实时性 | 差（构建时数据） | 好 | 好 |
| 适用场景 | 内容型网站 | 个性化内容 | 复杂交互 |

## 技术实现

### Next.js SSG 实现

```typescript
// pages/blog/[id].tsx

// 1. getStaticPaths - 告诉 Next.js 需要预渲染哪些路径
export async function getStaticPaths() {
  // 从 API 或文件系统获取所有文章 ID
  const posts = await getAllPostIds();
  
  return {
    paths: posts.map(post => ({
      params: { id: post.id }
    })),
    fallback: 'blocking' // 处理未预渲染的路径
    // fallback: false - 返回 404
    // fallback: true - 返回 loading 状态，后台生成
    // fallback: 'blocking' - 等待生成后返回
  };
}

// 2. getStaticProps - 获取页面数据（构建时执行）
export async function getStaticProps({ params }) {
  const post = await getPostById(params.id);
  
  return {
    props: { post },
    revalidate: 60 // ISR: 60秒后重新生成
  };
}

// 3. 页面组件
export default function Post({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### ISR (Incremental Static Regeneration)

ISR 是 SSG 的增强版，允许在不重新构建整个站点的情况下更新静态页面。

```typescript
// 结合 SSG 和 SSR 的优点
export async function getStaticProps() {
  const data = await fetchData();
  
  return {
    props: { data },
    revalidate: 60, // 60秒后首次访问触发重新生成
    // revalidate: 10 秒级更新
    // revalidate: 3600 小时级更新
  };
}
```

**ISR 工作流程**：
1. 首次请求返回缓存的静态页面（快速）
2. 后台检查是否超过 revalidate 时间
3. 如果超时，触发重新生成（异步）
4. 下次请求返回新生成的页面

### Gatsby SSG 实现

```javascript
// gatsby-node.js
exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  // 查询所有文章
  const result = await graphql(`
    query {
      allMarkdownRemark {
        edges {
          node {
            frontmatter {
              slug
            }
          }
        }
      }
    }
  `);
  
  // 为每篇文章创建页面
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPage({
      path: node.frontmatter.slug,
      component: path.resolve('./src/templates/blog-post.js'),
      context: {
        slug: node.frontmatter.slug
      }
    });
  });
};
```

### VitePress/VuePress SSG 实现

```typescript
// .vitepress/config.ts
export default {
  async buildEnd(siteConfig) {
    // 自定义构建逻辑
    const posts = await fetchPosts();
    
    for (const post of posts) {
      await generatePage(post);
    }
  }
}
```

## 高级特性

### 1. 部分预渲染 (PPR - Partial Prerendering)

Next.js 14+ 引入的新特性，结合 SSG 和动态渲染。

```typescript
// app/page.tsx (Next.js 14+)
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      {/* 静态部分 - 构建时渲染 */}
      <StaticHeader />
      
      {/* 动态部分 - 请求时渲染 */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
      
      {/* 静态部分 */}
      <StaticFooter />
    </>
  );
}
```

### 2. 增量式构建优化

```typescript
// next.config.js
module.exports = {
  experimental: {
    // 增量式构建缓存
    incrementalCacheHandlerPath: require.resolve('./cache-handler.js')
  }
};

// cache-handler.js
class CustomCacheHandler {
  async get(key) {
    // 从 Redis/S3 读取缓存
    return await redis.get(key);
  }
  
  async set(key, data, options) {
    // 写入分布式缓存
    await redis.set(key, data, 'EX', options.revalidate);
  }
}
```

### 3. 按需增量生成 (On-Demand ISR)

```typescript
// pages/api/revalidate.ts
export default async function handler(req, res) {
  // 验证请求来源
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  try {
    // 手动触发页面重新生成
    await res.revalidate('/blog/post-1');
    await res.revalidate('/blog/post-2');
    
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}

// CMS Webhook 调用
// POST /api/revalidate?secret=xxx
```

### 4. 混合渲染策略

```typescript
// app/layout.tsx (Next.js App Router)
export default function Layout({ children }) {
  return (
    <html>
      <body>
        {/* 所有页面共享的静态布局 */}
        <StaticNav />
        {children}
        <StaticFooter />
      </body>
    </html>
  );
}

// app/blog/[id]/page.tsx
// SSG 页面
export const dynamic = 'force-static';
export const revalidate = 3600;

// app/dashboard/page.tsx
// SSR 页面
export const dynamic = 'force-dynamic';

// app/products/page.tsx
// ISR 页面
export const revalidate = 60;
```

## 性能优化

### 1. 构建性能优化

```typescript
// next.config.js
module.exports = {
  // 并行构建
  experimental: {
    workerThreads: true,
    cpus: 4
  },
  
  // 增量式构建
  generateBuildId: async () => {
    return process.env.GIT_COMMIT_SHA;
  },
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  }
};
```

### 2. 智能预取策略

```typescript
// 自定义 Link 组件
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export function SmartLink({ href, children }) {
  const { ref, inView } = useInView({ triggerOnce: true });
  
  useEffect(() => {
    if (inView) {
      // 视口内才预取
      router.prefetch(href);
    }
  }, [inView, href]);
  
  return (
    <a ref={ref} href={href}>
      {children}
    </a>
  );
}
```

### 3. 资源优化

```typescript
// 代码分割
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false // 不在 SSG 时执行
});

// 图片优化
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // 首屏图片优先加载
  placeholder="blur"
  blurDataURL="data:image/..." // 模糊占位符
/>
```

## 部署架构

### CDN + Edge 架构

```
用户请求
  ↓
CDN (Cloudflare/AWS CloudFront)
  ├─ 静态 HTML (缓存)
  ├─ 静态资源 (永久缓存)
  └─ ISR 更新 (Edge Function)
      ↓
Origin Server (生成新页面)
  ↓
CDN 更新缓存
```

### Vercel 部署配置

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"], // 香港边缘节点
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate=3600"
        }
      ]
    }
  ]
}
```

### Netlify 部署配置

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## 适用场景分析

### 适合 SSG 的场景

✅ **博客、文档站点**
- 内容更新频率低
- SEO 要求高
- 用户量大

✅ **营销页面、Landing Page**
- 内容相对固定
- 性能要求极高
- 需要快速首屏

✅ **电商产品列表**
- 配合 ISR 使用
- 价格、库存异步更新
- 详情页 SSG + 动态数据客户端获取

### 不适合 SSG 的场景

❌ **个性化内容**
- 用户数据、推荐系统
- 实时数据（股票、聊天）

❌ **高频更新内容**
- 新闻资讯（秒级更新）
- 社交媒体 Feed

❌ **用户生成内容 (UGC)**
- 论坛、社区
- 评论系统

### 混合方案

```typescript
// 产品详情页最佳实践
export default function ProductPage({ product }) {
  // 静态内容：产品描述、图片 (SSG)
  const { title, description, images } = product;
  
  // 动态内容：价格、库存 (Client-side)
  const { data: liveData } = useSWR(`/api/products/${product.id}/live`, {
    refreshInterval: 10000 // 10秒刷新
  });
  
  return (
    <div>
      <h1>{title}</h1>
      <Gallery images={images} />
      <Description content={description} />
      
      {/* 动态数据 */}
      <Price value={liveData?.price} />
      <Stock count={liveData?.stock} />
    </div>
  );
}
```

## 技术难点与解决方案

### 1. 大规模页面构建

**问题**：数万个页面构建时间过长

**解决方案**：
```typescript
// 增量构建 + 按需生成
export async function getStaticPaths() {
  // 只预渲染热门页面
  const popularPosts = await getPopularPosts(100);
  
  return {
    paths: popularPosts.map(post => ({ params: { id: post.id } })),
    fallback: 'blocking' // 其他页面首次访问时生成
  };
}

// 分布式构建
// 使用 Nx、Turborepo 进行任务分发
// 利用 CI/CD 缓存加速构建
```

### 2. 数据一致性问题

**问题**：ISR 期间新旧数据不一致

**解决方案**：
```typescript
// 版本化数据 + 原子更新
export async function getStaticProps() {
  const data = await fetchData();
  
  return {
    props: {
      data,
      version: Date.now() // 数据版本号
    },
    revalidate: 60
  };
}

// 客户端检测版本
useEffect(() => {
  const currentVersion = await fetch('/api/version').then(r => r.json());
  if (currentVersion > props.version) {
    router.reload(); // 强制刷新
  }
}, []);
```

### 3. 动态路由与 SEO

**问题**：动态参数页面 SEO 优化

**解决方案**：
```typescript
// 生成完整的 sitemap
// scripts/generate-sitemap.js
import { getAllPosts } from './lib/posts';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

async function generateSitemap() {
  const posts = await getAllPosts();
  
  const stream = new SitemapStream({ hostname: 'https://example.com' });
  
  const links = posts.map(post => ({
    url: `/blog/${post.slug}`,
    changefreq: 'daily',
    priority: 0.8,
    lastmod: post.updatedAt
  }));
  
  const sitemap = await streamToPromise(Readable.from(links).pipe(stream));
  
  fs.writeFileSync('public/sitemap.xml', sitemap.toString());
}
```

## 监控与分析

### 构建时监控

```typescript
// next.config.js
module.exports = {
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 构建性能分析
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../analyze/server.html',
        })
      );
    }
    return config;
  }
};
```

### 运行时监控

```typescript
// 页面性能监控
export function reportWebVitals(metric) {
  // 发送到分析服务
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    page: window.location.pathname,
    isSSG: document.querySelector('[data-ssg="true"]') !== null
  });
  
  navigator.sendBeacon('/api/analytics', body);
}

// _app.tsx
export { reportWebVitals };
```

## 面试常见问题

### Q1: SSG 和 SSR 的本质区别是什么？

**A**: 核心是**渲染时机**和**服务器压力**：
- **SSG**：构建时渲染一次，部署后所有用户访问相同的静态 HTML，无服务器压力
- **SSR**：每次请求都在服务器渲染，内容可以动态化，但服务器压力大

选择标准：
- 内容更新频率低、SEO 重要 → SSG
- 需要个性化内容、实时数据 → SSR
- 中间地带 → ISR（SSG + 定期更新）

### Q2: ISR 的实现原理是什么？

**A**: ISR 是 stale-while-revalidate 缓存策略的应用：

```
1. 用户请求 → 返回缓存的静态页面（stale）
2. 检查是否超过 revalidate 时间
3. 如果超时 → 后台异步重新生成（revalidate）
4. 下次请求 → 返回新页面
```

**关键点**：
- 首次访问永远返回缓存（保证速度）
- 后台更新不阻塞响应
- 通过 CDN edge cache 实现全球分发

**代码层面**：
```typescript
// Next.js 内部伪代码
async function handleRequest(path) {
  const cached = await cache.get(path);
  
  if (cached && !isExpired(cached)) {
    return cached; // 未过期，直接返回
  }
  
  if (cached && isExpired(cached)) {
    // 过期但有缓存，先返回旧的
    sendResponse(cached);
    // 异步重新生成
    regenerate(path).then(newPage => cache.set(path, newPage));
    return;
  }
  
  // 无缓存，同步生成
  const newPage = await generate(path);
  cache.set(path, newPage);
  return newPage;
}
```

### Q3: 如何处理 SSG 中的动态数据？

**A**: 混合渲染策略：

**方案 1：静态 + 客户端水合**
```typescript
// 静态内容 SSG，动态数据 CSR
export default function Product({ product }) {
  const { data } = useSWR(`/api/products/${product.id}/price`);
  
  return (
    <>
      <StaticContent {...product} /> {/* SSG */}
      <DynamicPrice price={data?.price} /> {/* CSR */}
    </>
  );
}
```

**方案 2：ISR + 合理的 revalidate**
```typescript
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 60 // 根据更新频率设置
  };
}
```

**方案 3：Edge Function 动态注入**
```typescript
// Vercel Edge Function
export default async function handler(req) {
  const html = await readStaticHTML();
  const dynamicData = await fetchDynamicData();
  
  // 在 HTML 中注入动态数据
  const updated = html.replace(
    '<div id="dynamic-data"></div>',
    `<div id="dynamic-data">${dynamicData}</div>`
  );
  
  return new Response(updated, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### Q4: 大规模 SSG 项目如何优化构建时间？

**A**: 多维度优化：

**1. 增量构建**
```typescript
// 只构建变化的页面
export async function getStaticPaths() {
  const changedPosts = await getChangedPostsSinceLastBuild();
  
  return {
    paths: changedPosts.map(post => ({ params: { id: post.id } })),
    fallback: 'blocking'
  };
}
```

**2. 并行构建**
```typescript
// next.config.js
module.exports = {
  experimental: {
    workerThreads: true,
    cpus: 8 // 使用多核
  }
};
```

**3. 按需生成**
```typescript
// 只预渲染头部内容
export async function getStaticPaths() {
  const topPosts = await getTopPosts(100); // 只生成 top 100
  
  return {
    paths: topPosts.map(p => ({ params: { id: p.id } })),
    fallback: 'blocking' // 其他页面首次访问时生成
  };
}
```

**4. 构建缓存**
```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}
```

**5. 分布式构建**
- 使用 Turborepo/Nx 进行任务编排
- 多台机器并行构建不同部分
- S3/CDN 合并最终产物

### Q5: SSG 的 SEO 最佳实践？

**A**: 完整的 SEO 优化方案：

**1. 完整的 Meta 标签**
```typescript
// components/SEO.tsx
export function SEO({ title, description, image, url }) {
  return (
    <Head>
      {/* 基础 Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
      
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description,
            image,
            url
          })
        }}
      />
    </Head>
  );
}
```

**2. 结构化数据**
```typescript
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  image: post.coverImage,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: {
    '@type': 'Person',
    name: post.author.name
  }
};
```

**3. 自动生成 Sitemap**
```typescript
// pages/sitemap.xml.tsx
export async function getServerSideProps({ res }) {
  const posts = await getAllPosts();
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${posts.map(post => `
        <url>
          <loc>https://example.com/blog/${post.slug}</loc>
          <lastmod>${post.updatedAt}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `).join('')}
    </urlset>
  `;
  
  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
  
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
```

**4. 性能优化（Core Web Vitals）**
```typescript
// 关键性能指标
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

// 优化措施
- 图片使用 next/image 自动优化
- 字体使用 next/font 优化加载
- 关键 CSS 内联
- 预加载关键资源
```

### Q6: Next.js 的 fallback 配置有什么区别？

**A**: `fallback` 控制未预渲染页面的行为：

```typescript
export async function getStaticPaths() {
  return {
    paths: [...],
    fallback: false | true | 'blocking'
  };
}
```

**fallback: false**
- 未预渲染的路径返回 404
- 适合：页面数量固定且较少

**fallback: true**
- 返回 fallback 页面（loading 状态）
- 后台生成页面，完成后替换
- 需要处理 `router.isFallback`
```typescript
export default function Post({ post }) {
  const router = useRouter();
  
  if (router.isFallback) {
    return <Skeleton />;
  }
  
  return <Article post={post} />;
}
```

**fallback: 'blocking'** (推荐)
- 类似 SSR，等待页面生成后再响应
- 用户看不到 loading 状态
- 生成后缓存，后续访问走静态路径

**选择建议**：
- 少量页面 → false
- 需要极致首屏速度 → true（配合 loading）
- 大多数场景 → 'blocking'（体验好，实现简单）

### Q7: 如何监控和调试 SSG 页面？

**A**: 多层次监控方案：

**1. 构建时监控**
```typescript
// next.config.js
module.exports = {
  webpack: (config, { isServer, dev }) => {
    if (!dev && isServer) {
      // 构建性能分析
      const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
      const smp = new SpeedMeasurePlugin();
      return smp.wrap(config);
    }
    return config;
  }
};

// 输出构建报告
npm run build -- --profile
```

**2. 运行时监控**
```typescript
// pages/_app.tsx
export function reportWebVitals(metric) {
  console.log(metric);
  
  // 发送到监控服务
  sendToAnalytics({
    name: metric.name, // CLS, FID, LCP, FCP, TTFB
    value: metric.value,
    id: metric.id,
    label: metric.label // web-vital or custom
  });
}

// 监控 ISR 重新生成
export async function getStaticProps() {
  console.log('[ISR] Regenerating page at', new Date().toISOString());
  
  return {
    props: { data },
    revalidate: 60
  };
}
```

**3. 调试工具**
```typescript
// 开发环境显示渲染信息
export default function Page({ data, buildTime }) {
  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', bottom: 0, right: 0 }}>
          Build Time: {buildTime}
          <br />
          Render Type: SSG
        </div>
      )}
      <Content data={data} />
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {
      data: await fetchData(),
      buildTime: new Date().toISOString()
    }
  };
}
```

**4. Lighthouse CI**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://example.com
            https://example.com/blog
          uploadArtifacts: true
```

---

## 总结

SSG 是现代前端架构的重要组成部分，配合 ISR、Edge Functions 等技术，可以在性能和灵活性之间取得完美平衡。

**核心优势**：
- ⚡️ 极致性能（静态 HTML）
- 🚀 完美 SEO
- 💰 低成本（无服务器）
- 🌍 全球 CDN 分发

**最佳实践**：
- 合理使用 ISR 平衡实时性
- 混合渲染策略（静态 + 动态）
- 优化构建流程（增量、并行）
- 完善监控体系

**技术演进方向**：
- PPR (Partial Prerendering) - 部分预渲染
- React Server Components - 零 JS 静态组件
- Edge Runtime - 边缘计算增强
