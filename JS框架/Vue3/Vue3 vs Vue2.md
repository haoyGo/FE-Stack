# Vue2 vs Vue3 全面对比

## 架构设计

### 源码组织
* Vue2：
  - 采用单体仓库模式
  - 所有模块耦合在一起
  - 不支持单独使用某个模块

* Vue3：
  - 采用 monorepo 方式维护
  - 模块拆分更细化，职责划分明确
  - 核心模块可独立使用（如reactivity响应式库）
  - 依赖关系更加清晰

### 响应式系统
* Vue2：
  - 使用 Object.defineProperty 实现
  - 不能检测对象属性的添加和删除
  - 需要使用 Vue.set/Vue.delete
  - 数组变化检测存在限制
    - 无法检测通过索引设置数组项
    - 无法检测直接修改数组长度
    - 需要使用特殊的数组方法触发更新
  - 初始化时递归遍历所有属性
    - 性能开销大，初始化慢
    - 内存占用高
    ```js
    // Vue2响应式实现的关键代码
    function defineReactive(obj, key, val) {
      const dep = new Dep()
      Object.defineProperty(obj, key, {
        get() {
          if (Dep.target) dep.depend()
          return val
        },
        set(newVal) {
          if (val === newVal) return
          val = newVal
          dep.notify()
        }
      })
    }
    ```

* Vue3：
  - 使用 Proxy 实现
    - 真正的代理拦截，不需要递归遍历
    - 支持动态属性添加/删除
    - 数组索引和长度变化可直接监听
  - 支持 Map、Set 等数据结构
  - 使用懒递归，性能更好
    - 访问时才递归代理
    - 显著减少初始化时间
    - 内存占用更低
  ```js
  // Vue3响应式实现的关键代码
  function reactive(target) {
    return new Proxy(target, {
      get(target, key, receiver) {
        track(target, key) // 依赖收集
        const res = Reflect.get(target, key, receiver)
        return isObject(res) ? reactive(res) : res
      },
      set(target, key, value, receiver) {
        const oldValue = target[key]
        const result = Reflect.set(target, key, value, receiver)
        if (hasChanged(value, oldValue)) {
          trigger(target, key) // 触发更新
        }
        return result
      }
    })
  }
  ```
  
  性能对比数据：
  - 初始化时间：Vue3比Vue2快55%
  - 内存占用：Vue3比Vue2减少40%
  - 更新性能：Vue3比Vue2快133%
  - 首次渲染：Vue3比Vue2快50%

## 性能优化

### 编译优化
* Vue2：
  - 编译时优化较少
  - 虚拟DOM全量对比
  - 无法实现静态提升
  - 每次更新时都需要重新创建虚拟节点
  - 没有靶向更新机制

* Vue3：
  - 重写虚拟DOM的实现
  - 编译模板优化，生成Block tree
    - 将模板基于动态节点指令切割为嵌套的区块
    - 每个区块内部的节点结构是固定的
    - 每个区块只需要追踪自身包含的动态节点
  - 静态提升(hoistStatic)
    - 将静态的节点/属性提升到渲染函数之外
    - 避免在每次渲染时重新创建对象
    - 典型的空间换时间优化策略
    ```js
    // 静态提升前
    function render() {
      return createVNode('div', null, [
        createVNode('span', null, 'static')
      ])
    }
    // 静态提升后
    const hoisted = createVNode('span', null, 'static')
    function render() {
      return createVNode('div', null, [hoisted])
    }
    ```
  - PatchFlag优化
    - 在编译时标记动态内容的类型
    - 运行时只关注带有标记的节点
    - 不同的标记对应不同的更新方式
    ```js
    // PatchFlag示例
    createVNode('div', { class: 'foo' }, text, 1 /* TEXT */)
    createVNode('div', { class: dynamic }, null, 2 /* CLASS */)
    ```
  - 事件监听缓存优化
    - 缓存事件处理函数，避免组件更新时重新创建
    - 减少不必要的子组件更新
  - Fragment、Teleport、Suspense等新特性
    - Fragment减少模板根节点的限制
    - Teleport支持将内容渲染到任意DOM位置
    - Suspense简化异步依赖处理

### 体积优化
* Vue2：
  - 没有做太多优化
  - 打包体积相对较大

* Vue3：
  - 更好的Tree-shaking支持
  - 按需编译，体积更小
  - 内置组件和功能可摇树优化

## 开发体验

### TypeScript支持
* Vue2：
  - TypeScript支持不完善
  - 需要使用Vue.extend或装饰器
  - 类型推导能力有限

* Vue3：
  - 使用TypeScript重写
  - 更好的类型推导
  - 组件props类型推导增强
  - IDE支持更友好

