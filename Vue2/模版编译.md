## Vue2 模版编译
vue2 提供了两个构建版本
* vue.js：完整版本，包含模版编译的能力
* vue.runtime.js：运行时版本，不提供模版编译能力，需要通过 vue-loader 进行提前编译。

### 预编译
对于 Vue 组件来说，模版编译只会在组件实例化时候编译一次，生成 `render` 后不会再编译。编译对组件的 `runtime` 是一种性能损耗。所以模版编译的过程可以在构建（build）时候完成。
比如 `webpack` 的 `vue-loader` 依赖了 `vue-template-compiler` 模块，在 webpack 构建（build）过程中，将 `template` 预编译成 `render`，在 `runtime` 直接跳过模版编译过程。

### 编译
首先获取 `render`，没有则将 `template` 转换为 `render`，通过函数 `compileToFunctions`
``` js
// 省略了部分代码，只保留了关键部分
import { compileToFunctions } from './compiler/index'

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (el) {
  const options = this.$options
  
  // 如果没有 render 方法，则进行 template 编译
  if (!options.render) {
    let template = options.template
    if (template) {
      // 调用 compileToFunctions，编译 template，得到 render 方法
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      // 这里的 render 方法就是生成生成虚拟 DOM 的方法
      options.render = render
    }
  }
  return mount.call(this, el, hydrating)
}
```

``` js
import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

// 通过 createCompiler 方法生成编译函数
const { compile, compileToFunctions } = createCompiler(baseOptions)
export { compile, compileToFunctions }
```

主要由几个步骤：
* parse：template string -> AST，得到指令、class、style等数据。
* optimize：寻找 AST 中的静态节点进行标记，为后面 VNode 的 patch 过程中对比做优化。被标记为 static 的节点在后面的 diff 算法中会被直接忽略，不做详细的比较。
* generate：根据 AST 结构拼接生成 render 函数的字符串。

``` js
export function createCompiler(baseOptions) {
  const baseCompile = (template, options) => {
    // 解析 html，转化为 ast
    const ast = parse(template.trim(), options)
    // 优化 ast，标记静态节点
    optimize(ast, options)
    // 将 ast 转化为可执行代码
    const code = generate(ast, options)
    return {
      ast,
      render: code.render,
      staticRenderFns: code.staticRenderFns
    }
  }
  const compile = (template, options) => {
    const tips = []
    const errors = []
    // 收集编译过程中的错误信息
    options.warn = (msg, tip) => {
      (tip ? tips : errors).push(msg)
    }
    // 编译
    const compiled = baseCompile(template, options)
    compiled.errors = errors
    compiled.tips = tips

    return compiled
  }
  const createCompileToFunctionFn = () => {
    // 编译缓存
    const cache = Object.create(null)
    return (template, options, vm) => {
      // 已编译模板直接走缓存
      if (cache[template]) {
        return cache[template]
      }
      const compiled = compile(template, options)
    	return (cache[key] = compiled)
    }
  }
  return {
    compile,
    compileToFunctions: createCompileToFunctionFn(compile)
  }
}
```

### parse
简化后的 `parseHTML`，`while` 循环中每次`截取`一段 `html` 文本，然后通过`正则`判断文本的类型进行处理，这就类似于编译原理中常用的有限状态机。每次拿到 "<" 字符前后的文本，"<" 字符前的就当做文本处理，"<" 字符后的通过正则判断，可推算出有限的几种状态。

