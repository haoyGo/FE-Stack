### viewport
移动设备浏览器的可视区域，比pc浏览器小的多，所以移动设备有viewport这样的概念，为了能够正常显示页面，会比可视区域大（例如980px），所以会出现横向滚动条。
* viewport(layout viewport) 的获取：`document.documentElement.clientWidth`
* 可视区域(visual viewport)的获取：`window.innerWidth`
* 此外还有 `ideal viewport`

移动设备默认的viewport是 `layout viewport`，也就是那个比屏幕要宽的viewport，但在进行移动设备网站的开发时，我们需要的是 `ideal viewport`。那么怎么才能得到ideal viewport呢？这就该轮到 `meta标签` 出场了:
`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
`

| 值              | 可能的附加值                        | 描述                                                                                                                                   |
|-----------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `width`         | 一个正整数，或者字符串 device-width  | 定义 viewport 的宽度，如果值为正整数，则单位为像素。或者设置为设备宽度。                                                                   |
| `height`        | 一个正整数，或者字符串 device-height | 定义 viewport 的高度。未被任何浏览器使用。                                                                                               |
| `initial-scale` | 一个 0.0 和 10.0 之间的正数         | 定义设备宽度（宽度和高度中更小的那个：如果是纵向屏幕，就是 device-width，如果是横向屏幕，就是 device-height）与 viewport 大小之间的缩放比例。 |
| `maximum-scale` | 一个 0.0 和 10.0 之间的正数         | 定义缩放的最大值，必须大于等于 minimum-scale，否则表现将不可预测。浏览器设置可以忽略此规则；iOS 10 开始，Safari iOS 默认忽略此规则。         |
| `minimum-scale` | 一个 0.0 和 10.0 之间的正数         | 定义缩放的最小值，必须小于等于 maximum-scale，否则表现将不可预测。浏览器设置可以忽略此规则；iOS 10 开始，Safari iOS 默认忽略此规则。         |
| `user-scalable` | yes 或者 no                         | 默认为 yes，如果设置为 no，用户将无法缩放当前页面。浏览器设置可以忽略此规则；iOS 10 开始，Safari iOS 默认忽略此规则。                        |

#### 动态更改
``` html
<meta id="testViewport" name="viewport" content="width = 380">
<script>
var mvp = document.getElementById('testViewport');
mvp.setAttribute('content','width=480');
</script>
```


---

pc上 **1CSS像素** 基本等于 **1物理像素**。
随着技术的发展，移动设备的屏幕像素密度越高。例如苹果推出的 `Retina(视网膜)屏`，就是CSS像素大小固定，物理像素增加了倍数，`window.devicePixelRatio` 用来表示 **设备物理像素和设备独立像素的比例**。

#### 一像素问题
* 伪类 + transform
  这种方式的原理很简单，就是把原先元素的 border 去掉，然后利用 :before 或者 :after 重做 border ，并 transform 的 scale 缩小一半，原先的元素相对定位，新做的 border 绝对定位。个人认为这是比较完美的做法。
  ``` css
  li {position: relative;}
  li:after {
    position: absolute;
    bottom:0;
    left:0;
    content: '';
    width:100%;
    height:1px;
    border-top:1px solid black;
    transform: scaleY(0.5);//注意兼容性
  }
  ```

* 媒体查询 + transform
  ``` css
  /* 2倍屏 */
  @media only screen and (-webkit-min-device-pixel-ratio: 2.0) {
      .border-bottom::after {
          -webkit-transform: scaleY(0.5);
          transform: scaleY(0.5);
      }
  }
  /* 3倍屏 */
  @media only screen and (-webkit-min-device-pixel-ratio: 3.0) {
      .border-bottom::after {
          -webkit-transform: scaleY(0.33);
          transform: scaleY(0.33);
      }
  }
  ```

* viewport + rem
  同时通过设置对应viewport的rem基准值，这种方式就可以像以前一样轻松愉快的写1px了。
  ``` js
  var viewport = document.querySelector("meta[name=viewport]");  
  //下面是根据设备像素设置viewport  
  if (window.devicePixelRatio == 1) {  
      viewport.setAttribute('content', 'width=device-width,initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no');  
  }  
  if (window.devicePixelRatio == 2) {  
      viewport.setAttribute('content', 'width=device-width,initial-scale=0.5, maximum-scale=0.5, minimum-scale=0.5, user-scalable=no');  
  }  
  if (window.devicePixelRatio == 3) {  
      viewport.setAttribute('content', 'width=device-width,initial-scale=0.3333333333333333, maximum-scale=0.3333333333333333, minimum-scale=0.3333333333333333, user-scalable=no');  
  }  
  var docEl = document.documentElement;  
  var fontsize = 10 * (docEl.clientWidth / 320) + 'px';  
  docEl.style.fontSize = fontsize;  
  ```


### rem布局
rem是相对于根元素（html）的字体大小的单位。在移动端布局中，我们通常使用rem来实现页面的等比缩放。

#### 原理
* 1rem = html根元素设定的font-size的px值
* 将px转换为rem时，需要将px值除以根元素的font-size值

#### 实现方案
1. 动态设置根元素font-size
```js
// 以750px设计稿为例
function setRem() {
    const baseSize = 100; // 基准值
    const designWidth = 750; // 设计稿宽度
    const scale = document.documentElement.clientWidth / designWidth;
    document.documentElement.style.fontSize = baseSize * scale + 'px';
}

// 初始化
setRem();
// 窗口变化时重新设置
window.addEventListener('resize', setRem);
```

2. 使用 postcss-pxtorem 插件
```js
// postcss.config.js
module.exports = {
    plugins: {
        'postcss-pxtorem': {
            rootValue: 100, // 根元素字体大小
            propList: ['*'], // 需要转换的属性
            minPixelValue: 2 // 小于2px的不转换
        }
    }
}
```

#### 注意事项
* 字体不建议使用rem，会导致字体大小不稳定
* 设置meta标签viewport，禁止用户缩放
* 考虑屏幕最大最小宽度的限制

### 移动端性能优化
#### 首屏加载优化
* 路由懒加载
* 图片懒加载
* 组件按需加载
* 服务端渲染SSR
* 静态资源预加载
* 合理使用缓存策略

#### 渲染性能优化
* 避免重绘重排
* 使用transform代替位移
* 合理使用will-change
* 开启GPU加速
* 防抖节流
* 虚拟列表

### 调试与监控
#### 真机调试
* Chrome Remote Debug
* Safari Web Inspector
* vConsole/eruda等工具
* Charles/Fiddler抓包

#### 性能监控
* Performance API
* 首屏加载时间
* 页面白屏时间
* FPS监控
* 内存泄漏

#### 错误监控
* try-catch
* window.onerror
* unhandledrejection
* 资源加载错误
* 接口错误监控
* 错误上报和分析

### 安全性
#### XSS防范
* 输入过滤
* 输出转义
* CSP内容安全策略
* HttpOnly Cookie

#### CSRF防范
* 验证码
* Referer验证
* Token验证
* SameSite Cookie

#### 其他安全措施
* HTTPS
* 敏感数据加密
* 防止SQL注入
* 防止点击劫持
* 防止恶意第三方代码注入