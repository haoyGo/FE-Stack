# React SSR 实现原理

## 一、服务端渲染整体流程

### 1. 基本概念
React SSR（Server Side Rendering）是一种在服务器端将React组件渲染成HTML字符串的技术，主要解决以下问题：
- 首屏加载速度
- SEO优化
- 统一的开发体验

### 2. 渲染流程
1. **组件到HTML的转换**
   - 服务端使用`renderToString()`或`renderToNodeStream()`将React组件转换为HTML字符串
     - renderToString()和renderToNodeStream()都是React提供的服务端渲染方法。renderToString()会一次性将React组件渲染成完整的HTML字符串，适合小型应用；而renderToNodeStream()会返回一个可读流，可以分块传输HTML，适合大型应用，能提供更好的TTFB（首字节时间）性能，但需要注意流式传输可能带来的状态管理复杂性。
   - 生成初始状态（Initial State）
   - 注入必要的脚本标签和状态数据

2. **HTML传输到客户端**
   - 服务器返回完整的HTML文档
   - 客户端接收并展示静态HTML内容

### 3. 实现示例

#### 项目结构
```
/src
  /client
    index.js       # 客户端入口
  /server
    index.js       # 服务端入口
  /shared
    App.js         # 通用组件
    routes.js      # 路由配置
    store.js       # 状态管理
```

#### 服务端入口文件
```javascript
// server/index.js
import express from 'express';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Provider } from 'react-redux';
import serialize from 'serialize-javascript';
import { configureStore } from '@reduxjs/toolkit';
import App from '../shared/App';
import { rootReducer } from '../shared/store';

const app = express();

// 静态资源中间件
app.use(express.static(path.resolve(__dirname, '../build')));

app.get('*', async (req, res) => {
  // 创建Redux store
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {}
  });

  // 等待数据预取
  const dataRequirements = [];
  // 假设App组件中定义了静态fetchData方法
  if (App.fetchData) {
    dataRequirements.push(App.fetchData(store));
  }
  await Promise.all(dataRequirements);

  // 渲染组件
  const context = {};
  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url} context={context}>
        <App />
      </StaticRouter>
    </Provider>
  );

  // 处理重定向
  if (context.url) {
    return res.redirect(301, context.url);
  }

  // 获取预加载的状态
  const preloadedState = store.getState();

  // 注入初始状态和必要的脚本
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>React SSR</title>
        <link rel="stylesheet" href="/css/main.css">
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${serialize(preloadedState)};
        </script>
        <script src="/js/vendor.js"></script>
        <script src="/js/main.js"></script>
      </body>
    </html>
  `;

  res.send(fullHtml);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

#### 客户端入口文件
```javascript
// client/index.js
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../shared/App';
import { rootReducer } from '../shared/store';

// 获取服务端注入的状态
const preloadedState = window.__PRELOADED_STATE__;
delete window.__PRELOADED_STATE__;

// 创建Redux store
const store = configureStore({
  reducer: rootReducer,
  preloadedState
});

// 执行客户端激活
const container = document.getElementById('root');
const root = hydrateRoot(
  container,
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
```

#### 共享组件
```javascript
// shared/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  const data = useSelector(state => state.data);
  return <div>Home Page with data: {JSON.stringify(data)}</div>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
};

// 数据预取方法
App.fetchData = async (store) => {
  // 这里可以dispatch异步action来获取数据
  await store.dispatch(fetchInitialData());
};

export default App;
```

## 二、Hydration机制

### 1. 工作原理
Hydration是React用来在客户端复用服务端渲染的DOM并添加交互性的过程。这个过程主要包含以下核心步骤：

1. **初始化阶段**
```javascript
import { hydrateRoot } from 'react-dom/client';

// 创建ReactDOMRoot实例
const root = hydrateRoot(container, <App />);
// 内部会调用createRootImpl，并标记为hydrate模式
// const root = createRootImpl(container, options);
// root._internalRoot.hydrate = true;
```

