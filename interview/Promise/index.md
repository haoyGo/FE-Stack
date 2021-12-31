## Promise
* `constructor`
  ``` js
  new Promise(function(resolve, reject) {
    // 异步处理
    // 处理结束后、调用resolve 或 reject
  })
  ```
* `promise.then(onFulfilled, onRejected)`
  构造函数里执行的代码，如果有异常，也会被 `reject`
  ``` js
  new Promise((resolve, reject) => {
    setTimeout(function () {
      resolve('Async Hello world');
    }, 16);
  })
  .then((res) => {}, (err) => {})
  .catch((err) => {})
  ```
* Promise 实例有三种状态：
  * `Fulfilled` -- has-resolution，此时会调用 `onFulfilled`
  * `Rejected` -- has-rejection，此时会调用 `onRejected`
  * `Pending` -- unresolved，既不是 resolve 也不是 reject 的状态。也就是 promise 对象刚被创建后的初始化状态等
   
  基本上状态在代码中是不会涉及到的，所以名称也无需太在意。
  promise 对象的状态，从 `Pending` 转换为 `Fulfilled`  或 `Rejected` 之后， 这个 promise 对象的状态就不会再发生任何变化。
  也就是说，Promise与Event等不同，在 `.then` 后执行的函数可以肯定地说只会被调用一次。
  另外，`Fulfilled` 和 `Rejected` 这两个中的任一状态都可以表示为 `Settled(不变的)`。

* `Promise.resolve`
  ``` js
  Promise.resolve(42).then(function(value){
    console.log(value);
  });
  ```
  * `Thenable`
  `Promise.resolve` 方法另一个作用就是将 `thenable` 对象转换为 `promise` 对象。就像我们有时称具有 `.length` 方法的非数组对象为 `Array like` 一样，`thenable` 指的是一个具有 `.then` 方法的对象。



### 创建 XHR 的 promise 对象
``` js
function getURL(url) {
  return new Promise(function (resolve, reject) {
    const req = new XMLHttpRequest()

    req.open('GET', url, true)

    req.onload = function() {
      if (req.status === 200) {
        resolve(req.responseText);
      } else {
        reject(new Error(req.statusText));
      }
    }

    req.onerror = function () {
      reject(new Error(req.statusText));
    };

    req.send();
  })
}

// 运行示例
var URL = "http://httpbin.org/get";
getURL(URL).then(function onFulfilled(value){
    console.log(value);
}).catch(function onRejected(error){
    console.error(error);
});
```

### 函数不要混用同步和异步调用
``` js
function onReady(fn) {
    var readyState = document.readyState;
    if (readyState === 'interactive' || readyState === 'complete') {
        fn();
        // 改为异步调用
        // setTimeout(fn, 0);
    } else {
        window.addEventListener('DOMContentLoaded', fn);
    }
}
onReady(function () {
    console.log('DOM fully loaded and parsed');
});
console.log('==Starting==');
```
使用 Promise 去转为异步调用
``` js
function onReadyPromise() {
    return new Promise(function (resolve, reject) {
        var readyState = document.readyState;
        if (readyState === 'interactive' || readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('DOMContentLoaded', resolve);
        }
    });
}
onReadyPromise().then(function () {
    console.log('DOM fully loaded and parsed');
});
console.log('==Starting==');
```

### Promise chain
![](./imgs/promise-then-catch-flow.png)
#### promise.then
`Promise.then/catch` 会将 return 值（没有则返回空）通过 `Promise.resolve` 包装返回，所以 `Promise.then/catch` 可以链式调用。

#### promise.catch
``` js
var promise = Promise.reject(new Error("message"));
promise.catch(function (error) {
    console.error(error);
});
```
以上代码在 `IE8` 及以下版本则会出现 `identifier not found` 的语法错误。
**原因是**：在 `ECMAScript 3` 中保留字是不能作为对象的属性名使用的。 而 `IE8` 及以下版本都是基于 `ECMAScript 3` 实现的，因此不能将 `catch` 作为属性来使用，也就不能编写类似 `promise.catch()` 的代码，因此就出现了 `identifier not found` 这种语法错误了。
而现在的浏览器都是基于 `ECMAScript 5` 的，而在 `ECMAScript 5` 中保留字都属于 `IdentifierName` ，也可以作为属性名使用了。

当然，我们也可以想办法回避这个 `ECMAScript 3` 保留字带来的问题:
* `点标记法（dot notation）` 要求对象的属性必须是有效的标识符（在 `ECMAScript 3` 中则不能使用保留字），
* 但是使用 `中括号标记法（bracket notation）`的话，则可以将非合法标识符作为对象的属性名使用。
``` js
var promise = Promise.reject(new Error("message"));
promise["catch"](function (error) {
    console.error(error);
});
```

或者我们不单纯的使用 `catch` ，而是使用 `then` 也是可以避免这个问题的。
``` js
var promise = Promise.reject(new Error("message"));
promise.then(undefined, function (error) {
    console.error(error);
});
```

由于 `catch` 标识符可能会导致问题出现，因此一些类库（Library）也采用了 `caught` 作为函数名，而函数要完成的工作是一样的。
而且很多压缩工具自带了将 `promise.catch` 转换为 `promise["catch"]` 的功能

### Deferred vs Promise
``` js
function Deferred() {
    this.promise = new Promise(function (resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
    }.bind(this));
}
Deferred.prototype.resolve = function (value) {
    this._resolve.call(this.promise, value);
};
Deferred.prototype.reject = function (reason) {
    this._reject.call(this.promise, reason);
};
```

可以当作是 `Promise` 的操作方法分离，使用 `Deferred` 的方式：

``` js
// Promise
function getURL(URL) {
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', URL, true);
        req.onload = function () {
            if (req.status === 200) {
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.send();
    });
}
// 运行示例
var URL = "http://httpbin.org/get";
getURL(URL).then(function onFulfilled(value){
    console.log(value);
}).catch(console.error.bind(console));

// Deferred
function getURL(URL) {
    var deferred = new Deferred(); // (1)
    var req = new XMLHttpRequest();
    req.open('GET', URL, true);
    req.onload = function () {
        if (req.status === 200) {
            deferred.resolve(req.responseText); // (2)
        } else {
            deferred.reject(new Error(req.statusText)); // (3)
        }
    };
    req.onerror = function () {
        deferred.reject(new Error(req.statusText)); // (4)
    };
    req.send();
    return deferred.promise; // (5)
}
// 运行示例
var URL = "http://httpbin.org/get";
getURL(URL).then(function onFulfilled(value){
    console.log(value);
}).catch(console.error.bind(console));
```

* `Deferred` 的话不需要将代码用Promise括起来
  * 由于没有被嵌套在函数中，可以减少一层缩进
  * 反过来没有Promise里的错误处理逻辑

由于 `Deferred` 包含了 `Promise`，所以大体的流程还是差不多的，不过 `Deferred` 有用对 `Promise` 进行操作的特权方法，以及高度自由的对流程控制进行自由定制。
如果说 `Promise` 是用来对值进行抽象的话，`Deferred` 则是对处理还没有结束的状态或操作进行抽象化的对象，我们也可以从这一层的区别来理解一下这两者之间的差异。

放另一个例子，`nodejs/util/promisify` 也是采用 `Deferred` 的方式：
``` js
var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}
```