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

### 6. 二叉树遍历 【难度：中】【频率：高】

**问题描述**：实现二叉树的前序、中序、后序遍历，包括递归和非递归实现。

**解题思路**：
- 前序遍历：根节点 -> 左子树 -> 右子树
- 中序遍历：左子树 -> 根节点 -> 右子树
- 后序遍历：左子树 -> 右子树 -> 根节点
- 使用栈来实现非递归版本

```javascript
// 二叉树节点定义
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// 递归实现
class BinaryTree {
  // 前序遍历
  preorderTraversal(root) {
    const result = [];
    const preorder = (node) => {
      if (!node) return;
      result.push(node.val);
      preorder(node.left);
      preorder(node.right);
    };
    preorder(root);
    return result;
  }

  // 中序遍历
  inorderTraversal(root) {
    const result = [];
    const inorder = (node) => {
      if (!node) return;
      inorder(node.left);
      result.push(node.val);
      inorder(node.right);
    };
    inorder(root);
    return result;
  }

  // 后序遍历
  postorderTraversal(root) {
    const result = [];
    const postorder = (node) => {
      if (!node) return;
      postorder(node.left);
      postorder(node.right);
      result.push(node.val);
    };
    postorder(root);
    return result;
  }

  // 非递归前序遍历
  preorderIterative(root) {
    const result = [];
    const stack = [];
    let current = root;

    while (current || stack.length) {
      while (current) {
        result.push(current.val);
        stack.push(current);
        current = current.left;
      }
      current = stack.pop();
      current = current.right;
    }

    return result;
  }

  // 非递归中序遍历
  inorderIterative(root) {
    const result = [];
    const stack = [];
    let current = root;

    while (current || stack.length) {
      while (current) {
        stack.push(current);
        current = current.left;
      }
      current = stack.pop();
      result.push(current.val);
      current = current.right;
    }

    return result;
  }

  // 非递归后序遍历
  postorderIterative(root) {
    const result = [];
    const stack = [];
    let current = root;
    let lastVisited = null;

    while (current || stack.length) {
      while (current) {
        stack.push(current);
        current = current.left;
      }
      current = stack[stack.length - 1];
      if (!current.right || current.right === lastVisited) {
        result.push(current.val);
        lastVisited = current;
        stack.pop();
        current = null;
      } else {
        current = current.right;
      }
    }

    return result;
  }
}
```

### 7. 链表操作 【难度：中】【频率：高】

**问题描述**：实现链表的基本操作，包括反转链表、检测环、找出中间节点等。

**解题思路**：使用快慢指针、虚拟头节点等技巧来简化链表操作。

