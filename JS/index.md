## JS
JavaScript共有八种数据类型，分别是 `Undefined、Null、Boolean、Number、String、Object、Symbol、BigInt`。

相应类型判断：`typeof、instanceof、constructor、Object.prototype.toString.call()`

1. undefined 在 JavaScript 中不是一个保留字，这意味着可以使用 undefined 来作为一个变量名，但是这样的做法是非常危险的，它会影响对 undefined 值的判断。我们可以通过一些方法获得安全的 undefined 值，比如说 void 0。

2. 其中 Symbol 和 BigInt 是ES6 中新增的数据类型：
* Symbol 代表创建后独一无二且不可变的数据类型，它主要是为了解决可能出现的全局变量冲突的问题。
* BigInt 是一种数字类型的数据，它可以表示任意精度格式的整数，使用 BigInt 可以安全地存储和操作大整数，即使这个数已经超出了 Number 能够表示的安全整数范围。

3. typeof null 的结果是 `object`。
在 JavaScript 第一个版本中，所有值都存储在 32 位的单元中，每个单元包含一个小的 类型标签(1-3 bits) 以及当前要存储值的真实数据。类型标签存储在每个单元的低位中，共有五种数据类型：
``` js
000: object   - 当前存储的数据指向一个对象。
1: int        - 当前存储的数据是一个 31 位的有符号整数。
010: double   - 当前存储的数据指向一个双精度的浮点数。
100: string   - 当前存储的数据指向一个字符串。
110: boolean  - 当前存储的数据是布尔值。
```
有两种特殊数据类型：
* undefined的值是 (-2)30(一个超出整数范围的数字)；
* null 的值是机器码 NULL 指针(null 指针的值全是 0)
也就是说null的类型标签也是000，和Object的类型标签一样，所以会被判定为Object。

4. isNaN 和 Number.isNaN 函数的区别？
* 函数 isNaN 接收参数后，会尝试将这个参数转换为数值，任何不能被转换为数值的的值都会返回 true，因此非数字值传入也会返回 true ，会影响 NaN 的判断。
* 函数 Number.isNaN 会首先判断传入参数是否为数字，如果是数字再继续判断是否为 NaN ，不会进行数据类型的转换，这种方法对于 NaN 的判断更为准确。

5. == 操作符的强制类型转换规则？
对于 == 来说，如果对比双方的类型不一样，就会进行类型转换。假如对比 x 和 y 是否相同，就会进行如下判断流程：
   1. 首先会判断两者类型是否相同，相同的话就比较两者的大小；
   2. 类型不相同的话，就会进行类型转换；
   3. 会先判断是否在对比 null 和 undefined，是的话就会返回 true
   4. 判断两者类型是否为 string 和 number，是的话就会将字符串转换为 number
   5. 判断其中一方是否为 boolean，是的话就会把 boolean 转为 number 再进行判断
   6. 判断其中一方是否为 object 且另一方为 string、number 或者 symbol，是的话就会把 object 转为原始类型再进行判断
  
![](./imgs/==.jpg)

6. 其他值到字符串的转换规则？
* Null 和 Undefined 类型 ，null 转换为 "null"，undefined 转换为 "undefined"，
* Boolean 类型，true 转换为 "true"，false 转换为 "false"。
* Number 类型的值直接转换，不过那些极小和极大的数字会使用指数形式。
* Symbol 类型的值直接转换，但是只允许显式强制类型转换，使用隐式强制类型转换会产生错误。
* 对普通对象来说，除非自行定义 toString() 方法，否则会调用 toString()（Object.prototype.toString()），如"[object Object]"。如果对象有自己的 toString() 方法，字符串化时就会调用该方法并使用其返回值。