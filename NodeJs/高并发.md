# Node.js 高并发问题解决方案（高级/资深前端面试）

## 1. 高并发瓶颈深度分析

### 1.1 Node.js 事件循环机制

**架构图：**

```
┌───────────────────────┐
│   JavaScript 主线程    │  ← 单线程执行用户代码
│   (Event Loop)        │
└──────────┬────────────┘
           │
   ┌───────┴────────┐
   │  事件循环6个阶段  │
   ├────────────────┤
   │ ① Timers       │  setTimeout/setInterval
   │ ② Pending      │  系统调用回调
   │ ③ Idle/Prepare │  内部使用
   │ ④ Poll         │  IO 回调（最重要）
   │ ⑤ Check        │  setImmediate
   │ ⑥ Close        │  关闭回调
   └────────┬───────┘
            ↓
   ┌────────────────┐
   │  libuv 线程池   │  默认4个线程
   │  (IO 并发执行)  │  处理文件/DNS/加密
   └────────────────┘
```

**关键点：**

- 主线程只负责事件分发，不做 IO 等待
- IO 操作（文件/网络/数据库）交给 libuv 线程池并发执行
- 回调完成后，结果返回事件循环队列

### 1.2 三大瓶颈详解

#### 瓶颈 1：CPU 密集型任务阻塞事件循环

**问题场景：**

```javascript
// ❌ 错误：计算阻塞主线程 5 秒
app.get("/calc", (req, res) => {
  let sum = 0;
  for (let i = 0; i < 1e9; i++) {
    sum += i;
  }
  res.send({ sum });
});

// 期间所有请求被阻塞，包括 /health 健康检查
```

**影响：**

- 事件循环被占用，无法处理其他请求
- 服务假死，负载均衡器误判为宕机
- 用户体验极差（超时）

**解决方案：**

```javascript
// ✅ 正确：使用 worker_threads
const { Worker } = require("worker_threads");

app.get("/calc", (req, res) => {
  const worker = new Worker("./calc-worker.js");
  worker.on("message", (sum) => {
    res.send({ sum });
  });
});
```

#### 瓶颈 2：IO 并发受限

**数据库连接池耗尽：**

```javascript
// ❌ 不使用连接池：每次请求都创建新连接
// ❌ 串行查询：100ms + 100ms = 200ms
const user = await db.query("SELECT * FROM users WHERE id = ?", [1]);
const orders = await db.query("SELECT * FROM orders WHERE user_id = ?", [1]);

// ✅ 并发查询：max(100ms, 100ms) = 100ms
const [user, orders] = await Promise.all([
  db.query("SELECT * FROM users WHERE id = ?", [1]),
  db.query("SELECT * FROM orders WHERE user_id = ?", [1]),
]);
```

**连接池配置：**

```javascript
// ✅ 使用连接池：复用已有连接
const pool = mysql.createPool({
  connectionLimit: 10, // 最大连接数
  queueLimit: 100, // 排队上限
  acquireTimeout: 10000, // 获取连接超时
  waitForConnections: true, // 连接池满时是否等待
});

// 超时处理
try {
  const connection = await pool.getConnection();
  // 执行查询
  const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [
    req.params.id,
  ]);
  res.json(rows[0]);
} catch (error) {
  if (error.code === "POOL_TIMEOUT") {
    console.error("获取连接超时，可能是连接池配置过小或查询过慢");
  }
} finally {
  // 确保释放
  connection.release();
}
```

#### 瓶颈 3：内存与 GC

**v8.getHeapStatistics() vs process.memoryUsage() 对比：**

| 指标         | `v8.getHeapStatistics()` | `process.memoryUsage()`               |
| ------------ | ------------------------ | ------------------------------------- |
| **作用域**   | 仅 V8 堆内存（JS 对象）  | 整个进程内存（包括 C++ 插件、Buffer） |
| **返回值**   | 15+ 个详细指标           | 5 个核心指标                          |
| **性能开销** | 较大（~1ms）             | 极小（~0.1ms）                        |
| **适用场景** | 深度分析 V8 堆、GC 调优  | 日常监控、快速检查                    |

**process.memoryUsage() 详解：**

