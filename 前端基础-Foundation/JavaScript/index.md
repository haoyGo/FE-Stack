## JS
JavaScript共有八种数据类型，分别是 `Undefined、Null、Boolean、Number、String、Object、Symbol、BigInt`。

相应类型判断：`typeof、instanceof、constructor、Object.prototype.toString.call()`

### 类型判断方法
```javascript
// typeof 操作符（适合基本类型）
typeof 42 // "number"
typeof 'str' // "string" 
typeof true // boolean
typeof undefined // undefined
typeof {} // object
typeof [] // object
// javascript中不同对象在底层都表示为二进制，而javascript 中把二进制前三位都为0的判断为object类型，而null的二进制表示全都是0，自然前三位也是0，所以执行typeof时会返回'object'
typeof null // object
typeof function(){} // function

// instanceof（适合引用类型）
2 instanceof Number // false
true instanceof Boolean // false
'str' instanceof String // false

{} instanceof Object // true
[] instanceof Array // true
function(){} instanceof Function // true

// constructor 属性（适合引用类型）
function Fn(){};
Fn.prototype = new Array();
var f = new Fn();

// f.constructor => f.__proto__ => Fn.prototype => Array
f.constructor===Fn // false
f.constructor===Array // true

// Object.prototype.toString（最准确）
Object.prototype.toString.call([]) // "[object Array]"
Object.prototype.toString.call(null) // "[object Null]"
```

#### instanceof
``` javascript
function myInstanceof(obj, constr) {
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

### Number
``` javascript
// 最大安全整数（2^53 - 1）
Number.MAX_SAFE_INTEGER === 9007199254740991

// 最小安全整数（-2^53 + 1）
Number.MIN_SAFE_INTEGER === -9007199254740991

// 安全整数检查
Number.isSafeInteger(9007199254740992) // false
```

### NaN
``` javascript
typeof NaN; // "number"

NaN == NaN // false
NaN === NaN // false

isNaN("aaa")  //true
Number.isNaN("aaa")  //false

Number(undefined) // NaN
```

### Object
判断一个对象为空对象
``` javascript
JSON.stringify(Obj) == '{}'
// 局限
JSON.stringify({a: () => {}}) === '{}'

Object.keys(obj).length === 0
Object.getOwnPropertyNames().length === 0;
// 局限
a[Symbol('111')] = '111' // Symbol 属性不会被枚举

// 该方法可以枚举 Symbol 属性
Reflect.ownKeys(obj).length === 0;
```

#### typeof null 的结果是 `object`。
在 JavaScript 第一个版本中，所有值都存储在 32 位的单元中，每个单元包含一个小的 类型标签(1-3 bits) 以及当前要存储值的真实数据。类型标签存储在每个单元的低位中，共有五种数据类型：
``` js
000: object   - 当前存储的数据指向一个对象。
1: int        - 当前存储的数据是一个 31 位的有符号整数。
010: double   - 当前存储的数据指向一个双精度的浮点数。
100: string   - 当前存储的数据指向一个字符串。
110: boolean  - 当前存储的数据是布尔值。
```

### [JS标准内置对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects)
#### 值属性
这些全局属性返回一个简单值，这些值没有自己的属性和方法。
- globalThis
- Infinity
- NaN
- undefined
#### 函数属性
全局函数可以直接调用，不需要在调用时指定所属对象，执行结束后会将结果直接返回给调用者。
- eval()
- isFinite()
- isNaN()
- parseFloat()
- parseInt()
- decodeURI()
- decodeURIComponent()
- encodeURI()
- encodeURIComponent()
#### 基本对象
基本对象是定义或使用其他对象的基础。
- Object
- Function
- Boolean
- Symbol
#### 错误对象
错误对象是一种特殊的基本对象。它们拥有基本的 Error 类型，同时也有多种具体的错误类型。
- Error
- AggregateError
- EvalError
- RangeError
- ReferenceError
- SyntaxError
- TypeError
- URIError
#### 数字和日期对象
用来表示数字、日期和执行数学计算的对象。
- Number
- BigInt
- Math
- Date
#### 字符串
这些对象表示字符串并支持操作字符串。
- String
- RegExp
#### 可索引的集合对象
这些对象表示按照索引值来排序的数据集合，包括数组和类型数组，以及类数组结构的对象。
- Array
- Int8Array
- Uint8Array
- Uint8ClampedArray
- Int16Array
- Uint16Array
- Int32Array
- Uint32Array
- BigInt64Array
- BigUint64Array
- Float32Array
- Float64Array
#### 使用键的集合对象
这些集合对象在存储数据时会使用到键，包括可迭代的 Map 和 Set，支持按照插入顺序来迭代元素。
- Map
- Set
- WeakMap
- WeakSet
#### 结构化数据
这些对象用来表示和操作结构化的缓冲区数据，或使用 JSON（JavaScript Object Notation）编码的数据。
- ArrayBuffer
- SharedArrayBuffer
- Atomics
- DataView
- JSON
#### 反射
- Reflect
- Proxy
#### 控制抽象对象
控件抽象对象可以帮助构造代码，尤其是异步代码（例如不使用深度嵌套的回调）。
- Iterator
- AsyncIterator
- Promise
- GeneratorFunction
- AsyncGeneratorFunction
- Generator
- AsyncGenerator
- AsyncFunction
#### 国际化
ECMAScript 核心的附加功能，用于支持多语言处理。
- Intl


### 类型转换
``` javascript
// 1. +操作符的两边有至少一个string类型变量时，两边的变量都会被隐式转换为字符串；其他情况下两边的变量都会被转换为数字。
1 + '23' // '123'
1 + false // 1 
1 + Symbol() // Uncaught TypeError: Cannot convert a Symbol value to a number
'1' + false // '1false'
false + true // 1

