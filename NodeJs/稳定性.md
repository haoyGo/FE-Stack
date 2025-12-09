# Node.js 服务稳定性方案

## 1. 进程管理

### 1.1 守护进程（Process Manager）

#### 为什么需要守护进程？

```javascript
// ❌ 直接运行 Node.js 应用的问题
node app.js

// 问题：
// 1. 进程崩溃后不会自动重启
// 2. 终端关闭后进程结束
// 3. 无法充分利用多核 CPU
// 4. 无法监控进程状态
// 5. 无法实现零停机更新
```

---

### 1.2 PM2（推荐）

#### 安装和基本使用

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start app.js

# 启动多个实例（利用多核 CPU）
pm2 start app.js -i 4  # 4 个实例
pm2 start app.js -i max  # 根据 CPU 核心数

# 查看进程
pm2 list

# 查看日志
pm2 logs

# 重启
pm2 restart app

# 停止
pm2 stop app

# 删除
pm2 delete app
```

#### 配置文件（ecosystem.config.js）

```javascript
module.exports = {
  apps: [
    {
      name: "my-app", // 应用名称
      script: "./app.js", // 启动脚本

      // === 实例配置 ===
      instances: 4, // 实例数量（或 'max'）
      exec_mode: "cluster", // 集群模式（共享端口）

      // === 环境变量 ===
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_dev: {
        NODE_ENV: "development",
        PORT: 3001,
      },

      // === 自动重启策略 ===
      watch: false, // 文件变化时是否重启（开发环境用）
      ignore_watch: ["node_modules", "logs"],
      max_memory_restart: "500M", // 内存超过 500M 自动重启

      // === 崩溃重启配置 ===
      autorestart: true, // 崩溃后自动重启
      max_restarts: 10, // 最大重启次数
      min_uptime: "10s", // 最小运行时间（避免频繁重启）
      restart_delay: 4000, // 重启延迟（毫秒）

      // === 日志配置 ===
      error_file: "./logs/err.log", // 错误日志
      out_file: "./logs/out.log", // 输出日志
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true, // 合并日志

      // === 其他 ===
      cron_restart: "0 2 * * *", // 每天凌晨 2 点重启（可选）
      kill_timeout: 5000, // 强制杀死进程前的等待时间
    },
  ],
};
```

#### 使用配置文件

```bash
# 启动
pm2 start ecosystem.config.js

# 启动特定环境
pm2 start ecosystem.config.js --env dev

# 重载（零停机）
pm2 reload ecosystem.config.js

# 开机自启动
pm2 startup
pm2 save
```

#### 零停机重启

```bash
# reload：逐个重启实例（推荐），必须是 cluster 模式，单实例应用：无法实现零停机
pm2 reload app  # 新实例启动成功后再关闭旧实例

# restart：直接重启所有实例
pm2 restart app  # 会有短暂停机
```

#### 监控和日志

```bash
# 实时监控（CPU、内存）
pm2 monit

# 查看详细信息
pm2 show app

# 实时日志
pm2 logs app

# 清空日志
pm2 flush

# 导出监控数据
pm2 web  # 访问 http://localhost:9615
```

---

### 1.3 Docker + Node.js

#### Dockerfile 单个镜像如何构建

```dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制代码
COPY . .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js || exit 1

# 启动应用
CMD ["node", "app.js"]
```

#### docker-compose.yml 多个容器如何编排

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    volumes:
      - ./logs:/app/logs
    restart: always # 崩溃后自动重启
    deploy:
      replicas: 4 # 4 个实例
      resources:
        limits:
          cpus: "2"
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

---

## 2. 健康检查（Health Check）

### 2.1 基础健康检查

```javascript
const express = require("express");
const app = express();

// 简单的健康检查
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 详细的健康检查
app.get("/health/detailed", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),

    // 检查数据库连接
    database: await checkDatabase(),

    // 检查 Redis 连接
    redis: await checkRedis(),

    // 检查外部 API
    externalAPI: await checkExternalAPI(),
  };

  // 任何一项失败，返回 503
  const isHealthy = Object.values(health)
    .filter((v) => typeof v === "object" && v.status)
    .every((v) => v.status === "ok");

  res.status(isHealthy ? 200 : 503).json(health);
});