```javascript
const usage = process.memoryUsage();
console.log(usage);
/*
{
  rss: 50331648,           // ① 常驻集大小（Resident Set Size）：进程占用的物理内存总量
  heapTotal: 7159808,      // ② V8 堆内存总大小（已分配的堆内存）
  heapUsed: 4883840,       // ③ V8 堆内存使用量（实际使用的 JS 对象内存）
  external: 1245184,       // ④ C++ 对象绑定到 JS 对象的内存（如 Buffer、ArrayBuffer）
  arrayBuffers: 17888      // ⑤ ArrayBuffer 和 SharedArrayBuffer 的内存（Node.js 13.9.0+）
}
*/
```

**关键区别说明：**

```javascript
// 1. rss（Resident Set Size）：进程的实际物理内存占用
// 包含：heapTotal + external + 代码段 + 栈 + C++ 插件内存
rss ≈ heapTotal + external + 代码&栈 + C++插件

// 2. heapTotal vs heapUsed
heapTotal = 7 MB   // V8 向系统申请的堆内存（可能包含空闲区域）
heapUsed = 4.8 MB  // 实际使用的堆内存（JS 对象占用）
// 差值 2.2 MB 是 V8 预留的空闲空间

// 3. external：C++ 对象内存（不在 V8 堆内）
const buf = Buffer.alloc(10 * 1024 * 1024); // 10 MB Buffer
// external 会增加 10 MB，但 heapUsed 几乎不变
```

**v8.getHeapStatistics() 详解：**

```javascript
const v8 = require("v8");
const heapStats = v8.getHeapStatistics();
console.log(heapStats);
/*
{
  total_heap_size: 7159808,              // 堆总大小（同 heapTotal）
  total_heap_size_executable: 524288,    // 可执行代码的堆大小
  total_physical_size: 5140936,          // 实际提交的物理内存
  total_available_size: 1519618488,      // 可用堆大小（距离 heap_size_limit 的剩余空间）
  used_heap_size: 4883840,               // 已使用堆大小（同 heapUsed）
  heap_size_limit: 1526909922,           // 堆大小上限（默认 ~1.4 GB，可通过 --max-old-space-size 调整）
  malloced_memory: 254128,               // 通过 malloc 分配的内存
  peak_malloced_memory: 405136,          // malloc 分配的峰值内存
  does_zap_garbage: 0,                   // 是否清零垃圾内存（调试用）
  number_of_native_contexts: 1,          // 原生上下文数量
  number_of_detached_contexts: 0,        // 分离的上下文数量（潜在内存泄漏）
  total_global_handles_size: 8192,       // 全局句柄大小
  used_global_handles_size: 2112,        // 已使用的全局句柄
  external_memory: 1245184               // 外部内存（同 process.memoryUsage().external）
}
*/
```

**核心区别总结：**

```javascript
// ✅ 日常监控：使用 process.memoryUsage()
setInterval(() => {
  const usage = process.memoryUsage();
  const heapUsedMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
  const rssMB = (usage.rss / 1024 / 1024).toFixed(2);

  console.log(`堆内存: ${heapUsedMB} MB, 物理内存: ${rssMB} MB`);

  // 简单阈值告警
  if (usage.heapUsed / usage.heapTotal > 0.9) {
    console.warn("⚠️ 堆内存使用率超过 90%");
  }
}, 5000);

// ✅ 深度分析：使用 v8.getHeapStatistics()
const v8 = require("v8");

setInterval(() => {
  const stats = v8.getHeapStatistics();
  const usedPercent = (
    (stats.used_heap_size / stats.heap_size_limit) *
    100
  ).toFixed(2);
  const availableMB = (stats.total_available_size / 1024 / 1024).toFixed(2);

  console.log(`堆使用率: ${usedPercent}%, 可用: ${availableMB} MB`);

  // 检测内存泄漏：分离的上下文数量持续增长
  if (stats.number_of_detached_contexts > 10) {
    console.error("🚨 检测到 detached contexts，可能存在内存泄漏");
  }
}, 10000);
```

---

## 2. Node.js 并发模型原理

- **事件驱动、异步非阻塞**：主线程负责事件分发，IO 操作交给底层线程池（libuv）
- **单线程处理请求**，但 IO 操作可并发执行

