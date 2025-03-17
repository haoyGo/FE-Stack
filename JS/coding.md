### 手写代码
* call、apply、bind
  ``` javascript
  function iCall(context = window, ...rest) {
    if (typeof this !== 'function')
      throw new TypeError('argument is not a function')

    const fn = Symbol('fn')
    context[fn] = this
    const res = context[fn](...rest)
    delete context[fn]

    return res
  }

  function iApply(context = window, rest) {
    if (typeof this !== 'function')
      throw new TypeError('argument is not a function')

    const fn = Symbol('fn')
    context[fn] = this
    const res = Array.isArray(rest) ? context[fn](...rest) : context[fn]()
    delete context[fn]

    return res
  }

  function iBind(context = window, ...rest1) {
    if (typeof this !== 'function')
        throw new TypeError('argument is not a function')

    const fn = this
    return function(...rest2) {
        return fn.apply(this instanceof fn ? this : context, rest1.concat(rest2))
    }
  }
  ```
  ---

* new
  ``` javascript
  function iNew() {
    const arg = [...arguments]
    const Fn = constructor

    if (typeof constructor !== "function") {
      throw new TypeError('constructor is not a function')
    }

    const that = Object.create(Fn.prototype)
    const res = Fn.apply(that, arg)

    // res 如果是null，返回that
    return ['object', 'function'].includes(typeof res) && res || that
  }
  ```
  ---

* instanceof
  ``` javascript
  function inst(obj, constr) {
      const getProto = Object.getPrototypeOf
      const prototype = constr.prototype
      let proto = getProto(obj)

      while (true) {
          if (!proto)
              return false
          if (proto === prototype)
              return true

          proto = getProto(proto)
      }
  }
  ```
  ---

* Object.create
  ``` javascript
  function create(obj) {
    function F() {}
    F.prototype = obj
    return new F()
  }
  ```
  ---

* 继承
  ``` js
  // 寄生组合式继承
  function Student(name, age, grade) {
    Person.call(this, name, age);
    this.grade = grade;
  }
  Student.prototype = Object.create(Person.prototype);
  Student.prototype.constructor = Student;
  ```
  ---

