## 浏览器渲染流程
* 解析html建立dom树
* 解析css构建render树（将CSS代码解析成树形的数据结构，然后结合DOM合并成render树）
* 布局render树（Layout/reflow），负责各元素尺寸、位置的计算
* 绘制render树（paint），绘制页面像素信息
* 浏览器会将各层的信息发送给GPU，GPU会将各层合成（composite），显示在屏幕上。

渲染完毕后会触发load事件。
DOMContentLoaded 事件触发时，仅当DOM加载完成，不包括样式表，图片，脚本。

---

 * CSS 不会阻塞 DOM 的解析（构建），但会阻塞 DOM 渲染。
 * JS 阻塞 DOM 解析（构建），但浏览器会预先下载相关资源。
 * 浏览器遇到 `<script>` 且没有defer或async属性的 标签时，会触发页面渲染，因而如果前面CSS资源尚未加载完毕时，浏览器会等待它加载完毕在执行脚本。
 所以，`<script>` 最好放底部，`<link>` 最好放头部，如果头部同时有 `<script>` 与 `<link>` 的情况下，最好将 `<script>` 放在 `<link>` 上面

---

### css加载
* css 由单独的下载线程异步下载
* `css加载` 不会阻塞 DOM 树构建
* `css加载` 会阻塞render构建
---

### 图层
图层之间不会影响回流重绘，通过 `硬件加速` 可以开辟新图层。常用方式(css)：
* `transform: translate3d; transform: translateZ`
* `opacity`
* `will-change: transform;`

---

### 避免浏览器过多回流
* 合并多次 DOM 操作，CSS 操作
* 使用 `createDocumentFragment`，或者设置 CSS `display: none` 进行操作
* 获取布局信息，会强制浏览刷新，应该进行缓存使用
  clientHeight/clientWidth、offsetHeight/offsetWidth、scrollHeight/scrollWidth、getBoundingClientRect()、getComputedStyle() 等