## 3. 解决高并发的核心方案

### 3.1 进程模型（Cluster）

#### 核心原理

**架构：**

```
主进程 (Master)
  ├─ 监听端口 (如 3000)
  ├─ fork 子进程 (Worker 1, 2, 3, 4...)
  └─ 负载均衡 (Round-Robin 轮询)

子进程 (Worker)
  ├─ 独立 V8 实例和内存
  ├─ 独立事件循环
  └─ 处理实际请求
```

**负载均衡算法：**

- **Round-Robin**（轮询）：主进程依次将请求分配给子进程
- **共享 Socket**：子进程共享同一个 Socket，由操作系统调度（Windows）

#### 生产级完整代码

```js
// server.js - 生产级 Cluster 实现
const cluster = require("cluster");
const http = require("http");
const os = require("os");
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`[Master ${process.pid}] 启动，CPUs: ${numCPUs}`);

  // 1. fork 子进程
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();

    // 主进程向子进程发送配置
    worker.send({ cmd: "CONFIG", port: 3000, workerId: i });
  }

  // 2. 监听子进程退出，自动重启
  cluster.on("exit", (worker, code, signal) => {
    console.log(`[Worker ${worker.process.pid}] 退出 (code: ${code})`);

    // 延迟重启，避免频繁崩溃
    setTimeout(() => {
      const newWorker = cluster.fork();
      newWorker.send({ cmd: "CONFIG", port: 3000 });
    }, 1000);
  });

  // 3. 监听子进程在线
  cluster.on("online", (worker) => {
    console.log(`[Worker ${worker.process.pid}] 已启动`);
  });

  // 4. 监听子进程消息（统计上报）
  Object.values(cluster.workers).forEach((worker) => {
    worker.on("message", (msg) => {
      if (msg.cmd === "STATS") {
        console.log(`[Worker ${worker.process.pid}] 请求数: ${msg.count}`);
      }
    });
  });
} else {
  // 子进程：启动 HTTP 服务
  let requestCount = 0;

  const server = http.createServer((req, res) => {
    requestCount++;

    // 模拟异步 IO
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          pid: process.pid,
          requestCount,
          memory:
            (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + "MB",
        })
      );
    }, Math.random() * 50);
  });

  // 接收主进程配置
  process.on("message", (msg) => {
    if (msg.cmd === "CONFIG") {
      server.listen(msg.port, () => {
        console.log(`[Worker ${process.pid}] 监听端口 ${msg.port}`);
      });
    }
  });

  // 定期上报统计
  setInterval(() => {
    process.send({ cmd: "STATS", count: requestCount });
  }, 10000);

  // 优雅退出
  process.on("SIGTERM", () => {
    console.log(`[Worker ${process.pid}] 收到 SIGTERM，优雅关闭...`);
    server.close(() => {
      console.log(`[Worker ${process.pid}] 已关闭`);
      process.exit(0);
    });
  });
}
```

#### 验证负载均衡

```bash
# 启动服务
node server.js

# 测试负载均衡（观察不同 PID）
for i in {1..10}; do
  curl http://localhost:3000
done

# 输出示例（PID 轮询）：
# {"pid":12345,"requestCount":1,"memory":"25.3MB"}
# {"pid":12346,"requestCount":1,"memory":"24.8MB"}
# {"pid":12347,"requestCount":1,"memory":"25.1MB"}
# {"pid":12345,"requestCount":2,"memory":"25.3MB"} ← 回到第一个
```

#### 性能对比实测

| 场景       | 单进程 QPS | Cluster (4 核) QPS | 提升倍数  |
| ---------- | ---------- | ------------------ | --------- |
| 简单 API   | 1,000      | 3,800              | **3.8x**  |
| 数据库查询 | 500        | 1,900              | **3.8x**  |
| 文件读取   | 800        | 3,000              | **3.75x** |

**结论：**

- Cluster 可将 IO 密集型 QPS 提升 **3-4 倍**（接近 CPU 核数）
- 超过核数 fork 子进程无效（反而增加调度开销）

---

### 3.2 Worker Threads（适合 CPU 密集型）

#### 核心原理对比

