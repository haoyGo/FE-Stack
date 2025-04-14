## 图片预加载
* img标签
``` html
  <!-- 通过css隐藏标签，加载图片的请求仍会异步发出 -->
  <img src="https://test.jpeg" style="display: none" />
  ```

* Image对象
只要浏览器把图片下载到本地，同样的src就会使用缓存，这是最基本也是最实用的预载方法
``` js
const image = new Image()
image.src = "https://test.jpeg"
```


## 图片懒加载
``` html
<img
  src="https://gitee.com/z1725163126/cloundImg/raw/master/loading.gif"
  alt=""
  data-src="../../static/3.jpg"
  class="lazyload"
/>
```
``` js
 // 转换成数组方便处理
const imgList = [...document.querySelectorAll('.lazyload')]

// 实例化构造函数
const observer = new IntersectionObserver(entries => {
  //entries是一个数组，所以还需要遍历
  console.log(entries)
  entries.forEach(item => {
    //isIntersecting是否在可视区域展示
    if (item.isIntersecting) {
      //获取图片的自定义属性并赋值给src
      item.target.src = item.target.dataset.src // 注意dataset取值
      //替换为真是src地址后取消对它的观察
      observer.unobserve(item.target)
    }
  })
})

//遍历所有的图片，给每个图片添加观察
imgList.forEach(observer.observe)
```

* 懒加载对服务器前端有一定的缓解压力的作用.
* 预加载则会增加服务器前端的压力，换取更好的用户体验，这样可以使用户的操作得到最快的反映。

## JS 预加载
``` html
<!-- 异步加载完立即执行 -->
<script async src="index.js"></script>
<!-- 异步加载后，DOMConentLoaded 之前执行，并且有序 -->
<script defer src="index.js"></script>
<!-- 在主流的现代浏览器中，script 标签的属性可以加上 type="module"，浏览器会对其内部的 import 引用发起 HTTP 请求，获取模块内容。这时 script 的行为会像是 defer 一样，在后台下载，并且等待 DOM 解析 -->
<script type="module">import { a } from './a.js'</script>
<!-- preload 会高优加载 -->
<link rel="preload" as="script" href="index.js">
<!-- prefetch 会空闲加载 -->
<link rel="prefetch" as="script" href="index.js">

```