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