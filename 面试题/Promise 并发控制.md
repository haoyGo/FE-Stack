# Promise 并发控制

在处理大量异步任务时，为了避免同时发起过多的请求导致系统负载过高，我们需要对并发数量进行控制。下面介绍三种常见的 Promise 并发控制实现方式。

## 1. 基于 Promise.all 的并发控制

这种方式通过将任务分批执行，每批次执行固定数量的任务。

```javascript
class PromisePool {
  constructor(max) {
    this.max = max; // 最大并发数
    this.pool = []; // 并发池
    this.tasks = []; // 待执行的任务队列
  }

  // 添加任务
  addTask(task) {
    this.tasks.push(task);
  }

  // 执行任务
  async run() {
    while (this.tasks.length > 0) {
      // 当并发池未满时，将任务添加到并发池
      while (this.pool.length < this.max && this.tasks.length > 0) {
        const task = this.tasks.shift();
        const promise = task().then(() => {
          // 任务完成后从并发池中移除
          this.pool.splice(this.pool.indexOf(promise), 1);
        });
        this.pool.push(promise);
      }
      // 等待并发池中的某个任务完成
      await Promise.race(this.pool);
    }
    // 等待所有任务完成
    return Promise.all(this.pool);
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
      resolve();
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

这种方式通过维护一个任务队列，动态添加和执行任务。

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

    this.count++;
    const { task, resolve, reject } = this.queue.shift();

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

// 添加任务并获取结果
for (let i = 0; i < 5; i++) {
  queue.add(createTask(i)).then(result => {
    console.log(`Task ${result} result`);
  });
}
```

## 3. 基于计数器的并发控制

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

以上三种实现方式各有特点：

1. **Promise.all 方式**：适合任务数量固定，需要批量执行的场景。实现简单，但不够灵活。

2. **队列方式**：适合动态添加任务的场景，可以方便地处理任务的执行结果。实现相对复杂，但更灵活。

3. **计数器方式**：实现最为简洁，适合需要严格控制并发数的场景。可以保证同时执行的任务数不超过限制。

选择哪种实现方式主要取决于具体的使用场景和需求。