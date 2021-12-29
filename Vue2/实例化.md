## Vue2 实例化
``` js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 0. 初始化配置 $options，后面获取属性都通过 $options
//    if (options && options._isComponent) {
//      // optimize internal component instantiation
//      // since dynamic options merging is pretty slow, and none of the
//      // internal component options needs special treatment.
//      initInternalComponent(vm, options)
//    } else {
//      vm.$options = mergeOptions(
//        resolveConstructorOptions(vm.constructor),
//        options || {},
//        vm
//      )
//    }
//    vm._self = vm
// 1. 初始化组件实例关系属性 -- initLifecycle(vm)
//    vm.$parent = parent
//    vm.$root = parent ? parent.$root : vm
//    vm.$children = []
//    vm.$refs = {}

// 2. 自定义事件的监听 -- initEvents(vm)
//    vm._events = Object.create(null) // 事件池，每个组件实例一份
//    vm._hasHookEvent = false // 是否有生命周期 hook
//      // 触发事件回调事，会有以下判断
//      if (vm._hasHookEvent) {
//        vm.$emit('hook:' + hook)
//      }
//    const listeners = vm.$options._parentListeners
//    if (listeners) {
//      // 注册 listeners
//      updateComponentListeners(vm, listeners) 
//    }

// 3. 插槽和渲染函数 -- initRender(vm)
//    $slots、$scopedSlots、$createElement、$attrs、$listeners

// 4. 触发 beforeCreate 钩子函数 -- callHook(vm, 'beforeCreate')

// 5. 初始化 inject 配置项 -- initInjections(vm)
//    也是调了方法 defineReactive 实现响应式

// 6. 初始化响应式数据，如 props, methods, data, computed, watch -- initState(vm)
//    initProps -> initMethods -> initData -> initComputed -> initWatch

// 7. 初始化解析 provide -- initProvide(vm)
//    const provide = vm.$options.provide
//    if (provide) {
//      vm._provided = typeof provide === 'function'
//      ? provide.call(vm)
//      : provide
//    }

// 8. 触发 created 钩子函数 -- callHook(vm, 'created')
initMixin(Vue)

// $data、$props、$set、$delete、$watch 挂载
stateMixin(Vue)

// 生成事件监听器
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

### initMixin
``` js
Vue.prototype._init = function (options?: Object) {
  const vm: Component = this
  // a uid
  vm._uid = uid++

  let startTag, endTag
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    startTag = `vue-perf-start:${vm._uid}`
    endTag = `vue-perf-end:${vm._uid}`
    mark(startTag)
  }

  // a flag to avoid this being observed
  vm._isVue = true
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }
  // expose real self
  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    vm._name = formatComponentName(vm, false)
    mark(endTag)
    measure(`vue ${vm._name} init`, startTag, endTag)
  }

  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```
* 在调用 `beforeCreate` 之前，数据初始化并未完成，像 `data`、`props` 这些属性无法访问到
* 到了 `created` 的时候，数据已经初始化完成，能够访问 `data`、`props` 这些属性，但这时候并未完成dom的挂载，因此无法访问到dom元素
* 挂载方法是调用 `vm.$mount` 方法


#### initState
``` js
function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```
State: Props -> Methods -> Data -> Computed -> Watch

##### initData
``` js
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}
```

`initMethods` 就是将方法挂在到 `vm` 上。

`initProps` 和 `initData` 比较类似：
* 通过 `proxy` 方法将所有变量挂在到 `vm` 上，可以直接访问。
* 通过 `defineReactive` 方法递归将数据处理为响应式。

``` js
/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}
```