2. **Fiber树构建**
```javascript
// React内部会构建Fiber树，并标记hydrate标记
function createFiberRoot(containerInfo, tag, hydrate) {
  const root = new FiberRootNode(containerInfo, tag);
  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  // 标记hydrate模式
  if (hydrate) {
    root.hydrate = true;
  }
  return root;
}
```

### 2. 执行过程
1. **DOM节点复用**
   - React遍历服务端渲染的DOM树
   - 为每个DOM节点创建对应的Fiber节点
   - 复用DOM节点属性和文本内容
   - 标记不匹配的节点进行修补
```javascript
function hydrateInstance(instance, type, props) {
  // 检查DOM节点类型是否匹配
  const domType = instance.nodeName.toLowerCase();
  if (domType !== type) {
    console.error('类型不匹配，需要重新渲染');
    return null;
  }
  // 复用DOM节点，更新props
  diffProperties(instance, type, props);
  return instance;
}
```

2. **事件系统重建**
   - 创建React事件系统实例
   - 注册事件委托监听器
   - 建立事件映射关系
   - 恢复组件事件处理函数
```javascript
function ensureListeningTo(rootContainerElement) {
  // 在根容器上注册事件委托
  const doc = rootContainerElement.ownerDocument;
  listenToAllSupportedEvents(doc);
}

function listenToAllSupportedEvents(rootContainerElement) {
  // 注册原生事件监听器
  allNativeEvents.forEach(eventType => {
    if (!nonDelegatedEvents.has(eventType)) {
      // 使用事件委托
      addTrappedEventListener(
        rootContainerElement,
        eventType,
        IS_CAPTURE_PHASE
      );
    }
  });
}
```

3. **生命周期与Hooks重建**
   - 按照组件树结构依次调用componentDidMount
   - 重新初始化hooks的状态
   - 建立effect的依赖追踪
   - 执行useEffect的回调函数

## 三、数据预取策略

### 1. Next.js数据获取方法
1. **getInitialProps**
   - 适用于Next.js 9之前的版本
   - 在服务端和客户端都会执行
   - 无法进行静态优化
   ```javascript
   function Page({ data }) {
     return <div>{data}</div>;
   }
   
   Page.getInitialProps = async (ctx) => {
     const res = await fetch('https://api.example.com/data');
     const data = await res.json();
     return { data };
   };
   ```

2. **getServerSideProps**
   - 每次请求都在服务端执行
   - 适合需要实时数据的页面
   ```javascript
   export async function getServerSideProps(context) {
     const res = await fetch('https://api.example.com/data');
     const data = await res.json();
     return {
       props: { data },
     };
   }
   ```

3. **getStaticProps**
   - 在构建时执行，生成静态HTML
   - 适合数据不经常变化的页面
   ```javascript
   export async function getStaticProps() {
     const res = await fetch('https://api.example.com/data');
     const data = await res.json();
     return {
       props: { data },
       revalidate: 60, // 每60秒重新生成页面
     };
   }
   ```

### 2. 自定义数据预取
1. **路由级数据预取**
   ```javascript
   const routes = [
     {
       path: '/',
       component: Home,
       loadData: () => store.dispatch(fetchHomeData())
     }
   ];
   ```

2. **组件级数据预取**
   ```javascript
   class MyComponent extends React.Component {
     static async fetchData(store) {
       return store.dispatch(fetchData());
     }
     
     render() {
       return <div>{this.props.data}</div>;
     }
   }
   ```

## 四、流式渲染

### 1. Suspense与React 18
```javascript
// server/index.js
import { renderToPipeableStream } from 'react-dom/server';

app.get('*', (req, res) => {
  const stream = renderToPipeableStream(
    <App />,
    {
      bootstrapScripts: ['/client.js'],
      onShellReady() {
        res.setHeader('content-type', 'text/html');
        stream.pipe(res);
      },
      onShellError(error) {
        res.statusCode = 500;
        res.send('<!doctype html><p>Loading...</p>');
      },
      onAllReady() {
        // 可选：在所有数据加载完成后执行
      },
      onError(err) {
        console.error(err);
      },
    }
  );
});
```

