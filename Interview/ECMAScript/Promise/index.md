## Promise
`ES6` 主要用的是 `Promise/A+` 规范
### 实现 Promise
说到底，`Promise` 也还是使用回调函数，只不过是把回调封装在了内部，使用上一直通过 `then` 方法的链式调用，使得多层的回调嵌套看起来变成了同一层的，书写上以及理解上会更直观和简洁一些。

#### 基础版本
``` js
//极简的实现
class Promise {
  callbacks = [];
  constructor(fn) {
    fn(this._resolve.bind(this));
  }
  then(onFulfilled) {
    this.callbacks.push(onFulfilled);
  }
  _resolve(value) {
    this.callbacks.forEach(fn => fn(value));
  }
}

//Promise应用
let p = new Promise(resolve => {
  setTimeout(() => {
    console.log('done');
    resolve('5秒');
  }, 5000);
}).then((tip) => {
  console.log(tip);
})
```
上述代码很简单，大致的逻辑是这样的：
1. 调用 `then` 方法，将想要在 `Promise` 异步操作成功时执行的 `onFulfilled` 放入 `callbacks` 队列，其实也就是注册回调函数，可以向观察者模式方向思考。(其实整个代码可以看成同步代码，构造函数会直接执行函数内容，里面一般会有异步操作，所以会先执行 `then` 方法注册回调函数 `onFulfilled`)
2. 创建 `Promise` 实例时传入的函数会被赋予一个函数类型的参数，即 `resolve`，它接收一个参数 `value`，**代表异步操作返回的结果**，当异步操作执行成功后，会调用 `resolve` 方法，这时候其实真正执行的操作是将 `callbacks` 队列中的回调一一执行。

也即 `new Promise` 时，执行构造函数传给 `Promise` 的函数，设置定时器模拟异步的场景，接着调用 `promise.then` 方法注册异步操作完成后的 `onFulfilled`，最后当异步操作完成时，调用 `resolve(value)`， 执行 `then` 方法注册的 `onFulfilled`。

#### promise chain
只需要 `then/catch` 返回 `this`
``` js
then(onFulfilled) {
  this.callbacks.push(onFulfilled)
  return this // 看这里
}
```

#### 加入延迟机制
上面代码的执行顺序，依赖于构造函数内有异步操作，如果是同步的，会导致构造函数所有代码先执行完，再去执行 `then` 方法。因此要加入一些处理，保证在 `resolve` 执行之前，`then` 方法已经注册完所有的回调：
``` js
_resolve(value) {
  setTimeout(() => { // 看这里
    this.callbacks.forEach(fn => fn(value));
  });
}
```

但是这样依然存在问题，在 `resolve` 执行后，再通过 `then` 注册上来的 `onFulfilled` 都没有机会执行了。如下所示，我们加了延迟后，`then1` 和 `then2` 可以打印出来了，但下例中的 `then3` 依然打印不出来。所以我们需要增加状态，并且保存 `resolve` 的值。
``` js
let p = new Promise(resolve => {
  console.log('同步执行');
  resolve('同步执行');
}).then(tip => {
  console.log('then1', tip);
}).then(tip => {
  console.log('then2', tip);
});

setTimeout(() => {
  p.then(tip => {
    console.log('then3', tip);
  })
});
```

#### 加入状态机
为了解决上一节抛出的问题，我们必须加入状态机制，也就是大家熟知的 `pending`、`fulfilled`、`rejected`。
`Promises/A+` 规范中明确规定了，`pending` 可以转化为 `fulfilled` 或 `rejected` 并且只能转化一次，也就是说如果 `pending` 转化到 `fulfilled` 状态，那么就不能再转化到 `rejected`。并且 `fulfilled` 和 `rejected` 状态只能由 `pending` 转化而来，两者之间不能互相转换。
``` js
//极简的实现+链式调用+延迟机制+状态
class Promise {
    callbacks = [];
    state = 'pending';//增加状态
    value = null;//保存结果
    constructor(fn) {
        fn(this._resolve.bind(this));
    }
    then(onFulfilled) {
        if (this.state === 'pending') { // 在resolve之前，跟之前逻辑一样，添加到callbacks中
            this.callbacks.push(onFulfilled);
        } else {//在resolve之后，直接执行回调，返回结果了
            onFulfilled(this.value);
        }
        return this;
    }
    _resolve(value) {
        this.state = 'fulfilled';//改变状态
        this.value = value;//保存结果
        this.callbacks.forEach(fn => fn(value));
    }
}
```

> 注意：当增加完状态之后，原先的 `_resolve` 中的定时器可以去掉了。当 `resolve` 同步执行时，虽然 `callbacks` 为空，回调函数还没有注册上来，但没有关系，因为后面注册上来时，判断状态为 `fulfilled`，会立即执行回调。

至此，一个初具功能的 `Promise` 就实现好了，它实现了 `then`，实现了链式调用，实现了状态管理等等。但仔细想想，链式调用的实现只是在 `then` 中 `return` 了 `this`，因为是同一个实例，调用再多次 `then` 也只能返回相同的一个结果，这显然是不能满足我们的要求的。

