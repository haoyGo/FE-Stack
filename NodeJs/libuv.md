# libuv 详解

## 概念

**libuv** 是 Node.js 的核心依赖库，是一个**跨平台的异步 I/O 库**，用 C 语言编写。它为 Node.js 提供了事件循环、异步 I/O、线程池等底层能力。

---

## 核心作用

### 1. 跨平台抽象层

```
┌─────────────────────────────────────┐
│         Node.js (JavaScript)        │
│                                     │
└──────────────┬──────────────────────┘
               │ 调用
               ↓
┌─────────────────────────────────────┐
│            libuv (C)                │
│  - 事件循环                          │
│  - 异步 I/O                          │
│  - 线程池                            │
│  - 跨平台 API 封装                   │
└──────────────┬──────────────────────┘
               │ 调用操作系统 API
               ↓
┌─────────────────────────────────────┐
│        操作系统内核                  │
│  ┌──────────┐      ┌──────────┐    │
│  │  Linux   │      │ Windows  │    │
│  │ (epoll)  │      │ (IOCP)   │    │
│  └──────────┘      └──────────┘    │
│  ┌──────────┐      ┌──────────┐    │
│  │  macOS   │      │   其他    │    │
│  │ (kqueue) │      │          │    │
│  └──────────┘      └──────────┘    │
└─────────────────────────────────────┘
```

**作用：**

- 统一不同操作系统的 I/O 接口（Linux epoll、Windows IOCP、macOS kqueue）
- 让 Node.js 代码可以在不同平台运行

---

## 核心功能

### 1. 事件循环（Event Loop）

libuv 实现了 Node.js 的事件循环机制，包含 6 个阶段：

```javascript
// Node.js 事件循环由 libuv 驱动
┌───────────────────────┐
│   ① Timers            │  执行 setTimeout/setInterval 回调
├───────────────────────┤
│   ② Pending callbacks │  执行延迟到下一个循环迭代的 I/O 回调
├───────────────────────┤
│   ③ Idle, prepare     │  内部使用
├───────────────────────┤
│   ④ Poll              │  获取新的 I/O 事件（最重要）
├───────────────────────┤
│   ⑤ Check             │  执行 setImmediate 回调
├───────────────────────┤
│   ⑥ Close callbacks   │  执行关闭回调（如 socket.on('close')）
└───────────────────────┘
```

**示例：**

```javascript
// JavaScript 代码
const fs = require("fs");

// ① 文件读取请求 → libuv 处理
fs.readFile("/path/to/file", (err, data) => {
  // ④ 回调在事件循环的 Poll 阶段执行
  console.log("文件读取完成");
});

// ② 主线程继续执行其他代码
console.log("主线程不阻塞");
```

**libuv 内部处理：**

```c
// libuv 伪代码（简化）
void uv_run(uv_loop_t *loop) {
  while (true) {
    // 1. 执行 timers 回调
    uv__run_timers(loop);

    // 2. 处理 I/O 事件（核心）
    uv__io_poll(loop, timeout); // 调用 epoll/IOCP/kqueue

    // 3. 执行 check 回调（setImmediate）
    uv__run_check(loop);

    // 4. 执行关闭回调
    uv__run_closing_handles(loop);

    // 没有任务时退出
    if (!uv__loop_alive(loop)) break;
  }
}
```

---

### 2. 线程池（Thread Pool）

libuv 内置线程池，用于处理**无法异步执行的阻塞操作**。

#### 默认配置

```bash
# 默认 4 个线程
UV_THREADPOOL_SIZE=4

# 修改线程池大小（最大 1024）
UV_THREADPOOL_SIZE=16 node app.js
```

#### 使用线程池的操作

```javascript
// ✅ 以下操作会使用 libuv 线程池
const fs = require("fs");
const crypto = require("crypto");
const dns = require("dns");

// 1. 文件操作（部分）
fs.readFile("/path/to/file", callback); // 使用线程池
fs.writeFile("/path/to/file", data, callback); // 使用线程池

// 2. DNS 查询（部分）
dns.lookup("google.com", callback); // 使用线程池

// 3. 加密操作
crypto.pbkdf2("password", "salt", 100000, 64, "sha512", callback); // 使用线程池

// 4. zlib 压缩
const zlib = require("zlib");
zlib.gzip(buffer, callback); // 使用线程池
```

