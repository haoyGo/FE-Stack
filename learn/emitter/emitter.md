## JS Event Emitter
1. 最简单先创建一个对象 `Emitter`
2. 需要收集注册的事件 `_events`
3. 通过方法 `on` 注册事件
4. 通过方法 `off` 删除事件
5. 通过方法 `emit` 触发事件
6. 通过方法 `once` 注册一次性事件
7. 优化1 - 将回调函数上下文 ctx 存储起来
   
``` ts
interface EventItem {
  callback: Function
  ctx: object
}

class Emitter {
  // 每个事件有自己的队列，是一个数组，存放多个回调函数
  _events: Record<string, Array<EventItem>> = {}

  on(name: string, callback: Function, ctx: object) {
    // 队列初始化为空数组
    ;(this._events[name] || (this._events[name] = [])).push({
      callback,
      ctx
    })

    return this
  }

  off(name: string, callback: Function) {
    const cbList = this._events[name]
    if (cbList && callback) {
      // 直接通过函数全等判断，所以注册和删除的必须是同个函数
      const newList = cbList.filter((cb) => cb.callback !== callback)
      // 队列为空，则同时清除事件属性
      newList.length > 0
        ? (this._events[name] = newList)
        : delete this._events[name]
    }

    return this
  }

  // 只要不删除事件，可以触发无数次
  emit(name: string) {
    const cbList = this._events[name]
    if (cbList) {
      // 获取剩余参数
      const args = Array.prototype.slice.call(arguments, 1)
      // 整个队列执行
      cbList.forEach(({callback, ctx}) => callback.apply(ctx, args))
    }

    return this
  }

  // 利用 on 和 off 实现
  once(name: string, callback: Function, ctx: object) {
    const fn = (...args: any[]) => {
      callback.apply(ctx, args)
      this.off(name, fn)
    }

    this.on(name, fn, ctx)

    return this
  }
}
```

> Typescript 版本
> https://github.com/developit/mitt