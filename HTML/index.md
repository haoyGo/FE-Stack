## HTML

### 0. HTML5 新增
#### 语义化标签
* `header`
* `footer`
* `nav`
* `aside`
* `main`
* `section`
* `article`
#### 媒体标签
* `audio`：`<audio src='' controls autoplay loop='true'></audio>`
  * `controls` 控制面板
  * `autoplay` 自动播放
  * `loop=true` 循环播放
* `video`：`<video src='' poster='imgs/aa.jpg' controls></video>`
  * `poster`：指定视频还没有完全下载完毕，或者用户还没有点击播放前显示的封面。默认显示当前视频文件的第一针画面，当然通过poster也可以自己指定。
  * `controls` 控制面板
  * `width`
  * `height`
* `source`：因为浏览器对视频格式支持程度不一样，为了能够兼容不同的浏览器，可以通过source来指定视频源。
  ``` html
  <video>
    <source src='aa.flv' type='video/flv'></source>
    <source src='aa.mp4' type='video/mp4'></source>
  </video>
  ```
#### 表单
##### 表单类型
* `email`：能够验证当前输入的邮箱地址是否合法
* `url`：验证URL
* `number`：只能输入数字，其他输入不了，而且自带上下增大减小箭头，max属性可以设置为最大值，min可以设置为最小值，value为默认值。
* `search`：输入框后面会给提供一个小叉，可以删除输入的内容，更加人性化。
* `range`：可以提供给一个范围，其中可以设置max和min以及value，其中value属性可以设置为默认值
* `color`：提供了一个颜色拾取器
* `time`：时分秒
* `date`：日期选择年月日
* `datatime`：时间和日期(目前只有Safari支持)
* `datatime-local`：日期时间控件
* `week`：周控件
* `month`：月控件

##### 表单属性
* `placeholder`：提示信息
* `autofocus`：自动获取焦点
* `autocomplete=“on”` 或者 `autocomplete=“off”` 使用这个属性需要有两个前提：
  * 表单必须提交过
  * 必须有name属性。
* `required`：要求输入框不能为空，必须有值才能够提交。
* `pattern=" "` 里面写入想要的正则模式，例如手机号patte="^(+86)?\d{10}$"
* `multiple`：可以选择多个文件或者多个邮箱
* `form="form表单的ID"`

##### 表单事件
* `oninput` 每当input里的输入框内容发生变化都会触发此事件。
* `oninvalid` 当验证不通过时触发此事件。