``` js
import { parseHTML } from './html-parser'

export function parse(template, options) {
  let root
  parseHTML(template, {
    // some options...
    start() {}, // 解析到标签位置开始的回调
    end() {}, // 解析到标签位置结束的回调
    chars() {}, // 解析到文本时的回调
    comment() {} // 解析到注释时的回调
  })
  return root
}

export function parseHTML(html, options) {
  let index = 0
  let last,lastTag
  const stack = []
  while(html) {
    last = html
    let textEnd = html.indexOf('<')

    // "<" 字符在当前 html 字符串开始位置
    if (textEnd === 0) {
      // 1、匹配到注释: <!-- -->
      if (/^<!\--/.test(html)) {
        const commentEnd = html.indexOf('-->')
        if (commentEnd >= 0) {
          // 调用 options.comment 回调，传入注释内容
          options.comment(html.substring(4, commentEnd))
          // 裁切掉注释部分
          advance(commentEnd + 3)
          continue
        }
      }

      // 2、匹配到条件注释: <![if !IE]>  <![endif]>
      if (/^<!\[/.test(html)) {
        // ... 逻辑与匹配到注释类似
      }

      // 3、匹配到 Doctype: <!DOCTYPE html>
      const doctypeMatch = html.match(/^<!DOCTYPE [^>]+>/i)
      if (doctypeMatch) {
        // ... 逻辑与匹配到注释类似
      }

      // 4、匹配到结束标签: </div>
      const endTagMatch = html.match(endTag)
      if (endTagMatch) {}

      // 5、匹配到开始标签: <div>
      const startTagMatch = parseStartTag()
      if (startTagMatch) {}
    }
    // "<" 字符在当前 html 字符串中间位置
    let text, rest, next
    if (textEnd > 0) {
      // 提取中间字符
      rest = html.slice(textEnd)
      // 这一部分当成文本处理
      text = html.substring(0, textEnd)
      advance(textEnd)
    }
    // "<" 字符在当前 html 字符串中不存在
    if (textEnd < 0) {
      text = html
      html = ''
    }
    
    // 如果存在 text 文本
    // 调用 options.chars 回调，传入 text 文本
    if (options.chars && text) {
      // 字符相关回调
      options.chars(text)
    }
  }
  // 向前推进，裁切 html
  function advance(n) {
    index += n
    html = html.substring(n)
  }
}

// 判断是否标签开始位置，如果是，则提取标签名以及相关属性
function parseStartTag () {
  // 提取 <xxx
  const start = html.match(startTagOpen)
  if (start) {
    const [fullStr, tag] = start
    const match = {
      attrs: [],
      start: index,
      tagName: tag,
    }
    advance(fullStr.length)
    let end, attr
    // 递归提取属性，直到出现 ">" 或 "/>" 字符
    while (
      !(end = html.match(startTagClose)) &&
      (attr = html.match(attribute))
    ) {
      advance(attr[0].length)
      match.attrs.push(attr)
    }
    if (end) {
      // 如果是 "/>" 表示单标签
      match.unarySlash = end[1]
      advance(end[0].length)
      match.end = index
      return match
    }
  }
}

// 处理开始标签
function handleStartTag (match) {
  const tagName = match.tagName
  const unary = match.unarySlash
  const len = match.attrs.length
  const attrs = new Array(len)
  for (let i = 0; i < l; i++) {
    const args = match.attrs[i]
    // 这里的 3、4、5 分别对应三种不同复制属性的方式
    // 3: attr="xxx" 双引号
    // 4: attr='xxx' 单引号
    // 5: attr=xxx   省略引号
    const value = args[3] || args[4] || args[5] || ''
    attrs[i] = {
      name: args[1],
      value
    }
  }

  if (!unary) {
    // 非单标签，入栈
    stack.push({
      tag: tagName,
      lowerCasedTag:
      tagName.toLowerCase(),
      attrs: attrs
    })
    lastTag = tagName
  }

  if (options.start) {
    // 开始标签的回调
    options.start(tagName, attrs, unary, match.start, match.end)
  }
}

// 处理闭合标签
function parseEndTag (tagName, start, end) {
  let pos, lowerCasedTagName
  if (start == null) start = index
  if (end == null) end = index

  if (tagName) {
    lowerCasedTagName = tagName.toLowerCase()
  }

  // 在栈内查找相同类型的未闭合标签
  if (tagName) {
    for (pos = stack.length - 1; pos >= 0; pos--) {
      if (stack[pos].lowerCasedTag === lowerCasedTagName) {
        break
      }
    }
  } else {
    pos = 0
  }

  if (pos >= 0) {
    // 关闭该标签内的未闭合标签，更新堆栈
    for (let i = stack.length - 1; i >= pos; i--) {
      if (options.end) {
        // end 回调
        options.end(stack[i].tag, start, end)
      }
    }

    // 堆栈中删除已关闭标签
    stack.length = pos
    lastTag = pos && stack[pos - 1].tag
  }
}

```

