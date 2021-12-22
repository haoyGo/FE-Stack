## 一、Controllers
### 1.1 装饰器 
* `@Controller()`
* Request method - `@Get`、`@Post` and so on.
  * Route wildcards - `@Get('ab*cd')`
* Request object `@Req`、`@Res`
  * Note that when you inject either `@Res()` or `@Response()` in a method handler, you put Nest into `Library-specific` mode for that handler, and you become responsible for managing the response. When doing so, you must issue some kind of response by making a call on the response object (e.g., res.json(...) or res.send(...)), or the HTTP server will hang.
* Status code - `@HttpCode(204)` 
* Headers - `@Header('Cache-Control', 'none')`
* Redirection - `@Redirect('https://nestjs.com', 301)`
  * `@Redirect()` takes two arguments, url and statusCode, both are optional. The default value of statusCode is 302 (Found) if omitted.
* Route parameters
  * `@Param` - req.params 一般用于 Get 请求
  * `@Body` - req.body 一般用于 Post 请求
  * `@Query` - req.query - URI query
  * `@Headers` - req.headers
  * `@Ip` - req.ip
  * `@HostParam` - req.hosts
* Sub-Domain Routing - The `@Controller` decorator can take a host option to require that the HTTP host of the incoming requests matches some specific value.
  * **WARNING**
Since Fastify lacks support for nested routers, when using sub-domain routing, the (default) Express adapter should be used instead.

``` ts
import { 
    Controller, 
    Get, 
    Post,
    Req, 
    HttpCode, 
    Header, 
    Redirect, 
    Param 
} from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request: Request): string {
    return 'This action returns all cats';
  }

  @Post()
  @HttpCode(204)
  @Header('Cache-Control', 'none')
  create() {
    return 'This action adds a new cat';
  }

  @Get('docs')
  @Redirect('https://docs.nestjs.com', 302)
  getDocs(@Query('version') version) {
    /*
     * Sometimes you may want to determine the HTTP status code or 
     * the redirect URL dynamically. Do this by returning an 
     * object from the route handler method with the shape:
     * 
     * {
     *   "url": string,
     *   "statusCode": number
     *  }
     * 
     * Returned values will override any arguments passed to the @Redirect() decorator.
     */
    if (version && version === '5') {
      return { url: 'https://docs.nestjs.com/v5/' };
    }
  }

  @Get(':id')
  findOne(@Param() params): string {
    console.log(params.id);
    return `This action returns a #${params.id} cat`;
  }

  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return 'This action adds a new cat';
  }
}

@Controller({ host: 'admin.example.com' })
export class AdminController {
  @Get()
  index(): string {
    return 'Admin page';
  }
}
```

### 1.2 Library-specific approach
Though this approach works, and does in fact allow for more flexibility in some ways by providing full control of the response object (headers manipulation, library-specific features, and so on), it should be used with care.

 In general, the approach is much less clear and does have some disadvantages. The main disadvantage is that your code becomes platform-dependent (as underlying libraries may have different APIs on the response object), and harder to test (you'll have to mock the response object, etc.).
``` ts
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res: Response) {
     res.status(HttpStatus.OK).json([]);
  }
}
```

### 1.3 Controller scope
``` ts
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
```


## 二、Providers
`@Injectable()`

### 2.1 Provider scope
* DEFAULT - A single instance of the provider is shared across the entire application. The instance lifetime is tied directly to the application lifecycle. Once the application has bootstrapped, all singleton providers have been instantiated. Singleton scope is used by default.
* REQUEST - A new instance of the provider is created exclusively for each incoming **request**. The instance is garbage-collected after the request has completed processing.
* TRANSIENT - Transient providers are not shared across consumers. Each consumer that injects a transient provider will receive a new, dedicated instance.

Specify injection scope by passing the `scope` property to the `@Injectable()` decorator options object:
``` ts
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

Similarly, for `custom providers`, set the `scope` property in the long-hand form for a provider registration:
``` ts
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```




## 三、Modules
The `@Module()` decorator takes a single object whose properties describe the module:
* providers - the providers that will be instantiated by the Nest injector and that may be shared at least across this module
* controllers - the set of controllers defined in this module which have to be instantiated
* imports - the list of imported modules that export the providers which are required in this module
* exports - the subset of providers that are provided by this module and should be available in other modules which import this module

### 3.1 Shared modules
In Nest, modules are singletons by default, and thus you can share the same instance of any provider between multiple modules effortlessly.

Every module is automatically a `shared module`. Once created it can be reused by any module.
In order to do that, we first need to export the `CatsService` provider by adding it to the module's exports array, as shown below:
``` ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
export class CatsModule {}
```

### 3.2 Module re-exporting
In the example below, the `CommonModule` is both `imported` into and `exported` from the `CoreModule`, making it available for other modules which import this one. - 模块的透传（笑）
``` ts
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

### 3.3 Global modules
The `@Global()` decorator makes the module global-scoped. Global modules should be registered only once.
In the following example, the `CatsService` provider will be ubiquitous, and modules that wish to inject the service will **not need to import** the CatsModule in their imports array.
``` ts
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```


## 四、Middleware
`Middleware` is a function which is called **before** the route handler. Middleware functions have access to the `request` and `response` objects, and the `next()` middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named next. - 可以拿到 `request` 和 `response`

**Nest middleware are, by default, equivalent to express middleware.**

Middleware functions can perform the following tasks:
* execute any code.
* make changes to the request and the response objects.
* end the request-response cycle.
* call the next middleware function in the stack.
* if the current middleware function does not end the request-response cycle, it must call next() to pass control to the next middleware function. Otherwise, the request will be left hanging.

### 4.1 在 Module 中使用
实现 `NestModule.configure` 接口，`configure` 可以是异步函数 - `async`
``` ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
    //   .apply(cors(), helmet(), logger) 串行执行多个中间件
      .exclude( // 排除特定路由
        { path: 'cats', method: RequestMethod.GET },
        { path: 'cats', method: RequestMethod.POST },
        'cats/(.*)',
      )
      .forRoutes('cats');
    //   .forRoutes({ path: 'cats', method: RequestMethod.GET });
    //   .forRoutes(CatsController);
  }
}
```

### 4.2 Global middleware
``` ts
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(3000);
```

## 五、Exception filters