#### [querySelector](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/querySelector)
document.querySelector() & document.querySelectorAll()
它们选择的对象可以是标签，可以是类(需要加.)，可以是ID(需要加#)

#### [localStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage)
localStorage & sessionStorage

#### [拖放API](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API)
用户可使用鼠标选择`可拖拽（draggable）元素`，将元素拖拽到`可放置（droppable）元素`，并释放鼠标按钮以放置这些元素。拖拽操作期间，会有一个可拖拽元素的半透明快照跟随着鼠标指针。

1. 让一个元素被拖拽需要添加 `draggable` 属性：
  `<p id="p1" draggable="true">This element is draggable.</p>`
2. 定义拖拽数据：应用程序可以在拖拽操作中包含任意数量的数据项。每个数据项都是一个 `string` 类型，典型的 MIME 类型，如：`text/html`。
    ``` js
    function dragstart_handler(ev) {
      // 添加拖拽数据
      ev.dataTransfer.setData("text/plain", ev.target.innerText);
      ev.dataTransfer.setData("text/html", ev.target.outerHTML);
      ev.dataTransfer.setData("text/uri-list", ev.target.ownerDocument.location.href);
    }
    ```
3. 定义拖拽图像
   拖拽过程中，浏览器会在鼠标旁显示一张默认图片。当然，应用程序也可以通过 `setDragImage()` 方法自定义一张图片
    ``` js
    function dragstart_handler(ev) {
      // Create an image and then use it for the drag image.
      // NOTE: change "example.gif" to a real image URL or the image
      // will not be created and the default drag image will be used.
      var img = new Image();
      img.src = 'example.gif';
      ev.dataTransfer.setDragImage(img, 10, 10);
    }
    ```
4. 定义拖拽效果
   `dropEffect` 属性用来控制拖放操作中用户给予的反馈。它会影响到拖拽过程中浏览器显示的鼠标样式。比如，当用户悬停在目标元素上的时候，浏览器鼠标也许要反映拖放操作的类型。
5. 定义一个放置区
   当拖拽一个项目到 HTML 元素中时，浏览器默认不会有任何响应。想要让一个元素变成可释放区域，该元素必须设置 `ondragover` 和 `ondrop` 事件处理程序属性
    ``` html
    <script>
    function dragstart_handler(ev) {
      // Add the target element's id to the data transfer object
      ev.dataTransfer.setData("application/my-app", ev.target.id);
      ev.target.classList.add('dragging');
    }
    function dragover_handler(ev) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "move"
    }
    function drop_handler(ev) {
      ev.preventDefault();
      // Get the id of the target and add the moved element to the target's DOM
      var data = ev.dataTransfer.getData("application/my-app");
      ev.target.appendChild(document.getElementById(data));
      draggedElement.classList.remove('dragging');
    }
    </script>

    <p id="p1" draggable="true" ondragstart="dragstart_handler(event)">This element is draggable.</p>
    <div id="target" ondrop="drop_handler(event)" ondragover="dragover_handler(event)">Drop Zone</div>
    ```

#### Canvas & SVG

#### [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

---

### 1. src 和 href 的区别
**src 用于替换当前元素，href 用于在当前文档和引用资源之间确立联系。**
* src 是 source 的缩写，指向外部资源的位置，指向的内容将会嵌入到文档中当前标签所在位置；在请求 src 资源时会将其指向的资源下载并应用到文档内，例如 `js脚本`，`img图片` 和 `frame` 等元素。 
  `<script src =”js.js”></script>`
  当浏览器解析到该元素时，会暂停其他资源的下载和处理，直到将该资源加载、编译、执行完毕，图片和框架等元素也如此，类似于将所指向资源嵌入当前标签内。这也是为什么将js 脚本放在底部而不是头部。 
* href 是 `Hypertext Reference` 的缩写，指向网络资源所在位置，建立和当前元素（锚点）或当前文档（链接）之间的链接。
  `<link href=”common.css” rel=”stylesheet”/>`
  浏览器会识别该文档为 css 文件，就会并行下载资源并且不会停止对当前文档的处理。 这也是为什么建议使用 `link` 方式来加载 css，而不是使用 `@import` 方式。

---

### 2. 对HTML语义化的理解
**语义化是指根据内容的结构化（内容语义化），选择合适的标签（代码语义化）。通俗来讲就是用正确的标签做正确的事情。**

语义化的优点如下：
* **对机器友好**，带有语义的文字表现力丰富，更适合搜索引擎的爬虫爬取有效信息，**有利于SEO**。除此之外，语义类还支读屏软件，根据文章可以自动生成目录；
* **对开发者友好**，使用语义类标签增强了**可读性**，结构更加清晰，开发者能清晰的看出网页的结构，便于团队的**开发与维护**。

常见的语意化标签：
``` html
<header></header>  头部

<nav></nav>  导航栏

<section></section>  区块（有语义化的div）

<main></main>  主要区域

<article></article>  主要内容

<aside></aside>  侧边栏

<footer></footer>  底部
```

---

### 3. DOCTYPE(⽂档类型) 的作⽤
`DOCTYPE` 是 `HTML5` 中一种标准通用标记语言的文档类型声明，它的目的是**告诉浏览器（解析器）应该以什么样（html或xhtml）的文档类型定义来解析文档**，不同的渲染模式会影响浏览器对 `CSS` 代码甚⾄ `JavaScript` 脚本的解析。它必须声明在 `HTML⽂档` 的第⼀⾏。

浏览器渲染页面的两种模式（可通过`document.compatMode`获取)：
* `CSS1Compat`：`标准模式（Strick mode）`，默认模式，浏览器使用W3C的标准解析渲染页面。在标准模式中，浏览器以其支持的最高标准呈现页面。
* `BackCompat`：`怪异模式(混杂模式)(Quick mode)`，浏览器使用自己的怪异模式解析渲染页面。在怪异模式中，页面以一种比较宽松的向后兼容的方式显示。

