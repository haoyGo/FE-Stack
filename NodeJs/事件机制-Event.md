# Node.js Process 事件详解

## 1. 事件总览

### 完整事件列表

| 事件                 | 触发时机                   | 用途             |
| -------------------- | -------------------------- | ---------------- |
| `exit`               | 进程即将退出               | 同步清理工作     |
| `beforeExit`         | 事件循环清空，进程即将退出 | 异步清理工作     |
| `uncaughtException`  | 未捕获的异常               | 全局错误处理     |
| `unhandledRejection` | 未处理的 Promise 拒绝      | Promise 错误处理 |
| `warning`            | Node.js 发出警告           | 监控潜在问题     |
| `SIGTERM`            | 终止信号                   | 优雅退出         |
| `SIGINT`             | 中断信号（Ctrl+C）         | 优雅退出         |
| `SIGHUP`             | 终端挂断                   | 重新加载配置     |
| `message`            | IPC 消息（cluster 模式）   | 进程间通信       |
| `disconnect`         | IPC 通道断开               | 处理进程分离     |

---

## 2. 核心事件详解

### 2.1 exit - 进程退出

**特点：**

- ✅ **同步执行**（不能执行异步操作）
- ✅ 必然触发（无法阻止退出）
- ⚠️ 只能执行简单清理工作

```javascript
process.on("exit", (code) => {
  // ⚠️ 只能执行同步操作
  console.log(`Process exiting with code: ${code}`);

  // ✅ 可以：同步写文件
  const fs = require("fs");
  fs.writeFileSync("exit.log", `Exited at ${new Date()}`);

  // ❌ 不可以：异步操作（不会执行）
  setTimeout(() => {
    console.log("This will NOT be executed");
  }, 100);
});

// 触发退出
process.exit(0); // 正常退出
process.exit(1); // 异常退出
```

**退出码含义：**

| 退出码 | 含义                     |
| ------ | ------------------------ |
| `0`    | 正常退出                 |
| `1`    | 通用错误                 |
| `2`    | 误用 shell 命令          |
| `3`    | 内部 JavaScript 解析错误 |
| `130`  | Ctrl+C 终止              |

---

### 2.2 beforeExit - 即将退出（可执行异步）

**特点：**

- ✅ **可以执行异步操作**
- ✅ 可以阻止退出（通过添加新的异步任务）
- ⚠️ 不会在 `process.exit()` 时触发

```javascript
process.on("beforeExit", async (code) => {
  console.log("Before exit, code:", code);

  // ✅ 可以执行异步操作
  await saveData();
  await closeConnections();

  console.log("Cleanup completed");
});

async function saveData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Data saved");
      resolve();
    }, 1000);
  });
}

async function closeConnections() {
  await db.close();
  await redis.quit();
}
```

**对比 exit 和 beforeExit：**

```javascript
process.on("beforeExit", (code) => {
  console.log("1. beforeExit:", code);

  // 添加异步任务会阻止退出
  setTimeout(() => {
    console.log("2. Async task");
  }, 100);
});

process.on("exit", (code) => {
  console.log("3. exit:", code);
});

console.log("4. Start");

// 输出顺序：
// 4. Start
// 1. beforeExit: 0
// 2. Async task
// 1. beforeExit: 0  ← 再次触发
// 3. exit: 0
```

---

### 2.3 uncaughtException - 未捕获的异常

**特点：**

- ⚠️ 应用程序最后的防线
- ⚠️ 捕获后应该退出进程（状态可能已损坏）

```javascript
process.on("uncaughtException", (error, origin) => {
  console.error("Uncaught Exception:", error);
  console.error("Origin:", origin);
  console.error("Stack:", error.stack);

  // 1. 记录错误日志
  logger.fatal({
    type: "uncaughtException",
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // 2. 发送告警
  alertSystem.send("Critical Error", error.message, "critical");

  // 3. 保存现场信息
  saveErrorDump(error);

  // 4. 优雅退出（让 PM2 重启）
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// 示例：触发未捕获异常
setTimeout(() => {
  throw new Error("Oops! Something went wrong");
}, 1000);

// ⚠️ 这段代码不会执行
console.log("This may not execute");
```

**最佳实践：**

```javascript
process.on("uncaughtException", (error) => {
  // ✅ 推荐：记录 + 退出
  console.error("Fatal error:", error);
  logger.fatal(error);
  process.exit(1);
});

// ❌ 不推荐：捕获后继续运行
process.on("uncaughtException", (error) => {
  console.error("Error caught, continuing..."); // 危险！
});
```

---

### 2.4 unhandledRejection - 未处理的 Promise 拒绝

**特点：**

- ✅ 捕获未处理的 Promise 错误
- ⚠️ Node.js 15+ 会自动退出，之前版本不会

