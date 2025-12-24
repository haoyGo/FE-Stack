# Promise 并发控制

在处理大量异步任务时，为了避免同时发起过多的请求导致系统负载过高，我们需要对并发数量进行控制。下面介绍三种常见的 Promise 并发控制实现方式。

## 1. 基于 Promise.race 的并发控制
原理：在到达并发限制数后，通过 **Promise.race**，依次交替执行任务。
这种方式通过将任务分批执行，每批次执行**固定数量的任务**。

```javascript
class PromisePool {
  constructor(max) {
    this.max = max; // 最大并发数
    this.pool = []; // 并发池
    this.tasks = []; // 待执行的任务队列
    this.results = []; // 任务执行结果
  }

  // 添加任务
  addTask(task) {
    this.tasks.push(task);
  }

  // 执行任务
  async run() {
    for (const task of this.tasks) {
      const p = task().then(res => {
        this.pool.splice(this.pool.indexOf(p), 1);
        this.results.push(res);
        return res;
      })
      this.pool.push(p);
      if (this.pool.length >= this.max) {
        await Promise.race(this.pool);
      }
    }
    // 加上这句可以确保所有任务都执行完成后才返回
    // 去掉这句，如果 run 后面有其他代码，会在Promise.race执行完一个任务后就执行，而不会等待所有任务都执行完成
    await Promise.all(this.pool);
    return this.results;
  }
}

// 使用示例
const pool = new PromisePool(2); // 最大并发数为2

// 模拟异步任务
const createTask = (id) => {
  return () => new Promise((resolve) => {
    console.log(`Task ${id} start`);
    setTimeout(() => {
      console.log(`Task ${id} end`);
      resolve(id);
    }, 1000);
  });
};

// 添加任务
for (let i = 0; i < 5; i++) {
  pool.addTask(createTask(i));
}

// 执行任务
pool.run();
```

## 2. 基于队列的并发控制
原理：**每次添加任务都会执行(run)**，在 run 中判断是否到达并大限制，进行限制。
这种方式通过维护一个任务队列，**动态添加**和执行任务。

```javascript
class TaskQueue {
  constructor(max) {
    this.max = max; // 最大并发数
    this.count = 0; // 当前正在执行的任务数
    this.queue = []; // 等待执行的任务队列
  }

  // 添加任务到队列
  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject
      });
      this.run();
    });
  }

  // 执行任务
  async run() {
    // 当队列为空或者正在执行的任务达到最大并发数，则返回
    if (this.queue.length === 0 || this.count >= this.max) {
      return;
    }

    const { task, resolve, reject } = this.queue.shift();
    this.count++;

    try {
      const result = await task();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.count--;
      this.run();
    }
  }
}

// 使用示例
const queue = new TaskQueue(2);

// 模拟异步任务
const createTask = (id) => {
  return () => new Promise((resolve) => {
    console.log(`Task ${id} start`);
    setTimeout(() => {
      console.log(`Task ${id} end`);
      resolve(id);
    }, 1000);
  });
};

// 添加任务
for (let i = 0; i < 5; i++) {
  queue.add(createTask(i));
}
```

## 3. 基于计数器的并发控制
原理：跟第2种差不多。
这种方式通过维护一个计数器来控制并发数。

```javascript
class Scheduler {
  constructor(max) {
    this.max = max; // 最大并发数
    this.count = 0; // 当前正在执行的任务数
    this.waiting = []; // 等待执行的任务队列
  }

  // 添加任务
  async add(promiseCreator) {
    // 当前执行的任务数达到最大并发数，则等待
    if (this.count >= this.max) {
      await new Promise(resolve => this.waiting.push(resolve));
    }

    this.count++;
    try {
      // 执行任务
      const result = await promiseCreator();
      return result;
    } finally {
      this.count--;
      // 如果还有等待的任务，则继续执行
      if (this.waiting.length > 0) {
        this.waiting.shift()();
      }
    }
  }
}

// 使用示例
const scheduler = new Scheduler(2);

// 模拟异步任务
const createTask = (id, delay) => {
  return () => new Promise((resolve) => {
    console.log(`Task ${id} start`);
    setTimeout(() => {
      console.log(`Task ${id} end`);
      resolve(id);
    }, delay);
  });
};

// 添加任务
const tasks = [
  createTask(1, 1000),
  createTask(2, 500),
  createTask(3, 300),
  createTask(4, 400)
];

const run = async () => {
  const results = await Promise.all(
    tasks.map(task => scheduler.add(task))
  );
  console.log('All tasks finished:', results);
};

run();
```