### 2. 选择性Hydration
```javascript
// App.js
import { Suspense } from 'react';

function App() {
  return (
    <div>
      <h1>My App</h1>
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <Comments />
      </Suspense>
    </div>
  );
}
```

## 五、组件级SSR

### 1. 基本概念与工作原理

#### 代码实现差异
1. **数据预取差异**
```javascript
// 整体SSR - 统一数据预取
const dataRequirements = [];
if (App.fetchData) {
  dataRequirements.push(App.fetchData(store));
}
await Promise.all(dataRequirements);

// 组件级SSR - 按组件预取
const componentDataPromises = routes
  .filter(route => route.match(req.path))
  .map(route => {
    const component = route.component;
    return component.fetchData 
      ? component.fetchData(store, req.params) 
      : Promise.resolve();
  });
await Promise.all(componentDataPromises);
```

2. **状态注入差异**
```javascript
// 整体SSR - 全局状态注入
const preloadedState = store.getState();
const fullHtml = `
  <script>
    window.__PRELOADED_STATE__ = ${serialize(preloadedState)};
  </script>
`;

// 组件级SSR - 组件状态隔离
const componentStates = {};
routes.forEach(route => {
  if (route.match(req.path)) {
    componentStates[route.path] = route.component.getState();
  }
});
const stateScript = `
  <script>
    window.__COMPONENT_STATES__ = ${serialize(componentStates)};
  </script>
`;
```

3. **Hydration策略差异**
```javascript
// 整体SSR - 全应用Hydration
hydrateRoot(
  document.getElementById('root'),
  <App />
);

// 组件级SSR - 按需Hydration
const hydrateComponents = () => {
  const components = document.querySelectorAll('[data-hydrate]');
  components.forEach(container => {
    const componentName = container.dataset.hydrate;
    const Component = lazy(() => import(`./components/${componentName}`));
    
    hydrateRoot(
      container,
      <Suspense fallback={null}>
        <Component {...window.__COMPONENT_STATES__[componentName]} />
      </Suspense>
    );
  });
};
```

### 2. 组件类型与处理策略

#### 混合渲染示例
```javascript
// 页面组件同时包含SSR和CSR组件
function ProductPage() {
  return (
    <div>
      {/* 服务端渲染 - 关键SEO内容 */}
      <ProductDetailsSSR />
      
      {/* 客户端渲染 - 交互部分 */}
      <Suspense fallback={<Spinner />}>
        <ProductReviewsCSR />
      </Suspense>
      
      {/* 智能渲染 - 根据条件决定 */}
      <SmartRender 
        ssrPriority={isAboveTheFold ? 'high' : 'low'}
        component={RelatedProducts} 
      />
    </div>
  );
}

// 智能渲染容器实现
const SmartRender = ({ ssrPriority, component: Component }) => {
  const [shouldSSR] = useState(() => {
    return ssrPriority === 'high' || 
      (typeof window === 'undefined' && ssrPriority !== 'never');
  });

  return shouldSSR ? (
    <Component />
  ) : (
    <Suspense fallback={<Spinner />}>
      <Component />
    </Suspense>
  );
};
```

## 六、常见问题处理

### 1. 样式处理
```javascript
// 使用styled-components
import { ServerStyleSheet } from 'styled-components';

const sheet = new ServerStyleSheet();
try {
  const html = renderToString(sheet.collectStyles(<App />));
  const styleTags = sheet.getStyleTags();
  // 注入样式标签
} finally {
  sheet.seal();
}
```

### 2. window对象访问问题
```javascript
// 错误示例
const Component = () => {
  const width = window.innerWidth; // 服务端报错
  return <div>{width}</div>;
};

// 正确示例
const Component = () => {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  
  return <div>{width}</div>;
};
```

### 3. 内存泄漏问题
```javascript
// 清理副作用
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  
  return () => {
    clearInterval(timer); // 必须清理
  };
}, []);
```

## 七、性能优化策略

### 1. 代码分割与懒加载

```javascript
// 路由级代码分割
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. 缓存策略

```javascript
// 页面级缓存（Redis）
import redis from './redis';