```javascript
class ListNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

class LinkedList {
  // 反转链表
  reverseList(head) {
    let prev = null;
    let current = head;
    
    while (current) {
      const next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }
    
    return prev;
  }

  // 检测环
  hasCycle(head) {
    if (!head || !head.next) return false;
    
    let slow = head;
    let fast = head;
    
    while (fast && fast.next) {
      slow = slow.next;
      fast = fast.next.next;
      if (slow === fast) return true;
    }
    
    return false;
  }

  // 找出环的入口
  detectCycle(head) {
    if (!head || !head.next) return null;
    
    let slow = head;
    let fast = head;
    let hasCycle = false;
    
    while (fast && fast.next) {
      slow = slow.next;
      fast = fast.next.next;
      if (slow === fast) {
        hasCycle = true;
        break;
      }
    }
    
    if (!hasCycle) return null;
    
    slow = head;
    while (slow !== fast) {
      slow = slow.next;
      fast = fast.next;
    }
    
    return slow;
  }

  // 找出中间节点
  findMiddle(head) {
    if (!head || !head.next) return head;
    
    let slow = head;
    let fast = head;
    
    while (fast.next && fast.next.next) {
      slow = slow.next;
      fast = fast.next.next;
    }
    
    return slow;
  }

  // 合并两个有序链表
  mergeTwoLists(l1, l2) {
    const dummy = new ListNode(0);
    let current = dummy;
    
    while (l1 && l2) {
      if (l1.val <= l2.val) {
        current.next = l1;
        l1 = l1.next;
      } else {
        current.next = l2;
        l2 = l2.next;
      }
      current = current.next;
    }
    
    current.next = l1 || l2;
    return dummy.next;
  }
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

### 5. 虚拟列表实现 【难度：中】【频率：高】

**问题描述**：实现一个高性能的虚拟列表，用于展示大量数据时只渲染可视区域内的内容。

**解题思路**：使用基于视口的渲染策略，结合IntersectionObserver或滚动事件来检测可视区域，实现DOM节点的回收和复用。

```javascript
class VirtualList {
  constructor(options) {
    this.containerHeight = options.containerHeight; // 容器高度
    this.itemHeight = options.itemHeight; // 每项高度
    this.bufferSize = options.bufferSize || 5; // 缓冲区大小
    this.items = options.items || []; // 数据列表
    this.container = null;
    this.scrollTop = 0;
    this.visibleCount = 0; // 可视区域能显示的数量
    this.startIndex = 0; // 起始索引
    this.endIndex = 0; // 结束索引
    this.lastScrollTop = 0; // 上次滚动位置
    this.scrollTicking = false; // 滚动节流标记
  }

  init(container) {
    this.container = container;
    this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    this.container.style.height = `${this.containerHeight}px`;
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    // 创建总高度容器
    const totalHeight = this.items.length * this.itemHeight;
    const heightHolder = document.createElement('div');
    heightHolder.style.height = `${totalHeight}px`;
    heightHolder.style.position = 'relative';
    this.container.appendChild(heightHolder);

    // 监听滚动事件
    this.container.addEventListener('scroll', this.handleScroll.bind(this));

    // 初始渲染
    this.updateVisibleItems();
  }

  handleScroll() {
    if (!this.scrollTicking) {
      requestAnimationFrame(() => {
        this.updateVisibleItems();
        this.scrollTicking = false;
      });
      this.scrollTicking = true;
    }
  }

  updateVisibleItems() {
    const scrollTop = this.container.scrollTop;
    this.startIndex = Math.floor(scrollTop / this.itemHeight);
    this.endIndex = this.startIndex + this.visibleCount + this.bufferSize;

    // 确保索引在有效范围内
    this.startIndex = Math.max(0, this.startIndex - this.bufferSize);
    this.endIndex = Math.min(this.items.length, this.endIndex);

    // 获取可视区域数据
    const visibleData = this.items.slice(this.startIndex, this.endIndex);

    // 更新DOM
    this.render(visibleData);
  }

  render(visibleData) {
    // 清空现有内容
    const content = document.createElement('div');

    visibleData.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.style.position = 'absolute';
      itemElement.style.top = `${(this.startIndex + index) * this.itemHeight}px`;
      itemElement.style.height = `${this.itemHeight}px`;
      itemElement.textContent = item; // 实际应用中这里可能需要更复杂的渲染逻辑
      content.appendChild(itemElement);
    });

    // 使用新内容替换旧内容
    const oldContent = this.container.querySelector('.virtual-list-content');
    if (oldContent) {
      this.container.replaceChild(content, oldContent);
    } else {
      this.container.appendChild(content);
    }
    content.className = 'virtual-list-content';
  }
}
```

### 6. 大文件上传 【难度：中】【频率：高】

**问题描述**：实现一个支持大文件分片上传、断点续传的上传功能。

**解题思路**：将大文件分片，计算文件指纹，维护上传进度，支持断点续传和文件完整性校验。

```javascript
class FileUploader {
  constructor(options) {
    this.file = null;
    this.chunkSize = options.chunkSize || 2 * 1024 * 1024; // 分片大小
    this.uploadedChunks = new Set(); // 已上传的分片
    this.uploadingChunks = new Map(); // 正在上传的分片
    this.maxConcurrent = options.maxConcurrent || 3; // 最大并发数
  }