#### 处理开始标签
首先看解析到开始标签时，会生成一个 AST 节点，然后处理标签上的属性，最后将 AST 节点放入树形结构中
``` js
function makeAttrsMap(attrs) {
  const map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    const { name, value } = attrs[i]
    map[name] = value
  }
  return map
}
function createASTElement(tag, attrs, parent) {
  const attrsList = attrs
  const attrsMap = makeAttrsMap(attrsList)
  return {
    type: 1,       // 节点类型
    tag,           // 节点名称
    attrsMap,      // 节点属性映射
    attrsList,     // 节点属性数组
    parent,        // 父节点
    children: [],  // 子节点
  }
}

const stack = []
let root // 根节点
let currentParent // 暂存当前的父节点
parseHTML(template, {
  // some options...

  // 解析到标签位置开始的回调
  start(tag, attrs, unary) {
    // 创建 AST 节点
    let element = createASTElement(tag, attrs, currentParent)

    // 处理指令: v-for v-if v-once
    processFor(element)
    processIf(element)
    processOnce(element)
    processElement(element, options)

    // 处理 AST 树
    // 根节点不存在，则设置该元素为根节点
   	if (!root) {
      root = element
      checkRootConstraints(root)
    }
    // 存在父节点
    if (currentParent) {
      // 将该元素推入父节点的子节点中
      currentParent.children.push(element)
      element.parent = currentParent
    }
    if (!unary) {
    	// 非单标签需要入栈，且切换当前父元素的位置
      currentParent = element
      stack.push(element)
    }
  }
})
```

#### 处理结束标签
标签结束的逻辑就比较简单了，只需要去除栈内最后一个未闭合标签，进行闭合即可。
``` js
parseHTML(template, {
  // some options...

  // 解析到标签位置结束的回调
  end() {
    const element = stack[stack.length - 1]
    const lastNode = element.children[element.children.length - 1]
    // 处理尾部空格的情况
    if (lastNode && lastNode.type === 3 && lastNode.text === ' ') {
      element.children.pop()
    }
    // 出栈，重置当前的父节点
    stack.length -= 1
    currentParent = stack[stack.length - 1]
  }
})
```

#### 处理文本
处理完标签后，还需要对标签内的文本进行处理。文本的处理分两种情况，一种是带表达式的文本，还一种就是纯静态的文本。
``` js
parseHTML(template, {
  // some options...

  // 解析到文本时的回调
  chars(text) {
    if (!currentParent) {
      // 文本节点外如果没有父节点则不处理
      return
    }
    
    const children = currentParent.children
    text = text.trim()
    if (text) {
      // parseText 用来解析表达式
      // delimiters 表示表达式标识符，默认为 ['{{', '}}']
      const res = parseText(text, delimiters))
      if (res) {
        // 表达式
        children.push({
          type: 2,
          expression: res.expression,
          tokens: res.tokens,
          text
        })
      } else {
        // 静态文本
        children.push({
          type: 3,
          text
        })
      }
    }
  }
})

// 构造匹配表达式的正则
const buildRegex = delimiters => {
  const open = delimiters[0]
  const close = delimiters[1]
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
}

function parseText (text, delimiters){
  // delimiters 默认为 {{ }}
  const tagRE = buildRegex(delimiters || ['{{', '}}'])
  // 未匹配到表达式，直接返回
  if (!tagRE.test(text)) {
    return
  }
  const tokens = []
  const rawTokens = []
  let lastIndex = tagRE.lastIndex = 0
  let match, index, tokenValue
  while ((match = tagRE.exec(text))) {
    // 表达式开始的位置
    index = match.index
    // 提取表达式开始位置前面的静态字符，放入 token 中
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index))
      tokens.push(JSON.stringify(tokenValue))
    }
    // 提取表达式内部的内容，使用 _s() 方法包裹
    const exp = match[1].trim()
    tokens.push(`_s(${exp})`)
    rawTokens.push({ '@binding': exp })
    lastIndex = index + match[0].length
  }
  // 表达式后面还有其他静态字符，放入 token 中
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex))
    tokens.push(JSON.stringify(tokenValue))
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}

```