```javascript
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);

  // 记录详细信息
  logger.error({
    type: "unhandledRejection",
    reason: reason,
    promise: promise,
    stack: reason?.stack,
  });

  // Node.js 15+ 会自动退出，早期版本需要手动处理
  // process.exit(1);
});

// 示例 1：忘记 .catch()
Promise.reject(new Error("Promise rejected!"));

// 示例 2：async 函数中的错误
async function fetchData() {
  throw new Error("Fetch failed!");
}
fetchData(); // 没有 await 或 .catch()

// 示例 3：正确处理
async function main() {
  try {
    await fetchData();
  } catch (error) {
    console.error("Caught:", error);
  }
}
main();
```

---

### 2.5 SIGTERM - 终止信号（优雅退出）

**特点：**

- ✅ 最常见的优雅退出方式
- ✅ Docker/K8s 停止容器时发送
- ✅ PM2 reload 时发送

```javascript
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, starting graceful shutdown...");

  try {
    // 1. 停止接收新请求
    console.log("1. Closing HTTP server...");
    await new Promise((resolve) => {
      server.close(resolve);
    });

    // 2. 等待现有请求完成（最多 30 秒）
    console.log("2. Waiting for ongoing requests...");
    await Promise.race([
      waitForRequests(),
      new Promise((resolve) => setTimeout(resolve, 30000)),
    ]);

    // 3. 关闭数据库连接
    console.log("3. Closing database connections...");
    await db.close();

    // 4. 关闭 Redis 连接
    console.log("4. Closing Redis connections...");
    await redis.quit();

    // 5. 停止心跳上报
    console.log("5. Stopping heartbeat...");
    heartbeat.stop();

    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

function waitForRequests() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (activeRequests === 0) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
```

---

### 2.6 SIGINT - 中断信号（Ctrl+C）

```javascript
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT (Ctrl+C), exiting...");

  // 快速清理
  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// 提示用户
console.log("Press Ctrl+C to exit");
```

---

### 2.7 warning - Node.js 警告

```javascript
process.on("warning", (warning) => {
  console.warn("Warning name:", warning.name);
  console.warn("Warning message:", warning.message);
  console.warn("Stack trace:", warning.stack);

  // 常见警告类型
  if (warning.name === "DeprecationWarning") {
    // 使用了废弃的 API
    logger.warn("Using deprecated API:", warning.message);
  }

  if (warning.name === "MaxListenersExceededWarning") {
    // EventEmitter 监听器过多
    logger.warn("Too many listeners:", warning.message);
  }
});

// 触发警告示例
process.emitWarning("This is a custom warning", "CustomWarning");
```

---

### 2.8 message - 进程间通信（IPC）

**用于 cluster 模式或 child_process**

```javascript
// master.js
const cluster = require("cluster");

if (cluster.isMaster) {
  const worker = cluster.fork();

  // 监听 worker 消息
  worker.on("message", (msg) => {
    console.log("Master received:", msg);

    if (msg.type === "request") {
      // 回复 worker
      worker.send({ type: "response", data: "Hello from master" });
    }
  });

  // 发送消息给 worker
  worker.send({ type: "init", config: { port: 3000 } });
}

// worker.js
if (cluster.isWorker) {
  // 监听 master 消息
  process.on("message", (msg) => {
    console.log("Worker received:", msg);

    if (msg.type === "init") {
      startServer(msg.config);
    }
  });

  // 发送消息给 master
  process.send({ type: "request", data: "Need config" });
}
```

---

## 3. 完整示例：生产级错误处理

```javascript
const express = require("express");
const app = express();

// ==================== 错误处理 ====================

// 1. 未捕获异常
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  logger.fatal({
    type: "uncaughtException",
    error: error.message,
    stack: error.stack,
  });
  alertSystem.send("Uncaught Exception", error.message, "critical");

  // 优雅退出
  gracefulShutdown(1);
});

// 2. 未处理的 Promise 拒绝
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  logger.error({
    type: "unhandledRejection",
    reason: reason,
    stack: reason?.stack,
  });
  alertSystem.send("Unhandled Rejection", reason, "error");
});

// 3. Node.js 警告
process.on("warning", (warning) => {
  console.warn("⚠️ Warning:", warning.name, warning.message);
  logger.warn({
    type: "nodeWarning",
    name: warning.name,
    message: warning.message,
  });
});

// ==================== 优雅退出 ====================

let isShuttingDown = false;

async function gracefulShutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("🔄 Starting graceful shutdown...");

  const timeout = setTimeout(() => {
    console.error("⏰ Forced shutdown due to timeout");
    process.exit(1);
  }, 30000); // 30 秒超时

  try {
    // 1. 停止接收新请求
    await new Promise((resolve) => server.close(resolve));
    console.log("✅ Server closed");

    // 2. 关闭数据库
    await db.close();
    console.log("✅ Database closed");

    // 3. 关闭 Redis
    await redis.quit();
    console.log("✅ Redis closed");

    // 4. 停止心跳
    heartbeat.stop();
    console.log("✅ Heartbeat stopped");

    clearTimeout(timeout);
    console.log("✅ Graceful shutdown completed");
    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    clearTimeout(timeout);
    process.exit(1);
  }
}

// 监听退出信号
process.on("SIGTERM", () => {
  console.log("📨 Received SIGTERM");
  gracefulShutdown(0);
});

process.on("SIGINT", () => {
  console.log("📨 Received SIGINT (Ctrl+C)");
  gracefulShutdown(0);
});

// beforeExit（可选）
process.on("beforeExit", (code) => {
  console.log("Process beforeExit with code:", code);
});

// exit（最后的清理）
process.on("exit", (code) => {
  console.log("Process exit with code:", code);
});

// ==================== 启动服务 ====================

const server = app.listen(3000, () => {
  console.log("🚀 Server started on port 3000");
  console.log("📊 Process PID:", process.pid);
});
```