// 数据库健康检查
async function checkDatabase() {
  try {
    await db.query("SELECT 1");
    return { status: "ok" };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// Redis 健康检查
async function checkRedis() {
  try {
    await redis.ping();
    return { status: "ok" };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// 外部 API 健康检查
async function checkExternalAPI() {
  try {
    const response = await fetch("https://api.example.com/health", {
      timeout: 3000,
    });
    return response.ok
      ? { status: "ok" }
      : { status: "error", code: response.status };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}
```

---

### 2.2 心跳检测（Heartbeat）

#### 主动心跳（向监控中心上报）

```javascript
class HeartbeatReporter {
  constructor(url, interval = 30000) {
    this.url = url;
    this.interval = interval;
    this.timer = null;
    this.metadata = {
      hostname: require("os").hostname(),
      pid: process.pid,
      version: require("./package.json").version,
    };
  }

  start() {
    this.sendHeartbeat(); // 立即发送一次
    this.timer = setInterval(() => {
      this.sendHeartbeat();
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async sendHeartbeat() {
    try {
      const payload = {
        ...this.metadata,
        timestamp: Date.now(),
        uptime: process.uptime(), // 小于60秒记录服务是否重启
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      };

      await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        timeout: 5000,
      });

      console.log("Heartbeat sent successfully");
    } catch (error) {
      console.error("Failed to send heartbeat:", error.message);
    }
  }
}

// 使用
const heartbeat = new HeartbeatReporter(
  "http://monitor.example.com/heartbeat",
  30000
);
heartbeat.start();

// 优雅退出时停止心跳
process.on("SIGTERM", () => {
  heartbeat.stop();
  process.exit(0);
});
```

#### 被动心跳（被监控中心轮询）

```javascript
// 存储最后一次活跃时间
let lastActivity = Date.now();

// 所有请求都更新活跃时间
app.use((req, res, next) => {
  lastActivity = Date.now();
  next();
});

// 心跳检查端点
app.get("/heartbeat", (req, res) => {
  const now = Date.now();
  const idle = now - lastActivity;

  res.json({
    alive: true,
    lastActivity: new Date(lastActivity).toISOString(),
    idleTime: idle,
    uptime: process.uptime(),
  });
});
```

---

## 3. 错误处理与恢复

### 3.1 全局错误捕获

```javascript
// 未捕获的异常
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  // 记录日志
  logger.fatal(error);

  // 通知告警系统
  alertSystem.send("Uncaught Exception", error);

  // 优雅退出（让 PM2 重启）
  process.exit(1);
});

// 未处理的 Promise 拒绝
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);

  logger.error("Unhandled Rejection", { reason, promise });
  alertSystem.send("Unhandled Rejection", reason);

  // Node.js 15+ 会自动退出，之前版本需手动处理
  // process.exit(1);
});

// Express 错误处理中间件
app.use((err, req, res, next) => {
  console.error("Express Error:", err);

  // 记录详细错误信息
  logger.error("Request Error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // 返回友好的错误信息（不暴露内部细节）
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});
```

---

### 3.2 优雅退出（Graceful Shutdown）

```javascript
class GracefulShutdown {
  constructor(server, options = {}) {
    this.server = server;
    this.options = {
      timeout: 30000, // 最大等待时间
      signals: ["SIGTERM", "SIGINT"],
      ...options,
    };
    this.shuttingDown = false;
    this.connections = new Set();
  }

  init() {
    // 跟踪所有连接
    this.server.on("connection", (conn) => {
      this.connections.add(conn);
      conn.on("close", () => {
        this.connections.delete(conn);
      });
    });

    // 监听退出信号
    this.options.signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    });
  }

  async shutdown() {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    // 1. 停止接收新请求
    this.server.close(() => {
      console.log("Server closed, no longer accepting new connections");
    });

    // 2. 等待现有请求完成（带超时）
    const timeoutId = setTimeout(() => {
      console.log("Forcing shutdown due to timeout");
      this.forceShutdown();
    }, this.options.timeout);

    // 3. 关闭数据库连接
    try {
      await db.close();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error closing database:", error);
    }

    // 4. 关闭 Redis 连接
    try {
      await redis.quit();
      console.log("Redis connection closed");
    } catch (error) {
      console.error("Error closing Redis:", error);
    }

    // 5. 等待所有连接关闭
    await this.waitForConnections();
    clearTimeout(timeoutId);

    console.log("Graceful shutdown completed");
    process.exit(0);
  }

  waitForConnections() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.connections.size === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  forceShutdown() {
    // 强制关闭所有连接
    for (const conn of this.connections) {
      conn.destroy();
    }
    process.exit(1);
  }
}

