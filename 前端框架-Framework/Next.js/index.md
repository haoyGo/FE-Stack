# Next.js 核心知识

## 一、核心概念

### 1. Next.js 是什么？

Next.js 是一个基于 React 的**全栈框架**，提供了：
- 🚀 SSR/SSG/ISR 渲染模式
- 📁 基于文件系统的路由
- ⚡️ 自动代码分割
- 🎯 API Routes（全栈能力）
- 🖼️ 图片/字体优化
- 📦 零配置开箱即用

### 2. 渲染模式对比

| 模式 | 执行时机 | 适用场景 | 优缺点 |
|------|---------|---------|--------|
| **CSR** | 浏览器运行时 | 后台管理 | ❌ SEO差 ✅ 交互强 |
| **SSR** | 每次请求 | 个性化内容 | ✅ SEO好 ❌ 服务器压力大 |
| **SSG** | 构建时 | 博客/文档 | ✅ 性能最优 ❌ 无法实时更新 |
| **ISR** | 构建+定期更新 | 电商详情 | ✅ 兼顾性能和实时性 |

## 二、App Router vs Pages Router

### Pages Router（传统）

```javascript
// pages/blog/[id].js
export async function getServerSideProps({ params }) {
  const post = await fetchPost(params.id);
  return { props: { post } };
}

export default function Post({ post }) {
  return <div>{post.title}</div>;
}
```

### App Router（Next.js 13+，推荐）

```javascript
// app/blog/[id]/page.js
export default async function Post({ params }) {
  // 直接在组件中获取数据（Server Component）
  const post = await fetchPost(params.id);
  return <div>{post.title}</div>;
}
```

**主要区别**：

| 特性 | Pages Router | App Router |
|------|-------------|------------|
| 数据获取 | getServerSideProps | async 组件 |
| 布局 | _app.js | layout.js（嵌套） |
| 路由 | pages/ | app/ |
| 服务端组件 | ❌ | ✅ |
| 流式渲染 | ❌ | ✅ Suspense |

## 三、数据获取方式

### 1. getStaticProps（SSG）

```javascript
// pages/posts/[id].js
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.id);
  
  return {
    props: { post },
    revalidate: 60 // ISR: 60秒后重新生成
  };
}

export async function getStaticPaths() {
  const posts = await getAllPosts();
  
  return {
    paths: posts.map(p => ({ params: { id: p.id } })),
    fallback: 'blocking' // 未预渲染的路径按需生成
  };
}
```

### 2. getServerSideProps（SSR）

```javascript
// pages/dashboard.js
export async function getServerSideProps(context) {
  const { req, res, query } = context;
  
  // 服务端认证
  const session = await getSession(req);
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }
  
  const data = await fetchUserData(session.userId);
  
  return {
    props: { data }
  };
}
```

### 3. getStaticPaths 的 fallback 配置

```javascript
export async function getStaticPaths() {
  return {
    paths: [...],
    fallback: false | true | 'blocking'
  };
}
```

- **fallback: false** - 404未预渲染的路径
- **fallback: true** - 返回fallback UI，后台生成
- **fallback: 'blocking'** - 等待生成完成再返回（推荐）

### 4. App Router 数据获取

```javascript
// app/posts/[id]/page.js

// Server Component（默认）
export default async function Post({ params }) {
  // 直接 await，Next.js 自动缓存
  const post = await fetch(`/api/posts/${params.id}`).then(r => r.json());
  
  return <div>{post.title}</div>;
}

// 配置缓存和重新验证
export const revalidate = 60; // ISR: 60秒

// Client Component
'use client';
export default function Post() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/posts').then(r => r.json()).then(setData);
  }, []);
}
```

## 四、路由系统

### 1. Pages Router 路由

```
pages/
  index.js          → /
  about.js          → /about
  blog/
    index.js        → /blog
    [id].js         → /blog/:id
    [...slug].js    → /blog/* (catch-all)
  api/
    users.js        → /api/users
```

### 2. App Router 路由

```
app/
  page.js           → /
  about/
    page.js         → /about
  blog/
    page.js         → /blog
    [id]/
      page.js       → /blog/:id
    layout.js       → 布局（嵌套）
  api/
    users/
      route.js      → /api/users
```

