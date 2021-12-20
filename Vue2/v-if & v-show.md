* 控制手段：`v-show` 隐藏则是为该元素添加 css -- `display: none`，`dom元素` 依旧还在。`v-if` 显示隐藏是将 `dom元素` 整个添加或删除

* 编译过程：`v-if` 切换有一个局部编译/卸载的过程，切换过程中合适地销毁和重建内部的 `事件监听 `和 `子组件`；`v-show` 只是简单的基于 `css切换`

* 编译条件：`v-if` 是真正的条件渲染，它会确保在切换过程中条件块内的事件监听器和子组件适当地被销毁和重建。只有渲染条件为假时，并不做操作，直到为真才渲染
  **`v-show` 由false变为true的时候不会触发组件的生命周期**
  **`v-if` 由false变为true的时候，触发组件的 `beforeCreate`、`create`、`beforeMount`、`mounted` 钩子，由true变为false的时候触发组件的 `beforeDestory`、`destoryed` 方法**

* 性能消耗：`v-if` 有更高的切换消耗；`v-show` 有更高的初始渲染消耗