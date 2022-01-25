## Performance

### navigation
* type：页面类型。
  * `0(TYPE_NAVIGATE)`：当前页面是通过点击链接，书签和表单提交，或者脚本操作，或者在url中直接输入地址
  * `1(TYPE_RELOAD)`：点击刷新页面按钮或者通过 `Location.reload()` 方法显示的页面
  * `2(TYPE_BACK_FORWARD)`：页面通过历史记录和前进后退访问时
  * `255(TYPE_RESERVED)`：任何其他方式

* redirectCount：无符号短整型，表示在到达这个页面之前重定向了多少次

### memory
* `jsHeapSizeLimit`：上下文内可用堆的最大体积，以字节计算。
* `totalJSHeapSize`：已分配的堆体积，以字节计算。
* `usedJSHeapSize`：当前 JS 堆活跃段（segment）的体积，以字节计算。
`usedJSHeapSize` 不能大于 `totalJSHeapSize`

### timeOrigin
返回一个表示 the performance measurement 开始时间的高精度 timestamp

### timing
所有值都是一个无符号long long 型的毫秒数
* **`navigationStart`**：返回当前浏览器窗口的前一个页面的关闭，发生unload事件时的时间戳。如果没有前一个页面，则等于fetchStart属性。
* unloadEventStart：返回如果前一个页面与当前页面同域，则返回前一个页面unload事件发生时的时间戳。如果没有没有前一个页面，或者之前的页面跳转不是在同一个域名内，则返回值为0
* unloadEventEnd：和unloadEventStart相对应，返回前一个页面unload事件绑定的回调函数执行完毕的时间戳。如果没有没有前一个页面，或者之前的页面跳转不是在同一个域名内，则返回值为0
* redirectStart：返回第一个http重定向发生时的时间戳。有跳转并且是同域名内的重定向，否则返回值为0
* redirectEnd：返回最后一个http重定向完成时的时间戳。有跳转并且是同域名内的重定向，否则返回值为0
* **`fetchStart`**：返回浏览器准备好使用http请求抓取文档的时间戳，这发生在检查本地缓存之前
* domainLookupStart：返回DNS域名查询开始的时间戳，如果使用了本地缓存（也就是没有做DNS查询，直接从缓存中取到IP）或者使用了持久连接，则与fetchStart值相等
* domainLookupEnd：返回DNS域名查询完成的时间戳，如果使用了本地缓存（也就是没有做DNS查询，直接从缓存中取到IP）或者使用了持久连接，则与fetchStart值相等
* connectStart：返回http（TCP）开始建立连接的时间戳，如果是持久连接，则与fetchStart值相等。如果在传输层发生了错误并且重新建立连接，则这里显示的是新建立的连接开始的时间戳
* connectEnd：返回http（TCP）完成建立连接的时间戳，完成了四次握手，如果是持久连接，则与fetchStart值相等。如果在传输层发生了错误并且重新建立连接，则这里显示的是新建立的连接完成的时间戳。连接建立指的是所有握手和认证过程全部结束
* secureConnectionStart：返回https连接开始的时间戳，如果不是安全连接，否则返回值为0
* **`requestStart`**：返回http请求读取真实文档开始的时间戳（完成建立连接），包括从本地读取缓存。如果连接错误重连时，这里显示的也是新建立连接的时间戳
* **`responseStart`**：返回http开始接收响应的时间戳（**获取到第一个字节**），包括从本地读取缓存
* **`responseEnd`**：返回http响应全部接收完成的时间戳（**获取到最后一个字节**），包括从本地读取缓存
* domLoading：返回开始解析渲染DOM树的时间戳，此时Document.readyState变为loading，并将抛出readystatechange相关事件
* domInteractive：返回完成解析DOM树的时间戳，Document.readyState变为interactive，并将抛出readystatechange相关事件。这里只是DOM树解析完成，这时候并没有开始加载网页内的资源
* domContentLoadedEventStart：返回DOM解析完成后，网页内资源加载开始的时间戳。即所有需要被执行的脚本开始被解析了。在DOMContentLoaded事件抛出前发生
* domContentLoadedEventEnd：返回DOM解析完成后，网页内资源加载完成的时间戳。例如JS脚本加载执行完成，不论执行顺序。DOMContentLoaded事件也已经完成
* **`domComplete`**：返回DOM解析完成，且资源也准备就绪的时间戳。Document.readyState变为complete，并将抛出readystatechange相关事件
* loadEventStart：返回load事件发送给文档，load回调函数开始执行的时间戳。如果没有绑定load事件，返回值为0
* **`loadEventEnd`**：返回load事件的回调函数执行完毕的时间戳。如果没有绑定load事件，返回值为0

#### 页面加载完成时间
``` js
const performance = window.performance;
const t = performance.timing;
const time = t.loadEventEnd - t.navigationStart;
```

#### 解析DOM树结构的时间：判断DOM树嵌套情况
``` js
const time = t.domComplete - t.responseEnd;
```

#### 重定向的时间
``` js
const time = t.redirectEnd - t.redirectStart;
```

#### DNS查询时间：可做预加载，缓存，减少查询时间
``` js
const time = t.domainLookupEnd - t.domainLookupStart;
```

#### 白屏时间：读取页面第一个字节的时间
``` js
const time = t.responseStart - t.navigationStart;
```

#### 内容加载完成的时间
``` js
const time = t.responseEnd - t.requestStart;
```

#### 执行onload回调函数的时间
``` js
const time = t.loadEventEnd - t.loadEventStart;
```

#### DNS缓存时间
``` js
const time = t.domainLookupStart - t.fetchStart;
```

#### 卸载页面的时间
``` js
const time = t.unloadEventEnd - t.unloadEventStart;
```

#### TCP建立连接完成握手的时间
``` js
const time = t.connectEnd - t.connectStart;
```