### API设计
* Vue2：
  - Options API
    - 配置项分散，不利于逻辑复用
    - 相关逻辑分散在不同选项中
    ```js
    // Options API示例
    export default {
      data() {
        return {
          searchQuery: '',
          searchResults: []
        }
      },
      watch: {
        searchQuery: {
          handler: 'fetchResults',
          debounce: 300
        }
      },
      methods: {
        async fetchResults() {
          this.searchResults = await api.search(this.searchQuery)
        },
        useSearchResult(result) {
          // 处理结果
        }
      },
      mounted() {
        this.fetchResults()
      }
    }
    ```
  - Mixins存在命名冲突风险
    - 命名空间不隔离
    - 数据来源不清晰
    - 隐式依赖，难以追踪

* Vue3：
  - Composition API
    - 相关逻辑可以组合在一起
    - 更好的代码组织和复用
    ```js
    // Composition API示例
    import { ref, watch, onMounted } from 'vue'
    import { useDebounce } from '@vueuse/core'

    export function useSearch() {
      const searchQuery = ref('')
      const searchResults = ref([])
      
      const debouncedQuery = useDebounce(searchQuery, 300)
      
      watch(debouncedQuery, async (query) => {
        searchResults.value = await api.search(query)
      })

      const useSearchResult = (result) => {
        // 处理结果
      }

      onMounted(() => {
        // 初始化搜索
        if (searchQuery.value) {
          searchResults.value = await api.search(searchQuery.value)
        }
      })

      return {
        searchQuery,
        searchResults,
        useSearchResult
      }
    }
    ```
  - 更好的TypeScript类型推导
    - 响应式数据类型自动推导
    - 组件props类型检查增强
  - 更灵活的代码组织方式
    - 可以按功能拆分到不同文件
    - 支持组合多个功能模块
  - 更好的逻辑复用能力
    - 避免mixins的缺陷
    - 显式依赖，易于追踪
    ```js
    // 组合多个功能模块
    export default {
      setup() {
        // 用户搜索相关
        const { searchQuery, searchResults, useSearchResult } = useSearch()
        
        // 页面分页相关
        const { currentPage, pageSize, paginate } = usePagination()
        
        // 表格排序相关
        const { sortBy, sortOrder, sort } = useSort()
        
        return {
          // 暴露组合式API的响应式状态和方法
          searchQuery,
          searchResults,
          useSearchResult,
          currentPage,
          pageSize,
          paginate,
          sortBy,
          sortOrder,
          sort
        }
      }
    }
    ```
  - 依然支持Options API
    - 向下兼容
    - 渐进式迁移

### 工具链支持
* Vue2：
  - Vue CLI
  - Vue Devtools支持有限

* Vue3：
  - Vite原生支持
  - 更强大的Devtools
  - 更好的IDE支持
  - 更完善的测试工具

## 生态系统

### 路由
* Vue2：Vue Router 3.x
  - 基于配置的路由定义
  - 动态路由加载较复杂
  - 类型支持有限
  ```js
  // Vue Router 3.x示例
  const router = new VueRouter({
    routes: [
      {
        path: '/user/:id',
        component: User,
        beforeEnter: (to, from, next) => {
          // 路由守卫
          next()
        }
      }
    ]
  })
  ```

* Vue3：Vue Router 4.x，支持组合式API
  - 基于函数的路由定义
  - 更灵活的路由配置
  - 完整的TypeScript支持
  ```js
  // Vue Router 4.x示例
  import { createRouter, useRoute, useRouter } from 'vue-router'
  
  const router = createRouter({
    routes: [...]
  })
  
  // 在组件中使用
  export default {
    setup() {
      const route = useRoute()
      const router = useRouter()
      
      // 响应式的路由参数
      watch(() => route.params.id, async newId => {
        // 处理路由参数变化
      })
      
      return { /* ... */ }
    }
  }
  ```

### 状态管理
* Vue2：Vuex 3.x
  - 基于Options API的状态管理
  - 模块化支持较弱
  - TypeScript支持不完善
  ```js
  // Vuex 3.x示例
  const store = new Vuex.Store({
    state: { count: 0 },
    mutations: {
      increment(state) {
        state.count++
      }
    },
    actions: {
      async fetchData({ commit }) {
        const data = await api.getData()
        commit('setData', data)
      }
    }
  })
  ```

* Vue3：Vuex 4.x 或 Pinia（推荐）
  - Pinia优势：
    - 更简单的API设计
    - 更好的TypeScript支持
    - 更小的包体积
    - 不需要嵌套模块
  ```js
  // Pinia示例
  import { defineStore } from 'pinia'
  
  export const useCounterStore = defineStore('counter', {
    state: () => ({ count: 0 }),
    getters: {
      doubleCount: (state) => state.count * 2
    },
    actions: {
      increment() {
        this.count++
      },
      async fetchData() {
        const data = await api.getData()
        this.data = data
      }
    }
  })
  
  // 在组件中使用
  export default {
    setup() {
      const counter = useCounterStore()
      
      // 自动解构，保持响应性
      const { count, doubleCount } = storeToRefs(counter)
      
      return { count, doubleCount }
    }
  }
  ```