// 使用
const server = app.listen(3000);
const gracefulShutdown = new GracefulShutdown(server);
gracefulShutdown.init();
```

---

## 4. 限流（Rate Limiting）

### 4.1 固定窗口限流

```javascript
const rateLimit = require("express-rate-limit");

// 全局限流
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 个请求
  message: "Too many requests, please try again later",
  standardHeaders: true, // 返回 RateLimit-* headers
  legacyHeaders: false,
});

app.use(globalLimiter);

// API 限流
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分钟
  max: 30, // 最多 30 个请求
  keyGenerator: (req) => {
    // 按用户 ID 限流
    return req.user?.id || req.ip;
  },
});

app.use("/api/", apiLimiter);
```

---

### 4.2 滑动窗口限流（Redis）

```javascript
const Redis = require("ioredis");
const redis = new Redis();

async function slidingWindowLimit(key, limit, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // 1. 删除窗口外的记录
  await redis.zremrangebyscore(key, 0, windowStart);

  // 2. 统计窗口内的请求数
  const count = await redis.zcard(key);

  if (count < limit) {
    // 3. 添加当前请求
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, Math.ceil(windowMs / 1000));
    return { allowed: true, remaining: limit - count - 1 };
  }

  return { allowed: false, remaining: 0 };
}

// Express 中间件
function rateLimitMiddleware(limit, windowMs) {
  return async (req, res, next) => {
    const key = `rate_limit:${req.ip}`;
    const result = await slidingWindowLimit(key, limit, windowMs);

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);

    if (result.allowed) {
      next();
    } else {
      res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }
  };
}

app.use("/api/", rateLimitMiddleware(100, 60000));
```

---

### 4.3 令牌桶限流

```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  consume(count = 1) {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return {
        allowed: true,
        remaining: this.tokens,
      };
    }

    return {
      allowed: false,
      remaining: this.tokens,
      retryAfter: Math.ceil((count - this.tokens) / this.refillRate),
    };
  }
}

// 使用
const buckets = new Map();

function getTokenBucket(key) {
  if (!buckets.has(key)) {
    buckets.set(key, new TokenBucket(100, 10)); // 容量 100，每秒补充 10
  }
  return buckets.get(key);
}

app.use((req, res, next) => {
  const bucket = getTokenBucket(req.ip);
  const result = bucket.consume(1);

  res.setHeader("X-RateLimit-Remaining", result.remaining);

  if (result.allowed) {
    next();
  } else {
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: result.retryAfter,
    });
  }
});
```

---

## 5. 服务降级（Degradation）

### 5.1 功能降级

```javascript
class FeatureToggle {
  constructor() {
    this.features = {
      recommendations: true, // 推荐功能
      comments: true, // 评论功能
      analytics: true, // 统计分析
    };
    this.systemLoad = 0;
  }

  // 根据系统负载自动降级
  updateLoad(load) {
    this.systemLoad = load;

    if (load > 90) {
      // 高负载：关闭所有非核心功能
      this.features.recommendations = false;
      this.features.comments = false;
      this.features.analytics = false;
    } else if (load > 70) {
      // 中负载：关闭部分功能
      this.features.recommendations = false;
      this.features.analytics = false;
      this.features.comments = true;
    } else {
      // 正常负载：开启所有功能
      Object.keys(this.features).forEach((key) => {
        this.features[key] = true;
      });
    }
  }

  isEnabled(feature) {
    return this.features[feature] !== false;
  }
}

const featureToggle = new FeatureToggle();

// 定期更新系统负载
setInterval(() => {
  const load = (os.loadavg()[0] / os.cpus().length) * 100;
  featureToggle.updateLoad(load);
}, 5000);

// 使用
app.get("/api/product/:id", async (req, res) => {
  const product = await db.query("SELECT * FROM products WHERE id = ?", [
    req.params.id,
  ]);

  const response = { product };

  // 推荐功能降级
  if (featureToggle.isEnabled("recommendations")) {
    response.recommendations = await getRecommendations(product.id);
  } else {
    response.recommendations = []; // 返回空数组
  }

  // 评论功能降级
  if (featureToggle.isEnabled("comments")) {
    response.comments = await getComments(product.id);
  } else {
    response.comments = { message: "Comments temporarily unavailable" };
  }

  res.json(response);
});
```

---

### 5.2 数据降级（缓存降级）

```javascript
async function getProductWithFallback(id) {
  try {
    // 1. 尝试从数据库读取
    const product = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id],
      { timeout: 2000 } // 2 秒超时
    );

    // 更新缓存
    await redis.setex(`product:${id}`, 3600, JSON.stringify(product));

    return product;
  } catch (error) {
    console.error("Database error, falling back to cache:", error);

    // 2. 数据库失败，从缓存读取
    const cached = await redis.get(`product:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // 3. 缓存也没有，返回默认值
    return {
      id,
      name: "Product information temporarily unavailable",
      available: false,
    };
  }
}
```

---

### 5.3 熔断器（Circuit Breaker）

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5; // 失败阈值
    this.resetTimeout = options.resetTimeout || 60000; // 重置时间
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is OPEN");
      }
      // 尝试恢复
      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(
        `Circuit breaker opened, will retry after ${this.resetTimeout}ms`
      );
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.state === "OPEN" ? new Date(this.nextAttempt) : null,
    };
  }
}

