# JS Coding Skills #

## 1. for 循环 ##

``` javascript
for (let i = 0; i < len; i++)

// 小优化
for (let i = len; i--;)
```

---

## 2. for in ##

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

## 3. eval ##

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

## 4. 字符串转数值 ##

常用的有三种：`parseInt()/parseFloat()`、`+`、`Number()`

* `parseInt` 的第二个参数表示字符串的进制，默认是10进制，最好加上。注意转换得到的数值一定是10进制的。
* 后两种方法要更快一些，因为前者需要做解析的工作。但如果希望将 `080hello` 这类字符串转换为数值，则需要使用 `parseInt`，后两种会返回 `NaN`。

---

## 5. 构造函数的调用加验 ##

避免调用构造函数没有用 `new`：因为如果用了 `new`，则 `this` 会被绑定到生成的实例。

``` javascript
function Constructor(...rest) {
    if (!(this instanceof Constructor))
        return new Constructor(...rest)
}
```

---

## 6. 函数重写 ##

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

## 7. 函数缓存 ##

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

## 8. 快速生成排列数组 ##

``` javascript
[...Array(10).keys()] // [0,1,2,3,4,5,6,7,8,9]
```