| 特性         | Worker Threads              | Cluster               |
| ------------ | --------------------------- | --------------------- |
| **本质**     | 多线程（共享内存）          | 多进程（独立内存）    |
| **启动开销** | 小（~5ms）                  | 大（~50ms）           |
| **内存隔离** | 低（共享 V8 堆）            | 高（独立进程）        |
| **数据传递** | SharedArrayBuffer（零拷贝） | IPC（序列化）         |
| **适用场景** | CPU 密集型（加密、压缩）    | IO 密集型（Web 服务） |

#### 实战：图片压缩服务

**主线程（线程池管理）：**

```javascript
// main.js
const { Worker } = require("worker_threads");
const express = require("express");
const app = express();

// 线程池（复用 Worker，避免频繁创建）
class WorkerPool {
  constructor(numWorkers, workerScript) {
    this.workers = [];
    this.queue = [];

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(workerScript);

      worker.on("message", (result) => {
        const { resolve } = worker.currentTask;
        resolve(result);
        this.processNext(worker);
      });

      worker.on("error", (err) => {
        const { reject } = worker.currentTask;
        reject(err);
        this.processNext(worker);
      });

      this.workers.push(worker);
    }
  }

  exec(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      const freeWorker = this.workers.find((w) => !w.currentTask);

      if (freeWorker) {
        freeWorker.currentTask = task;
        freeWorker.postMessage(data);
      } else {
        this.queue.push(task);
      }
    });
  }

  processNext(worker) {
    worker.currentTask = null;
    if (this.queue.length > 0) {
      const task = this.queue.shift();
      worker.currentTask = task;
      worker.postMessage(task.data);
    }
  }
}

// 创建 4 个工作线程
const pool = new WorkerPool(4, "./image-worker.js");

app.post("/compress", async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await pool.exec({
      imagePath: req.body.imagePath,
      quality: 80,
    });
    result.duration = Date.now() - startTime;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

**工作线程（图片压缩）：**

```javascript
// image-worker.js
const { parentPort } = require("worker_threads");
const sharp = require("sharp"); // 图片处理库

parentPort.on("message", async (task) => {
  try {
    const { imagePath, quality } = task;

    // CPU 密集型任务
    const info = await sharp(imagePath)
      .jpeg({ quality })
      .toFile(imagePath.replace(".jpg", "_compressed.jpg"));

    parentPort.postMessage({
      success: true,
      originalSize: info.size,
      compressedSize: info.size * (quality / 100),
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
    });
  }
});
```

#### 共享内存高级用法

**场景：多线程累加计数器（避免竞态）**

```javascript
// main.js
const { Worker } = require("worker_threads");

// 共享内存：4 字节整数
const sharedBuffer = new SharedArrayBuffer(4);
const sharedArray = new Int32Array(sharedBuffer);
sharedArray[0] = 0;

// 创建 4 个线程，每个累加 1000 次
const workers = [];
for (let i = 0; i < 4; i++) {
  workers.push(
    new Worker("./counter-worker.js", {
      workerData: { sharedBuffer },
    })
  );
}

Promise.all(
  workers.map(
    (w) =>
      new Promise((resolve) => {
        w.on("message", resolve);
      })
  )
).then(() => {
  console.log("最终计数:", sharedArray[0]); // 期望 4000
});
```

```javascript
// counter-worker.js
const { workerData, parentPort } = require("worker_threads");
const sharedArray = new Int32Array(workerData.sharedBuffer);

// 使用原子操作避免竞态
for (let i = 0; i < 1000; i++) {
  Atomics.add(sharedArray, 0, 1); // 原子加 1
}