var a = {name:'Jack'}
var b = {age: 18}
a + b // "[object Object][object Object]"

// 2. -、*、\操作符NaN是一个数字
1 * '23' // 23
1 * false // 0
1 / 'aa' // NaN

// 3. ==操作符两边的值都尽量转成number
3 == true // false
'0' == false //true
'0' == 0 // true

// 4. 对于<和>比较符，如果两边都是字符串，则比较字母表顺序，其他情况下，转换为数字再比较：
'ca' < 'bd' // false
'a' < 'b' // true
'12' < 13 // true
false > -1 // true

{} > 2 // false
// 解析
({}).valueOf() // {}, 上面提到过，ToPrimitive默认type为number，所以先valueOf，结果还是个对象，下一步
({}).toString() // "[object Object]"，现在是一个字符串了
Number(({}).toString()) // NaN，根据上面 < 和 > 操作符的规则，要转换成数字
NaN > 2 //false，得出比较结果
```

#### ToPrimitive
type的值为number或者string。
（1）当type为number时规则如下：
- 调用obj的valueOf方法，如果为原始值，则返回，否则下一步；
- 调用obj的toString方法，后续同上；
- 抛出TypeError 异常。
（2）当type为string时规则如下：
- 调用obj的toString方法，如果为原始值，则返回，否则下一步；
- 调用obj的valueOf方法，后续同上；
- 抛出TypeError 异常。

可以看出两者的主要区别在于调用toString和valueOf的先后顺序。默认情况下：
- 如果对象为 Date 对象，则type默认为string；
- 其他情况下，type默认为number。
总结上面的规则，对于 Date 以外的对象，转换为基本类型的大概规则可以概括为一个函数：
``` js
var objToNumber = value => Number(value.valueOf().toString())
objToNumber([]) === 0
objToNumber({}) === NaN
```

### JavaScript 中的包装类型？
在 JavaScript 中，基本类型是没有属性和方法的，但是为了便于操作基本类型的值，在调用基本类型的属性或方法时 JavaScript 会在后台隐式地将基本类型的值转换为对象，如：
``` js
var a = "abc";
a.length; // 3
a.toUpperCase(); // "ABC"
```
在访问'abc'.length时，JavaScript 将'abc'在后台转换成String('abc')，然后再访问其length属性。

JavaScript也可以使用Object函数显式地将基本类型转换为包装类型：
``` js
var a = 'abc'
Object(a) // String {"abc"}
```

也可以使用valueOf方法将包装类型倒转成基本类型：
``` js
var a = 'abc'
var b = Object(a)
var c = b.valueOf() // 'abc'
```

### 类数组对象
一个拥有 length 属性和若干索引属性的对象就可以被称为类数组对象，类数组对象和数组类似，但是不能调用数组的方法。常见的类数组对象有 arguments 和 DOM 方法的返回结果，还有一个函数也可以被看作是类数组对象，因为它含有 length 属性值，代表可接收的参数个数。
#### 类数组转换为数组
``` js
Array.prototype.slice.call(arrayLike);
Array.prototype.splice.call(arrayLike, 0);
Array.prototype.concat.apply([], arrayLike);