`<!Doctype html>` 的作用就是让浏览器进入标准模式，使用最新的 `HTML5` 标准来解析渲染页面；如果不写，浏览器就会进入混杂模式，我们需要避免此类情况发生。

---

### 4. defer & async
如果没有 `defer` 或 `async` 属性，浏览器会立即加载并执行相应的脚本。
defer 和 async 都是去异步加载外部的JS脚本文件，它们都不会阻塞页面的解析，其区别如下：
* 执行顺序：多个带 `async` 的脚本，不能保证加载的顺序；多个带 `defer` 的标脚本，按照加载顺序执行；
* 立即执行：`async` 脚本加载完成立即执行；`defer` 脚本加载完成不会立即执行，在 `DOMContentLoaded` 事件前触发。所以 `defer` 不会阻塞 `HTML` 解析。

---

### [5. meta标签](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meta)
* `charset`：用来描述HTML文档的编码类型
  `<meta charset="UTF-8" />`
* `keywords`：页面关键词
  `<meta name="keywords" content="关键词" />`
* `description`：页面描述
  `<meta name="description" content="页面描述内容" />`
* `viewport`：适配移动端，可以控制视口的大小和比例，参考 [viewport](./../c端/index.md)
  `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`
* `robots`，搜索引擎索引方式：
  `<meta name="robots" content="index,follow" />`
  content 参数有以下几种：
  * `all`：文件将被检索，且页面上的链接可以被查询；
  * `none`：文件将不被检索，且页面上的链接不可以被查询；
  * `index`：文件将被检索；
  * `follow`：页面上的链接可以被查询；
  * `noindex`：文件将不被检索；
  * `nofollow`：页面上的链接不可以被查询。
* `refresh`：页面重定向和刷新
  `<meta http-equiv="refresh" content="0;url=" />`
* `x-ua-compatible`，唯一`content="IE=edge"`
  `<meta http-equiv="x-ua-compatible" content="IE=edge" />`