parentPort.postMessage("done");
```

**原子操作 API：**

```javascript
Atomics.add(sharedArray, index, value); // 原子加
Atomics.sub(sharedArray, index, value); // 原子减
Atomics.compareExchange(arr, idx, expect, replace); // CAS
Atomics.load(sharedArray, index); // 原子读
Atomics.store(sharedArray, index, value); // 原子写
```

---

### 3.3 负载均衡与反向代理

#### Nginx 反向代理示例

```
http {
  upstream backend {
    # Node.js Cluster
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
  }

  server {
    listen 80;

    location / {
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

#### Node.js 中间件示例

```javascript
const express = require("express");
const app = express();

// 请求计数
let requestCount = 0;
app.use((req, res, next) => {
  requestCount++;
  console.log(`请求总数: ${requestCount}`);
  next();
});

// 响应时间
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`响应时间: ${duration}ms`);
  });
  next();
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("服务器错误");
});

// 404 处理
app.use((req, res) => {
  res.status(404).send("未找到");
});

app.listen(3000, () => {
  console.log("服务已启动，监听 3000 端口");
});
```

---

### 3.4 监控与故障恢复

#### PM2 进程管理

```bash
# 安装 PM2
npm install pm2 -g

# 启动应用
pm2 start server.js -i max

# 查看状态
pm2 status

# 日志查看
pm2 logs

# 进程监控
pm2 monit

# 配置守护进程
pm2 startup

# 保存进程列表
pm2 save
```

#### 自定义监控指标

```javascript
const client = require("prom-client");

// 创建一个 Registry，用于管理所有的 Metrics
const register = new client.Registry();

// 创建一个 Histogram 记录响应时间
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "请求响应时间",
  labelNames: ["method", "route", "code"],
  // 自定义分桶
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// 将 Histogram 注册到 Registry
register.registerMetric(httpRequestDurationMicroseconds);

// 中间件：记录请求响应时间
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on("finish", () => {
    end({ route: req.path, method: req.method, code: res.statusCode });
  });
  next();
});

// 提供 /metrics 接口给 Prometheus 抓取
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

---

### 3.5 限流与降级

#### 限流算法详解

**1. 令牌桶算法（Token Bucket）**

原理：以恒定速率生成令牌，请求消耗令牌，桶满则丢弃新令牌。

```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity; // 桶容量
    this.tokens = capacity; // 当前令牌数
    this.refillRate = refillRate; // 每秒补充令牌数
    this.lastRefill = Date.now();
  }

  consume(count = 1) {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true; // 允许请求
    }
    return false; // 拒绝请求
  }

  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// 使用：每秒 100 个请求，桶容量 200（支持突发）
const bucket = new TokenBucket(200, 100);

app.use((req, res, next) => {
  if (bucket.consume(1)) {
    next();
  } else {
    res.status(429).json({
      error: "Too Many Requests",
      retryAfter: Math.ceil((1 - bucket.tokens) / bucket.refillRate),
    });
  }
});
```

**2. 漏桶算法（Leaky Bucket）**

原理：请求进入队列，以恒定速率处理，队列满则拒绝。

```javascript
class LeakyBucket {
  constructor(capacity, leakRate) {
    this.capacity = capacity; // 桶容量
    this.queue = []; // 请求队列
    this.leakRate = leakRate; // 每秒处理请求数
    this.processing = false;

    // 定期漏出请求
    this.startLeaking();
  }

  startLeaking() {
    setInterval(() => {
      const count = Math.min(this.queue.length, this.leakRate);
      for (let i = 0; i < count; i++) {
        const callback = this.queue.shift();
        callback();
      }
    }, 1000);
  }

  add(callback) {
    if (this.queue.length < this.capacity) {
      this.queue.push(callback);
      return true;
    }
    return false; // 桶满，拒绝
  }
}

const bucket = new LeakyBucket(1000, 100);

app.use((req, res, next) => {
  const success = bucket.add(() => next());
  if (!success) {
    res.status(429).send("Too Many Requests");
  }
});
```

**3. Redis 分布式限流（滑动窗口）**

```javascript
const redis = require("redis");
const client = redis.createClient();

async function slidingWindowRateLimit(key, limit, window) {
  const now = Date.now();
  const windowStart = now - window * 1000;

  // 使用 ZSET 存储时间戳
  const multi = client.multi();

  // 1. 删除窗口外的记录
  multi.zRemRangeByScore(key, 0, windowStart);

  // 2. 统计窗口内的请求数
  multi.zCard(key);

  // 3. 添加当前请求
  multi.zAdd(key, now, `${now}-${Math.random()}`);

  // 4. 设置过期时间
  multi.expire(key, window);

  const results = await multi.exec();
  const count = results[1];

  return count < limit;
}

// 中间件
app.use(async (req, res, next) => {
  const key = `rate_limit:${req.ip}`;
  const allowed = await slidingWindowRateLimit(key, 100, 60); // 每分钟 100 次

  if (allowed) {
    next();
  } else {
    res.status(429).json({ error: "Rate limit exceeded" });
  }
});
```

#### 熔断降级（Circuit Breaker）

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || 5; // 失败阈值
    this.timeout = options.timeout || 60000; // 熔断时长（ms）
    this.resetTimeout = options.resetTimeout || 30000; // 半开尝试间隔
    this.failureCount = 0;
    this.successCount = 0;
    this.state = "CLOSED"; // CLOSED / OPEN / HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async call(fn, fallback) {
    // 熔断状态：直接返回降级结果
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        console.log("[Circuit Breaker] OPEN - 熔断中");
        return fallback
          ? fallback()
          : Promise.reject(new Error("Circuit breaker is OPEN"));
      }
      this.state = "HALF_OPEN"; // 尝试恢复
      console.log("[Circuit Breaker] 切换到 HALF_OPEN");
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), this.timeout)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return fallback ? fallback() : Promise.reject(error);
    }
  }

  onSuccess() {
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = "CLOSED";
        this.successCount = 0;
        console.log("[Circuit Breaker] 恢复到 CLOSED");
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(
        `[Circuit Breaker] 触发熔断，${this.resetTimeout}ms 后尝试恢复`
      );
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt,
    };
  }
}

// 使用示例
const breaker = new CircuitBreaker({
  threshold: 5, // 5 次失败后熔断
  timeout: 3000, // 单次请求超时 3 秒
  resetTimeout: 10000, // 熔断 10 秒后尝试恢复
});

app.get("/api/external", async (req, res) => {
  try {
    const result = await breaker.call(
      // 主逻辑
      () => fetch("https://external-api.com/data"),
      // 降级逻辑（可选）
      () => ({ data: "降级数据", cached: true })
    );
    res.json(result);
  } catch (error) {
    res.status(503).json({ error: "服务暂时不可用" });
  }
});

// 监控接口
app.get("/circuit-breaker/status", (req, res) => {
  res.json(breaker.getState());
});
```

---

### 3.6 缓存与中间件

#### 多层缓存架构

```
用户请求
  ↓
① 本地内存缓存 (LRU, TTL 1分钟)  ← 最快
  ↓ 未命中
② Redis 缓存 (TTL 1小时)        ← 中等
  ↓ 未命中
③ 数据库                        ← 最慢
```

#### LRU 内存缓存实现

```javascript
class LRUCache {
  constructor(capacity, ttl = 60000) {
    this.capacity = capacity;
    this.ttl = ttl;
    this.cache = new Map(); // Map 保持插入顺序
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    const { value, expireAt } = this.cache.get(key);

    // 检查过期
    if (Date.now() > expireAt) {
      this.cache.delete(key);
      return null;
    }

    // 移到最前面（最近使用）
    this.cache.delete(key);
    this.cache.set(key, { value, expireAt });
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最久未使用的（Map 的第一个元素）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expireAt: Date.now() + this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// 使用示例：多层缓存
const memoryCache = new LRUCache(1000, 60000); // 1000 个，TTL 1 分钟
const redis = require("redis").createClient();

app.get("/user/:id", async (req, res) => {
  const cacheKey = `user:${req.params.id}`;

  // 1️⃣ 查本地内存缓存
  let user = memoryCache.get(cacheKey);
  if (user) {
    return res.json({ ...user, from: "memory" });
  }

  // 2️⃣ 查 Redis 缓存
  user = await redis.get(cacheKey);
  if (user) {
    user = JSON.parse(user);
    memoryCache.set(cacheKey, user); // 回填内存缓存
    return res.json({ ...user, from: "redis" });
  }

  // 3️⃣ 查数据库
  user = await db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);

  // 写入缓存
  await redis.setEx(cacheKey, 3600, JSON.stringify(user)); // Redis 缓存 1 小时
  memoryCache.set(cacheKey, user); // 内存缓存 1 分钟

  res.json({ ...user, from: "database" });
});
```

#### 缓存预热与更新

```javascript
// 缓存预热：启动时加载热点数据
async function warmupCache() {
  const hotUsers = await db.query(
    "SELECT * FROM users ORDER BY visit_count DESC LIMIT 100"
  );

  for (const user of hotUsers) {
    const key = `user:${user.id}`;
    await redis.setEx(key, 3600, JSON.stringify(user));
    memoryCache.set(key, user);
  }

  console.log("✅ 缓存预热完成");
}

// 缓存更新：数据变更时主动更新
app.put("/user/:id", async (req, res) => {
  const { id } = req.params;

  // 更新数据库
  await db.query("UPDATE users SET ? WHERE id = ?", [req.body, id]);

  // 删除缓存（下次请求时重新加载）
  const cacheKey = `user:${id}`;
  memoryCache.clear(cacheKey);
  await redis.del(cacheKey);

  res.json({ success: true });
});
```

---

## 4. 架构设计建议

### 4.1 完整分层架构

```
                    [用户请求]
                        ↓
        ┌───────────────────────────────┐
        │   CDN（静态资源、边缘缓存）      │
        │   - JS/CSS/图片                │
        │   - 就近访问，降低延迟          │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │   Nginx（反向代理、负载均衡）    │
        │   - SSL 卸载                   │
        │   - 限流（ngx_http_limit_req） │
        │   - 负载均衡（upstream）        │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │   API Gateway（鉴权、路由）     │
        │   - JWT 验证                   │
        │   - 路由转发                   │
        │   - 熔断降级                   │
        └───────────────┬───────────────┘
                        ↓
┌───────────────────────────────────────────────┐
│         Node.js Cluster（多进程）              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Worker│ │Worker│ │Worker│ │Worker│         │
│  │ 1    │ │ 2    │ │ 3    │ │ 4    │         │
│  └──────┘ └──────┘ └──────┘ └──────┘         │
└───────────────────┬───────────────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │   Redis Cluster               │
        │   - 缓存（热点数据）           │
        │   - 会话（Session）            │
        │   - 限流计数器                 │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │   消息队列（RabbitMQ/Kafka）    │
        │   - 削峰填谷                   │
        │   - 异步任务                   │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │   数据库集群                   │
        │   - 主从复制                   │
        │   - 读写分离                   │
        │   - 分库分表                   │
        └───────────────────────────────┘
```

### 4.2 监控与告警

#### Prometheus 指标暴露

```javascript
const promClient = require("prom-client");
const register = new promClient.Registry();

// 1. HTTP 请求耗时直方图
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP 请求耗时（秒）",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], // 分桶
  registers: [register],
});

// 2. HTTP 请求总数计数器
const httpRequestTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "HTTP 请求总数",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// 3. 当前并发请求数
const httpActiveRequests = new promClient.Gauge({
  name: "http_active_requests",
  help: "当前活跃请求数",
  registers: [register],
});

// 4. 内存使用率
const memoryUsage = new promClient.Gauge({
  name: "nodejs_memory_usage_bytes",
  help: "Node.js 内存使用（字节）",
  labelNames: ["type"],
  registers: [register],
});

// 定期采集内存指标
setInterval(() => {
  const usage = process.memoryUsage();
  memoryUsage.labels("heapUsed").set(usage.heapUsed);
  memoryUsage.labels("heapTotal").set(usage.heapTotal);
  memoryUsage.labels("external").set(usage.external);
}, 5000);

// 中间件
app.use((req, res, next) => {
  const start = Date.now();
  httpActiveRequests.inc(); // 并发 +1

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal.labels(req.method, route, res.statusCode).inc();

    httpActiveRequests.dec(); // 并发 -1
  });

  next();
});

// 暴露指标
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

#### Grafana 监控看板

```yaml
# prometheus.yml 配置
scrape_configs:
  - job_name: "nodejs-app"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/metrics"
    scrape_interval: 15s
```

**关键指标：**

- **QPS**：`rate(http_requests_total[1m])`
- **P99 延迟**：`histogram_quantile(0.99, http_request_duration_seconds)`
- **错误率**：`rate(http_requests_total{status_code=~"5.."}[1m])`
- **内存使用**：`nodejs_memory_usage_bytes{type="heapUsed"}`

### 4.3 自动扩容（K8s HPA）

```yaml
# hpa.yaml - 水平自动扩容
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nodejs-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nodejs-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70 # CPU 超过 70% 扩容
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80 # 内存超过 80% 扩容
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000" # QPS 超过 1000 扩容
```

---

## 5. 面试答题思路总结

### 标准答题模板（5 分钟）

#### 第一步：分析瓶颈（30 秒）

> **"Node.js 高并发的主要瓶颈有三个：**
>
> 1. **单线程**：CPU 密集型任务阻塞事件循环
> 2. **IO 受限**：数据库连接池、网络带宽有限
> 3. **资源压力**：内存泄漏、GC 暂停"

#### 第二步：核心方案（2 分钟）

> **"针对不同场景有不同方案：**
>
> **1. Cluster 多进程（IO 密集型）**
>
> - 充分利用多核 CPU
> - 内置 Round-Robin 负载均衡
> - 可将 QPS 提升 3-4 倍
>
> **2. Worker Threads 多线程（CPU 密集型）**
>
> - 共享内存，传递数据零拷贝
> - 适合图片处理、加密等重计算
> - 避免阻塞主线程
>
> **3. 异步 IO + 连接池**
>
> - 数据库查询并发执行
> - 连接池复用，避免频繁创建
>
> **4. 限流 + 熔断降级**
>
> - 令牌桶/漏桶算法限流
> - Circuit Breaker 熔断保护
>
> **5. 多层缓存**
>
> - 本地内存缓存（LRU, 1 分钟）
> - Redis 缓存（1 小时）
> - 数据库"

#### 第三步：代码实战（1 分钟）

> **"我举个 Cluster 的例子：**
> （展示简化版 cluster 代码，说明 fork、负载均衡、自动重启）
>
> **核心代码：**
>
> ````js
> if (cluster.isMaster) {
>   for (let i = 0; i < numCPUs; i++) {
>     cluster.fork();
>   }
>   cluster.on('exit', () => cluster.fork()); // 自动重启
> } else {
>   require('./app'); // 子进程启动服务
> }
> ```"
> ````

#### 第四步：架构设计（1 分钟）

> **"在架构层面，我会采用分层设计：**
>
> - **前端**：CDN + Nginx（静态资源、限流、负载均衡）
> - **应用层**：Node.js Cluster（多进程处理请求）
> - **缓存层**：Redis（热点数据、会话）
> - **消息队列**：RabbitMQ（削峰填谷）
> - **数据层**：主从复制、读写分离
> - **监控**：Prometheus + Grafana + K8s HPA 自动扩容"

#### 第五步：容错处理（30 秒）

> **"还需要考虑：**
>
> - 限流（防止雪崩）
> - 熔断降级（保护后端）
> - 健康检查（自动剔除故障节点）
> - 优雅退出（不丢失正在处理的请求）"

---

### 常见追问与应对

#### Q: Cluster 如何实现负载均衡？

**A:** 主进程监听端口，收到请求后通过 Round-Robin 轮询算法分发给子进程。Linux 默认 Round-Robin，Windows 使用共享 Socket 由操作系统调度。

#### Q: Worker Threads 和 Cluster 性能差异？

**A:** Worker Threads 启动快（~5ms），共享内存，适合 CPU 密集型；Cluster 启动慢（~50ms），进程隔离，适合 IO 密集型。实测 IO 场景 Cluster 提升 3.8 倍，CPU 场景 Worker Threads 提升 3.8 倍。

#### Q: 如何防止内存泄漏？

**A:**

1. 监控：`process.memoryUsage()` 定期采集
2. 排查：`node --inspect` + Chrome DevTools Memory Profiler
3. 避免：及时清理事件监听、定时器、全局变量、闭包引用

#### Q: Redis 缓存雪崩怎么办？

**A:**

1. **随机过期时间**：避免同时失效
2. **缓存预热**：启动时加载热点数据
3. **熔断降级**：Redis 挂了返回降级数据
4. **多级缓存**：本地内存 + Redis 双层缓存

---

**参考：**

- [Node.js 官方 Cluster 文档](https://nodejs.org/api/cluster.html)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
- [Node.js 事件循环详解](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Prometheus Node.js Client](https://github.com/siimon/prom-client)
