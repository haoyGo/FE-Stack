## Dom 事件
`DOM级别` 一共可以分为四个级别：`DOM0级、DOM1级、DOM2级和DOM3级`。而 `DOM事件` 分为3个级别：`DOM 0级事件处理，DOM 2级事件处理和DOM 3级事件处理`。由于DOM 1级中没有事件的相关内容，所以没有DOM 1级事件。

### DOM事件模型
DOM事件模型分为 `捕获和冒泡`。一个事件发生后，会在子元素和父元素之间传播（propagation）。这种传播分成三个阶段。
* 捕获阶段：事件从 `window` 自上而下向 `目标节点` 传播的阶段；
* 目标阶段：真正的 `目标节点` 正在处理事件的阶段；
* 冒泡阶段：事件从 `目标节点` 自下而上向 `window` 传播的阶段。

### 0级事件
``` js
// 例1
var btn = document.getElementById('btn');
btn.onclick = function(){
  alert(this.innerHTML);
}
```
* 不允许绑定多个同类型事件，会被**覆盖**
* 事件只能在**冒泡阶段**触发

### 2级事件
`el.addEventListener(event-name, callback, useCapture)`
``` js
// 例2
var btn = document.getElementById('btn');
btn.addEventListener("click", test, false);
function test(e){
    e = e || window.event;
    alert((e.target || e.srcElement).innerHTML);
    btn.removeEventListener("click", test)
}
//IE9-: attachEvent()与detachEvent()。只能冒泡阶段触发
//IE9+/chrome/FF: addEventListener()和removeEventListener()
```
* useCapture: 默认是false，代表事件句柄在冒泡阶段执行

### 3级事件
在DOM 2级事件的基础上添加了更多的事件类型：
* UI事件，当用户与页面上的元素交互时触发，如：load、scroll
* 焦点事件，当元素获得或失去焦点时触发，如：blur、focus
* 鼠标事件，当用户通过鼠标在页面执行操作时触发如：dblclick、mouseup
* 滚轮事件，当使用鼠标滚轮或类似设备时触发，如：mousewheel
* 文本事件，当在文档中输入文本时触发，如：textInput
* 键盘事件，当用户通过键盘在页面上执行操作时触发，如：keydown、keypress
* 合成事件，当为IME（输入法编辑器）输入字符时触发，如：compositionstart
* 变动事件，当底层DOM结构发生变化时触发，如：DOMsubtreeModified
* 同时DOM3级事件也允许使用者自定义一些事件。

### 事件代理/事件委托
由于事件会在冒泡阶段向上传播到父节点，因此可以把子节点的监听函数定义在父节点上，由父节点的监听函数统一处理多个子元素的事件。这种方法叫做事件的代理（delegation）。
* 减少内存消耗，提高性能
  * 如果给每个列表项一一都绑定一个函数，那对于内存消耗是非常大的，效率上需要消耗很多性能。借助事件代理，我们只需要给父容器ul绑定方法即可，这样不管点击的是哪一个后代元素，都会根据冒泡传播的传递机制，把容器的click行为触发，然后把对应的方法执行，根据事件源，我们可以知道点击的是谁，从而完成不同的事。
* 动态绑定事件
  * 在很多时候，我们需要通过用户操作动态的增删列表项元素，如果一开始给每个子元素绑定事件，那么在列表发生变化时，就需要重新给新增的元素绑定事件，给即将删去的元素解绑事件，如果用事件代理就会省去很多这样麻烦。

``` html
<ul id="list">
  <li>item 1</li>
  <li>item 2</li>
  <li>item 3</li>
  ......
  <li>item n</li>
</ul>

<script>
  // 给父层元素绑定事件
document.getElementById('list').addEventListener('click', function (e) {
  // 兼容性处理
  var event = e || window.event;
  var target = event.target || event.srcElement;
  // 判断是否匹配目标元素
  if (target.nodeName.toLocaleLowerCase === 'li') {
    console.log('the content is: ', target.innerHTML);
  }
});
</script>
```