* [content-security-policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
  `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`

---

### [6. Responsive images 响应式图片](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
img 标签新增属性：
* `srcset`
* `sizes`

---

### 7. HTML标签类型
* 行内元素
  `a b span img input select strong`
* 块级元素
  `div ul ol li dl dt dd h1 h2 h3 h4 h5 h6 p`
* 空元素
  `<br>、<hr>、<img>、<input>、<link>、<meta>`

---

### [8.1 Web Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)
* window.Worker
* myWorker.postMessage
* myWorker.onmessage

### [8.2 Service Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)

**ServiceWorker的事件列表：**
* install：安装事件，当ServiceWorker安装成功后，就会触发这个事件，这个事件只会触发一次。
* activate：激活事件，当ServiceWorker激活成功后，就会触发这个事件，这个事件只会触发一次。
* fetch：网络请求事件，当页面发起网络请求时，就会触发这个事件。
* push：推送事件，当页面发起推送请求时，就会触发这个事件。
* sync：同步事件，当页面发起同步请求时，就会触发这个事件。
* message：消息事件，当页面发起消息请求时，就会触发这个事件。
* messageerror：消息错误事件，当页面发起消息错误请求时，就会触发这个事件。
* error：错误事件，当页面发起错误请求时，就会触发这个事件。

ServiceWorker的缓存是基于CacheStorage的，它是一个Promise对象，我们可以通过caches来获取它；CacheStorage提供了一些方法，我们可以通过这些方法来对缓存进行操作；

* 添加缓存
我们可以通过cache.put来添加缓存，它接收两个参数，第一个参数是Request对象，第二个参数是Response对象；
  ``` javascript
  caches.open('my-cache').then(function (cache) {
    cache.put(new Request('/'), new Response('Hello World'));
  });
  ```
* 获取缓存
我们可以通过cache.match来获取缓存，它接收一个参数，这个参数可以是Request对象，也可以是URL字符串
  ``` javascript
  caches.open('my-cache').then(function (cache) {
    cache.match('/').then(function (response) {
        console.log(response);
    });
  });
  ```
* 删除缓存
我们可以通过cache.delete来删除缓存，它接收一个参数，这个参数可以是Request对象，也可以是URL字符串；
  ``` javascript
  caches.open('my-cache').then(function (cache) {
    cache.delete('/').then(function () {
        console.log('删除成功');
    });
  });
  ```
* 清空缓存
我们可以通过cache.keys来获取缓存的key，然后通过cache.delete来删除缓存；
  ``` javascript
  caches.open('my-cache').then(function (cache) {
    cache.keys().then(function (keys) {
        keys.forEach(function (key) {
            cache.delete(key);
        });
    });
  });
  ```
* 拦截请求
  ``` javascript
  self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
  });
  ```

1. 注册Service Worker
* service worker 文件的路径需要相对于源（origin），而不是 app 的根目录。在我们的示例中，worker 是在 https://mdn.github.io/sw-test/sw.js，app 的根目录是 https://mdn.github.io/sw-test/。但是路径需要写成 /sw.js。
* 也不允许你的 app 指向不同源（origin）的 service worker。
```javascript
// 主线程代码
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/' // 控制作用域
      });

      if (registration.installing) {
        console.log("正在安装 Service worker");
      } else if (registration.waiting) {
        console.log("已安装 Service worker installed");
      } else if (registration.active) {
        console.log("激活 Service worker");
      }
    } catch (error) {
      console.log('注册失败:', error);
    }
  });
}
```
2. 安装
* 在 addResourcesToCache() 内，我们使用了 caches.open() 方法来创建了叫做 v1 的新缓存，这将会是我们的站点资源缓存的第 1 个版本。然后我们会在创建的缓存示例中调用 addAll() 函数，它的参数采用一个 URL 数组，指向你想要缓存的所有资源。其中，URL 是相对于 worker 的 location。
* 上面缓存的所有资源一定都是确定的存在的，不能出现除状态码为 200 以外的其他状态码，否则缓存会失败；
```javascript
// 缓存名称（版本更新时修改）
const CACHE_NAME = 'v1';

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
};

// 安装阶段 - 缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    addResourcesToCache([
      '/',
      '/index.html',
      '/main.css',
      '/app.js',
      '/fallback.html'
    ])
  );
});

```

3. 激活阶段清除旧版本
上面我们已经缓存了我们需要资源，但是我们的资源是不会更新的，现在你可以修改一下index.css，然后刷新页面，不管怎么刷新，你的页面都不会更新，这是因为我们的资源是缓存的，所以我们需要更新我们的缓存；
通常情况下，我们会在activate事件中删除旧的缓存，然后在install事件中缓存新的资源；
``` javascript
// 启用导航预加载
const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
};

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', event => {
  // 预加载
  event.waitUntil(enableNavigationPreload());

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME) // 删除旧缓存
          .map(key => caches.delete(key))
      );
    })
  );
});
```

1. 运行阶段拦截请求
* caches.match(event.request) 允许我们对网络请求里的每个资源与缓存里可获取的等效资源进行匹配，查看缓存中是否有相应的资源。该匹配通过 URL 和各种标头进行，就像正常的 HTTP 请求一样。
* 如果请求 URL 在缓存中不可用，我们将使用 await fetch（request) 从网络请求中请求资源。之后，我们将响应的克隆放入缓存。putInCache() 函数使用 caches.open('v1') 和 cache.put() 将资源增加到缓存中。它的原始响应会返回给浏览器以提供给调用它的页面。
* ServiceWorker连插件的请求都拦截了，这是因为ServiceWorker的优先级是最高的，它会拦截所有的请求，包括插件的请求。

``` javascript
const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

const cacheFirst = async (request) => {
  try {
    // 首先，尝试从缓存中获取资源
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
      return responseFromCache;
    }

    // 如果资源不存在缓存中，它们则会从网络中进行请求。
    // return fetch(request);

    // 然后尝试从网络中获取资源
    const responseFromNetwork = await fetch(request);
    // 拷贝放入缓存
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    return caches.match('/fallback.html');
  }
};

// 请求拦截
self.addEventListener('fetch', event => {
  event.respondWith(cacheFirst(event.request));
});
```

