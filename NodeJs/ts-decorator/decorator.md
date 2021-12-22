## TS Decorator

**分为四种：**
### 一、MethodDecorator
``` ts
declare type MethodDecorator = <T>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

interface TypedPropertyDescriptor<T> {
  enumerable?: boolean;
  configurable?: boolean;
  writable?: boolean;
  value?: T;
  get?: () => T;
  set?: (value: T) => void;
}
```

``` ts
class C {
  @log
  foo(n: number) {
      return n * 2;
  }
}

function log(target: Function, key: string, descriptor: any) {
  // save a reference to the original method
  // this way we keep the values currently in the 
  // descriptor and don't overwrite what another 
  // decorator might have done to the descriptor.
  var originalMethod = descriptor.value; 

  //editing the descriptor/value parameter
  descriptor.value =  function (...args: any[]) {
    var a = args.map(a => JSON.stringify(a)).join();
    // note usage of originalMethod here
    var result = originalMethod.apply(this, args);
    var r = JSON.stringify(result);
    console.log(`Call: ${key}(${a}) => ${r}`);
    return result;
  }

  // return edited descriptor as opposed to overwriting 
  // the descriptor by returning a new descriptor
  return descriptor;
}
```

上面 TS 代码编译后

``` js
// 不带装饰器
var C = (function () {
  function C() {
  }
  C.prototype.foo = function (n) {
    return n * 2;
  };
  return C;
})();

// 带装饰器
var C = (function () {
  function C() {
  }
  C.prototype.foo = function (n) {
    return n * 2;
  };

  /* */
  Object.defineProperty(C.prototype, "foo",
    __decorate(                                             
      [log],                                                  // decorators
      C.prototype,                                            // target
      "foo",                                                  // key
      Object.getOwnPropertyDescriptor(C.prototype, "foo")     // desc
    )
  );
  /* */

  return C;
})();
```

和内置方法 `__extends` 类似，方法 `__decorate` 的实现如下

``` js
var __extends = this.__extends || function (d, b) {
  for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  function __() { this.constructor = d; }
  __.prototype = b.prototype;
  d.prototype = new __();
};

var __decorate = this.__decorate || function (decorators, target, key, desc) {
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
    return Reflect.decorate(decorators, target, key, desc);
  }
  switch (arguments.length) {
    case 2: 
      return decorators.reduceRight(function(o, d) { 
        return (d && d(o)) || o; 
      }, target);
    case 3: 
      return decorators.reduceRight(function(o, d) { 
        return (d && d(target, key)), void 0; 
      }, void 0);
    case 4: 
      return decorators.reduceRight(function(o, d) { 
        return (d && d(target, key, o)) || o; 
      }, desc);
  }
};
```

可以看到上面 `__decorate` 用了 [reduceRight](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight) 方法，即数组从右到左执行累加器，如果有多个 `decorators: [foo、bar]`，编译结果为 `foo(bar(...args))`，这决定了多个装饰器的执行顺序。


### 二、PropertyDecorator
``` ts
declare type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
```

``` ts
class Person { 
  @logProperty
  public name: string;
  public surname: string;

  constructor(name : string, surname : string) { 
    this.name = name;
    this.surname = surname;
  }
}

function logProperty(target: any, key: string) {

  // property value
  var _val = this[key];

  // property getter
  var getter = function () {
    console.log(`Get: ${key} => ${_val}`);
    return _val;
  };

  // property setter
  var setter = function (newVal) {
    console.log(`Set: ${key} => ${newVal}`);
    _val = newVal;
  };

  // Delete property.
  if (delete this[key]) {

    // Create new property with getter and setter
    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  }
}
```

上面 TS 代码编译后

``` js
var Person = (function () {
  function Person(name, surname) {
    this.name = name;
    this.surname = surname;
  }

  /* */
  __decorate(
    [logProperty],
    Person.prototype,
    "name"
  );
  /* */

  return Person;
})();
```


### 三、ClassDecorator
``` ts
declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
```

``` ts
@logClass
class Person { 

  public name: string;
  public surname: string;

  constructor(name : string, surname : string) { 
    this.name = name;
    this.surname = surname;
  }
}

function logClass(target: any) {

  // save a reference to the original constructor
  var original = target;

  // a utility function to generate instances of a class
  function construct(constructor, args) {
    var c : any = function () {
      return constructor.apply(this, args);
    }
    c.prototype = constructor.prototype;
    return new c();
  }

  // the new constructor behaviour
  var f : any = function (...args) {
    console.log("New: " + original.name); 
    return construct(original, args);
  }

  // copy prototype so intanceof operator still works
  f.prototype = original.prototype;

  // return new constructor (will override original)
  return f;
}
```

上面 TS 代码编译后

``` js
var Person = (function () {
  function Person(name, surname) {
    this.name = name;
    this.surname = surname;
  }

  /* */
  Person = __decorate(
    [logClass],
    Person
  );
  /* */

  return Person;
})();
```

### 四、ParameterDecorator
``` ts
declare type ParameterDecorator = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
```

``` ts
class Person { 

  public name: string;
  public surname: string;

  constructor(name : string, surname : string) { 
    this.name = name;
    this.surname = surname;
  }

  public saySomething(@logParameter something : string) : string { 
    return this.name + " " + this.surname + " says: " + something; 
  }
}
```

上面 TS 代码编译后

``` js
Object.defineProperty(Person.prototype, "saySomething",
  __decorate(
    [__param(0, logParameter)],
    Person.prototype,
    "saySomething",
    Object.getOwnPropertyDescriptor(Person.prototype, "saySomething")
  )
);
return Person;

function logParameter(target: any, key : string, index : number) {
  var metadataKey = `log_${key}_parameters`;
  if (Array.isArray(target[metadataKey])) {
    target[metadataKey].push(index);
  }
  else { 
    target[metadataKey] = [index];
  }
}
```

``` js
var __param = this.__param || function (index, decorator) {
  // return a decorator function (wrapper)
  return function (target, key) {
    // apply decorator (return is ignored)
    decorator(target, key, index); 
  }
};
```

上面 `logParameter` 给 `Person.prototype` 添加了一个 `metadata: 'log_${key}_parameters'`。我们可以在其他装饰器例如 `MethodDecorator` 去读取使用。

``` ts
class Person { 

  public name: string;
  public surname: string;

  constructor(name : string, surname : string) { 
    this.name = name;
    this.surname = surname;
  }

  @logMethod
  public saySomething(@logParameter something : string) : string { 
    return this.name + " " + this.surname + " says: " + something; 
  }
}

function logMethod(target: Function, key: string, descriptor: any) {
  var originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {

    var metadataKey = `__log_${key}_parameters`;
    var indices = target[metadataKey];

    if (Array.isArray(indices)) { 

      for (var i = 0; i < args.length; i++) { 

        if (indices.indexOf(i) !== -1) { 

          var arg = args[i];
          var argStr = JSON.stringify(arg) || arg.toString();
          console.log(`${key} arg[${i}]: ${argStr}`);
        }
      }
      var result = originalMethod.apply(this, args);
      return result;
    }
    else {

      var a = args.map(a => (JSON.stringify(a) || a.toString())).join();
      var result = originalMethod.apply(this, args);
      var r = JSON.stringify(result);
      console.log(`Call: ${key}(${a}) => ${r}`);
      return result;
    }
  }
  return descriptor;
}
```


### Decorator factory
通过一个方法统一处理所有类型的装饰器