app.get('*', async (req, res) => {
  const cacheKey = `page:${req.url}`;
  
  // 尝试从缓存读取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.send(cached);
  }
  
  // 渲染页面
  const html = renderToString(<App />);
  
  // 写入缓存（5分钟过期）
  await redis.setex(cacheKey, 300, html);
  
  res.send(html);
});
```

### 3. 流式渲染优化

```javascript
// React 18 流式SSR
import { renderToPipeableStream } from 'react-dom/server';

app.get('*', (req, res) => {
  const { pipe, abort } = renderToPipeableStream(
    <App />,
    {
      bootstrapScripts: ['/js/main.js'],
      onShellReady() {
        // Shell准备好时立即发送
        res.setHeader('Content-Type', 'text/html');
        pipe(res);
      },
      onError(err) {
        console.error(err);
      }
    }
  );
  
  // 超时处理
  setTimeout(() => abort(), 5000);
});
```

### 4. 组件级缓存

```javascript
// 使用React.memo优化组件渲染
const ExpensiveComponent = React.memo(({ data }) => {
  // 复杂计算或渲染逻辑
  return <div>{processData(data)}</div>;
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return prevProps.data.id === nextProps.data.id;
});

// 服务端缓存组件HTML片段
const componentCache = new Map();

function renderCachedComponent(Component, props) {
  const cacheKey = JSON.stringify({ name: Component.name, props });
  
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey);
  }
  
  const html = renderToString(<Component {...props} />);
  componentCache.set(cacheKey, html);
  
  return html;
}
```

## 八、React 18 新特性与SSR

### 1. Streaming SSR

```javascript
// 服务端流式渲染
import { renderToPipeableStream } from 'react-dom/server';

function App() {
  return (
    <html>
      <body>
        <Header />
        <Suspense fallback={<Spinner />}>
          <Comments />
        </Suspense>
        <Footer />
      </body>
    </html>
  );
}

// Header和Footer立即发送，Comments延迟加载
```

**工作原理**：
1. Shell（Header + Spinner + Footer）立即渲染并发送
2. Comments组件在后台异步加载数据
3. 数据就绪后，通过 `<script>` 标签插入HTML
4. 客户端React自动替换Spinner为真实内容

### 2. Selective Hydration（选择性水合）

```javascript
// 页面结构
function Page() {
  return (
    <>
      <Header /> {/* 立即水合 */}
      <Suspense fallback={<Spinner />}>
        <Sidebar /> {/* 延迟水合 - 优先级低 */}
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <MainContent /> {/* 延迟水合 - 优先级高 */}
      </Suspense>
    </>
  );
}
```

**优势**：
- 用户交互的组件优先水合
- 避免阻塞主线程
- 提升TTI（Time to Interactive）

### 3. Server Components (RSC)

```javascript
// Server Component（零JavaScript）
async function BlogPost({ id }) {
  // 直接在组件中获取数据
  const post = await db.posts.find(id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <Content>{post.content}</Content>
    </article>
  );
}

// Client Component（需要交互）
'use client'; // 标记为客户端组件

function LikeButton({ postId }) {
  const [likes, setLikes] = useState(0);
  
  return (
    <button onClick={() => setLikes(likes + 1)}>
      ❤️ {likes}
    </button>
  );
}
```

**核心优势**：
- Server Component不发送JS到客户端
- 可以直接访问后端资源（数据库、文件系统）
- 自动代码分割
- 减少客户端Bundle大小

## 九、生产环境最佳实践

### 1. 错误边界与降级策略

```javascript
// 服务端错误边界
class SSRErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // 发送错误到监控服务
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.props.hasError) {
      // 服务端渲染失败，降级到CSR
      return (
        <html>
          <body>
            <div id="root"></div>
            <script src="/fallback.js"></script>
          </body>
        </html>
      );
    }
    
    return this.props.children;
  }
}

