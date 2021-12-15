const _toString = Object.prototype.toString

const toRawType = (val) => _toString.call(val).slice(8, -1)

const isPlainObject = (val) => _toString.call(val) === '[object Object]'

const NodeTypeEnum = {
  tag: 1,
  text: 3,
  comment: 8,
  root: 9
}

// 订阅器
class Dep {
  // 每个属性都有单独的订阅器
  constructor() {
    this.subs = [] // 观察者池
  }

  add(sub) {
    // sub是watcher实例,在new Watch()依赖收集的的时候,被加进来的
    this.subs.push(sub)
  }

  notify() {
    console.log('notify', this.subs);
    this.subs.forEach(sub => sub.update())
  }
}

// 观察者/订阅者
class Watcher {
  constructor(node, key, vm) {
    // 用于判断是在 new Watcher 时候
    Dep.target = this
    
    Object.assign(this, {
      node,
      key,
      vm
    })

    this.getValue()

    Dep.target = null
  }

  // 因为进行过数据劫持，所以会触发这里更新
  getValue() {
    this.value = this.vm.$data[this.key]
  }

  update() {
    // console.log('update', this.node);
    this.getValue()
    if (this.node.nodeType == NodeTypeEnum.tag) {
      // 只考虑input框
      this.node.value = this.value
    } else if (this.node.nodeType == NodeTypeEnum.text) {//文本节点
      this.node.textContent = this.value
    }
  }
}

const nodeCompilerMap = {
  [NodeTypeEnum.tag]: (node, vm) => {
    // console.log('tag compiler');
    const { attributes, childNodes } = node

    // 处理属性，是否有 v- 指令
    ;[...attributes].forEach((attr) => {
      const { nodeName, nodeValue } = attr
      // console.log('attr', attr, nodeName, nodeValue);

      if (/^v-\w+/.test(nodeName)) {
        // 观察到name使用了，收集到这里的依赖了，需要把观察者加到每一个data的目标的池子里
        new Watcher(node, nodeValue, vm)
        
        // 取值
        const value = vm.$data[nodeValue]
        node.value = value

        node.addEventListener('input', (e) => {
          //视图改变,更新数据，触发set
          vm.$data[nodeValue] = e.target.value
        })
      }
    })

    // 递归处理 children
    ;[...childNodes].forEach(vm.compile.bind(vm))
  },
  [NodeTypeEnum.text]: (node, vm) => {
    // console.log('text compiler');
    // text 需要处理文本插值
    const textContent = node.textContent
    const reg = /{{(.+)}}/
    if (reg.test(textContent)) {
      const str = textContent.replace(reg, (_, b) => {
        const key = b.trim()
        console.log('reg key', key)

        new Watcher(node, key, vm)

        return vm.$data[key]
      })

      node.textContent = str
    }

  },
  [NodeTypeEnum.comment]: (node, vm) => {
    // console.log('comment compiler');

  },
  [NodeTypeEnum.root]: (node, vm) => {
    // console.log('root compiler');

  },
}

class Vue {
  constructor(option) {
    const { el, data } = option

    this.$el = document.querySelector(el)
    this.$data = data

    // 劫持数据
    this.observe(this.$data)

    // 模板编译
    this.nodeToFragment(this.$el)
  }

  observe(data) {
    if (!isPlainObject(data)) return

    // 遍历 data，对所有属性进行劫持
    Object.entries(data).forEach(([k, v]) => {
      this.defineReactive$$1(data, k, v)
    })
  }
  
  defineReactive$$1(data, k, v) {
    const dep = new Dep()

    Object.defineProperty(data, k, {
      enumerable: true,
      get() {
        // console.log(`get: ${k} -- ${v}`);

        // 为什么要有这个判断？能够触发get的方式有很多种,这里是为了保证能拿到new Watcher()时候的实例
        if (Dep.target) {
          console.log('Dep.target', Dep.target);
          //依赖收集，触发get函数，收集watcher
          dep.add(Dep.target)// 我们在事件池中放置的都是一些订阅者
        }

        return v
      },
      set(newV) {
        // console.log(`set: ${k} -- ${v} -> ${newV}`);
        
        // v = newV
        if(newV !== v){
          v = newV
          dep.notify()
        }
      }
    })
  }
  nodeToFragment(el) {
    // 借助 fragment，把Vue模版所有节点编译完，再转移回 $el
    // appendChild 方法会将这个节点从原来位置转移到新的位置
    let fragment = document.createDocumentFragment()
    let child

    while(child = el.firstChild) {
      this.compile(child)
      fragment.appendChild(child)
    }

    el.appendChild(fragment)
  }

  compile(node) {
    // console.log('node', node);
    const vm = this
    const compiler = nodeCompilerMap[node.nodeType]
    compiler && compiler(node, vm)
  }
}

let vm = new Vue({
  el: '#app',
  data: {
    name: 'hooyah'
  }
})