#### 线程池工作流程

```
JavaScript 主线程
       ↓
┌──────────────────────────────────┐
│  调用 fs.readFile()               │
│  (JavaScript)                    │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  libuv 将任务提交到线程池          │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  libuv 线程池（默认 4 个线程）      │
│  ┌────────┐ ┌────────┐           │
│  │Thread 1│ │Thread 2│ ... 并发执行│
│  └────────┘ └────────┘           │
└──────────────┬───────────────────┘
               │ 完成
               ↓
┌──────────────────────────────────┐
│  结果返回事件循环队列              │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  Poll 阶段执行回调                │
│  callback(null, data)            │
└──────────────────────────────────┘
```

#### 验证线程池限制

```javascript
const crypto = require("crypto");

// 测试：同时执行 8 个加密任务
const start = Date.now();
let count = 0;

for (let i = 0; i < 8; i++) {
  crypto.pbkdf2("password", "salt", 100000, 64, "sha512", () => {
    count++;
    console.log(`任务 ${i + 1} 完成，耗时: ${Date.now() - start}ms`);

    if (count === 8) {
      console.log(`总耗时: ${Date.now() - start}ms`);
    }
  });
}

// 结果（默认 4 个线程）：
// 任务 1 完成，耗时: 1025ms
// 任务 2 完成，耗时: 1027ms
// 任务 3 完成，耗时: 1030ms
// 任务 4 完成，耗时: 1031ms  ← 前 4 个任务并发完成
// 任务 5 完成，耗时: 2045ms  ← 后 4 个任务等待前 4 个完成
// 任务 6 完成，耗时: 2048ms
// 任务 7 完成，耗时: 2050ms
// 任务 8 完成，耗时: 2051ms
// 总耗时: 2051ms

// 如果设置 UV_THREADPOOL_SIZE=8：
// 所有任务在 ~1000ms 内并发完成
```

---

### 3. 网络 I/O（异步非阻塞）

**网络操作不使用线程池**，直接使用操作系统的异步 I/O 机制。

```javascript
// ✅ 网络操作由操作系统内核处理（不占用线程池）
const http = require("http");

// 可以同时处理上万个并发连接
const server = http.createServer((req, res) => {
  res.end("Hello World");
});

server.listen(3000);
```

#### 网络 I/O 工作流程

```
Node.js 主线程
       ↓
┌──────────────────────────────────┐
│  监听端口 3000                     │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  libuv 调用操作系统 API            │
│  - Linux: epoll_wait()            │
│  - macOS: kevent()                │
│  - Windows: GetQueuedCompletionStatus()│
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  操作系统内核监听端口              │
│  (异步非阻塞，不占用 CPU)          │
└──────────────┬───────────────────┘
               │ 收到请求
               ↓
┌──────────────────────────────────┐
│  内核通知 libuv 有新连接           │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  事件循环执行回调                  │
│  (req, res) => res.end('...')    │
└──────────────────────────────────┘
```

---

## libuv 与 Node.js 性能关系

### 1. 为什么 Node.js 适合 I/O 密集型？

```javascript
// ❌ 传统多线程服务器（如 Apache）
// 每个请求一个线程，1000 个并发 = 1000 个线程
// 线程切换开销大，内存占用高

// ✅ Node.js + libuv
// 单线程事件循环，I/O 操作异步执行
// 1000 个并发连接只需 1 个主线程 + 少量工作线程
```

**性能对比：**

| 场景           | 传统多线程 | Node.js (libuv)       | 内存占用 |
| -------------- | ---------- | --------------------- | -------- |
| 1000 并发连接  | 1000 线程  | 1 主线程 + 4 工作线程 | 1/200    |
| 10000 并发连接 | 崩溃       | 正常运行              | -        |

---

### 2. 为什么 Node.js 不适合 CPU 密集型？