// 使用
app.get('*', (req, res) => {
  try {
    const html = renderToString(
      <SSRErrorBoundary>
        <App />
      </SSRErrorBoundary>
    );
    res.send(html);
  } catch (error) {
    // 完全失败，返回基础HTML
    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="root"></div>
          <script src="/client.js"></script>
        </body>
      </html>
    `);
  }
});
```

### 2. 监控与性能追踪

```javascript
// 性能监控
import { performance } from 'perf_hooks';

app.get('*', async (req, res) => {
  const startTime = performance.now();
  
  // 渲染过程
  const html = await renderPage(req);
  
  const renderTime = performance.now() - startTime;
  
  // 发送监控数据
  sendMetrics({
    url: req.url,
    renderTime,
    memoryUsage: process.memoryUsage(),
    timestamp: Date.now()
  });
  
  res.set('Server-Timing', `render;dur=${renderTime}`);
  res.send(html);
});

// 客户端性能监控
export function reportWebVitals(metric) {
  const body = JSON.stringify({
    name: metric.name, // LCP, FID, CLS, FCP, TTFB
    value: metric.value,
    id: metric.id,
    label: metric.label
  });
  
  navigator.sendBeacon('/api/vitals', body);
}
```

### 3. 安全防护

```javascript
// XSS防护
import serialize from 'serialize-javascript';
import DOMPurify from 'isomorphic-dompurify';

// 序列化状态时防止XSS
const safeState = serialize(preloadedState, { isJSON: true });

// 渲染用户内容时清理
function UserContent({ html }) {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// CSRF防护
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken();
  next();
});

// 注入CSRF token
const html = `
  <script>
    window.__CSRF_TOKEN__ = "${res.locals.csrfToken}";
  </script>
`;
```

### 4. 可扩展架构

```javascript
// 微服务架构 - SSR服务独立部署
// ssr-service/server.js
import express from 'express';
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // 自动重启
  });
} else {
  const app = express();
  
  // SSR渲染端点
  app.post('/render', async (req, res) => {
    const { componentName, props } = req.body;
    
    try {
      const Component = await import(`./components/${componentName}`);
      const html = renderToString(<Component.default {...props} />);
      
      res.json({ html, success: true });
    } catch (error) {
      res.status(500).json({ error: error.message, success: false });
    }
  });
  
  app.listen(3000);
}

// 主应用调用SSR服务
app.get('/product/:id', async (req, res) => {
  const response = await fetch('http://ssr-service:3000/render', {
    method: 'POST',
    body: JSON.stringify({
      componentName: 'ProductPage',
      props: { id: req.params.id }
    })
  });
  
  const { html } = await response.json();
  res.send(wrapHTML(html));
});
```

## 十、面试高频问题与答案

### Q1: SSR vs CSR vs SSG，如何选择？

**A**: 根据场景特点选择：

| 场景 | 方案 | 理由 |
|------|------|------|
| 博客、文档 | SSG | 内容固定，SEO重要，性能最优 |
| 电商详情页 | SSR | 内容动态，SEO重要，需要实时数据 |
| 管理后台 | CSR | 无SEO需求，复杂交互，开发体验好 |
| 新闻资讯 | ISR | 内容更新频繁，可接受短延迟 |
| 社交Feed | CSR + SSR首屏 | 个性化内容，首屏SEO |

**混合方案**：
```javascript
// 首屏SSR + 后续CSR
export async function getServerSideProps() {
  const initialData = await fetchInitialData();
  return { props: { initialData } };
}

function Page({ initialData }) {
  const [data, setData] = useState(initialData);
  
  useEffect(() => {
    // 客户端继续加载更多数据
    fetchMoreData().then(setData);
  }, []);
  
  return <Feed data={data} />;
}
```

### Q2: Hydration过程中遇到不匹配怎么办？

**A**: 

**原因**：
1. 服务端和客户端渲染结果不一致
2. 使用了`Date.now()`、`Math.random()`等不确定值
3. 浏览器插件修改了DOM

**解决方案**：

```javascript
// 方案1: 使用useEffect避免服务端执行
function Component() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading...</div>; // 服务端和首次渲染相同
  }
  
  return <div>{Math.random()}</div>; // 只在客户端执行
}

// 方案2: 使用suppressHydrationWarning
<div suppressHydrationWarning>
  {new Date().toISOString()}
</div>

// 方案3: 确保数据一致性
// 服务端生成UUID并传递给客户端
export async function getServerSideProps() {
  const uuid = generateUUID();
  return { props: { uuid } };
}

function Component({ uuid }) {
  return <div id={uuid}>Content</div>;
}
```

**调试技巧**：
```javascript
// 开发环境显示详细错误
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('Hydration')) {
      console.trace(); // 打印调用栈
    }
    originalError(...args);
  };
}
```

### Q3: 如何处理SSR中的异步数据依赖？

**A**: 

**方案1: getServerSideProps（Next.js推荐）**
```javascript
export async function getServerSideProps({ params }) {
  // 并行获取多个数据源
  const [user, posts, comments] = await Promise.all([
    fetchUser(params.id),
    fetchPosts(params.id),
    fetchComments(params.id)
  ]);
  
  return {
    props: { user, posts, comments }
  };
}
```

**方案2: 组件级预取**
```javascript
// 定义组件的数据需求
ProductPage.getInitialProps = async ({ query }) => {
  const product = await fetchProduct(query.id);
  const reviews = await fetchReviews(query.id);
  
  return { product, reviews };
};

// 服务端批量执行
async function renderWithData(Component, context) {
  const props = Component.getInitialProps 
    ? await Component.getInitialProps(context)
    : {};
  
  return renderToString(<Component {...props} />);
}
```

**方案3: React 18 Suspense（未来推荐）**
```javascript
function ProductPage({ id }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <ProductDetails id={id} /> {/* 内部使用use(promise) */}
    </Suspense>
  );
}

// ProductDetails内部
function ProductDetails({ id }) {
  const product = use(fetchProduct(id)); // React 18+ 新API
  return <div>{product.name}</div>;
}
```

### Q4: SSR性能瓶颈在哪里，如何优化？

**A**: 

**主要瓶颈**：
1. 数据库查询慢
2. 渲染大型组件树耗时
3. 序列化大量数据
4. 内存占用高

**优化方案**：

**1. 缓存策略（最有效）**
```javascript
// Redis页面缓存
import redis from 'redis';
const client = redis.createClient();

app.get('*', async (req, res) => {
  const cacheKey = `page:${req.url}`;
  
  // 尝试缓存
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.send(cached);
  }
  
  // 渲染
  const html = renderToString(<App />);
  
  // 写入缓存（5分钟）
  await client.setex(cacheKey, 300, html);
  
  res.send(html);
});
```

**2. 组件级优化**
```javascript
// 使用React.memo避免重复渲染
const HeavyComponent = React.memo(({ data }) => {
  return <ExpensiveTree data={data} />;
}, (prev, next) => {
  return prev.data.id === next.data.id;
});

// 懒加载非关键组件
const Comments = lazy(() => import('./Comments'));

function Page() {
  return (
    <>
      <CriticalContent /> {/* SSR */}
      <Suspense fallback={null}>
        <Comments /> {/* 客户端加载 */}
      </Suspense>
    </>
  );
}
```

**3. 流式渲染**
```javascript
// React 18 流式SSR
import { renderToPipeableStream } from 'react-dom/server';

app.get('*', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady() {
      res.setHeader('Content-Type', 'text/html');
      pipe(res); // 立即发送Shell
    }
  });
});

// 优势：TTFB从1s降低到100ms
```

**4. 数据库优化**
```javascript
// 使用DataLoader批量查询
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (ids) => {
  const users = await db.users.findMany({ where: { id: { in: ids } } });
  return ids.map(id => users.find(u => u.id === id));
});

// N+1问题优化
// 之前: 每个用户一次查询
const users = await Promise.all(
  posts.map(post => fetchUser(post.userId))
);

// 之后: 批量查询
const users = await userLoader.loadMany(
  posts.map(post => post.userId)
);
```

**5. 服务端并发控制**
```javascript
// 使用Worker Threads
import { Worker } from 'worker_threads';

const renderWorker = new Worker('./render-worker.js');

app.get('*', (req, res) => {
  renderWorker.postMessage({ url: req.url, cookies: req.cookies });
  
  renderWorker.once('message', ({ html }) => {
    res.send(html);
  });
});

// render-worker.js
import { parentPort } from 'worker_threads';
import { renderToString } from 'react-dom/server';

parentPort.on('message', ({ url, cookies }) => {
  const html = renderToString(<App url={url} cookies={cookies} />);
  parentPort.postMessage({ html });
});
```

### Q5: SSR项目如何进行SEO优化？

**A**: 

**完整SEO方案**：

```javascript
// 1. Meta标签管理
import Head from 'next/head';

function SEOHead({ title, description, image, url }) {
  return (
    <Head>
      {/* 基础Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* 结构化数据 (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description,
            image,
            url,
            datePublished: '2024-01-01',
            author: {
              '@type': 'Person',
              name: 'Author Name'
            }
          })
        }}
      />
    </Head>
  );
}

// 2. 生成Sitemap
// pages/sitemap.xml.js
export async function getServerSideProps({ res }) {
  const pages = await getAllPages();
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages.map(page => `
        <url>
          <loc>https://example.com${page.url}</loc>
          <lastmod>${page.updatedAt}</lastmod>
          <changefreq>daily</changefreq>
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

// 3. Robots.txt
// public/robots.txt
User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml

// 4. 性能优化（Core Web Vitals）
// - LCP < 2.5s
// - FID < 100ms
// - CLS < 0.1

import Image from 'next/image';

function OptimizedImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero Image"
      width={1200}
      height={630}
      priority // 首屏图片
      placeholder="blur"
    />
  );
}
```

### Q6: 大规模SSR应用如何保证稳定性？

**A**: 

**1. 降级策略**
```javascript
app.get('*', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 设置超时
    const html = await Promise.race([
      renderPage(req),
      timeout(3000) // 3秒超时
    ]);
    
    res.send(html);
  } catch (error) {
    console.error('SSR failed:', error);
    
    // 降级到CSR
    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="root"></div>
          <script src="/client.js"></script>
        </body>
      </html>
    `);
  } finally {
    // 监控渲染时间
    const duration = Date.now() - startTime;
    sendMetric('ssr.render.duration', duration);
  }
});

function timeout(ms) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
}
```

**2. 内存管理**
```javascript
// 定期重启Worker进程
import cluster from 'cluster';

if (cluster.isPrimary) {
  const workers = new Set();
  
  // Fork workers
  for (let i = 0; i < 4; i++) {
    const worker = cluster.fork();
    workers.add(worker);
  }
  
  // 每30分钟优雅重启一个Worker
  setInterval(() => {
    const [worker] = workers;
    workers.delete(worker);
    
    const newWorker = cluster.fork();
    workers.add(newWorker);
    
    // 等待新Worker准备好再关闭旧的
    newWorker.on('listening', () => {
      worker.disconnect();
    });
  }, 30 * 60 * 1000);
}

// 监控内存使用
setInterval(() => {
  const usage = process.memoryUsage();
  
  if (usage.heapUsed > 1.5 * 1024 * 1024 * 1024) { // 1.5GB
    console.error('High memory usage:', usage);
    // 触发告警
    sendAlert('High Memory Usage', usage);
  }
}, 10000);
```

**3. 错误监控**
```javascript
// 全局错误捕获
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  sendErrorToSentry(error);
  
  // 优雅退出
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  sendErrorToSentry(reason);
});

// React错误边界
class SSRErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    sendErrorToSentry(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackUI />;
    }
    return this.props.children;
  }
}
```

---

## 总结

React SSR是一个复杂的技术体系，涉及服务端渲染、Hydration、数据预取、性能优化等多个方面。掌握SSR需要理解：

**核心概念**：
- 服务端渲染流程
- Hydration机制
- 同构应用架构

**性能优化**：
- 缓存策略（页面缓存、组件缓存）
- 流式渲染（React 18）
- 代码分割与懒加载

**生产实践**：
- 降级策略
- 监控告警
- 安全防护

**技术演进**：
- React Server Components
- Partial Prerendering
- Streaming SSR + Selective Hydration

在实际项目中，需要根据业务场景选择合适的渲染策略，平衡性能、开发体验和用户体验。