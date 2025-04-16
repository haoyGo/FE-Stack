# 前端面试常见算法题

> 本文档收集了前端面试中常见的算法题，按照最新面试趋势排序，包含问题描述、解题思路和JavaScript代码实现，并标注难度级别和考察频率。

## JavaScript特有算法实现

### 1. 手写Promise及相关方法 【难度：中高】【频率：高】

**问题描述**：实现符合Promise/A+规范的Promise及其静态方法。

**解题思路**：理解Promise的状态转换、链式调用和错误处理机制，实现基本的Promise类及其静态方法。

```javascript
class MyPromise {
  static PENDING = 'pending';
  static FULFILLED = 'fulfilled';
  static REJECTED = 'rejected';

  constructor(executor) {
    this.status = MyPromise.PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  resolve(value) {
    if (this.status === MyPromise.PENDING) {
      this.status = MyPromise.FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach(callback => callback(this.value));
    }
  }

  reject(reason) {
    if (this.status === MyPromise.PENDING) {
      this.status = MyPromise.REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach(callback => callback(this.reason));
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === MyPromise.FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else if (this.status === MyPromise.REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else if (this.status === MyPromise.PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              this.resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              this.resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });

    return promise2;
  }

  resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
      return reject(new TypeError('Chaining cycle detected for promise'));
    }

    if (x instanceof MyPromise) {
      x.then(resolve, reject);
    } else {
      resolve(x);
    }
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(callback) {
    return this.then(
      value => MyPromise.resolve(callback()).then(() => value),
      reason => MyPromise.resolve(callback()).then(() => { throw reason })
    );
  }

  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) {
        return reject(new TypeError('promises must be an array'));
      }
      
      const result = [];
      let count = 0;
      
      if (promises.length === 0) return resolve(result);
      
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          value => {
            result[index] = value;
            count++;
            if (count === promises.length) resolve(result);
          },
          reason => reject(reason)
        );
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) {
        return reject(new TypeError('promises must be an array'));
      }
      
      if (promises.length === 0) return;
      
      promises.forEach(promise => {
        MyPromise.resolve(promise).then(resolve, reject);
      });
    });
  }

  static allSettled(promises) {
    return new MyPromise((resolve) => {
      if (!Array.isArray(promises)) {
        return resolve([]);
      }
      
      const result = [];
      let count = 0;
      
      if (promises.length === 0) return resolve(result);
      
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          value => {
            result[index] = { status: 'fulfilled', value };
            count++;
            if (count === promises.length) resolve(result);
          },
          reason => {
            result[index] = { status: 'rejected', reason };
            count++;
            if (count === promises.length) resolve(result);
          }
        );
      });
    });
  }
}
```

### 2. Promise并发控制 【难度：中】【频率：高】

**问题描述**：实现一个Promise并发控制器，限制同时执行的Promise数量。

**解题思路**：使用队列存储任务，控制同时执行的任务数量，当有任务完成时，从队列中取出新任务执行。

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
    // 确保所有任务都执行完成后才返回
    await Promise.all(this.pool);
    return this.results;
  }
}
```

### 3. 深拷贝实现 【难度：中】【频率：高】

**问题描述**：实现一个深拷贝函数，可以处理循环引用、各种数据类型等复杂情况。

**解题思路**：使用递归遍历对象的属性，针对不同类型的数据采用不同的复制策略，使用Map记录已经复制过的对象，解决循环引用问题。

```javascript
function deepClone(obj, hash = new Map()) {
  // 处理null或基本类型
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  // 处理正则对象
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }
  
  // 处理循环引用
  if (hash.has(obj)) {
    return hash.get(obj);
  }
  
  // 创建新对象/数组
  const cloneObj = Array.isArray(obj) ? [] : {};
  
  // 记录已克隆对象，避免循环引用
  hash.set(obj, cloneObj);
  
  // 递归克隆属性
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloneObj[key] = deepClone(obj[key], hash);
    }
  }
  
  return cloneObj;
}
```

### 4. 防抖与节流 【难度：简单】【频率：高】

**问题描述**：实现防抖和节流函数，用于优化高频事件处理。

**解题思路**：
- 防抖：在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。
- 节流：规定一个单位时间，在这个单位时间内，只能有一次触发事件的回调函数执行。

```javascript
// 防抖函数
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 节流函数
function throttle(fn, delay) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

