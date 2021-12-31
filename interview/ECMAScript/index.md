### ES6(2015)
1. [class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
   * class 是建立在 `prototype` 上的
   * class 和 function 类似，可以写成直接声明，或者是表达式
   * function 可以先调用后声明，class 必须先声明才能调用，否则报 `ReferenceError`
   * `constructor` 构造函数里可以调用 `super`，使用 `this` 前必须先调用 `super`
   * class 构造函数上的属性，等同于 `static`；直接定义在 body 里的属性，则会挂到 prototype 上
   * class 通过 `extneds` 进行继承，但不能对普通对象进行继承，可以通过 `Object.setPrototypeOf()` 方法对普通对象进行继承。
   * Minxins
     ``` js
     let calculatorMixin = Base => class extends Base {
       calc() { }
     };

     let randomizerMixin = Base => class extends Base {
       randomize() { }
     };
     ```
2. 模块化(Module)
3. [箭头函数(Arrow function)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
   * 不能用 new
   * 不能作为构造函数
   * 没有 this 和 super
   * 不能用 call、apply、bind
   * 没有 prototype
   * 没有 `arguments` 可以使用 `rest`，获取函数参数
   * 函数参数可以设置默认值
4. 函数参数默认值
5. 模版字符串
6. 解构赋值
7. 扩展语法(Spread syntax) / 扩展参数(Rest parameters)
8. 对象属性简写
9.  [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
    * 三种 status：`pending`、`fulfilled`、`rejected`
    * `new Promise(executor)`
      * executor: (resolve, reject) => unknow
      executor 函数内返回值被 ignore，throw 异常会被 reject 处理
    * `Promise.all`
      * 并行执行所有异步任务，全部完成后返回数组
      * 有一个异常，则立即停止并抛出异常
    * `Promise.allSettled`
      * 并行执行所有异步任务，不会因有异常而停止
    * `Promise.any`
      * 不管是否有 rejected，都会返回第一个 fulfilled 的值
    * `Promise.race`
      * 返会第一个 resolved 的值，可以是 rejected 或 fulfilled
    * `Promise.then(onFulfilled, onRejected)`
10. `let & const`
---

### ES7(2016)
1. `Array.prototype.includes`
2. 指数运算符 `**`
---

### ES8(2017)
1. `async/await`
2. `Object.values`、`Object.entries`
3. `String.prototype.padStart/padEnd`
4. 函数参数允许逗号结尾
   主要作用是方便使用 `git` 进行多人协作开发时修改同一个函数减少不必要的行变更。
5. `Object.getOwnPropertyDescriptors`
6. `ShareArrayBuffer` 和 `Atomics` 对象，用于从共享内存位置读取和写入
---

### ES9(2018)
1. 异步迭代
   await 与 for...of 共用，以串行的方式运行异步操作。
   ``` js
    async function process(array) {
      for await (let i of array) {
        doSomething(i);
      }
    }
   ```
2. `Promise.finally`
3. 正则捕获组
   ``` js
    const reDate = /(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})/,
    match  = reDate.exec('2018-04-30'),
    year   = match.groups.year,  // 2018
    month  = match.groups.month, // 04
    day    = match.groups.day;   // 30

    const reDate = /(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})/,
    d      = '2018-04-30',
    usDate = d.replace(reDate, '$<month>-$<day>-$<year>');
   ```
4. 正则断言
---

### ES10(2019)
1. 更加友好的 `JSON.stringify`
   如果输入 Unicode 格式但是超出范围的字符，在原先JSON.stringify返回格式错误的Unicode字符串。现在实现了一个改变JSON.stringify的第3阶段提案，因此它为其输出转义序列，使其成为有效Unicode（并以UTF-8表示）
2. `Array.prototype.flat`
3. `String.prototype.trimStart/trimEnd`
4. `Object.fromEntries`
5. `Symbol.prototype.description`
6. `String.prototype.matchAll`
7. `Function.prototype.toString`
   返回精确字符，包括空格和注释
8. 修改 `catch` 绑定
   ``` js
   // 以前
   try {} catch(e) {}

   // 现在
   try {} catch {}
   ```
9. `BigInt`
---

### ES2020
1. `Optional Chaining`
   ``` js
   // 以前
   let nestedProp = obj && obj.first && obj.first.second;

   // 现在
   let nestedProp = obj?.first?.second;
   ```
2. `Nullish coalescing Operator`
   ``` js
    // 等价于let c = a !== undefined && a !== null ? a : b;
    let c = a ?? b;
   ```
3. `Promise.allSettled`
4. `Dynamic import`
   `import()` 可以用于 `script` 脚本中，`import(module)` 函数可以在任何地方调用。它返回一个解析为模块对象的 `promise`，也支持 await 关键字。
   ``` js
    el.onclick = () => {
      import('/modules/my-module.js')
        .then(module => {
          // Do something with the module.
        })
        .catch(err => {
          // load error;
        })
    }
   ```
5. `globalThis`