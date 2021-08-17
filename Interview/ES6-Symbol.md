**创建Symbol实例**
`let s1 = Symbol()`
`let s2 = Symbol('another symbol')`

**判断类型**
`typeof s1 // 'symbol'`

**Symbol函数前不能使用new命令，否则会报错。这是因为生成的 Symbol 是一个原始类型的值，不是对象，也不能添加属性。**

**每个Symbol实例都是唯一的**
```
let s1 = Symbol();
let s2 = Symbol('test');
let s3 = Symbol('test');

s1 === s2; // false
s2 === s3; // false
```

**如果 Symbol 的参数是一个对象，就会调用该对象的toString方法，将其转为字符串，然后才生成一个 Symbol 值。**
```
const obj = {
  toString() {
    return 'abc';
  }
};
const sym = Symbol(obj);
sym // Symbol(abc)
```

**Symbol 值不能与其他类型的值进行运算，会报错。但是，Symbol 值可以显式转为字符串。另外，Symbol 值也可以转为布尔值，但是不能转为数值。**
```
let sym = Symbol('My symbol');

"your symbol is " + sym // TypeError: can't convert symbol to string

String(sym) // 'Symbol(My symbol)'
sym.toString() // 'Symbol(My symbol)'
sym.description // ES2019 "My symbol"

Boolean(sym) // true
!sym  // false

Number(sym) // TypeError
sym + 2 // TypeError
```

**注册和获取全局Symbol
`Symbol.for()`的这个全局登记特性，可以用在不同的 iframe 或 service worker 中取到同一个值。
`Symbol.keyFor()`方法返回一个已登记的 Symbol 类型值的key。**
```
let s1 = Symbol('global');
let s2 = Symbol.for('global');
let s3 = Symbol.for('global');

s1 === s2; // false
s2 === s3; // true

Symbol.keyFor(s1); // "undefined"
Symbol.keyFor(s2); // "global"
```

应用场景一：
```
const peopleName = Symbol('peopleName');
const peopleAge = Symbol('peopleAge');

const people = {
  [peopleName]: 'hy',
};
obj[peopleAge] = 18;

obj[peopleName]; // 'hy'
obj[peopleAge]; // 18
```
**需要注意：使用Symbol作为对象的属性key后，一般的枚举方法会将其排除。**
```
const obj = {
  [Symbol('name')]: 'hy',
  age: 18,
  job: 'FE',
};
Object.keys(obj); // ['age', 'job']
for (let p in obj)
  console.log(p); // 'age', 'job'
Object.getOwnPropertyNames(obj); // ['age', 'job']
```
**也正因为这样一个特性，当使用`JSON.stringify()`把对象转换成JSON字符串时，Symbol属性也会被排除在外`**
```
JSON.stringify(obj); // {"age":18,"job":"FE"}
```
可以利用这一特性来更好地设计我们的数据对象，让“对内操作”和“对外选择性输出”变得更加优雅。

还有一些专门处理Symbol属性的API：
```
Object.getOwnPropertySymbols(obj); // [Symbol(name)]
Reflect.ownKeys(obj); // ["age", "job", Symbol(name)]
```

应用场景二：
**利用`模块化机制`以及`Symbol`，实现类的私有属性和方法。**
```
// a.js
const pwd = Symbol('password');
class Login {
  constructor(user, pwd) {
    this.user = user;
    this[pwd] = pwd;
  }

  checkPwd(pwd) {
    return this[pwd] === pwd;
  }
}
export default Login;

// b.js
import Login from './a';

const login = new Login('admin', '12345');
login.checkPwd('12345'); // true

// 以下都不能获取login对象的私有属性pwd
login.pwd; 
login[pwd];
login['pwd']; 
```

**实例：模块的 Singleton 模式**
```
function A() {
  this.foo = 'hello';
}

if (!global._foo) {
  global._foo = new A();
}

module.exports = global._foo;
```
通过Symbol改良
```
const FOO_KEY = Symbol.for('foo');

function A() {
  this.foo = 'hello';
}

if (!global[FOO_KEY]) {
  global[FOO_KEY] = new A();
}