// 节流函数的另一种实现（定时器方式）
function throttle2(fn, delay) {
  let timer = null;
  return function(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    }
  };
}
```

### 5. 函数柯里化 【难度：中】【频率：中】

**问题描述**：实现一个函数柯里化的通用方法。

**解题思路**：利用闭包和递归，根据传入参数的个数决定是否继续返回函数或执行原函数。

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function(...args2) {
        return curried.apply(this, args.concat(args2));
      };
    }
  };
}

// 使用示例
function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2, 3)); // 6
```

## 数据结构与算法

### 1. 数组去重 【难度：简单】【频率：高】

**问题描述**：给定一个数组，去除其中重复的元素。

**解题思路**：利用Set数据结构的唯一性特性，或使用Map/对象来记录元素是否出现过。

```javascript
// 方法1：使用Set
function uniqueArray1(arr) {
  return [...new Set(arr)];
}

// 方法2：使用filter
function uniqueArray2(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

// 方法3：使用reduce
function uniqueArray3(arr) {
  return arr.reduce((acc, cur) => acc.includes(cur) ? acc : [...acc, cur], []);
}

// 方法4：使用Map
function uniqueArray4(arr) {
  const map = new Map();
  const result = [];
  for (const item of arr) {
    if (!map.has(item)) {
      map.set(item, true);
      result.push(item);
    }
  }
  return result;
}
```

### 2. 数组扁平化 【难度：简单】【频率：高】

**问题描述**：将多维数组转换为一维数组。

**解题思路**：使用递归、reduce或ES6的flat方法。

```javascript
// 方法1：使用flat
function flatten1(arr) {
  return arr.flat(Infinity);
}

// 方法2：使用递归
function flatten2(arr) {
  let result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result = result.concat(flatten2(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

// 方法3：使用reduce
function flatten3(arr) {
  return arr.reduce((acc, cur) => 
    acc.concat(Array.isArray(cur) ? flatten3(cur) : cur), []);
}

// 方法4：使用扩展运算符
function flatten4(arr) {
  while (arr.some(item => Array.isArray(item))) {
    arr = [].concat(...arr);
  }
  return arr;
}
```

### 3. LRU缓存实现 【难度：中】【频率：中高】

**问题描述**：实现一个LRU（最近最少使用）缓存机制，要求get和put操作的时间复杂度都是O(1)。

**解题思路**：结合哈希表和双向链表，哈希表提供O(1)的查找，双向链表提供O(1)的插入和删除。

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    
    // 将访问的元素移到最近使用的位置
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 如果达到容量上限，删除最久未使用的元素
      // Map的keys()返回的迭代器按插入顺序排列，第一个就是最久未使用的
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    // 添加新元素
    this.cache.set(key, value);
  }
}
```

### 4. 二分查找 【难度：简单】【频率：高】

**问题描述**：在有序数组中查找目标值，返回其索引，如果不存在则返回-1。

**解题思路**：使用二分查找算法，每次将查找范围缩小一半。

```javascript
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}
```

### 5. 快速排序 【难度：中】【频率：中】

**问题描述**：实现快速排序算法。

**解题思路**：选择一个基准元素，将数组分为两部分，小于基准的放左边，大于基准的放右边，然后递归排序左右两部分。

```javascript
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const middle = [];
  const right = [];
  
  for (const item of arr) {
    if (item < pivot) {
      left.push(item);
    } else if (item > pivot) {
      right.push(item);
    } else {
      middle.push(item);
    }
  }
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}
```

## 前端实际场景算法应用

### 1. 虚拟列表实现 【难度：中高】【频率：中高】

**问题描述**：实现一个虚拟列表，用于高效渲染大量数据。

**解题思路**：只渲染可视区域内的元素，通过计算滚动位置动态更新渲染的元素。

```javascript
class VirtualList {
  constructor(options) {
    this.container = options.container;
    this.itemHeight = options.itemHeight;
    this.total = options.total;
    this.buffer = options.buffer || 5; // 上下缓冲区域的数量
    this.renderFunction = options.renderFunction;
    
    this.visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight) + this.buffer * 2;
    this.startIndex = 0;
    this.endIndex = this.startIndex + this.visibleCount;
    
