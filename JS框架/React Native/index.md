# React Native 深度解析

---

## 一、原理篇

### 1. 渲染流程与 Shadow Tree

- JS 组件 → React Fiber 协调 → Shadow Tree（Yoga 布局） → Native View
- Shadow Tree 是 JS 侧的虚拟 UI 树，Yoga 负责跨平台 Flexbox 布局，最终映射到原生视图层。

### 2. Yoga 布局引擎

- C++实现，支持 Flexbox 所有属性，性能高、跨平台。
- JS 侧描述样式，Yoga 计算布局，Native 侧渲染。

### 3. 通信机制

- 旧架构：Bridge 异步通信，JSON 序列化，性能瓶颈明显。
- 新架构：JSI 同步通信，TurboModules 直接调用 C++，零拷贝、类型安全。
- 事件传递：Native 事件通过 EventEmitter 发送到 JS，支持双向通信。

---

## 二、架构篇

### 1. 旧架构 vs 新架构（Fabric）

| 对比项   | 旧架构                | 新架构（Fabric）     |
| -------- | --------------------- | -------------------- |
| 通信方式 | Bridge（异步+序列化） | JSI（同步+直接调用） |
| 渲染引擎 | Shadow Tree + Yoga    | C++ Fabric + Yoga    |
| 原生模块 | NativeModules         | TurboModules         |
| 类型安全 | 弱                    | 强（CodeGen）        |
| 并发渲染 | 不支持                | 支持（React 18）     |
| 性能     | 有瓶颈                | 优秀                 |

### 2. Fabric 核心机制

- JSI：JS 与 C++直接通信，无需序列化，支持同步/异步方法。
- TurboModules：原生模块自动注册，类型安全，按需加载。
- Shadow Tree 重构：C++实现，支持优先级调度和可中断渲染。
- 并发渲染：React 18 特性，Fiber 多版本并行，UI 流畅。

---

## 三、优化篇

### 1. 列表性能优化

- FlatList 虚拟化原理：只渲染可见区域及附近元素，未显示部分用占位符，极大减少内存和渲染压力。
- 性能参数：getItemLayout（避免测量）、initialNumToRender（首屏数量）、maxToRenderPerBatch（每批渲染）、windowSize（渲染窗口）、removeClippedSubviews（移除不可见视图）、updateCellsBatchingPeriod（批量更新周期）。
- React.memo 用于列表项，避免重复渲染。
- 适用场景：中等规模列表、动态内容。

```jsx
<FlatList
  data={largeData}
  renderItem={({ item }) => <MemoizedItem item={item} />}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  updateCellsBatchingPeriod={50}
/>
```

- RecyclerListView：采用视图回收和布局分离，适合超大数据量场景。
- DataProvider 管理数据，LayoutProvider 管理布局，rowRenderer 渲染项。

```jsx
const dataProvider = new DataProvider(
  (r1, r2) => r1.id !== r2.id
).cloneWithRows(largeData);
const layoutProvider = new LayoutProvider(
  () => "NORMAL",
  (type, dim) => {
    dim.width = Dimensions.get("window").width;
    dim.height = ITEM_HEIGHT;
  }
);
<RecyclerListView
  dataProvider={dataProvider}
  layoutProvider={layoutProvider}
  rowRenderer={(type, data) => <MemoizedItem item={data} />}
/>;
```

### 2. 动画优化

- useNativeDriver 原理：动画配置序列化到 Native，动画在 UI 线程执行，避免 JS/Bridge 卡顿，支持 transform/opacity。
- 典型代码：

```jsx
const fadeAnim = useRef(new Animated.Value(0)).current;
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 1000,
  useNativeDriver: true,
}).start();
```

- 适用场景：简单动画、页面切换、弹窗。

- Reanimated 2 优势：Worklet 机制，动画和手势在 UI 线程运行，支持复杂交互和高性能动画。
- 典型代码：