需要注意的是，性能的提升是相对于完全没有缓存的情况来讲的，而浏览器本身有着相对完善的HTTP缓存机制。所以使用Service Worker缓存，并不能使我们已经相对完善的架构有立竿见影的性能提升，Service Worker缓存真正有意义的地方在于，利用它可以更精准地、以编码方式控制缓存，如何缓存、缓存什么、如何更新缓存，完全取决于代码如何写，所以这提供了很大的自由度，但同时也带来维护成本。它只是换了一种缓存方式，而不是从无到有的突破。

---

### 9. HTML5 离线存储
HTML5的离线存储是基于一个 `manifest文件` (缓存清单文件，后缀为 `.appcache`)的缓存机制(不是存储技术)，通过这个文件上的清单解析离线存储资源，这些资源就会像cookie一样被存储了下来。之后当网络在处于离线状态时，浏览器会通过被离线存储的数据进行页面展示。
1. html 标签添加 manifest
   ``` html
    <html lang="en" manifest="index.manifest">
   ```
2. 配置manifest文件
    ```
    CACHE MANIFEST
    #v0.11
    CACHE:
    js/app.js
    css/style.css
    NETWORK:
    resourse/logo.png
    FALLBACK:
    / /offline.html
    ```
  * `CACHE` - 表示需要离线存储的资源列表
  * `NETWORK` - 表示不会被离线存储的资源。可以使用*，表示除 CACHE 外的所有其他资源。CACHE 优先级更高
  * `FALLBACK` - 表示如果访问第一个资源失败，那么就使用第二个资源来替换他，比如上面这个文件表示的就是如果访问根目录下任何一个资源失败了，那么就去访问 offline.html 。
  注意：`CACHE` 写在第一行
3. 使用 API `window.applicationCache`

更新缓存的方法：
* 更新 manifest 文件
* 通过 javascript 操作
* 清除浏览器缓存

---

### 10. iframe
优点：
* 用来加载速度较慢的内容（如广告）
* 可以使脚本可以并行下载
* 可以实现跨子域通信

缺点：
* iframe 会阻塞主页面的 onload 事件
* 无法被一些搜索引擎索识别
* 会产生很多页面，不容易管理

---

### 11. label 标签
label标签来定义表单控件的关系：当用户选择label标签时，浏览器会自动将焦点转到和label标签相关的表单控件上。
``` html
使用方法1
<label for="mobile">Number:</label>
<input type="text" id="mobile"/>

使用方法2
<label>Date:<input type="text"/></label>
```

---

### 12. Canvas vs SVG
#### SVG
SVG可缩放矢量图形（Scalable Vector Graphics）是基于可扩展标记语言XML描述的2D图形的语言，SVG基于XML就意味着SVG DOM中的每个元素都是可用的，可以为某个元素附加Javascript事件处理器。在 SVG 中，每个被绘制的图形均被视为对象。如果 SVG 对象的属性发生变化，那么浏览器能够自动重现图形。

其特点如下：
* 不依赖分辨率
* 支持事件处理器
* 最适合带有大型渲染区域的应用程序（比如谷歌地图）
* 复杂度高会减慢渲染速度（任何过度使用 DOM 的应用都不快）
* 不适合游戏应用

#### Canvas
Canvas是画布，通过Javascript来绘制2D图形，是逐像素进行渲染的。其位置发生改变，就会重新进行绘制。

其特点如下：
* 依赖分辨率
* 不支持事件处理器
* 弱的文本渲染能力
* 能够以 .png 或 .jpg 格式保存结果图像
* 最适合图像密集型的游戏，其中的许多对象会被频繁重绘

---

### 13. head 标签
`<head>` 标签用于定义文档的头部，它是所有头部元素的容器。`<head>` 中的元素可以引用脚本、指示浏览器在哪里找到样式表、提供元信息等。

文档的头部描述了文档的各种属性和信息，包括文档的标题、在 Web 中的位置以及和其他文档的关系等。绝大多数文档头部包含的数据都不会真正作为内容显示给读者。

下面这些标签可用在 head 部分：`<base>, <link>, <meta>, <script>, <style>, <title>`。 

其中 `<title>` 定义文档的标题，它是 head 部分中唯一必需的元素。

---