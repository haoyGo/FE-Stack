## NodeJS

`Node.js` 是 JS 在服务端的运行环境，构建在 `chrome` 的 `V8` 引擎之上，基于 `事件驱动`、`非阻塞I/O模型`，充分利用操作系统提供的 `异步 I/O` 进行多任务的执行，适合于 `I/O 密集型` 的应用场景，因为异步，程序无需阻塞等待结果返回，而是基于回调通知的机制，原本同步模式等待的时间，则可以用来处理其它任务。

> 科普：在 `Web服务器` 方面，著名的 `Nginx` 也是采用此模式（事件驱动），避免了多线程的线程创建、线程上下文切换的开销，`Nginx` 采用 `C语言` 进行编写，主要用来做高性能的 Web 服务器，不适合做业务。

在 `单核CPU` 系统之上我们采用 `单进程 + 单线程` 的模式来开发。在 `多核CPU` 系统之上，可以通过 `child_process.fork` 开启多个进程（Node.js 在 v0.8 版本之后新增了 `Cluster` 来实现多进程架构） ，即 `多进程 + 单线程` 模式。注意：开启多进程不是为了解决高并发，主要是解决了单进程模式下 `Node.js CPU` 利用率不足的情况，充分利用 `多核CPU` 的性能。

### Process
* `process.env`：环境变量，例如通过 `process.env.NODE_ENV` 获取不同环境项目配置信息
* `process.nextTick`：这个在谈及 `Event Loop` 时经常为会提到
* `process.pid`：获取当前进程id
* `process.ppid`：当前进程对应的父进程
* `process.cwd()`：获取当前进程工作目录，
* `process.platform`：获取当前进程运行的操作系统平台
* `process.uptime()`：当前进程已运行时间，例如：pm2 守护进程的 uptime 值
* 进程事件：`process.on('uncaughtException', cb)` 捕获异常信息、`process.on('exit', cb）`进程推出监听
* 三个标准流：`process.stdout 标准输出`、`process.stdin 标准输入`、`process.stderr 标准错误输出`
* `process.title` 指定进程名称，有的时候需要给进程指定一个名称