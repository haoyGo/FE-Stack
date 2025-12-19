### 手写代码

- call、apply、bind

  ```javascript
  function iCall(context = window, ...rest) {
    if (typeof this !== "function")
      throw new TypeError("argument is not a function");

    const fn = Symbol("fn");
    context[fn] = this;
    const res = context[fn](...rest);
    delete context[fn];

    return res;
  }

  function iApply(context = window, rest) {
    if (typeof this !== "function")
      throw new TypeError("argument is not a function");

    const fn = Symbol("fn");
    context[fn] = this;
    const res = Array.isArray(rest) ? context[fn](...rest) : context[fn]();
    delete context[fn];

    return res;
  }

  function iBind(context = window, ...rest1) {
    if (typeof this !== "function")
      throw new TypeError("argument is not a function");

    const fn = this;
    return function (...rest2) {
      return fn.apply(this instanceof fn ? this : context, rest1.concat(rest2));
    };
  }
  ```

  ***

- new

  ```javascript
  function iNew() {
    const arg = [...arguments];
    const Fn = constructor;

    if (typeof constructor !== "function") {
      throw new TypeError("constructor is not a function");
    }

    const that = Object.create(Fn.prototype);
    const res = Fn.apply(that, arg);

    // res 如果是null，返回that
    return (["object", "function"].includes(typeof res) && res) || that;
  }
  ```

  ***

- instanceof

  ```javascript
  function inst(obj, constr) {
    const getProto = Object.getPrototypeOf;
    const prototype = constr.prototype;
    let proto = getProto(obj);

    while (true) {
      if (!proto) return false;
      if (proto === prototype) return true;

      proto = getProto(proto);
    }
  }
  ```

  ***

- Object.create

  ```javascript
  function create(obj) {
    function F() {}
    F.prototype = obj;
    return new F();
  }
  ```

  ***

- 继承

  ```js
  // 寄生组合式继承
  function Student(name, age, grade) {
    Person.call(this, name, age);
    this.grade = grade;
  }
  Student.prototype = Object.create(Person.prototype);
  Student.prototype.constructor = Student;
  ```

  ***