  async uploadFile(file) {
    this.file = file;
    const fileHash = await this.calculateHash(file);
    const chunks = this.createChunks(file);
    
    // 获取已上传的分片信息
    const uploadedList = await this.getUploadedList(fileHash);
    this.uploadedChunks = new Set(uploadedList);

    // 上传所有分片
    await this.uploadChunks(chunks, fileHash);

    // 通知服务器合并分片
    await this.mergeChunks(fileHash, chunks.length);
  }

  createChunks(file) {
    const chunks = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + this.chunkSize, file.size);
      chunks.push(file.slice(start, end));
      start = end;
    }

    return chunks;
  }

  async calculateHash(file) {
    // 这里使用一个简单的实现，实际项目中可能需要更复杂的文件指纹算法
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        const hash = this.simpleHash(result);
        resolve(hash);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  simpleHash(data) {
    let hash = 0;
    const view = new DataView(data);
    for (let i = 0; i < view.byteLength; i += 4) {
      hash = (hash << 5) - hash + view.getInt32(i, true);
      hash |= 0;
    }
    return hash.toString(16);
  }

  async uploadChunks(chunks, fileHash) {
    const uploadQueue = chunks.map((chunk, index) => ({
      chunk,
      index,
      hash: fileHash + '-' + index
    })).filter(item => !this.uploadedChunks.has(item.hash));

    const upload = async (task) => {
      const formData = new FormData();
      formData.append('chunk', task.chunk);
      formData.append('hash', task.hash);
      formData.append('fileHash', fileHash);
      formData.append('index', task.index);

      try {
        const response = await fetch('/upload/chunk', {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          this.uploadedChunks.add(task.hash);
          this.uploadingChunks.delete(task.hash);
        }
      } catch (error) {
        // 上传失败，可以重试
        console.error('Chunk upload failed:', error);
      }
    };

    // 控制并发上传
    while (uploadQueue.length > 0) {
      if (this.uploadingChunks.size >= this.maxConcurrent) {
        await Promise.race(this.uploadingChunks.values());
        continue;
      }
      const task = uploadQueue.shift();
      const promise = upload(task);
      this.uploadingChunks.set(task.hash, promise);
    }

    // 等待所有分片上传完成
    await Promise.all(this.uploadingChunks.values());
  }

  async getUploadedList(fileHash) {
    try {
      const response = await fetch(`/upload/check?fileHash=${fileHash}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Get uploaded list failed:', error);
      return [];
    }
  }

  async mergeChunks(fileHash, totalChunks) {
    try {
      const response = await fetch('/upload/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileHash,
          totalChunks
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Merge chunks failed:', error);
      return false;
    }
  }
}
```

### 7. 快速排序 【难度：中】【频率：中】

**问题描述**：实现快速排序算法。

**解题思路**：选择一个基准元素，将数组分为两部分，小于基准的放左边，大于基准的放右边，然后递归排序左右两部分。

```javascript
// 基本实现
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const middle = []; // 不能省
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

// 优化1：原地分区（减少空间复杂度）
function quickSortInPlace(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr;
  
  const pivotIndex = partition(arr, left, right);
  quickSortInPlace(arr, left, pivotIndex - 1);
  quickSortInPlace(arr, pivotIndex + 1, right);
  
  return arr;
}

function partition(arr, left, right) {
  // 选择最右边的元素作为基准
  const pivot = arr[right];
  let i = left - 1;
  
  // 遍历从left到right-1的元素
  // 原理:将小于等于pivot的元素都交换到数组左侧
  // i记录已处理区域的边界,j遍历待处理区域
  // 每当找到一个小于等于pivot的元素,就将其与i+1位置交换
  // 这样可以保证i左侧的元素都小于等于pivot
  for (let j = left; j < right; j++) {
    if (arr[j] <= pivot) {
      i++;
      // 交换当前元素到已处理区域的下一个位置
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}

// 随机选择基准元素
function quickSortRandom(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr;
  
  // 随机选择基准元素
  const randomIndex = Math.floor(Math.random() * (right - left + 1)) + left;
  [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];
  
  const pivotIndex = partition(arr, left, right);
  quickSortRandom(arr, left, pivotIndex - 1);
  quickSortRandom(arr, pivotIndex + 1, right);
  
  return arr;
}
```

## 动态规划

### 1. 斐波那契数列 【难度：简单】【频率：高】

**问题描述**：计算斐波那契数列的第n个数。

**解题思路**：使用动态规划避免递归的重复计算。

```javascript
// 动态规划解法
function fib(n) {
  if (n <= 1) return n;
  
  let dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
  }
  
  return dp[n];
}

// 优化空间复杂度
function fibOptimized(n) {
  if (n <= 1) return n;
  
  let prev = 0;
  let curr = 1;
  
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  
  return curr;
}
```

### 2. 爬楼梯 【难度：简单】【频率：高】

**问题描述**：假设你正在爬楼梯，需要n阶才能到达楼顶。每次你可以爬1或2个台阶，问有多少种不同的方法可以爬到楼顶？

**解题思路**：类似斐波那契数列，第n阶的方法数等于第n-1阶和第n-2阶方法数之和。

```javascript
function climbStairs(n) {
  if (n <= 2) return n;
  
  let prev = 1;
  let curr = 2;
  
  for (let i = 3; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  
  return curr;
}
```

### 3. 0-1背包问题 【难度：中】【频率：中】

**问题描述**：给定n个物品，每个物品有重量和价值两个属性。在总重量不超过背包容量的情况下，选择物品使得总价值最大。

**解题思路**：使用二维数组dp[i][j]表示前i个物品放入容量为j的背包的最大价值。
状态转移方程`dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])`来求解。这个方程的含义是：当前状态的最大价值等于不放入第i个物品的最大价值和放入第i个物品后的最大价值中的较大值。

```javascript
function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= capacity; j++) {
      if (weights[i-1] <= j) {
        dp[i][j] = Math.max(
          dp[i-1][j],
          dp[i-1][j-weights[i-1]] + values[i-1]
        );
      } else {
        dp[i][j] = dp[i-1][j];
      }
    }
  }
  
  return dp[n][capacity];
}
```

### 4. 最长递增子序列 【难度：中】【频率：高】

**问题描述**：给定一个无序的整数数组，找到其中最长上升子序列的长度。

**解题思路**：dp[i]表示以第i个数字结尾的最长上升子序列的长度。

```javascript
function lengthOfLIS(nums) {
  if (!nums.length) return 0;
  
  const dp = Array(nums.length).fill(1);
  let maxLen = 1;
  
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLen = Math.max(maxLen, dp[i]);
  }
  
  return maxLen;
}

// 优化解法：使用二分查找
function lengthOfLISOptimized(nums) {
  const tails = [];
  
  for (const num of nums) {
    let left = 0;
    let right = tails.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    tails[left] = num;
    if (left === tails.length) tails.push(num);
  }
  
  return tails.length;
}
```

### 5. 最长公共子序列 【难度：中】【频率：中】

**问题描述**：给定两个字符串，求它们的最长公共子序列的长度。

**解题思路**：使用二维dp数组，dp[i][j]表示text1的前i个字符与text2的前j个字符的最长公共子序列长度。

```javascript
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i-1] === text2[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  return dp[m][n];
}
```

## 字符串算法

### 1. 字符串匹配（KMP算法）【难度：中高】【频率：中】

**问题描述**：实现一个字符串匹配算法，在主串中查找模式串出现的位置。

**解题思路**：使用KMP算法，通过构建部分匹配表（next数组）来避免不必要的比较。

```javascript
function getNext(pattern) {
  const next = [0];
  let prefix = 0;
  let i = 1;
  
  while (i < pattern.length) {
    if (pattern[i] === pattern[prefix]) {
      prefix++;
      next[i] = prefix;
      i++;
    } else if (prefix === 0) {
      next[i] = 0;
      i++;
    } else {
      prefix = next[prefix - 1];
    }
  }
  
  return next;
}

function kmp(text, pattern) {
  if (!pattern) return 0;
  
  const next = getNext(pattern);
  let i = 0; // 主串指针
  let j = 0; // 模式串指针
  
  while (i < text.length) {
    if (text[i] === pattern[j]) {
      if (j === pattern.length - 1) {
        return i - j;
      }
      i++;
      j++;
    } else if (j > 0) {
      j = next[j - 1];
    } else {
      i++;
    }
  }
  
  return -1;
}
```

### 2. 回文串判断 【难度：简单】【频率：高】

**问题描述**：判断一个字符串是否是回文串，只考虑字母和数字字符，忽略大小写。

**解题思路**：使用双指针从两端向中间移动，跳过非字母数字字符。

```javascript
function isPalindrome(s) {
  // 将字符串转换为小写并移除非字母数字字符
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    if (s[left] !== s[right]) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
}

// 进阶：最长回文子串
function longestPalindrome(s) {
  if (s.length < 2) return s;
  
  let start = 0;
  let maxLength = 1;
  
  function expandAroundCenter(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const currentLength = right - left + 1;
      if (currentLength > maxLength) {
        start = left;
        maxLength = currentLength;
      }
      left--;
      right++;
    }
  }
  
  for (let i = 0; i < s.length; i++) {
    expandAroundCenter(i, i); // 奇数长度
    expandAroundCenter(i, i + 1); // 偶数长度
  }
  
  return s.substring(start, start + maxLength);
}
```

### 3. 字符串压缩 【难度：简单】【频率：中】

**问题描述**：实现基本的字符串压缩功能。例如，字符串"aabcccccaaa"会变为"a2b1c5a3"。

**解题思路**：遍历字符串，统计连续相同字符的个数。

```javascript
function compressString(s) {
  if (!s) return '';
  
  let result = '';
  let count = 1;
  let current = s[0];
  
  for (let i = 1; i <= s.length; i++) {
    if (s[i] === current) {
      count++;
    } else {
      result += current + count;
      current = s[i];
      count = 1;
    }
  }
  
  return result.length < s.length ? result : s;
}
```

### 4. 字符串转整数 (atoi) 【难度：中】【频率：中】

**问题描述**：实现一个atoi函数，将字符串转换为整数。需要处理前导空格、正负号、溢出等情况。

**解题思路**：依次处理空格、符号和数字，注意边界条件和溢出情况。

```javascript
function myAtoi(s) {
  let i = 0;
  let result = 0;
  let sign = 1;
  
  // 处理前导空格
  while (s[i] === ' ') {
    i++;
  }
  
  // 处理正负号
  if (s[i] === '+' || s[i] === '-') {
    sign = s[i] === '+' ? 1 : -1;
    i++;
  }
  
  // 处理数字
  while (i < s.length && /\d/.test(s[i])) {
    result = result * 10 + (s[i] - '0');
    
    // 处理溢出
    if (sign === 1 && result > 2147483647) {
      return 2147483647;
    }
    if (sign === -1 && result > 2147483648) {
      return -2147483648;
    }
    
    i++;
  }
  
  return sign * result;
}
```

### 5. 最长公共前缀 【难度：简单】【频率：高】

**问题描述**：编写一个函数来查找字符串数组中的最长公共前缀。

**解题思路**：可以使用水平扫描或垂直扫描方法。

```javascript
// 水平扫描法
function longestCommonPrefix(strs) {
  if (!strs.length) return '';
  
  let prefix = strs[0];
  
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.substring(0, prefix.length - 1);
      if (!prefix) return '';
    }
  }
  
  return prefix;
}

// 垂直扫描法
function longestCommonPrefix2(strs) {
  if (!strs.length) return '';
  
  for (let i = 0; i < strs[0].length; i++) {
    const char = strs[0][i];
    for (let j = 1; j < strs.length; j++) {
      if (i === strs[j].length || strs[j][i] !== char) {
        return strs[0].substring(0, i);
      }
    }
  }
  
  return strs[0];
}
```

## 树相关算法

### 1. 二叉树的遍历 【难度：简单】【频率：高】

**问题描述**：实现二叉树的前序、中序、后序遍历。

**解题思路**：可以使用递归或迭代的方式实现三种遍历方式。

```javascript
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// 递归实现
function preorderTraversal(root) {
  const result = [];
  
  function traverse(node) {
    if (!node) return;
    
    result.push(node.val); // 前序：根-左-右
    traverse(node.left);
    traverse(node.right);
  }
  
  traverse(root);
  return result;
}

function inorderTraversal(root) {
  const result = [];
  
  function traverse(node) {
    if (!node) return;
    
    traverse(node.left);
    result.push(node.val); // 中序：左-根-右
    traverse(node.right);
  }
  
  traverse(root);
  return result;
}

function postorderTraversal(root) {
  const result = [];
  
  function traverse(node) {
    if (!node) return;
    
    traverse(node.left);
    traverse(node.right);
    result.push(node.val); // 后序：左-右-根
  }
  
  traverse(root);
  return result;
}

// 迭代实现（以前序遍历为例）
function preorderIterative(root) {
  if (!root) return [];
  
  const result = [];
  const stack = [root];
  
  while (stack.length) {
    const node = stack.pop();
    result.push(node.val);
    
    // 先压入右子节点，再压入左子节点，这样出栈时就是先左后右
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  
  return result;
}
```

### 2. 二叉树的层序遍历 【难度：中】【频率：高】

**问题描述**：从上到下按层打印二叉树，同一层的节点按从左到右的顺序打印。

**解题思路**：使用队列实现广度优先搜索。

```javascript
function levelOrder(root) {
  if (!root) return [];
  
  const result = [];
  const queue = [root];
  
  while (queue.length) {
    const level = [];
    const size = queue.length;
    
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    result.push(level);
  }
  
  return result;
}
```

### 3. 二叉树的最大深度 【难度：简单】【频率：高】

**问题描述**：计算二叉树的最大深度（根节点到最远叶子节点的最长路径上的节点数）。

**解题思路**：可以使用递归或迭代的方式，这里展示递归解法。

```javascript
function maxDepth(root) {
  if (!root) return 0;
  
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  
  return Math.max(leftDepth, rightDepth) + 1;
}
```

### 4. 路径总和 【难度：简单】【频率：中】

**问题描述**：判断二叉树中是否存在根节点到叶子节点的路径，使得路径上所有节点值相加等于目标和。

**解题思路**：使用递归，每次减去当前节点的值，判断叶子节点时是否剩余为0。

```javascript
function hasPathSum(root, targetSum) {
  if (!root) return false;
  
  // 到达叶子节点
  if (!root.left && !root.right) {
    return targetSum === root.val;
  }
  
  return hasPathSum(root.left, targetSum - root.val) ||
         hasPathSum(root.right, targetSum - root.val);
}
```

### 5. 二叉树的最近公共祖先 【难度：中】【频率：高】

**问题描述**：找到二叉树中两个指定节点的最近公共祖先。

**解题思路**：后序遍历，自底向上查找。

```javascript
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  
  if (!left) return right; // p和q都在右子树
  if (!right) return left; // p和q都在左子树
  
  return root; // p和q分别在左右子树
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