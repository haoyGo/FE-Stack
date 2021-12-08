## Reflect Metadata

A powerful reflection API should allow us to examine an unknown object at `run-time` and find out everything about it. We should be able to find things like:

* The name of the entity.
* The type of the entity.
* Which interfaces are implemented by the entity.
* The name and types of the properties of the entity.
* The name and types of the constructor arguments of the entity.

In JavaScript we can use functions like `Object.getOwnPropertyDescriptor()` or `Object.keys()` to find some information about an entity but we need reflection to implement more powerful development tools.

**reflect-metadata 包内部定义了三种 keys：**
1. Type metadata uses the metadata key `design:type`.
    ``` ts
    function logType(target : any, key : string) {
      var t = Reflect.getMetadata("design:type", target, key);
      console.log(`${key} type: ${t.name}`);
    }

    class Demo{ 
      @logType
      public attr1 : string;
    }

    // attr1 type: String
    ```

2. Parameter type metadata uses the metadata key `design:paramtypes`.
    ``` ts
    function logParamTypes(target : any, key : string) {
      var types = Reflect.getMetadata("design:paramtypes", target, key);
      var s = types.map(a => a.name).join();
      console.log(`${key} param types: ${s}`);
    }

    class Foo {}
    interface IFoo {}

    class Demo{ 
      @logParameters
      doSomething(
        param1 : string,
        param2 : number,
        param3 : Foo,
        param4 : { test : string },
        param5 : IFoo,
        param6 : Function,
        param7 : (a : number) => void,
      ) : number { 
          return 1
      }
    }

    // doSomething param types: String, Number, Foo, Object, Object, Function, Function
    ```
3. Return type metadata uses the metadata key `design:returntype`.


## Basic type serialization
* `number` serialized as `Number`
* `string` serialized as `String`
* `boolean` serialized as `Boolean`
* `any` serialized as `Object`
* `void` serializes as `undefined`
* `Array` serialized as `Array`
* If a `Tuple`, serialized as `Array`
* If a `class` serialized it as the `class` constructor
* If an `Enum` serialized it as `Number`
* If has at least one call signature, serialized as `Function`
* Otherwise serialized as `Object` (Including interfaces)

`Interfaces` and `object literals` may be serialize in the future via `complex type serialization` but this feature is not available at this time.

## 使用场景
### IoC
``` ts
type Constructor<T = any> = new (...args: any[]) => T;

const Injectable = (): ClassDecorator => target => {};

class OtherService {
  a = 1;
}

@Injectable()
class TestService {
  constructor(public readonly otherService: OtherService) {}

  testMethod() {
    console.log(this.otherService.a);
  }
}

const Factory = <T>(target: Constructor<T>): T => {
  // 获取所有注入的服务
  const providers = Reflect.getMetadata('design:paramtypes', target); // [OtherService]
  const args = providers.map((provider: Constructor) => new provider());
  return new target(...args);
};

Factory(TestService).testMethod(); // 1
```

### Controller & Methods
``` ts
@Controller('/test')
class SomeClass {
  @Get('/a')
  someGetMethod() {
    return 'hello world';
  }

  @Post('/b')
  somePostMethod() {}
}


const METHOD_METADATA = 'method'；
const PATH_METADATA = 'path'；

const Controller = (path: string): ClassDecorator => {
  return target => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  }
}

const createMappingDecorator = (method: string) => (path: string): MethodDecorator => {
  return (target, key, descriptor) => {
    Reflect.defineMetadata(PATH_METADATA, path, descriptor.value);
    Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value);
  }
}

const Get = createMappingDecorator('GET');
const Post = createMappingDecorator('POST');
```

``` ts
function mapRoute(instance: Object) {
  const prototype = Object.getPrototypeOf(instance);

  // 筛选出类的 methodName
  const methodsNames = Object.getOwnPropertyNames(prototype)
                              .filter(item => !isConstructor(item) && isFunction(prototype[item]))；
  return methodsNames.map(methodName => {
    const fn = prototype[methodName];

    // 取出定义的 metadata
    const route = Reflect.getMetadata(PATH_METADATA, fn);
    const method = Reflect.getMetadata(METHOD_METADATA, fn)；
    return {
      route,
      method,
      fn,
      methodName
    }
  })
};


Reflect.getMetadata(PATH_METADATA, SomeClass); // '/test'

mapRoute(new SomeClass());

/**
 * [{
 *    route: '/a',
 *    method: 'GET',
 *    fn: someGetMethod() { ... },
 *    methodName: 'someGetMethod'
 *  },{
 *    route: '/b',
 *    method: 'POST',
 *    fn: somePostMethod() { ... },
 *    methodName: 'somePostMethod'
 * }]
 *
 */
```