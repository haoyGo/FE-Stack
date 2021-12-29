
## 浏览器渲染流程
* 解析html建立dom树
* 解析css构建render树（将CSS代码解析成树形的数据结构，然后结合DOM合并成render树）
* 布局render树（Layout/reflow），负责各元素尺寸、位置的计算
* 绘制render树（paint），绘制页面像素信息
* 浏览器会将各层的信息发送给GPU，GPU会将各层合成（composite），显示在屏幕上。

渲染完毕后会触发load事件。
DOMContentLoaded 事件触发时，仅当DOM加载完成，不包括样式表，图片，脚本。

### css加载
* css 由单独的下载线程异步下载
* `css加载` 不会阻塞 DOM 树构建
* `css加载` 会阻塞render构建

### 图层
图层之间不会影响回流重绘，通过 `硬件加速` 可以开辟新图层。常用方式(css)：
* `transform: translate3d; transform: translateZ`
* `opacity`
* `will-change: transform;`