### 3. 动态路由

```javascript
// pages/blog/[slug].js
export default function Post({ params }) {
  const { slug } = params; // 'hello-world'
}

// pages/blog/[...slug].js - Catch-all
// /blog/a/b/c → slug = ['a', 'b', 'c']

// pages/blog/[[...slug]].js - Optional catch-all
// /blog → slug = []
// /blog/a → slug = ['a']
```

### 4. 路由导航

```javascript
import { useRouter } from 'next/router';
import Link from 'next/link';

function Post() {
  const router = useRouter();
  
  // 编程式导航
  const navigate = () => {
    router.push('/blog');
    router.replace('/blog'); // 不添加历史记录
    router.back();
    router.prefetch('/blog'); // 预取
  };
  
  return (
    <>
      {/* 声明式导航 */}
      <Link href="/blog">Blog</Link>
      <Link href={{ pathname: '/blog/[id]', query: { id: 1 } }}>
        Post 1
      </Link>
    </>
  );
}
```

## 五、API Routes

### 1. 基础用法

```javascript
// pages/api/users.js
export default async function handler(req, res) {
  const { method } = req;
  
  switch (method) {
    case 'GET':
      const users = await db.users.findMany();
      res.status(200).json(users);
      break;
      
    case 'POST':
      const user = await db.users.create({ data: req.body });
      res.status(201).json(user);
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

### 2. 动态 API 路由

```javascript
// pages/api/posts/[id].js
export default async function handler(req, res) {
  const { id } = req.query;
  
  const post = await db.posts.findUnique({ where: { id } });
  
  if (!post) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.status(200).json(post);
}
```

### 3. 中间件

```javascript
// middleware/auth.js
export function withAuth(handler) {
  return async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      req.user = await verifyToken(token);
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// pages/api/protected.js
export default withAuth(async (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});
```

### 4. App Router API Routes

```javascript
// app/api/users/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const users = await db.users.findMany();
  return NextResponse.json(users);
}

export async function POST(request) {
  const body = await request.json();
  const user = await db.users.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}

// 动态路由
// app/api/users/[id]/route.js
export async function GET(request, { params }) {
  const user = await db.users.findUnique({ where: { id: params.id } });
  return NextResponse.json(user);
}
```

## 六、性能优化

### 1. 图片优化

```javascript
import Image from 'next/image';

export default function Post({ post }) {
  return (
    <Image
      src={post.image}
      alt={post.title}
      width={800}
      height={600}
      priority // 首屏图片优先加载
      placeholder="blur" // 模糊占位符
      blurDataURL={post.blurDataURL}
      sizes="(max-width: 768px) 100vw, 800px"
      quality={90}
    />
  );
}
```

### 2. 字体优化

```javascript
// pages/_app.js (Pages Router)
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export default function App({ Component, pageProps }) {
  return (
    <main className={inter.className}>
      <Component {...pageProps} />
    </main>
  );
}

// app/layout.js (App Router)
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 3. 代码分割

```javascript
import dynamic from 'next/dynamic';

// 动态导入（懒加载）
const DynamicComponent = dynamic(() => import('../components/Heavy'), {
  loading: () => <p>Loading...</p>,
  ssr: false // 禁用SSR
});

// 多个导出
const DynamicComponent = dynamic(
  () => import('../components/Hello').then(mod => mod.Hello)
);
```

### 4. 预取优化

```javascript
import Link from 'next/link';
import { useRouter } from 'next/router';

function PostList({ posts }) {
  const router = useRouter();
  
  return posts.map(post => (
    <Link
      key={post.id}
      href={`/posts/${post.id}`}
      prefetch={false} // 禁用自动预取（默认开启）
      onMouseEnter={() => {
        // 鼠标悬停时手动预取
        router.prefetch(`/posts/${post.id}`);
      }}
    >
      {post.title}
    </Link>
  ));
}
```

## 七、中间件（Middleware）

```javascript
// middleware.js（项目根目录）
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // 认证检查
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // A/B 测试
  if (pathname === '/') {
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    const response = NextResponse.next();
    response.cookies.set('variant', variant);
    return response;
  }
  
  // 限流
  const ip = request.ip || 'unknown';
  const rateLimitKey = `ratelimit:${ip}`;
  // 实现限流逻辑...
  
  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/',
    '/api/:path*'
  ]
};
```