- deepclone
  利用其他 API

  ```js
  // 1 JSON
  JSON.parse(JSON.stringify(obj))

  // 4. structuredClone，新API
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
  const clone = structuredClone(original);
  ```

  手写

  ```js
  function deepClone(obj, hash = new Map()) {
    // 处理null或基本类型
    if (obj === null || typeof obj !== "object") {
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

  ***

- 防抖

  ```js
  // 防抖
  function debounce(fn, delay = 300, immediate = false) {
    if (typeof fn !== "function") {
      throw new TypeError("第一个参数必须是函数");
    }

    let timer = null;

    return function debounced(...args) {
      const context = this;

      // 清除之前的定时器
      if (timer) {
        clearTimeout(timer);
      }

      if (immediate) {
        // 立即执行模式
        // 如果 timer 不存在，说明是第一次触发或者已经执行过了，可以立即执行
        const callNow = !timer;

        timer = setTimeout(() => {
          timer = null; // 重置 timer，允许下次立即执行
        }, delay);

        if (callNow) {
          fn.apply(context, args);
        }
      } else {
        // 延迟执行模式
        timer = setTimeout(() => {
          fn.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }
  ```



- 节流

  ```js
  const throttle = (fn, millSec) => {
    const now = Date.now();
    return function (...args) {
      const context = this;
      if (Date.now() - now >= millSec) {
        now = Date.now();
        return fn.apply(context, args);
      }
    };
  };

  // 定时器版

  function throttle(fn, delay = 300, immediate = false) {
    if (typeof fn !== "function") {
      throw new TypeError("第一个参数必须是函数");
    }

    let timer = null;

    return function (...args) {
      const context = this;

      if (!timer) {
        // immediate 为 true 时立即执行
        if (immediate) {
          fn.apply(context, args);
        }

        timer = setTimeout(() => {
          // immediate 为 false 时延迟执行
          if (!immediate) {
            fn.apply(context, args);
          }
          timer = null;
        }, delay);
      }
    };
  }
  ```



- curry

  ```js
  function curry(func) {
    return function curried(...args) {
      if (args.length >= func.length) {
        return func.apply(this, args);
      } else {
        const that = this
        return function (...args2) {
          return curried.apply(that, args.concat(args2));
        };
      }
    };
  }
  ```


- promisify

  ```js
  // 将 callback 风格的函数转换为 Promise 风格
  function promisify(fn) {
    return function (...args) {
      return new Promise((resolve, reject) => {
        // 添加 callback 函数作为最后一个参数
        fn(...args, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    };
  }
  ```

- middlewares
  ```js
  function middlewares(...fns) {
    // throw 'Not implemented!';
    const n = fns.length
    return async function innerFn(context, i = 0) {
      if (i === n) {
        return Promise.resolve()
      };
      const fn = fns[i]
      return fn(context, () => innerFn(context, i + 1))
    }
  }
  ```

- [eventEmitter](../read-code/emitter/emitter.md)

  ***

### js-skills

- for in

  ```javascript
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // ...
    }
  }

  // 小优化：省去遍历原型链的开销
  const hasOwn = Object.prototype.hasOwnProperty;
  hasOwn.call(obj, key);

  // 更佳的做法：Object.keys 不会遍历 prototype 属性
  for (const key of Object.keys(obj)) {
    // ...
  }
  ```

  ***

- eval
  可以直接将字符串解析执行，类似的还有 `setTimeout`、`setInterval`、`new Function`。

  - `setTimeout`、`setInterval` 一般避免使用字符串形式去执行代码，转而用匿名函数
  - `new Function` 和 `eval` 的区别
    首先，使用 `eval` 是非常危险的行为，如果不得不，可以用 `new Function` 替代。这有一个潜在的好处，后者执行的代码，会在一个局部作用域内。

  ```javascript
  console.log(typeof testEval); // 'uncdefined'
  console.log(typeof testFun); // 'uncdefined'
  console.log(typeof testFun2); // 'uncdefined'

  var jsStr = "var testEval = 1; console.log(testEval);";
  eval(jsStr); // 1
  console.log(typeof testEval); // 'number'，全局变量被改变

  jsStr = "var testFun = 2; console.log(testFun);";
  new Function(jsStr)(); // 2
  console.log(typeof testFun); // 'uncdefined'

  jsStr = "var testFun2 = 3; console.log(testFun2);"(function () {
    eval(jsStr);
  })(); // 3
  console.log(typeof testFun2); // 'uncdefined'
  ```

  ***

- 字符串转数值
  常用的有三种：`parseInt()/parseFloat()`、`Number()`、`+`

  - `parseInt` 的第二个参数表示字符串的进制，默认是 10 进制，最好加上。注意转换得到的数值一定是 10 进制的。
  - 后两种方法要更快一些，因为前者需要做解析的工作。但如果希望将 `080hello` 这类字符串转换为数值，则需要使用 `parseInt`，后两种会返回 `NaN`。

  ***

- 构造函数的调用加验
  避免调用构造函数没有用 `new`：因为如果用了 `new`，则 `this` 会被绑定到生成的实例。

  ```javascript
  function Constructor(...rest) {
    if (!(this instanceof Constructor)) return new Constructor(...rest);
  }
  ```

  ***

- Array.prototype.sort

  ```javascript
  // sort by the following order of importance:
  //  1. x - coordinate
  //  2. y - coordinate precedence given to higher value
  //  3. node val in ascending order

  // pseudocode
  nodeInfos: [
    [a1, b1, c1],
    [a2, b2, c2],
  ];
  nodeInfos.sort((a, b) => a[0] - b[0] || b[1] - a[1] || a[2] - b[2]);
  ```
