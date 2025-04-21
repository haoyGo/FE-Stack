``` js
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