## 八、环境变量

```bash
# .env.local
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com

# .env.production
NODE_ENV=production
```

```javascript
// 服务端使用
export async function getServerSideProps() {
  const db = process.env.DATABASE_URL; // ✅ 只在服务端可用
  return { props: {} };
}

// 客户端使用
export default function App() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✅ NEXT_PUBLIC_ 前缀
  console.log(apiUrl); // 客户端可访问
}
```

## 九、部署

### 1. Vercel 部署（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产部署
vercel --prod
```

### 2. Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. 自定义服务器

```javascript
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
```

## 十、面试高频问题

### Q1: Next.js 的渲染模式如何选择？

**A**: 根据数据特性选择：

```javascript
// 1. 静态内容（博客、文档）→ SSG
export async function getStaticProps() {
  const posts = await fetchPosts();
  return {
    props: { posts }
  };
}

// 2. 准实时内容（电商）→ ISR
export async function getStaticProps() {
  const products = await fetchProducts();
  return {
    props: { products },
    revalidate: 60 // 60秒后重新生成
  };
}

// 3. 个性化内容（用户数据）→ SSR
export async function getServerSideProps({ req }) {
  const session = await getSession(req);
  const data = await fetchUserData(session.userId);
  return {
    props: { data }
  };
}

// 4. 高交互内容（聊天）→ CSR
export default function Chat() {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // 客户端获取数据
    fetchMessages().then(setMessages);
  }, []);
}
```

**决策树**：
```
内容是否个性化？
├─ 否 → 内容更新频率？
│   ├─ 低（天/周）→ SSG
│   └─ 高（分钟）→ ISR
└─ 是 → 需要SEO？
    ├─ 是 → SSR
    └─ 否 → CSR
```

---

### Q2: ISR 的工作原理是什么？

**A**: ISR（Incremental Static Regeneration）= SSG + 定期更新

**工作流程**：
```
1. 用户请求 → 返回缓存的静态页面（快速）
2. 检查是否超过 revalidate 时间
3. 如果超时 → 后台异步重新生成（不阻塞响应）
4. 下次请求 → 返回新生成的页面
```

**代码实现**：
```javascript
export async function getStaticProps() {
  const data = await fetchData();
  
  return {
    props: { data },
    revalidate: 60 // 60秒后，首次访问触发重新生成
  };
}
```

**缓存策略**：
```
请求1（0秒）  → 返回缓存页面（生成于构建时）
请求2（61秒） → 返回缓存页面 + 触发后台重新生成
请求3（62秒） → 返回新页面
```

**按需重新验证**（Next.js 12.2+）：
```javascript
// pages/api/revalidate.js
export default async function handler(req, res) {
  // 验证密钥
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  try {
    // 手动触发重新生成
    await res.revalidate('/posts/1');
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}

// CMS Webhook 调用
// POST /api/revalidate?secret=xxx
```

---

### Q3: App Router 和 Pages Router 的核心区别？

**A**: 

| 维度 | Pages Router | App Router |
|------|-------------|------------|
| **路由文件** | pages/ | app/ |
| **渲染模式** | 页面级配置 | 组件级配置 |
| **数据获取** | getServerSideProps | async 组件 |
| **布局** | _app.js（全局） | layout.js（嵌套） |
| **Server Component** | ❌ 不支持 | ✅ 默认 |
| **流式渲染** | ❌ | ✅ Suspense |
| **并行路由** | ❌ | ✅ |
| **拦截路由** | ❌ | ✅ |

**数据获取对比**：

```javascript
// Pages Router
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

export default function Page({ data }) {
  return <div>{data}</div>;
}

// App Router（Server Component）
export default async function Page() {
  const data = await fetchData(); // 直接 await
  return <div>{data}</div>;
}
```

**布局嵌套**：

```javascript
// Pages Router - 扁平结构
// pages/_app.js - 全局布局
export default function App({ Component, pageProps }) {
  return (
    <GlobalLayout>
      <Component {...pageProps} />
    </GlobalLayout>
  );
}

// App Router - 嵌套布局
// app/layout.js - 根布局
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// app/dashboard/layout.js - 嵌套布局
export default function DashboardLayout({ children }) {
  return (
    <div>
      <Sidebar />
      {children}
    </div>
  );
}
```

**Server Component 优势**：
- ✅ 零客户端 JS（纯服务端渲染）
- ✅ 直接访问后端资源（数据库、文件系统）
- ✅ 自动代码分割
- ✅ 减少客户端 Bundle 大小

---

### Q4: Next.js 如何优化性能？

**A**: 

**1. 图片优化**
```javascript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // 首屏图片
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

**2. 字体优化**
```javascript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return <html className={inter.className}>{children}</html>;
}
```

**3. 代码分割**
```javascript
import dynamic from 'next/dynamic';

const Heavy = dynamic(() => import('./Heavy'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

**4. 预取优化**
```javascript
<Link href="/posts" prefetch={false}>
  Posts
</Link>
```

**5. 缓存策略**
```javascript
// App Router
export const revalidate = 3600; // 1小时

// fetch 自动缓存
const data = await fetch('/api/data', {
  next: { revalidate: 60 } // 60秒缓存
});
```

**6. 打包分析**
```bash
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({});

# 运行分析
ANALYZE=true npm run build
```

---

### Q5: Next.js 的 Middleware 有什么用？

**A**: Middleware 在请求到达页面之前执行，用于：

**1. 认证/鉴权**
```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

**2. A/B 测试**
```javascript
export function middleware(request) {
  const variant = Math.random() < 0.5 ? 'A' : 'B';
  const response = NextResponse.next();
  response.cookies.set('variant', variant);
  return response;
}
```

**3. 国际化**
```javascript
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const locale = request.cookies.get('locale') || 'en';
  
  if (!pathname.startsWith(`/${locale}`)) {
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }
}
```

**4. 限流**
```javascript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s')
});

export async function middleware(request) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

**执行顺序**：
```
请求 → Middleware → getServerSideProps/Page → 响应
```

---

### Q6: 如何在 Next.js 中处理认证？

**A**: 

**方案1：NextAuth.js（推荐）**

```bash
npm install next-auth
```

```javascript
// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    }
  }
});

