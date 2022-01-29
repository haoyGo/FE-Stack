## CSS
### CSS 选择器及其优先级
* `!important` 优先级最高
* 内联/行内样式：1000
* id 选择器：100
* 类选择器、伪类选择器、属性选择器：10
* 标签选择器、伪元素选择器：1

| 选择器 | 格式 | 优先级权重 |
| --- | --- | --- |
| id选择器 | #id | 100 |
| 类选择 | .classname | 10 |
| 属性选择器 | a[ref=“eee”] | 10 |
| 伪类选择器 | li:last-child | 10 |
| 标签选择器 | div | 1 |
| 伪元素选择器 | li:after | 1 |
| 相邻兄弟选择器 | h1+p | 0 |
| 子选择器 | ul>li | 0 |
| 后代选择器 | li a | 0 |
| 通配符选择器 | * | 0 |

---

### 属性继承
#### 不可继承
* 盒子属性
  * `display`
  * `width、height、min-width、min-height、max-width、max-height、margin、border、padding`
* 文本属性
  * vertical-align：垂直文本对齐
  * text-decoration：规定添加到文本的装饰
  * text-shadow：文本阴影效果
  * white-space：空白符的处理
  * unicode-bidi：设置文本的方向
* 背景属性
  * `background、background-color、background-image、background-repeat、background-position、background-attachment`
* 定位属性
  * `float、clear、position、top、right、bottom、left、overflow、clip、z-index`
* 轮廓样式属性
  * `outline-style、outline-width、outline-color、outline`

#### 可继承
* 字体系列属性
  * font-family：字体系列
  * font-weight：字体的粗细
  * font-size：字体的大小
  * font-style：字体的风格
* 文本属性
  * text-indent：文本缩进
  * text-align：文本水平对齐
  * line-height：行高
  * word-spacing：单词之间的间距
  * letter-spacing：中文或者字母之间的间距
  * text-transform：控制文本大小写（就是uppercase、lowercase、capitalize这三个）
  * color：文本颜色
* 元素可见性
  * `visibility`
* 列表布局属性
  * list-style：列表风格，包括list-style-type、list-style-image等
* 光标属性
  * cursor：光标显示为何种形态

---

### display
* block：独占一行，可以设置 `width、height、margin、padding`；
* inline：元素不会独占一行，设置width、height属性无效。**但可以设置水平方向的margin和padding属性，不能设置垂直方向的padding和margin**；
* inline-block：元素不会独占一行，可以设置 `width、height、margin、padding`。

---

### 隐藏标签
* `display: none`。不会在页面中占据位置，也不会响应绑定的监听事件
* `visibility: hidden`。元素在页面中仍占据空间，但是不会响应绑定的监听事件。
* `opacity: 0`。元素在页面中仍然占据空间，并且能够响应元素绑定的监听事件。
* `position: absolute`
* `z-index: 负值`
* `transform: scale(0,0)`。将元素缩放为 0，来实现元素的隐藏。这种方法下，元素仍在页面中占据位置，但是不会响应绑定的监听事件
* `clip/clip-path`。使用元素裁剪的方法来实现元素的隐藏，这种方法下，元素仍在页面中占据位置，但是不会响应绑定的监听事件。