Array.from(arrayLike);
```

### JS解析执行
JS在拿到一个变量或者一个函数的时候，会有两步操作，即解析和执行。
* 在解析阶段，JS会检查语法，并对函数进行预编译。解析的时候会先创建一个全局执行上下文环境，先把代码中即将执行的变量、函数声明都拿出来，变量先赋值为undefined，函数先声明好可使用。在一个函数执行之前，也会创建一个函数执行上下文环境，跟全局执行上下文类似，不过函数执行上下文会多出this、arguments和函数的参数。
  - 全局上下文：变量定义，函数声明
  - 函数上下文：变量定义，函数声明，this，arguments
* 在执行阶段，就是按照代码的顺序依次执行。

那为什么会进行变量提升呢？主要有以下两个原因：
- 提高性能
  在JS代码执行之前，会进行语法检查和预编译，并且这一操作只进行一次。这么做就是为了提高性能，如果没有这一步，那么每次执行代码前都必须重新解析一遍该变量（函数），而这是没有必要的，因为变量（函数）的代码并不会改变，解析一遍就够了。
- 容错性更好



### 原码、补码、反码
计算机中的有符号数有三种表示方法，即原码、反码和补码。三种表示方法均有符号位和数值位两部分，符号位都是用0表示“正”，用1表示“负”，而数值位，三种表示方法各不相同。
* 正数的原码、反码、补码都一样
* 负数的反码为除符号位，按位取反。如 -10，原码：1000 1010 反码：1111 0101
* 负数的补码为反码加1。

### Unicode、UTF-8、UTF-16、UTF-32的区别？
（1）Unicode
在说Unicode之前需要先了解一下ASCII码：ASCII 码（American Standard Code for Information Interchange）称为美国标准信息交换码。
● 它是基于拉丁字母的一套电脑编码系统。
● 它定义了一个用于代表常见字符的字典。
● 它包含了"A-Z"(包含大小写)，数据"0-9" 以及一些常见的符号。
● 它是专门为英语而设计的，有128个编码，对其他语言无能为力
ASCII码可以表示的编码有限，要想表示其他语言的编码，还是要使用Unicode来表示，可以说Unicode是ASCII 的超集。

Unicode全称 Unicode Translation Format，又叫做统一码、万国码、单一码。Unicode 是为了解决传统的字符编码方案的局限而产生的，它为每种语言中的每个字符设定了统一并且唯一的二进制编码，以满足跨语言、跨平台进行文本转换、处理的要求。

Unicode的实现方式（也就是编码方式）有很多种，常见的是UTF-8、UTF-16、UTF-32和USC-2。
（2）UTF-8
UTF-8是使用最广泛的Unicode编码方式，它是一种可变长的编码方式，可以是1—4个字节不等，它可以完全兼容ASCII码的128个字符。

注意： UTF-8 是一种编码方式，Unicode是一个字符集合。

UTF-8的编码规则：
● 对于单字节的符号，字节的第一位为0，后面的7位为这个字符的Unicode编码，因此对于英文字母，它的Unicode编码和ACSII编码一样。
● 对于n字节的符号，第一个字节的前n位都是1，第n+1位设为0，后面字节的前两位一律设为10，剩下的没有提及的二进制位，全部为这个符号的Unicode码 。

来看一下具体的Unicode编号范围与对应的UTF-8二进制格式 ：
编码范围（编号对应的十进制数）	二进制格式
0x00—0x7F （0-127）	0xxxxxxx
0x80—0x7FF （128-2047）	110xxxxx 10xxxxxx
0x800—0xFFFF  （2048-65535）	1110xxxx 10xxxxxx 10xxxxxx
0x10000—0x10FFFF  （65536以上）	11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
那该如何通过具体的Unicode编码，进行具体的UTF-8编码呢？步骤如下：
● 找到该Unicode编码的所在的编号范围，进而找到与之对应的二进制格式
● 将Unicode编码转换为二进制数（去掉最高位的0）
● 将二进制数从右往左一次填入二进制格式的X中，如果有X未填，就设为0

来看一个实际的例子：
“马” 字的Unicode编码是：0x9A6C，整数编号是39532
（1）首选确定了该字符在第三个范围内，它的格式是 1110xxxx 10xxxxxx 10xxxxxx
（2）39532对应的二进制数为1001 1010 0110 1100
（3）将二进制数填入X中，结果是：11101001 10101001 10101100
（3）UTF-16
1. 平面的概念
在了解UTF-16之前，先看一下平面的概念：
Unicode编码中有很多很多的字符，它并不是一次性定义的，而是分区进行定义的，每个区存放65536（216）个字符，这称为一个平面，目前总共有17 个平面。

最前面的一个平面称为基本平面，它的码点从0 — 216-1，写成16进制就是U+0000 — U+FFFF，那剩下的16个平面就是辅助平面，码点范围是 U+10000—U+10FFFF。
2. UTF-16 概念：
UTF-16也是Unicode编码集的一种编码形式，把Unicode字符集的抽象码位映射为16位长的整数（即码元）的序列，用于数据存储或传递。Unicode字符的码位需要1个或者2个16位长的码元来表示，因此UTF-16也是用变长字节表示的。
3. UTF-16 编码规则：
● 编号在 U+0000—U+FFFF 的字符（常用字符集），直接用两个字节表示。
● 编号在 U+10000—U+10FFFF 之间的字符，需要用四个字节表示。
4. 编码识别
那么问题来了，当遇到两个字节时，怎么知道是把它当做一个字符还是和后面的两个字节一起当做一个字符呢？

UTF-16 编码肯定也考虑到了这个问题，在基本平面内，从 U+D800 — U+DFFF 是一个空段，也就是说这个区间的码点不对应任何的字符，因此这些空段就可以用来映射辅助平面的字符。

辅助平面共有 220 个字符位，因此表示这些字符至少需要 20 个二进制位。UTF-16 将这 20 个二进制位分成两半，前 10 位映射在 U+D800 — U+DBFF，称为高位（H），后 10 位映射在 U+DC00 — U+DFFF，称为低位（L）。这就相当于，将一个辅助平面的字符拆成了两个基本平面的字符来表示。

因此，当遇到两个字节时，发现它的码点在 U+D800 —U+DBFF之间，就可以知道，它后面的两个字节的码点应该在 U+DC00 — U+DFFF 之间，这四个字节必须放在一起进行解读。
5. 举例说明
以 "𡠀" 字为例，它的 Unicode 码点为 0x21800，该码点超出了基本平面的范围，因此需要用四个字节来表示，步骤如下：
● 首先计算超出部分的结果：0x21800 - 0x10000
● 将上面的计算结果转为20位的二进制数，不足20位就在前面补0，结果为：0001000110 0000000000
● 将得到的两个10位二进制数分别对应到两个区间中
● U+D800 对应的二进制数为 1101100000000000， 将0001000110填充在它的后10 个二进制位，得到 1101100001000110，转成 16 进制数为 0xD846。同理，低位为 0xDC00，所以这个字的UTF-16 编码为 0xD846 0xDC00
（4） UTF-32
UTF-32 就是字符所对应编号的整数二进制形式，每个字符占四个字节，这个是直接进行转换的。该编码方式占用的储存空间较多，所以使用较少。

比如“马” 字的Unicode编号是：U+9A6C，整数编号是39532，直接转化为二进制：1001 1010 0110 1100，这就是它的UTF-32编码。
（5）总结
Unicode、UTF-8、UTF-16、UTF-32有什么区别？
● Unicode 是编码字符集（字符集），而UTF-8、UTF-16、UTF-32是字符集编码（编码规则）；
● UTF-16 使用变长码元序列的编码方式，相较于定长码元序列的UTF-32算法更复杂，甚至比同样是变长码元序列的UTF-8也更为复杂，因为其引入了独特的代理对这样的代理机制；
● UTF-8需要判断每个字节中的开头标志信息，所以如果某个字节在传送过程中出错了，就会导致后面的字节也会解析出错；而UTF-16不会判断开头标志，即使错也只会错一个字符，所以容错能力教强；
● 如果字符内容全部英文或英文与其他文字混合，但英文占绝大部分，那么用UTF-8就比UTF-16节省了很多空间；而如果字符内容全部是中文这样类似的字符或者混合字符中中文占绝大多数，那么UTF-16就占优势了，可以节省很多空间；


## ES6(2015)

### `let & const`
#### 变量声明提升
```javascript
console.log(a); // undefined
var a = 1;
// 实际执行顺序：
var a;          // 声明提升
console.log(a); // undefined
a = 1;          // 赋值保持原位