### optimize
通过上述一些列处理，我们就得到了 Vue 模板的 AST。由于 Vue 是响应式设计，所以拿到 AST 之后还需要进行一系列优化，确保静态的数据不会进入虚拟 DOM 的更新阶段，以此来优化性能。
简单来说，就是把所以静态节点的 static 属性设置为 true。
``` js
export function optimize (root, options) {
  if (!root) return
  // 标记静态节点
  markStatic(root)
}

function isStatic (node) {
  if (node.type === 2) { // 表达式，返回 false
    return false
  }
  if (node.type === 3) { // 静态文本，返回 true
    return true
  }
  // 此处省略了部分条件
  return !!(
    !node.hasBindings && // 没有动态绑定
    !node.if && !node.for && // 没有 v-if/v-for
    !isBuiltInTag(node.tag) && // 不是内置组件 slot/component
    !isDirectChildOfTemplateFor(node) && // 不在 template for 循环内
    Object.keys(node).every(isStaticKey) // 非静态节点
  )
}

function markStatic (node) {
  node.static = isStatic(node)
  if (node.type === 1) {
    // 如果是元素节点，需要遍历所有子节点
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      if (!child.static) {
        // 如果有一个子节点不是静态节点，则该节点也必须是动态的
        node.static = false
      }
    }
  }
}
```

### generate
得到优化的 AST 之后，就需要将 AST 转化为 render 方法。还是用之前的模板，先看看生成的代码长什么样
``` html
<div>
  <h2 v-if="message">{{message}}</h2>
  <button @click="showName">showName</button>
</div>
```
解析 `template` 生成的 `render` 函数。
看到这里一堆的下划线肯定很懵逼，这里的 `_c` 对应的是虚拟 DOM 中的 `createElement` 方法。其他的下划线方法在 `core/instance/render-helpers` 中都有定义，每个方法具体做了什么不做展开。
``` js
with (this) {
    return _c(
      'div',
      [
        (message) ? _c('h2', [_v(_s(message))]) : _e(),
        _v(' '),
        _c('button', { on: { click: showName } }, [_v('showName')])
      ])
    ;
}
```

``` js
const compiler = require('vue-template-compiler')
// 插值
// const template =  ` <p>{{message}}</p> ` 
// 编译
const res = compiler.compile(template)
console.log(res.render)
// with(this){return _c('p',[_v(_s(message))])}
```
其中 this 在vue中就是 vm 实例，所以 _c _v _s 就是vue源码中的一些函数，所以我们去源码中搜索一下这几个函数的意义。
``` js
// 从 vue 源码中找到缩写函数的含义
function installRenderHelpers (target) {
    target._c = createElement//创建vnode
    target._o = markOnce;
    target._n = toNumber;
    target._s = toString;
    target._l = renderList;
    target._t = renderSlot;
    target._q = looseEqual;
    target._i = looseIndexOf;
    target._m = renderStatic;
    target._f = resolveFilter;
    target._k = checkKeyCodes;
    target._b = bindObjectProps;
    target._v = createTextVNode;
    target._e = createEmptyVNode;
    target._u = resolveScopedSlots;
    target._g = bindObjectListeners;
    target._d = bindDynamicKeys;
    target._p = prependModifier;
}
```
所以转换后
``` js
with(this){return createElement('p',[createTextVNode(toString(message))])}
```


具体转化方法就是一些简单的字符拼接，下面是简化了逻辑的部分，不做过多讲述。
``` js
export function generate(ast, options) {
  const state = new CodegenState(options)
  const code = ast ? genElement(ast, state) : '_c("div")'
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}

export function genElement (el, state) {
  let code
  const data = genData(el, state)
  const children = genChildren(el, state, true)
  code = `_c('${el.tag}'${
    data ? `,${data}` : '' // data
  }${
    children ? `,${children}` : '' // children
  })`
  return code
}

```