    this.init();
  }
  
  init() {
    // 创建内容容器
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.content.style.height = `${this.total * this.itemHeight}px`;
    this.container.appendChild(this.content);
    
    // 监听滚动事件
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    
    // 初始渲染
    this.render();
  }
  
  handleScroll() {
    const scrollTop = this.container.scrollTop;
    const newStartIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    
    if (newStartIndex !== this.startIndex) {
      this.startIndex = newStartIndex;
      this.endIndex = Math.min(this.total, this.startIndex + this.visibleCount);
      this.render();
    }
  }
  
  render() {
    this.content.innerHTML = '';
    
    for (let i = this.startIndex; i < this.endIndex; i++) {
      const item = this.renderFunction(i);
      item.style.position = 'absolute';
      item.style.top = `${i * this.itemHeight}px`;
      item.style.height = `${this.itemHeight}px`;
      item.style.width = '100%';
      this.content.appendChild(item);
    }
  }
}
```

### 2. 大文件上传（分片上传）【难度：中高】【频率：中】

**问题描述**：实现大文件分片上传功能，包括分片、上传和合并。

**解题思路**：将大文件切分为小块，分别上传，最后在服务端合并。

```javascript
class FileUploader {
  constructor(options) {
    this.file = options.file;
    this.chunkSize = options.chunkSize || 2 * 1024 * 1024; // 默认2MB一片
    this.uploadUrl = options.uploadUrl;
    this.mergeUrl = options.mergeUrl;
    this.onProgress = options.onProgress || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    
    this.chunks = this.createChunks();
    this.uploadedChunks = 0;
  }
  
  createChunks() {
    const chunks = [];
    const totalChunks = Math.ceil(this.file.size / this.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      const chunk = this.file.slice(start, end);
      
      chunks.push({
        index: i,
        file: new File([chunk], this.file.name, { type: this.file.type }),
        size: chunk.size
      });
    }
    
    return chunks;
  }
  
  async upload() {
    try {
      const uploadPromises = this.chunks.map(chunk => this.uploadChunk(chunk));
      await Promise.all(uploadPromises);
      await this.mergeChunks();
      this.onSuccess();
    } catch (error) {
      this.onError(error);
    }
  }
  
  async uploadChunk(chunk) {
    const formData = new FormData();
    formData.append('file', chunk.file);
    formData.append('index', chunk.index);
    formData.append('filename', this.file.name);
    formData.append('total', this.chunks.length);
    
    const response = await fetch(this.uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed for chunk ${chunk.index}`);
    }
    
    this.uploadedChunks++;
    this.onProgress(this.uploadedChunks / this.chunks.length);
    
    return response.json();
  }
  
  async mergeChunks() {
    const response = await fetch(this.mergeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: this.file.name,
        total: this.chunks.length
      })
    });
    
    if (!response.ok) {
      throw new Error('Merge chunks failed');
    }
    
    return response.json();
  }
}
```

### 3. 图片懒加载 【难度：简单】【频率：中】

**问题描述**：实现图片懒加载功能，只有当图片进入可视区域时才加载。

**解题思路**：使用IntersectionObserver API或监听滚动事件，判断图片是否进入可视区域。

```javascript
// 方法1：使用IntersectionObserver API
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => observer.observe(img));
}

// 方法2：使用滚动事件
function lazyLoadImagesLegacy() {
  const images = document.querySelectorAll('img[data-src]');
  
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  function loadImages() {
    images.forEach(img => {
      if (isInViewport(img) && img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }
  
  // 初始加载
  loadImages();
  
  // 滚动时加载
  window.addEventListener('scroll', loadImages);
}
```

### 4. 实现EventEmitter（发布订阅模式）【难度：简单】【频率：中】

**问题描述**：实现一个事件发布订阅系统。

**解题思路**：使用对象存储事件和对应的回调函数，提供订阅、发布、取消订阅等方法。

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  // 订阅事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }
  
  // 只订阅一次
  once(event, callback) {
    const onceCallback = (...args) => {
      callback.apply(this, args);
      this.off(event, onceCallback);
    };
    return this.on(event, onceCallback);
  }
  
  // 发布事件
  emit(event, ...args) {
    const callbacks = this.events[event];
    if (!callbacks || callbacks.length === 0) return false;
    
    callbacks.forEach(callback => {
      callback.apply(this, args);
    });
    return true;
  }
  
  // 取消订阅
  off(event, callback) {
    if (!this.events[event]) return this;
    
    if (!callback) {
      delete this.events[event];
      return this;
    }
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    return this;
  }
}
```

### 5. 实现简易版React useState 【难度：中】【频率：中】

**问题描述**：实现一个简易版的React useState钩子函数。

**解题思路**：使用闭包存储状态，通过函数调用更新状态并触发重新