// 使用
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
});

app.get("/api/external", async (req, res) => {
  try {
    const data = await breaker.execute(async () => {
      const response = await fetch("https://external-api.com/data", {
        timeout: 5000,
      });
      if (!response.ok) throw new Error("API Error");
      return response.json();
    });

    res.json(data);
  } catch (error) {
    // 熔断时返回降级数据
    res.json({
      error: "Service temporarily unavailable",
      fallback: true,
      data: getCachedData(),
    });
  }
});
```

---

## 6. 监控告警

### 6.1 性能监控

```javascript
const prometheus = require("prom-client");

// 创建指标
const httpRequestDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new prometheus.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const activeConnections = new prometheus.Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

// 中间件
app.use((req, res, next) => {
  const start = Date.now();

  activeConnections.inc();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || "unknown";

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal.labels(req.method, route, res.statusCode).inc();

    activeConnections.dec();
  });

  next();
});

// 指标端点
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

---

### 6.2 告警系统

```javascript
class AlertSystem {
  constructor() {
    this.webhookUrl = process.env.ALERT_WEBHOOK_URL;
    this.alertThresholds = {
      errorRate: 0.01, // 1% 错误率
      responseTime: 2000, // 2 秒响应时间
      memory: 0.9, // 90% 内存使用
      cpu: 0.8, // 80% CPU 使用
    };
  }

  async send(title, message, level = "warning") {
    const payload = {
      title,
      message,
      level, // info, warning, error, critical
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      pid: process.pid,
    };

    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
  }

  checkHealth() {
    // 检查内存
    const memUsage = process.memoryUsage();
    const memPercent = memUsage.heapUsed / memUsage.heapTotal;
    if (memPercent > this.alertThresholds.memory) {
      this.send(
        "High Memory Usage",
        `Memory usage: ${(memPercent * 100).toFixed(2)}%`,
        "warning"
      );
    }

    // 检查 CPU
    const cpuUsage = process.cpuUsage();
    const cpuPercent =
      (cpuUsage.user + cpuUsage.system) / 1000000 / process.uptime();
    if (cpuPercent > this.alertThresholds.cpu) {
      this.send(
        "High CPU Usage",
        `CPU usage: ${(cpuPercent * 100).toFixed(2)}%`,
        "warning"
      );
    }
  }
}

const alertSystem = new AlertSystem();

// 定期检查
setInterval(() => {
  alertSystem.checkHealth();
}, 60000);
```

---

## 7. 最佳实践总结

### 7.1 稳定性检查清单

```markdown
✅ 进程管理

- 使用 PM2 或 Docker 管理进程
- 配置自动重启策略
- 实现优雅退出

✅ 健康检查

- 实现 /health 端点
- 检查数据库、Redis、外部 API
- 配置心跳上报

✅ 错误处理

- 捕获 uncaughtException 和 unhandledRejection
- 记录详细错误日志
- 实现告警通知

✅ 限流降级

- API 限流（防止过载）
- 熔断器（保护外部依赖）
- 功能降级（保证核心功能）

✅ 监控告警

- 性能指标监控（Prometheus）
- 日志聚合（ELK）
- 实时告警（钉钉、企业微信）
```

---

### 7.2 生产环境配置示例

```javascript
// ecosystem.config.js (PM2)
module.exports = {
  apps: [
    {
      name: "my-app",
      script: "./app.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

```bash
# 启动命令
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

---

## 8. 总结

### 核心要点

1. **进程管理**：使用 PM2 实现自动重启、集群模式、零停机更新
2. **健康检查**：实现多层次健康检查，及时发现问题
3. **错误处理**：全局捕获异常，优雅退出，避免内存泄漏
4. **限流降级**：保护系统不被打垮，保证核心功能可用
5. **监控告警**：实时监控系统状态，及时发现并解决问题