module.exports = global[FOO_KEY];
```

**内置的 Symbol 值
除了定义自己使用的 Symbol 值以外，ES6 还提供了 11 个内置的 Symbol 值，指向语言内部使用的方法。**

**Symbol.hasInstance**
对象的`Symbol.hasInstance`属性，指向一个内部方法。当其他对象使用`instanceof`运算符，判断是否为该对象的实例时，会调用这个方法。比如，`foo instanceof Foo`在语言内部，实际调用的是`Foo[Symbol.hasInstance](foo)`。
```
class MyClass {
  [Symbol.hasInstance](foo) {
    return foo instanceof Array;
  }
}
[1, 2, 3] instanceof new MyClass() // true


class Even {
  static [Symbol.hasInstance](obj) {
    return Number(obj) % 2 === 0;
  }
}
// 等同于
const Even = {
  [Symbol.hasInstance](obj) {
    return Number(obj) % 2 === 0;
  }
};
1 instanceof Even // false
2 instanceof Even // true
12345 instanceof Even // false
```

**Symbol.iterator**
对象进行`for...of`循环时，会调用`Symbol.iterator`方法，返回该对象的默认遍历器。
```
class Collection {
  *[Symbol.iterator]() {
    let i = 0;
    while(this[i] !== undefined) {
      yield this[i];
      ++i;
    }
  }
}

let myCollection = new Collection();
myCollection[0] = 1;
myCollection[1] = 2;

for(let value of myCollection) {
  console.log(value);
}
// 1
// 2
```

**Symbol.toPrimitive**
对象的`Symbol.toPrimitive`属性，指向一个方法。该对象被转为原始类型的值时，会调用这个方法，返回该对象对应的原始类型值。

`Symbol.toPrimitive`被调用时，会接受一个字符串参数，表示当前运算的模式，一共有三种模式。
- Number：该场合需要转成数值
- String：该场合需要转成字符串
- Default：该场合可以转成数值，也可以转成字符串
```
let obj = {
  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'number':
        return 123;
      case 'string':
        return 'str';
      case 'default':
        return 'default';
      default:
        throw new Error();
     }
   }
};

2 * obj // 246
3 + obj // '3default'
obj == 'default' // true
String(obj) // 'str'
```

**Symbol.toStringTag**
对象的`Symbol.toStringTag`属性，指向一个方法。在该对象上面调用`Object.prototype.toString`方法时，如果这个属性存在，它的返回值会出现在`toString`方法返回的字符串之中，表示对象的类型。也就是说，这个属性可以用来定制`[object Object]`或`[object Array]`中`object`后面的那个字符串。
```
// 例一
({[Symbol.toStringTag]: 'Foo'}.toString())
// "[object Foo]"

// 例二
class Collection {
  get [Symbol.toStringTag]() {
    return 'xxx';
  }
}
let x = new Collection();
Object.prototype.toString.call(x) // "[object xxx]"
```
ES6 新增内置对象的`Symbol.toStringTag`属性值如下。

`JSON[Symbol.toStringTag]：`'JSON'
`Math[Symbol.toStringTag]：`'Math'
`Module 对象M[Symbol.toStringTag]：`'Module'
`ArrayBuffer.prototype[Symbol.toStringTag]：`'ArrayBuffer'
`DataView.prototype[Symbol.toStringTag]：`'DataView'
`Map.prototype[Symbol.toStringTag]：`'Map'
`Promise.prototype[Symbol.toStringTag]：`'Promise'
`Set.prototype[Symbol.toStringTag]：`'Set'
`%TypedArray%.prototype[Symbol.toStringTag]：`'Uint8Array'等
`WeakMap.prototype[Symbol.toStringTag]：`'WeakMap'
`WeakSet.prototype[Symbol.toStringTag]：`'WeakSet'
`%MapIteratorPrototype%[Symbol.toStringTag]：`'Map Iterator'
`%SetIteratorPrototype%[Symbol.toStringTag]：`'Set Iterator'
`%StringIteratorPrototype%[Symbol.toStringTag]：`'String Iterator'
`Symbol.prototype[Symbol.toStringTag]：`'Symbol'
`Generator.prototype[Symbol.toStringTag]：`'Generator'
`GeneratorFunction.prototype[Symbol.toStringTag]：`'GeneratorFunction'

参考：
[http://es6.ruanyifeng.com/#docs/symbol](http://es6.ruanyifeng.com/#docs/symbol)
[https://www.jianshu.com/p/f40a77bbd74e](https://www.jianshu.com/p/f40a77bbd74e)