* deepclone
  利用其他 API
  ``` js
  // 1 JSON
  JSON.parse(JSON.stringify(obj))

  /*** Structured Clone 结构化克隆算法 ***/
  // 2. MessageChannel
  // 优点是能解决循环引用的问题，还支持大量的内置数据类型。
  // 缺点就是这个方法是异步的。
  function structuralClone(obj) {
    return new Promise(resolve => {
      const {port1, port2} = new MessageChannel();
      port2.onmessage = ev => resolve(ev.data);
      port1.postMessage(obj);
    })
  }
  const obj = /* ... */;
  structuralClone(obj).then(res=>{
    console.log(res);
  })

  // 3. Notification API
  // 优点是能解决循环对象问题，也支持许多内置类型的克隆，并且是同步的。
  // 缺点是这个api的使用需要向用户请求权限，但是用在这里克隆数据的时候，不经用户授权也可以使用。在http协议的情况下会提示你再https的场景下使用
  function structuralClone(obj) {
    return new Notification('', {data: obj, silent: true}).data;
  }

  var obj = {};
  var b = {obj};
  obj.b = b
  var copy = structuralClone(obj);
  console.log(copy)

  // 4. structuredClone，新API

  ```

  深拷贝原理（lodash）
  * 通过 `typeof` 区分是否是 `object`，不是直接返回
    ``` js
    function isObject(value) {
      const type = typeof value
      return value != null && (type === 'object' || type === 'function')
    }

    if (!isObject(value)) {
      return value
    }
    ```
  * 通过 `Array.isArray` 判断是否是数组，数组初始化
    ``` js
    function initCloneArray(array) {
      const { length } = array
      const result = new array.constructor(length)

      // Add properties assigned by `RegExp#exec`.
      if (length && typeof array[0] === 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index
        result.input = array.input
      }
      return result
    }
    ```
  * 通过 `Buffer.isBuffer` 判断是否是 `Buffer`
    ``` js
    const nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined
    const isBuffer = nativeIsBuffer || (() => false)

    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice()
      }
      const length = buffer.length
      const result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length)

      buffer.copy(result)
      return result
    }
    ```
  * 对象初始化
    ``` js
    function initCloneObject(object) {
      return (typeof object.constructor === 'function' && !isPrototype(object))
        ? Object.create(Object.getPrototypeOf(object))
        : {}
    }
    ```
  * 其余情况
    ``` js
    function cloneRegExp(regexp) {
      const reFlags = /\w*$/
      const result = new regexp.constructor(regexp.source, reFlags.exec(regexp))
      result.lastIndex = regexp.lastIndex
      return result
    }

    function cloneSymbol(symbol) {
      const symbolValueOf = Symbol.prototype.valueOf
      return Object(symbolValueOf.call(symbol))
    }

    function initCloneByTag(object, tag, isDeep) {
      const Ctor = object.constructor
      switch (tag) {
        case arrayBufferTag:
          return cloneArrayBuffer(object)

        case boolTag:
        case dateTag:
          return new Ctor(+object)

        case dataViewTag:
          return cloneDataView(object, isDeep)

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
          return cloneTypedArray(object, isDeep)

        case mapTag:
          return new Ctor

        case numberTag:
        case stringTag:
          return new Ctor(object)

        case regexpTag:
          return cloneRegExp(object)

        case setTag:
          return new Ctor

        case symbolTag:
          return cloneSymbol(object)
      }
    }
    ```
  * `Map` 拷贝
    ``` js
    if (tag == mapTag) {
      value.forEach((subValue, key) => {
        result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack))
      })
      return result
    }
    ```
  * `Set` 拷贝
    ``` js
    if (tag == setTag) {
      value.forEach((subValue) => {
        result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack))
      })
      return result
    }
    ```
  * 对象通过遍历所有 `keys` 进行拷贝，需要考虑继承链上的属性，以及 `Symbol`
    ``` js
    // Object.keys 相当于 Object.getOwnPropertyNames 过滤掉不可枚举的属性
    Object.keys // 拿对象自身，可枚举属性，无Symbol

    for in // 拿对象自身，和继承链属性，可枚举属性，无 Symbol

    Object.getOwnPropertySymbols // 拿对象自身，所有 Symbol 属性，包括不可枚举
    function getSymbols(object) {
      const propertyIsEnumerable = Object.prototype.propertyIsEnumerable
      const nativeGetSymbols = Object.getOwnPropertySymbols
      if (object == null) {
        return []
      }
      object = Object(object)
      return nativeGetSymbols(object).filter((symbol) => propertyIsEnumerable.call(object, symbol))
    }
    ```
  * 最后考虑循环引用，通过一个 `Map` 存储遍历过的对象，如果已经存在，直接返回。注意，这个 Map 需跟随整个深拷贝直到结束，每次深拷贝则新建一个新的 Map
  
  ---

* 防抖
``` js
const debounce = (fn, millSec) => {
  let timer = null
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, millSec)

  }
}
```
  ---

* 节流
``` js
const throttle = (fn, millSec) => {
  const now = Date.now();
  return function (...args) {
    if (Date.now() - now >= millSec) {
      now = Date.now()
      fn.apply(this, args)
    }
  }
}
```
  ---

* curry
  ``` js
  function curry(func) {
    return function curried(...args) {
      if (args.length >= func.length) {
        return func.apply(this, args);
      } else {
        return function(...args2) {
          return curried.apply(this, args.concat(args2));
        }
      }
    };
  }
  ```
  ---

* [eventEmitter](./read-code/emitter/emitter.md)
  
  ---

### js-skills
* for
  ``` javascript
  for (let i = 0; i < len; i++)

  // 小优化
  for (let i = len; i--;)
  ```
  ---

* for in
  ``` javascript
  for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
          // ...
      }
  }

  // 小优化：省去遍历原型链的开销
  const hasOwn = Object.prototype.hasOwnProperty
  hasOwn.call(obj, key)

  // 更佳的做法：Object.keys 不会遍历 prototype 属性
  for (const key of Object.keys(obj)) {
      // ...
  }
  ```
  ---

* eval
可以直接将字符串解析执行，类似的还有 `setTimeout`、`setInterval`、`new Function`。
  * `setTimeout`、`setInterval` 一般避免使用字符串形式去执行代码，转而用匿名函数
  * `new Function` 和 `eval` 的区别
  首先，使用 `eval` 是非常危险的行为，如果不得不，可以用 `new Function` 替代。这有一个潜在的好处，后者执行的代码，会在一个局部作用域内。
  ``` javascript
  console.log(typeof testEval) // 'uncdefined'
  console.log(typeof testFun) // 'uncdefined'
  console.log(typeof testFun2) // 'uncdefined'

  var jsStr = 'var testEval = 1; console.log(testEval);'
  eval(jsStr) // 1
  console.log(typeof testEval) // 'number'，全局变量被改变

  jsStr = 'var testFun = 2; console.log(testFun);'
  new Function(jsStr)() // 2
  console.log(typeof testFun) // 'uncdefined'
  
  jsStr = 'var testFun2 = 3; console.log(testFun2);'
  (function() {
      eval(jsStr)
  })() // 3
  console.log(typeof testFun2) // 'uncdefined'
  ```
  ---

* 字符串转数值
  常用的有三种：`parseInt()/parseFloat()`、`Number()`、`+`
  * `parseInt` 的第二个参数表示字符串的进制，默认是10进制，最好加上。注意转换得到的数值一定是10进制的。
  * 后两种方法要更快一些，因为前者需要做解析的工作。但如果希望将 `080hello` 这类字符串转换为数值，则需要使用 `parseInt`，后两种会返回 `NaN`。
  ---

* 构造函数的调用加验
  避免调用构造函数没有用 `new`：因为如果用了 `new`，则 `this` 会被绑定到生成的实例。
  ``` javascript
  function Constructor(...rest) {
    if (!(this instanceof Constructor))
      return new Constructor(...rest)
  }
  ```
  ---

* 函数重写（可用于单例模式）
  当函数有一些初始化操作，并且希望只执行一次，则可以使用这种模式。
  ``` javascript
  function fn() {
      console.log('Initial')

      fn = function() {
          console.log('Override')
      }
  }

  fn() // 'Initial'
  fn() // 'Override'
  ```
  ---

* 函数缓存
  函数也是对象，可以添加属性。
  ``` javascript
  function fn(params) {
      if (!fn.cache[params]) {
          const res
          // ... res 计算
          fn.cache[params] = res
      }

      return fn.cache[params]
  }

  fn.cache = {}
  ```
  ---

* 快速生成排列数组
  ``` javascript
  [...Array(10).keys()] // [0,1,2,3,4,5,6,7,8,9]
  ```
  ---

* Array.prototype.sort
  ``` javascript
  // sort by the following order of importance:
  //  1. x - coordinate
  //  2. y - coordinate precedence given to higher value
  //  3. node val in ascending order

  // pseudocode
  nodeInfos: [[a1,b1,c1], [a2,b2,c2]]
  nodeInfos.sort((a, b) => a[0] - b[0] || b[1] - a[1] || a[2] - b[2]);
  ```