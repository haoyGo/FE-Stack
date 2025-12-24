
### 3. LRU缓存实现 【难度：中】【频率：中高】

**问题描述**：实现一个LRU（最近最少使用）缓存机制，要求get和put操作的时间复杂度都是O(1)。

**解题思路**：
1. 使用Map数据结构存储键值对，保证O(1)的查找和删除
2. 利用Map的迭代顺序特性来维护访问顺序
3. 在达到容量上限时删除最久未使用的元素

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
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    // 添加新元素
    this.cache.set(key, value);
  }
}

// 使用示例
const cache = new LRUCache(2);
cache.put(1, 1); // 缓存是 {1=1}
cache.put(2, 2); // 缓存是 {1=1, 2=2}
console.log(cache.get(1)); // 返回 1
cache.put(3, 3); // 该操作会使得关键字 2 作废，缓存是 {1=1, 3=3}
console.log(cache.get(2)); // 返回 -1 (未找到)
```