每个 `then` 注册的 `onFulfilled` 都返回了不同的结果，层层递进，很明显在 `then`方法中 `return this` 不能达到这个效果。引入真正的链式调用，`then` 返回的一定是一个新的 `Promise` 实例。

#### 较为完整实现
``` js
//完整的实现
class Promise {
  callbacks = [];
  state = 'pending';//增加状态
  value = null;//保存结果
  constructor(fn) {
    fn(this._resolve.bind(this));
  }
  then(onFulfilled) {
    // 注意用了箭头函数，所以 this 是前面实例
    return new Promise(resolve => {
      this._handle({
        onFulfilled: onFulfilled || null,
        resolve
      });
    });
  }
  _handle(callback) {
    // this 是前面实例
    if (this.state === 'pending') {
      this.callbacks.push(callback);
      return;
    }
    //如果then中没有传递任何东西
    if (!callback.onFulfilled) {
      callback.resolve(this.value);
      return;
    }
    var ret = callback.onFulfilled(this.value);
    callback.resolve(ret);
  }
  _resolve(value) {
    this.state = 'fulfilled';//改变状态
    this.value = value;//保存结果
    this.callbacks.forEach(callback => this._handle(callback));
  }
}
```
* `then` 方法中，创建并返回了新的 `Promise 实例`，这是`串行 Promise`的基础，是实现真正链式调用的根本
* `then` 方法传入的形参 `onFulfilled` 以及创建新 `Promise 实例`时传入的 `resolve` 放在一起，被 `push` 到当前 `Promise` 的 `callbacks` 队列中，这是衔接`当前 Promise` 和`后邻 Promise` 的关键所在
* 根据规范，`onFulfilled` 是可以为空的，为空时不调用 `onFulfilled`

自己的理解：
* 首先需要在 `then` 方法返回新的 `Promise`，所以返回了新的 `new Promise` 实例
* 为了将前后 `Promise` 串联起来，`后面 Promise` 需要拿到 `前面 Promise` 的返回值 `value` (通过回调函数 `onFulfilled` 调用返回)。这个通过 `resolve` 函数来串联，所以每个 `callback` 除了注册的回调函数 `onFulfilled`，还需要保存该实例的 `resolve` 函数（通过构造函数而来），用于传递 `value`。
* 这样每个 `then` 方法后都会返回新的 `Promise` 实例，也会有自己的 `state、value、callbacks`，`后面 Promise` 传参就是`前面 Promise`，`前面 Promise callbacks` 会存放`后面 Promise`

#### then 返回 promise
如果 `onFulfilled` 返回的是 Promise，需要把 `前 promise` 的状态变更延迟，直到`返回 promise` 里的异步操作执行完成，不然下一个 `then` 拿到的参数就是 `promise 对象`。通过调用 `返回 promise 的 then` 方法，保证异步操作执行完成，然后去改 `前 promise` 的状态，即通过 `前 promise 的 resolve`。
``` js
_resolve(value) {
  if (value && (typeof value === 'object' || typeof value === 'function')) {
    var then = value.then;
    if (typeof then === 'function') {
      then.call(value, this._resolve.bind(this));
      return;
    }
  }

  this.state = 'fulfilled';//改变状态
  this.value = value;//保存结果
  this.callbacks.forEach(callback => this._handle(callback));
}
```
从代码上看，它是对 `resolve` 中的值作了一个特殊的判断，判断 `resolve` 的值是否为 `Promise` 实例，如果是 `Promise` 实例，那么就把当前 `Promise` 实例的状态改变接口重新注册到 `resolve` 的值对应的 `Promise` 的 `onFulfilled` 中，也就是说当前 `Promise` 实例的状态要依赖 `resolve` 的值的 `Promise` 实例的状态。

#### 补充 reject
``` js
//完整的实现+reject
class Promise {
  callbacks = [];
  state = 'pending';//增加状态
  value = null;//保存结果
  constructor(fn) {
    fn(this._resolve.bind(this), this._reject.bind(this));
  }
  then(onFulfilled, onRejected) {
    return new Promise((resolve, reject) => {
      this._handle({
        onFulfilled: onFulfilled || null,
        onRejected: onRejected || null,
        resolve: resolve,
        reject: reject
      });
    });
  }
  _handle(callback) {
    if (this.state === 'pending') {
      this.callbacks.push(callback);
      return;
    }

    let cb = this.state === 'fulfilled' ? callback.onFulfilled : callback.onRejected;

    if (!cb) {//如果then中没有传递任何东西
      cb = this.state === 'fulfilled' ? callback.resolve : callback.reject;
      cb(this.value);
      return;
    }

    let ret = cb(this.value);
    cb = this.state === 'fulfilled' ? callback.resolve : callback.reject;
    cb(ret);
  }
  _resolve(value) {
    if (value && (typeof value === 'object' || typeof value === 'function')) {
      var then = value.then;
      if (typeof then === 'function') {
        then.call(value, this._resolve.bind(this), this._reject.bind(this));
        return;
      }
    }

    this.state = 'fulfilled';//改变状态
    this.value = value;//保存结果
    this.callbacks.forEach(callback => this._handle(callback));
  }
  _reject(error) {
    this.state = 'rejected';
    this.value = error;
    this.callbacks.forEach(callback => this._handle(callback));
  }
}
```

