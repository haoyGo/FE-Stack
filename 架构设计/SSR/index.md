### Q3: 详情页日均 PV 5000 万，如何设计高性能渲染方案？

**考察点：** SSR/SSG、性能优化、缓存策略、CDN

#### 标准答案

**1. 渲染策略选择**

| 方案                   | 适用场景               | 优点               | 缺点                |
| ---------------------- | ---------------------- | ------------------ | ------------------- |
| **CSR** (客户端渲染)   | 管理后台、低 SEO 需求  | 简单、开发体验好   | SEO 差、首屏慢      |
| **SSR** (服务端渲染)   | 内容页、需要实时数据   | SEO 好、首屏快     | 服务器压力大        |
| **SSG** (静态生成)     | 官网、文档、营销页     | 性能最优、CDN 友好 | 无法实时更新        |
| **ISR** (增量静态再生) | 内容页（可接受短延迟） | 兼顾性能和实时性   | 需要 Next.js 等支持 |

**推荐方案：SSR + 边缘缓存（Vercel Edge、Cloudflare Workers）**

```javascript
// Next.js 笔记详情页
export async function getServerSideProps(context) {
  const { id } = context.params;
  const { locale } = context;

  // 1. 尝试从边缘缓存读取
  const cacheKey = `note:${id}:${locale}`;
  const cached = await edgeCache.get(cacheKey);

  if (cached) {
    return {
      props: JSON.parse(cached),
    };
  }

  // 2. 缓存未命中，从数据库查询
  const note = await fetchNote(id, locale);

  // 3. 写入边缘缓存（5 分钟过期）
  await edgeCache.set(cacheKey, JSON.stringify({ note }), { ex: 300 });

  return {
    props: { note },
  };
}

export default function NotePage({ note }) {
  return (
    <div>
      <h1>{note.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: note.content }} />
    </div>
  );
}
```

**2. 多级缓存架构**

```
用户请求
    ↓
┌─────────────────────┐
│  CDN 边缘缓存 (1秒)  │ ← 命中率 95%
└─────────┬───────────┘
          ↓ 未命中
┌─────────────────────┐
│  Redis 缓存 (5分钟)  │ ← 命中率 4%
└─────────┬───────────┘
          ↓ 未命中
┌─────────────────────┐
│  数据库 (MySQL)      │ ← 命中率 1%
└─────────────────────┘
```

**3. 性能优化清单**

```javascript
// (1) 图片优化
import Image from "next/image";

<Image
  src={note.cover}
  alt={note.title}
  width={750}
  height={1000}
  priority // 首屏图片优先加载
  placeholder="blur"
  blurDataURL={note.coverBlur} // 模糊占位符
  sizes="(max-width: 768px) 100vw, 750px"
/>;

// (2) 关键 CSS 内联
export default function Document() {
  return (
    <Html>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        <link rel="preconnect" href="https://api.xiaohongshu.com" />
        <link rel="dns-prefetch" href="https://cdn.xiaohongshu.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// (3) 代码分割
const Comments = dynamic(() => import("./Comments"), {
  loading: () => <CommentsSkeleton />,
  ssr: false, // 评论区纯客户端渲染
});

// (4) 预取关联笔记
function RelatedNotes({ notes }) {
  return notes.map((note) => (
    <Link
      key={note.id}
      href={`/note/${note.id}`}
      prefetch={true} // 鼠标悬停时预取
    >
      {note.title}
    </Link>
  ));
}
```

**4. 监控指标**

```javascript
// Web Vitals 监控
import { getCLS, getFID, getLCP } from "web-vitals";

function sendToAnalytics({ name, value, id }) {
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify({ name, value, id }),
    headers: { "Content-Type": "application/json" },
  });
}

getCLS(sendToAnalytics); // 累积布局偏移
getFID(sendToAnalytics); // 首次输入延迟
getLCP(sendToAnalytics); // 最大内容绘制

// 目标值：
// LCP < 2.5s
// FID < 100ms
// CLS < 0.1
```

---