---

## 4. 事件优先级和执行顺序

### 正常退出流程

```javascript
console.log("1. Start");

process.on("beforeExit", () => {
  console.log("3. beforeExit");
});

process.on("exit", () => {
  console.log("4. exit");
});

console.log("2. End");

// 输出：
// 1. Start
// 2. End
// 3. beforeExit
// 4. exit
```

### 异常退出流程

```javascript
process.on("uncaughtException", () => {
  console.log("2. uncaughtException");
  process.exit(1);
});

process.on("beforeExit", () => {
  console.log("X. beforeExit - NOT called"); // 不会执行
});

process.on("exit", () => {
  console.log("3. exit");
});

console.log("1. Start");
throw new Error("Error!");

// 输出：
// 1. Start
// 2. uncaughtException
// 3. exit
```

---

## 5. 常见问题

### Q1: exit 和 beforeExit 有什么区别？

| 特性               | beforeExit                 | exit      |
| ------------------ | -------------------------- | --------- |
| **异步操作**       | ✅ 允许                    | ❌ 不允许 |
| **阻止退出**       | ✅ 可以                    | ❌ 不可以 |
| **触发次数**       | 多次（如果有新的异步任务） | 1 次      |
| **process.exit()** | ❌ 不触发                  | ✅ 触发   |

---

### Q2: 如何选择退出信号处理？

```javascript
// 推荐：统一处理 SIGTERM 和 SIGINT
const signals = ["SIGTERM", "SIGINT"];

signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}`);
    await gracefulShutdown();
  });
});
```

---

### Q3: 如何防止重复处理退出信号？

```javascript
let isShuttingDown = false;

process.on("SIGTERM", async () => {
  if (isShuttingDown) {
    console.log("Already shutting down, ignoring signal");
    return;
  }

  isShuttingDown = true;
  await gracefulShutdown();
});
```

---

### Q4: uncaughtException 后为什么要退出？

**原因：**

1. 应用状态可能已损坏
2. 可能导致内存泄漏
3. 后续行为不可预测

**正确做法：**

```javascript
process.on("uncaughtException", (error) => {
  console.error("Fatal error:", error);
  // 记录日志
  logger.fatal(error);
  // 发送告警
  alertSystem.send(error);
  // 退出进程（让 PM2 重启）
  process.exit(1);
});
```

---

## 6. process.uptime() 详解

### 基本用法

`process.uptime()` 返回**当前 Node.js 进程运行的时间**（单位：秒）。

```javascript
const uptime = process.uptime();
console.log(`Process has been running for ${uptime} seconds`);
// 输出：Process has been running for 125.456 seconds
```

### 与 os.uptime() 的区别

| 方法               | 说明                          | 返回值     |
| ------------------ | ----------------------------- | ---------- |
| `process.uptime()` | **当前 Node.js 进程**运行时间 | 秒（小数） |
| `os.uptime()`      | **整个操作系统**启动时间      | 秒（整数） |

```javascript
const os = require("os");

console.log("Process uptime:", process.uptime()); // 125.456 秒
console.log("OS uptime:", os.uptime()); // 345678 秒
```

### 实战应用

#### 1. 健康检查

```javascript
app.get("/health", (req, res) => {
  const uptime = process.uptime();

  res.json({
    status: "ok",
    uptime: uptime,
    uptimeFormatted: formatUptime(uptime),
    timestamp: new Date().toISOString(),
  });
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}
```

#### 2. 检测服务重启

```javascript
app.use((req, res, next) => {
  const uptime = process.uptime();

  if (uptime < 60) {
    console.warn("⚠️ Service recently restarted:", uptime, "seconds ago");
    alertSystem.send("Service Restart", `Uptime: ${uptime}s`);
  }

  next();
});
```

---
