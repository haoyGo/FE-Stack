## Vue-Router
### 使用方法
``` js
import Router from './router'
import App from 'app.vue'

// 作为插件 use，会调用 Router.install 方法
Vue.use(Router)

const router = new Router({
  routes: []
})

new Vue({
  router,
  render: h => h(App)
})
```

``` js
class Router {
  constructor(){}
}
Router.install = function(Vue) {
  Vue.mixin({
    beforeCreate(){
      // $options.router存在则表示是根组件
      if (this.$options && this.$options.router) {
        this._root = this
        this._router = this.$options.router
        Vue.util.defineReactive(this, 'current', this._router.history)
      } else {
        // 不是根组件则从父组件中获取，不断往上递归直到 _root
        this._root = this.$parent._root
      }
      
      // 使用$router代理对this._root._router的访问
      Object.defineProperty(this, '$router', {
        get() {
          return this._root._router
        }
      })
    }
  })
}
```
`install` 方法接收一个 `Vue实例/构造函数` 作为参数，通过 `Vue.mixin()` 全局混入 `beforeCreated` 生命周期钩子；通过 `Vue实例` 暴露的工具方法 `defineReactive` 将 `current` 属性变成一个监视者。

为了避免在使用过程中对 `_router` 的修改，所以通过 `Object.defineProperty` 设置一个只读属性 `$router`，并使用它代理对 `this._root._router` 的访问。

``` js
class HistoryRoute {
  constructor() {
    this.current = null
  }
}
class Router {
  // options 为初始化时的参数
  constructor(options) {
    this.mode = options.mode || 'hash'
    this.routes = options.routes || []
    this.history = new HistoryRoute
    this.init()
  }
  init() {
    if (this.mode === 'hash') {
      // 初始化一个#
      location.hash ? '' : location.hash = '/'
      // 页面加载完成获取当前路由
      window.addEventListener('load', () => {
        this.history.current = location.hash.slice(1)
      })
      window.addEventListener('hashchange', () => {
        this.history.current = location.hash.slice(1)
      })
    } else {
      window.addEventListener('load', () => {
        this.history.current = location.pathname
      })
      window.addEventListener('popstate', () => {
        this.history.current = location.pathname
      })
    }
  }
}
export default Router
```

在上面的代码中，创建一个 `HistoryRoute` 类，`HistoryRoute.current` 属性储存当前路由，在 `install` 方法会让这个值实现 `可响应` 并监视它的变化，并根据它的变化渲染不同的组件。

### router-view组件与路由渲染
`router-view` 组件的实现依赖于 `Vue.component()` 方法，通过这个方法向全局注册一个组件，需要注意的是 `Vue` 的全局组件注册需要在 `Vue` 实例化之前进行；

接下来就需要实现 `router-view` 组件最重要的功能，如何找到需要渲染的组件?

可以知道的是，当路由变化的时候可以获取到最新的路由地址，同时也可以访问到routes(路由表)的数据。
所以只需要根据路由地址从路由表中拿到相应的组件然后交给 `render函数` 执行就可以了。

为了通过路由快速找到组件，把 `routes数组` 转为 `map` 结构：
``` js
class Router {
  constructor(options) {
    // 省略其他代码
    this.routes = options.routes || []
    this.routeMap = this.createMap(this.routes)
  }
  // 省略其他代码
  createMap(routes) {
    return routes.reduce((memo, current) => {
      memo[current.path] = current.component
      return memo
    }, {})
  }
}
```

至此，所有的路由都已经使用键值对的方式存入 `routeMap` 中，接下来就可以使用 `render` 函数进行组件渲染了。

``` js
Router.install = function(_Vue) {
  // 省略其他代码
  Vue.component('router-view', {
    render(h) {
      let current = this._self._root._router.history.current  // 当前路由
      let routerMap = this._self._root._router.routeMap
      return h(routerMap[current])
    }
  })
}  
```

### router-link的实现
`router-link` 也是通过 `Vue.component()` 方法注册的一个全局组件
``` js
Vue.component('router-link', {
  props: {
    // 目标路由地址
    to: {
      type: [Object, String],
      required: true
    },
    // 渲染的标签
    tag: {
      type: String,
      default: 'a'
    },
    // 使用replace方式进行路由跳转，不留下history记录
    replace: Boolean
  },
  render(h) {
    let data = {}
    if (this.tag === 'a') {
      data.attrs = {href: this.to}
    } else {
      data.on = {click: () => {
        if (this.replace) {
          this._self._root._router.replace(this.to)
        } else {
          this._self._root._router.push(this.to)
        }
      }}
    }
    return h(this.tag, data, this.$slots.default)
  }
})
```

`router-link` 组件通过参数 `to` 设置目标路由，`tag` 参数负责组件在页面上渲染的标签，默认为 `a标签`，`replace` 参数则负责控制在路由跳转时是否使用`replace` 方法。

在 `render` 函数中根据不同的 `tag` 进行不同的数据拼接，在改变路由时，默认的 `a标签` 可以直接设置 `href` 属性，而其他标签则需要监听事件，然后使用 `router` 的路由跳转方法进行路由切换