```javascript
// ❌ CPU 密集型任务会阻塞事件循环
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 这会阻塞主线程，导致所有其他请求被延迟
app.get("/calc", (req, res) => {
  const result = fibonacci(40); // 耗时 ~2 秒
  res.send({ result });
});

// ✅ 解决方案：使用 Worker Threads
const { Worker } = require("worker_threads");

app.get("/calc", (req, res) => {
  const worker = new Worker("./fib-worker.js");
  worker.on("message", (result) => {
    res.send({ result });
  });
});
```

---

## libuv 关键特性

### 1. 支持的 I/O 模型

| 操作系统 | libuv 使用的 I/O 模型 | 特点                           |
| -------- | --------------------- | ------------------------------ |
| Linux    | **epoll**             | 高效事件通知机制，支持百万并发 |
| macOS    | **kqueue**            | BSD 系列的高效事件机制         |
| Windows  | **IOCP**              | 完成端口，Windows 独有         |

### 2. 定时器实现

```javascript
// libuv 使用最小堆管理定时器
setTimeout(() => console.log("A"), 100);
setTimeout(() => console.log("B"), 50);

// libuv 内部：
// 堆顶是最快到期的定时器（50ms）
// 每次事件循环检查堆顶，执行到期的回调
```

### 3. 信号处理

```javascript
// libuv 封装信号处理
process.on("SIGINT", () => {
  console.log("收到 Ctrl+C，优雅退出");
  process.exit(0);
});
```

---

## 常见面试问题

### Q1: libuv 的线程池大小如何设置？

**A:**

```bash
# 默认 4 个，范围 1-1024
UV_THREADPOOL_SIZE=16 node app.js

# 根据场景设置：
# - CPU 密集型（加密）：核心数 * 2
# - I/O 密集型（文件）：核心数 * 4
# - 混合场景：实测调优
```

### Q2: 哪些操作会使用线程池？

**A:**

```javascript
// ✅ 使用线程池
fs.readFile(); // 文件读取
fs.writeFile(); // 文件写入
dns.lookup(); // DNS 查询（getaddrinfo）
crypto.pbkdf2(); // 加密
zlib.gzip(); // 压缩

// ❌ 不使用线程池（内核异步 I/O）
http.request(); // HTTP 请求
net.connect(); // TCP 连接
fs.watch(); // 文件监听（inotify/FSEvents）
```

### Q3: libuv 和 V8 的关系？

**A:**

```
┌─────────────────────────────────┐
│          Node.js 架构            │
├─────────────────────────────────┤
│  V8 引擎 (执行 JavaScript)       │ ← 负责 JS 代码执行、GC
├─────────────────────────────────┤
│  Node.js Bindings (C++)         │ ← 连接 V8 和 libuv
├─────────────────────────────────┤
│  libuv (事件循环、I/O)           │ ← 负责异步 I/O、事件驱动
└─────────────────────────────────┘

// V8 执行 JS 代码
const fs = require('fs');
fs.readFile('file.txt', callback);

// Node.js Bindings 将调用转换为 libuv API
uv_fs_read(...);

// libuv 执行 I/O，完成后通知 V8 执行回调
```

---

## 操作系统对不同 I/O 的支持

| I/O 类型     | 操作系统支持                           | 是否使用线程池 | 原因                            |
| ------------ | -------------------------------------- | -------------- | ------------------------------- |
| **网络 I/O** | ✅ 原生异步支持<br>(epoll/kqueue/IOCP) | ❌ 不使用      | 内核直接管理 TCP 连接，效率极高 |
| **文件 I/O** | ⚠️ 支持有限<br>(Linux AIO 性能差)      | ✅ 使用        | 需要线程池模拟异步              |
| **DNS 查询** | ❌ 阻塞式 API<br>(getaddrinfo)         | ✅ 使用        | 系统调用是阻塞的                |
| **加密操作** | ❌ 纯 CPU 计算                         | ✅ 使用        | 耗时操作，避免阻塞主线程        |

---

## 总结

**libuv 的核心价值：**

1. **跨平台抽象**：统一不同操作系统的 I/O 接口
2. **事件循环**：实现异步非阻塞 I/O
3. **线程池**：处理无法异步化的阻塞操作
4. **高性能**：单线程处理高并发连接