```jsx
const offset = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));
<Animated.View style={animatedStyle} />;
```

- 适用场景：手势驱动、复杂动画、性能敏感场景。

### 3. 图片优化

- 格式选择：WebP（高压缩）、合适尺寸，避免大图直接加载。
- FastImage：原生缓存、优先级、渐进加载。
- 渐进加载：先显示占位图，图片加载完成后替换。

```jsx
<FastImage
  source={{ uri: "https://example.com/image.webp" }}
  style={{ width: 100, height: 100 }}
  resizeMode={FastImage.resizeMode.cover}
  cache={FastImage.cacheControl.immutable}
/>;
const [loaded, setLoaded] = useState(false);
<View>
  {!loaded && <PlaceholderImage />}
  <Image source={{ uri: highResUrl }} onLoad={() => setLoaded(true)} />
</View>;
```

### 4. Bundle 与启动优化

- 代码分割：React.lazy/Suspense 懒加载页面和模块。
- Metro 配置：inlineRequires 加速启动，减少同步 require。
- Hermes：字节码预编译，低内存、快启动，适合移动端。
- RAM Bundle：分块加载，减少首屏体积。

```js
const ProfileScreen = React.lazy(() => import('./ProfileScreen'));
<Suspense fallback={<LoadingScreen />}><ProfileScreen /></Suspense>
// metro.config.js
module.exports = { transformer: { inlineRequires: true } };
// android/app/build.gradle
project.ext.react = [enableHermes: true];
```

### 5. 内存与启动优化

- 定时器/事件/动画及时清理，避免内存泄漏。
- useMemo 用于缓存重计算结果，减少重复渲染。
- SplashScreen 优化感知，预加载关键资源。

```jsx
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);
import SplashScreen from "react-native-splash-screen";
useEffect(() => {
  initializeApp().then(() => SplashScreen.hide());
}, []);
```

### 6. 调试与监控

- Profiler：分析渲染耗时，定位慢渲染组件。
- Sentry：错误追踪，自动收集异常和性能指标。
- Flipper/Reactotron：网络、布局、性能调试，支持实时监控。

```jsx
import { Profiler } from "react";
<Profiler
  id="App"
  onRender={(id, phase, actualDuration) => {
    if (actualDuration > 16) {
      console.warn(`Slow render: ${id} took ${actualDuration}ms`);
    }
  }}
>
  <App />
</Profiler>;
import * as Sentry from "@sentry/react-native";
Sentry.init({ dsn: "YOUR_DSN" });
```

### 7. 原生模块开发

- iOS：RCT_EXPORT_MODULE 注册模块，RCT_EXPORT_METHOD 导出方法，支持 Promise/Callback。
- Android：继承 ReactContextBaseJavaModule，@ReactMethod 导出方法。
- JS 调用 NativeModules，支持异步/同步通信。

```objective-c
RCT_EXPORT_MODULE();
RCT_EXPORT_METHOD(createEvent:(NSString *)title resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) { resolve(eventId); }
```

```java
public class CalendarModule extends ReactContextBaseJavaModule {
  @Override public String getName() { return "CalendarModule"; }
  @ReactMethod public void createEvent(String title, Promise promise) { promise.resolve(eventId); }
}
```

import { NativeModules } from 'react-native';
NativeModules.CalendarModule.createEvent('Party', '2024-12-25').then(id => console.log(id));

---

## 四、面试问答篇（高频+深度）

### 1. React Native 的核心渲染原理？

- 原理：JS 线程运行 React/Fiber，生成 Shadow Tree，Yoga 布局，最终映射到 Native View。Fabric 架构用 C++统一实现 Shadow Tree，支持同步通信和并发渲染。
- 源码细节：React/Fiber 协调阶段生成 Fiber 节点，构建 Shadow Tree，Yoga 负责布局计算，Native 侧渲染。
- 性能优化：Fabric 支持优先级调度、可中断渲染，UI 更流畅。
- 面试答疑：如何实现 JS 到 Native 的高效渲染？答：Fiber 协调、Shadow Tree 虚拟 UI、Yoga 布局、C++高性能映射。

