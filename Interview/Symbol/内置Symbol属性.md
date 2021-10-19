## Symbol.iterator
`Symbol.iterator` 为每一个对象定义了默认的迭代器。该迭代器可以被 `for...of` 循环使用。

当对一个对象进行迭代时（例如 `for...of`），`Symbol.iterator` 方法会隐式调用：
1. `Array.prototype[Symbol.iterator] === Array.prototype.values // true`
2. `Set.prototype[Symbol.iterator] === Set.prototype.values // true`
3. `Map.prototype[Symbol.iterator] === Map.prototype.entries // true`
4. `String.prototype[Symbol.iterator]`

``` javascript
const arr = ['a', 'b', 'c']
const iterator = arr[Symbol.iterator]() // or arr.values()
for (const item of iterator) {
    console.log(item) // 依次打印 'a' 'b' 'c'
}

// 另一种迭代方式
while(value = iterator.next().value) {
    console.log(value) // 依次打印 'a' 'b' 'c'
}

[...iterator] // ['a', 'b', 'c']
```

``` javascript
// 自定义迭代器
const myIterable = {}
myIterable[Symbol.iterator] = function* () {
    yield 1
    yield 2
    yield 3
}
for (const item of myIterable) {
    console.log(item) // 依次打印 1 2 3
}

[...myIterable] // [1, 2, 3]
```

## Symbol.toStringTag
对象调用 `Object.prototype.toString` 方法会读取这个内置属性。

``` javascript
const objectToString = Object.prototype.toString
const toTypeString = (val: unknown): string => objectToString.call(val)
toTypeString('test') // '[object String]'
toTypeString(1) // '[object Number]'
toTypeString(true) // '[object Boolean]'
toTypeString(null) // '[object Null]'
toTypeString(undefined) // '[object Undefined]'
toTypeString([1, 2]) // '[object Array]'

/** 某些对象已经内置toStringTag **/

const map = new Map()
toTypeString(map) // '[object Map]'
map[Symbol.toStringTag] // 'Map'
Map.prototype[Symbol.toStringTag] // 'Map'

const prom = Promise.resolve()
toTypeString(prom) // '[object Promise]'
prom[Symbol.toStringTag] // 'Promise'
Promise.prototype[Symbol.toStringTag] // 'Promise'

const fn = function* () {}
toTypeString(fn) // '[object GeneratorFunction]'
fn[Symbol.toStringTag] // 'GeneratorFunction'

JSON[Symbol.toStringTag] // 'JSON'
Math[Symbol.toStringTag] // 'Math'
Symbol.prototype[Symbol.toStringTag] // 'Symbol'
```

自定义 `Symbol.toStringTag` 属性
``` javascript
const TestObj = {
    [Symbol.toStringTag]: 'Test'
}
TestObj.toString() // '[object Test]'

class ValidatorClass {
    get [Symbol.toStringTag]() {
        return "Validator";
    }
}
toTypeString(new ValidatorClass()) // '[object Validator]'
```

## Symbol.hasInstance
`Symbol.hasInstance` 用于判断某对象是否为某构造器的实例。因此你可以用它自定义 `instanceof` 操作符在某个类上的行为。

``` javascript
const obj = {}

const TestObj = {
    [Symbol.hasInstance]() { return true }
}
obj instanceof TestObj // true

class MyClass {
    static [Symbol.hasInstance]() { return true }
}
obj instanceof MyClass // true

class Even {
  static [Symbol.hasInstance](obj) {
    return Number(obj) % 2 === 0;
  }
}
1 instanceof Even // false
2 instanceof Even // true
```

## Symbol.toPrimitive
`Symbol.toPrimitive` 是一个内置的 Symbol 值，它是作为对象的函数值属性存在的，当一个对象转换为对应的原始值时，会调用此函数。

`Symbol.toPrimitive` 被调用时，会传递一个参数 `hint`，表示要转换的类型。有 `number`，`string`，`default`
``` javascript
const toNumberPrimitive = Symbol('toNumberPrimitive')
const toStringPrimitive = Symbol('toNumberPrimitive')
const toDefaultPrimitive = Symbol('toNumberPrimitive')
class MyObj {
    toNumberPrimitive() {
        return 10
    },
    toStringPrimitive() {
        return 'StringPrimitive'
    },
    toDefaultPrimitive() {
        return 'Default'
    },
    [Symbol.toPrimitive](hint) {
        return this[`to${hint[0].toUpperCase() + hint.slice(1)}Primitive`]()
    }
}
const obj = new MyObj()
+obj // 10
String(ttt) // 'StringPrimitive'
ttt == 'Default' // true
```