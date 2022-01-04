## 跨域
跨域并不是请求发不出去，请求能发出去，服务端能收到请求并正常返回结果，只是结果被**浏览器拦截**。

### 浏览器同源策略
所谓同源是指 `协议+域名+端口` 三者相同，即便两个不同的域名指向同一个ip地址，也非同源。

同源策略限制内容有：
* `Cookie、LocalStorage、IndexedDB` 等存储性内容
* `DOM 节点`
* `AJAX` 请求发送后，结果被浏览器拦截了

但是有三个标签是允许跨域加载资源：
* `<img src=XXX>`
* `<script src=XXX>`
* `<link href=XXX>`

### 跨域解决方案
#### 1. jsonp
  * 利用 `<script>` 标签没有跨域限制的漏洞，网页可以得到从其他来源动态产生的 JSON 数据。JSONP请求一定需要对方的服务器做支持才可以。
  * 原理是浏览器定义好回调函数的实现，服务端返回回调函数的调用，回调函数传参即为返回数据。
  * JSONP优点是**简单兼容性好**，可用于解决主流浏览器的跨域数据访问的问题。缺点是**仅支持get方法**具有局限性,不安全可能会遭受XSS攻击。
  * 实现
  ``` js
  // index.html
  function jsonp({ url, params, callback }) {
    return new Promise((resolve, reject) => {
      let script = document.createElement('script')
      window[callback] = function(data) {
        resolve(data)
        document.body.removeChild(script)
      }
      params = { ...params, callback } // wd=b&callback=show
      let arrs = []
      for (let key in params) {
        arrs.push(`${key}=${params[key]}`)
      }
      script.src = `${url}?${arrs.join('&')}`
      document.body.appendChild(script)
    })
  }
  jsonp({
    url: 'http://localhost:3000/say',
    params: { wd: 'Iloveyou' },
    callback: 'show'
  }).then(data => {
    console.log(data)
  })

  // // server.js
  let express = require('express')
  let app = express()
  app.get('/say', function(req, res) {
    let { wd, callback } = req.query
    console.log(wd) // Iloveyou
    console.log(callback) // show
    res.end(`${callback}('我不爱你')`)
  })
  app.listen(3000)
  ```
  上面这段代码相当于向http://localhost:3000/say?wd=Iloveyou&callback=show这个地址请求数据，然后后台返回show('我不爱你')，最后会运行show()这个函数，打印出'我不爱你'

#### 2. CORS
浏览器会自动进行CORS通信，实现CORS通信的关键是后端。只要后端实现了CORS，就实现了跨域。服务端设置 `Access-Control-Allow-Origin` 就可以开启 CORS。 该属性表示哪些域名可以访问资源，如果设置通配符则表示所有网站都可以访问资源。

* 简单请求
  * method: `GET/POST/HEAD`
  * Content-Type: 
    * `text/plain`
    * `multipart/form-data`
    * `application/x-www-form-urlencoded`

* 复杂请求
不满足上面条件的属于复杂请求，复杂请求的CORS请求，会在正式通信之前，增加一次HTTP查询请求，称为**预检请求**,该请求是 `option` 方法的，通过该请求来知道服务端是否允许跨域请求。

#### 3. [postMessage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)
`postMessage` 是 `HTML5 XMLHttpRequest Level 2` 中的API，且是为数不多可以跨域操作的window属性之一。
postMessage()方法允许来自不同源的脚本采用异步方式进行有限的通信，可以实现跨文本档、多窗口、跨域消息传递。

#### 4. websocket
`Websocket` 是HTML5的一个持久化的协议，它实现了浏览器与服务器的**全双工通信**，同时也是跨域的一种解决方案。在建立连接之后，WebSocket 的 `server` 与 `client` 都能主动向对方发送或接收数据。
WebSocket和HTTP都是应用层协议，都基于 `TCP` 协议。

#### 5. Node中间件代理(两次跨域)
同源策略是浏览器需要遵循的标准，而如果是服务器向服务器请求就无需遵循同源策略。

#### 6. nginx反向代理
实现原理类似于Node中间件代理，需要你搭建一个中转nginx服务器，用于转发请求。
使用nginx反向代理实现跨域，是最简单的跨域方式。只需要修改nginx的配置即可解决跨域问题，支持所有浏览器，支持session，不需要修改任何代码，并且不会影响服务器性能。