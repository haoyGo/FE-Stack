# PWA（Progressive Web App）渐进式 Web 应用

## 一、什么是 PWA？

PWA 是一种结合了 Web 和原生应用优势的应用开发模式，通过现代 Web 技术提供接近原生应用的用户体验。

### 核心特性

- **渐进式**：适用于所有浏览器，功能逐步增强
- **响应式**：适配各种屏幕尺寸和设备
- **离线可用**：通过 Service Worker 实现离线访问
- **类原生体验**：可添加到主屏幕，全屏运行
- **安全**：必须通过 HTTPS 提供服务
- **可发现**：通过 manifest.json 被识别为"应用程序"
- **可安装**：无需应用商店即可安装到设备
- **推送通知**：支持消息推送
- **始终最新**：Service Worker 可自动更新

### PWA 的优势

| 对比项   | PWA                | 原生应用      | 传统 Web |
| -------- | ------------------ | ------------- | -------- |
| 安装成本 | 低（无需应用商店） | 高            | 无       |
| 跨平台   | ✅ 一套代码        | ❌ 需分别开发 | ✅       |
| 离线访问 | ✅                 | ✅            | ❌       |
| 推送通知 | ✅                 | ✅            | ❌       |
| 更新方式 | 自动更新           | 手动更新      | 实时更新 |
| 性能     | 接近原生           | 最优          | 一般     |
| 开发成本 | 较低               | 高            | 低       |

---

## 二、核心技术

### 1. Service Worker（核心）

Service Worker 是运行在浏览器背后的独立线程（Web Worker），可以拦截网络请求、缓存资源、推送消息等。

#### 基本注册

```javascript
// 在主线程注册 Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW 注册成功:", registration.scope);
      })
      .catch((error) => {
        console.error("SW 注册失败:", error);
      });
  });
}
```

#### Service Worker 生命周期

```javascript
// sw.js
const CACHE_NAME = "my-pwa-v1";
const urlsToCache = [
  "/",
  "/styles/main.css",
  "/scripts/main.js",
  "/images/logo.png",
];

// 1. 安装阶段：缓存静态资源
self.addEventListener("install", (event) => {
  console.log("SW: 安装中...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("SW: 缓存文件");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 立即激活
  );
});

// 2. 激活阶段：清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("SW: 激活中...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("SW: 删除旧缓存", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // 立即控制所有页面
  );
});

// 3. 拦截请求：缓存优先策略
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 缓存命中，返回缓存
      if (response) {
        return response;
      }
      // 缓存未命中，发起网络请求
      return fetch(event.request);
    })
  );
});
```

### 2. Web App Manifest

manifest.json 定义应用的元数据，使其可被识别为应用并添加到主屏幕。

```json
{
  "name": "我的 PWA 应用",
  "short_name": "PWA App",
  "description": "一个渐进式 Web 应用示例",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/images/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

在 HTML 中引入：

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2196F3" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
```

---

## 三、面试常见问答（第一部分）

### Q1: 什么是 PWA？它解决了什么问题？

**答**：PWA 是渐进式 Web 应用，通过 Service Worker、Web App Manifest、HTTPS 等技术，让 Web 应用具备：

- **离线访问**：Service Worker 缓存资源
- **原生体验**：可安装、全屏、推送通知
- **快速加载**：缓存策略优化性能
- **始终最新**：自动更新，无需手动

**解决的痛点**：

- 传统 Web 依赖网络、无法离线
- 无法像原生应用一样安装和推送
- 用户体验不如原生应用流畅

### Q2: Service Worker 的生命周期是什么？

**答**：Service Worker 生命周期包括：

1. **注册（Register）**：通过 `navigator.serviceWorker.register()` 注册
2. **安装（Install）**：`install` 事件触发，可预缓存静态资源
3. **等待（Waiting）**：等待旧版本 Service Worker 释放控制权
4. **激活（Activate）**：`activate` 事件触发，可清理旧缓存
5. **运行（Fetch/Message/Push）**：监听事件，拦截请求、处理消息

**关键点**：

- `self.skipWaiting()` 跳过等待，立即激活
- `self.clients.claim()` 立即控制所有页面

### Q3: PWA 必须使用 HTTPS 吗？为什么？

**答**：是的，PWA 必须通过 HTTPS（localhost 除外），原因：

- Service Worker 可拦截网络请求，HTTP 不安全
- 推送通知、地理位置等 API 需要安全上下文
- 防止中间人攻击，保护用户数据

**例外**：`localhost` 和 `127.0.0.1` 可用于开发调试。

---