#### 异常处理
如果在执行 `onFulfilled` 或者 `onRejected` 时，出现了异常，需要进行异常处理。
``` js
_handle(callback) {
  if (this.state === 'pending') {
    this.callbacks.push(callback);
    return;
  }

  let cb = this.state === 'fulfilled' ? callback.onFulfilled : callback.onRejected;

  if (!cb) {//如果then中没有传递任何东西
    cb = this.state === 'fulfilled' ? callback.resolve : callback.reject;
    cb(this.value);
    return;
  }

  let ret;

  try {
    ret = cb(this.value);
    cb = this.state === 'fulfilled' ? callback.resolve : callback.reject;
  } catch (error) {
    ret = error;
    cb = callback.reject
  } finally {
    cb(ret);
  }
}
```

#### catch 方法
`catch` 其实就是 `then` 中的 `onRejected`
``` js
catch(onError){
  return this.then(null, onError);
}
```

#### finally 方法
`finally` 其实就是 `then` 中的 `onFulfilled`、`onRejected`都一致处理
``` js
finally(onDone){
  return this.then(onDone, onDone);
}
```
但是由于 `finally` 方法的 `onDone` 不关心 `Promise` 的状态到底是 `fulfilled` 还是 `rejected` ，所以 `onDone` 里的操作，应该是与状态无关的，并且不应该有任何参数。
``` js
finally(onDone) {
  if (typeof onDone !== 'function') return this.then();
  let Promise = this.constructor;
  return this.then(
    value => Promise.resolve(onDone()).then(() => value),
    reason => Promise.resolve(onDone()).then(() => { throw reason })
  );
}
```

#### Promise.resolve/reject
如果 `Promise.resolve` 的参数是一个 `Promise 实例`，那么 `Promise.resolve` 将不做任何改动，直接返回这个 `Promise 实例`，如果是一个基本数据类型，譬如上例中的字符串，`Promise.resolve` 就会新建一个 `Promise 实例` 返回。这样当我们不清楚拿到的对象到底是不是 `Promise 实例` 时，为了保证统一的行为，`Promise.resolve` 就变得很有用了。
``` js
static resolve(value) {
  if (value && value instanceof Promise) {
    // Promise 实例直接返回
    return value;
  } else if (value && typeof value === 'object' && typeof value.then === 'function') {
    // thenable，将 resolve 传入 then 执行
    let then = value.then;
    return new Promise(resolve => {
      then(resolve);
    });

  } else if (value) {
    // promise 实例化
    return new Promise(resolve => resolve(value));
  } else {
    // promise 实例化
    return new Promise(resolve => resolve());
  }
}

static reject(value) {
  if (value && typeof value === 'object' && typeof value.then === 'function') {
    let then = value.then;
    return new Promise((resolve, reject) => {
      then(reject);
    });
  } else {
    return new Promise((resolve, reject) => reject(value));
  }
}
```
`Promise.reject` 与 `Promise.resolve` 类似，区别在于 `Promise.reject` 始终返回一个状态的 `rejected` 的 `Promise` 实例，而 `Promise.resolve` 的参数如果是一个 `Promise` 实例的话，返回的是参数对应的 `Promise` 实例，所以状态不一 定。

#### Promise.all
计数完成所有异步调用，然后 `resolve` 返回所有结果
``` js
static all(promises) {
  return new Promise((resolve, reject) => {
    let counter = promises.length
    let res = new Array(counter)
    promises.forEach((item, index) => {
      Promise.resolve(item).then(result => {
        res[index] = result;
        if (--counter === 0) {
          resolve(res);
        }
      }, reason => reject(reason));
    })

  })
}
```

#### Promise.race
所有异步调用都注册 `resolve`，只要有一个完成，就直接 `resolve`，但不会停止其他调用继续执行。
``` js
static race(promises) {
  return new Promise(function (resolve, reject) {
    for (let i = 0, len = promises.length; i < len; i++) {
      Promise.resolve(promises[i]).then(resolve, reject)
    }
  })
}
```

刚开始看 `Promise` 源码的时候总不能很好的理解 `then` 和 `resolve` 函数的运行机理，但是如果你静下心来，反过来根据执行 `Promise` 时的逻辑来推演，就不难理解了。这里一定要注意的点是：**`Promise` 里面的 `then` 函数仅仅是注册了后续需要执行的代码，真正的执行是在 `resolve` 方法里面执行的**，理清了这层，再来分析源码会省力的多。

现在回顾下 `Promise` 的实现过程，其主要使用了设计模式中的**观察者模式**：

通过 `Promise.prototype.then` 和 `Promise.prototype.catch` 方法将观察者方法注册到被观察者 `Promise` 对象中，同时返回一个新的 `Promise` 对象，以便可以链式调用。
被观察者管理内部 `pending`、`fulfilled` 和 `rejected` 的状态转变，同时通过构造函数中传递的 `resolve` 和 `reject` 方法以主动触发状态转变和通知观察者。