// let/const 的暂时性死区（TDZ）
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;

// 函数声明提升
foo(); // "hello"
function foo() {
  console.log("hello");
}
// 函数表达式不会提升
bar(); // TypeError: bar is not a function
var bar = function() {};

// 提升优先级，函数在前，后被覆盖
var myFunc = 1;
function myFunc() {}
console.log(typeof myFunc); // "number"
// 实际解析顺序：
function myFunc() {} // 函数声明优先提升
var myFunc;          // 变量声明被忽略（重复声明）
myFunc = 1;          // 赋值覆盖函数


var tmp = new Date();
function fn(){
	console.log(tmp);
	if(false){
		var tmp = 'hello world'; // 内层定义的tmp被提到函数内部的最顶部，相当于覆盖了外层的tmp，所以打印结果为undefined。
	}
}
fn();  // undefined

var tmp = 'hello world';

for (var i = 0; i < tmp.length; i++) {
	console.log(tmp[i]);
}

console.log(i); // 11。由于遍历时定义的i会变量提升成为一个全局变量，在函数结束之后不会被销毁，所以打印出来11。
```

### [箭头函数(Arrow function)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
* 没有prototype，也没有自己的this指向，更不可以使用arguments参数
* 所以不能用 new，不能作为构造函数，没有 this 和 super
* 没有 `arguments` 可以使用 `rest`，获取函数参数

#### New
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

### Map & WeakMap
``` javascript
const map = new Map([
     ["foo",1],
     ["bar",2],
])
for(let key of map.keys()){
    console.log(key);  // foo bar
}
for(let value of map.values()){
     console.log(value); // 1 2
}
for(let items of map.entries()){
    console.log(items);  // ["foo",1]  ["bar",2]
}
map.forEach( (value,key,map) => {
     console.log(key,value); // foo 1    bar 2
})
map.size()
map.clear()
```
WeakMap 对象也是一组键值对的集合，其中的键是弱引用的。**其键必须是对象**，原始数据类型不能作为key值，而值可以是任意的。
WeakMap的设计目的在于，有时想在某个对象上面存放一些数据，但是这会形成对于这个对象的引用。一旦不再需要这两个对象，就必须手动删除这个引用，否则**垃圾回收机制**就不会释放对象占用的内存。
而WeakMap的键名所引用的对象都是弱引用，即垃圾回收机制不将该引用考虑在内。因此，只要所引用的对象的其他引用都被清除，垃圾回收机制就会释放该对象所占用的内存。也就是说，一旦不再需要，WeakMap 里面的键名对象和所对应的键值对会自动消失，不用手动删除引用。

### 尾调用优化（Tail Call Optimization）
当函数最后一步操作是调用另一个函数且**不需要保留当前栈帧**时，引擎会进行尾调用优化
优化条件：
1. 严格模式（'use strict'）
2. 必须是最后一步操作且无后续操作
3. 尾调用的结果直接返回
``` javascript
// 普通递归（存在栈溢出风险）
function factorial(n) {
  if(n === 1) return 1
  return n * factorial(n - 1) // 需要保存n的上下文
}

// 尾调用形式
function factorialTail(n, total = 1) {
  if(n === 1) return total
  return factorialTail(n - 1, n * total) // 最后一步纯函数调用
}
```


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
3. 函数参数默认值
4. 模版字符串
5. 解构赋值
6. 扩展语法(Spread syntax) / 扩展参数(Rest parameters)
7. 对象属性简写
8.  [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
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
    * `promise.then(onFulfilled, onRejected)`
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
    match  = reDate.exec('2018-04-30')
    year   = match.groups.year  // 2018
    month  = match.groups.month // 04
    day    = match.groups.day   // 30

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