### 2. Bridge 与 JSI/TurboModules 的区别？

- 原理：Bridge 采用异步通信和 JSON 序列化，性能瓶颈明显。JSI 支持同步通信、零拷贝，TurboModules 类型安全、按需加载。
- 源码细节：Bridge 通过消息队列传递数据，JSI 直接调用 C++方法，TurboModules 自动注册原生模块。
- 性能优化：JSI/TurboModules 减少序列化和线程切换，提升调用效率。
- 面试答疑：为什么 JSI 性能更高？答：同步调用、零拷贝、类型安全、减少线程切换。

### 3. Fabric 架构的核心优势？

- 原理：Fabric 用 C++统一实现 Shadow Tree，支持优先级调度、可中断渲染、类型安全。
- 源码细节：C++层管理 UI 树，JSI 直接通信，CodeGen 自动生成类型安全接口。
- 性能优化：并发渲染、按需加载、跨平台共享核心代码。
- 面试答疑：Fabric 如何提升性能？答：C++高效实现、优先级调度、类型安全、并发渲染。

### 8. Fabric 如何支持并发渲染？

- 原理：Fiber 多版本并行，Shadow Tree 可中断，优先级调度，UI 流畅。
- 源码细节：Fiber 架构支持多任务并发，C++层可中断渲染，优先级调度算法。
- 性能优化：UI 响应更快，动画不卡顿，复杂场景流畅。
- 面试答疑：并发渲染底层机制？答：Fiber 多版本、优先级调度、Shadow Tree 可中断。

### 4. 列表/动画/图片/启动性能优化策略？

- 原理：列表用虚拟化和视图回收，动画用 UI 线程执行，图片用缓存和渐进加载，启动用代码分割和预编译。
- 源码细节：FlatList/RecyclerListView 虚拟化，Animated/Reanimated 2 Worklet，FastImage 原生缓存，Hermes 字节码。
- 性能优化：减少渲染压力、提升动画流畅度、优化图片加载、加快启动速度。
- 面试答疑：如何排查列表卡顿？答：分析虚拟化参数、视图回收、memo 优化、布局预计算。

### 5. 性能瓶颈排查与优化思路？

- 原理：通过 FPS/内存/慢渲染监控，Profiler/Flipper/Reactotron 分析性能瓶颈。
- 源码细节：Profiler onRender 回调，Flipper 插件实时监控，Sentry 错误追踪。
- 性能优化：定位瓶颈后针对性优化（如列表、动画、图片、网络、内存）。
- 面试答疑：如何定位慢渲染组件？答：Profiler 分析渲染耗时，Flipper/Reactotron 实时监控。

### 6. JS 与 Native 双向通信原理？

- 原理：JS 调用 Native 用 NativeModules/TurboModules，Native 调用 JS 用 EventEmitter/Callback/Promise，JSI 支持同步方法和直接内存访问。
- 源码细节：NativeModules 封装原生方法，EventEmitter 事件分发，JSI 直接调用。
- 性能优化：TurboModules 类型安全、按需加载，JSI 零拷贝。
- 面试答疑：如何实现高效双向通信？答：TurboModules/JSI 同步调用，EventEmitter 事件分发。

### 7. Hermes 引擎的技术优势？

- 原理：Hermes 采用字节码预编译，低内存、快启动，优化 GC，无 JIT 但适合移动端。
- 源码细节：Hermes 编译 JS 为字节码，启动时直接加载，GC 机制优化。
- 性能优化：减少启动时间、降低内存占用、提升执行效率。
- 典型场景：移动端首屏优化、低内存设备。
- 面试答疑：Hermes 为什么适合移动端？答：字节码预编译、低内存、快启动、GC 优化。

---