// pages/_app.js
import { SessionProvider } from 'next-auth/react';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

// 使用
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  
  if (session) {
    return (
      <>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  
  return <button onClick={() => signIn()}>Sign in</button>;
}

// 服务端保护
export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }
  
  return {
    props: { session }
  };
}
```

**方案2：JWT + Cookie**

```javascript
// lib/auth.js
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const TOKEN_NAME = 'token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7天

export function setTokenCookie(res, token) {
  const cookie = serialize(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax'
  });
  
  res.setHeader('Set-Cookie', cookie);
}

export function getTokenCookie(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[TOKEN_NAME];
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// pages/api/login.js
export default async function handler(req, res) {
  const { email, password } = req.body;
  
  const user = await db.users.findOne({ email });
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  setTokenCookie(res, token);
  res.json({ user });
}

// Middleware 保护路由
// middleware.js
import { verifyToken, getTokenCookie } from './lib/auth';

export function middleware(request) {
  const token = getTokenCookie(request);
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    verifyToken(token);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*']
};
```

---

## 总结

Next.js 是现代全栈 React 开发的首选框架。

**核心优势**：
- 🚀 多种渲染模式（SSR/SSG/ISR）
- 📁 基于文件系统的路由
- ⚡️ 自动优化（图片、字体、代码分割）
- 🎯 全栈能力（API Routes）
- 📦 零配置开箱即用

**适用场景**：
- ✅ 博客、文档站（SSG）
- ✅ 电商平台（ISR）
- ✅ 企业官网（SSG/ISR）
- ✅ SaaS 应用（SSR）
- ✅ 内容管理系统（ISR）

**最佳实践**：
- 合理选择渲染模式
- 善用图片/字体优化
- 利用 ISR 平衡性能和实时性
- 使用 Middleware 处理横切关注点
- App Router 优先（新项目）

**技术演进**：
- App Router（Server Components）
- Turbopack（更快的打包器）
- Server Actions（表单处理）
- Partial Prerendering（部分预渲染）