### UI框架
* Vue2：Element UI, Vuetify等
  - Element UI
    - 完整的组件库
    - 国内使用广泛
    - 主题定制能力一般
  - Vuetify
    - Material Design风格
    - 功能丰富但体积较大
    - 定制化成本高

* Vue3：Element Plus, Vuetify 3等
  - Element Plus
    - 完全重写的Vue3组件库
    - 更好的TypeScript支持
    - 更强的主题定制能力
    - 更小的包体积（支持按需加载）
  - Vuetify 3
    - 完整的Material Design 3支持
    - 更好的性能和包体积优化
    - Composition API支持

最佳实践建议：
- 状态管理：推荐使用Pinia，更轻量且TypeScript支持更好
- UI框架：
  - 中后台系统：Element Plus
  - 面向用户产品：Vuetify 3
  - 定制化需求高：基于Headless UI库自建组件
- 工具库：
  - VueUse：必备的组合式API工具集
  - unplugin-auto-import：自动导入API
  - unplugin-vue-components：自动导入组件

## 迁移和兼容性

### 破坏性变更
* 移除了过滤器（filters）
  - 推荐使用计算属性或方法替代
  ```js
  // Vue2 过滤器
  {{ date | formatDate }}
  
  // Vue3 计算属性替代
  const formattedDate = computed(() => formatDate(date))
  ```
* v-model 重新设计
  - 统一组件和原生元素的v-model用法
  - 支持多个v-model绑定
  ```js
  // Vue2
  <CustomInput
    v-model="value"
    :value="value"
    @input="value = $event"
  />
  
  // Vue3
  <CustomInput
    v-model="value"
    v-model:title="title"
  />
  ```
* 插槽统一为 v-slot 指令
  - 移除slot和slot-scope语法
  - 统一使用v-slot指令
  ```js
  // Vue2 旧语法
  <template slot="header" slot-scope="{ data }">
    {{ data.title }}
  </template>
  
  // Vue3
  <template v-slot:header="{ data }">
    {{ data.title }}
  </template>
  ```
* 移除 .native 修饰符
  - 组件事件监听行为统一
  - 使用emits选项声明事件
* 生命周期钩子重命名
  - beforeDestroy → beforeUnmount
  - destroyed → unmounted
  - 使用setup时需要导入on前缀的钩子函数
* 事件API重命名
  - $on, $off, $once 被移除
  - 推荐使用外部事件库或自定义事件总线

### 兼容性考虑
* Vue2：支持IE11
  - 需要额外的polyfills
  - 需要特殊的构建配置
  - 性能优化受限

* Vue3：放弃IE11支持，专注现代浏览器
  - 利用现代浏览器特性
  - 更好的性能优化空间
  - 更小的包体积

### 迁移成本
* 小型项目：迁移成本相对较小
  - 可以直接升级依赖
  - 修复破坏性变更
  - 逐步采用新特性

* 中大型项目：
  - 需要评估第三方库兼容性
    - UI组件库是否支持Vue3
    - 自定义组件是否需要重写
    - 插件是否有Vue3版本
  - 需要重构部分代码
    - 移除已废弃的特性
    - 更新生命周期钩子
    - 优化数据响应式写法
  - 建议渐进式迁移
    - 先在新功能中使用Vue3
    - 使用迁移构建版本
    - 逐步重构旧代码

迁移策略建议：
1. 评估项目规模和复杂度
   - 统计使用了哪些Vue2特性
   - 评估第三方依赖情况
   - 估算迁移工作量

2. 制定迁移计划
   - 确定是全量迁移还是部分迁移
   - 划分迁移阶段和优先级
   - 设置合理的迁移时间表

3. 迁移步骤
   ```js
   // 1. 安装迁移构建版本
   npm install @vue/compat@3
   
   // 2. 配置兼容模式
   // vite.config.js
   export default {
     resolve: {
       alias: {
         vue: '@vue/compat'
       }
     }
   }
   
   // 3. 开启编译器警告
   // vue.config.js
   module.exports = {
     chainWebpack: config => {
       config.resolve.alias.set('vue', '@vue/compat')
     }
   }
   ```

4. 测试策略
   - 增加单元测试覆盖率
   - 进行全面的集成测试
   - 灰度发布新版本

5. 性能优化
   - 利用Vue3新特性优化性能
   - 使用新的工具链和构建工具
   - 实施代码分割和懒加载
