# React Native 深度解析

## 一、React Native 核心架构

### 1. 整体架构演进

#### 旧架构（Old Architecture）

- **JavaScript 层**：业务逻辑、React 组件
- **Bridge（桥接层）**：异步消息传递，JSON 序列化
- **Native 层**：原生模块、UI 组件

**问题**：

- Bridge 是异步的，所有通信都需要序列化/反序列化
- 大量数据传输时性能瓶颈明显
- 无法实现同步调用
- 启动时需要加载所有原生模块

#### 新架构（New Architecture - Fabric + TurboModules）

**Fabric（新渲染引擎）**：

- 使用 JSI（JavaScript Interface）替代 Bridge
- 支持同步调用
- 直接操作 Shadow Tree
- 更好的类型安全

**TurboModules（新原生模块系统）**：

- 懒加载，按需初始化
- 同步方法调用支持
- 类型安全的接口

### 2. JSI（JavaScript Interface）

JSI 是连接 JavaScript 和原生代码的新接口：

```cpp
// JSI 允许 JavaScript 直接调用 C++ 对象
// JavaScript 侧
const result = nativeModule.syncMethod();

// C++ 侧
jsi::Value syncMethod(jsi::Runtime& runtime,
                      const jsi::Value& thisValue,
                      const jsi::Value* arguments,
                      size_t count) {
  // 直接执行，无需序列化
  return jsi::Value(42);
}
```

**优势**：

- 零拷贝：直接共享内存
- 类型安全：编译时类型检查
- 同步调用：某些场景下必需
- 性能提升：避免 JSON 序列化开销

### 3. 线程模型

React Native 有三个主要线程：

#### JavaScript Thread（JS 线程）

- 运行 JavaScript 代码
- 执行业务逻辑
- React 组件渲染
- 使用 Hermes 引擎（默认）

#### Native/UI Thread（主线程）

- 原生 UI 渲染
- 处理用户交互
- 执行原生模块代码

#### Shadow Thread（影子线程）

- 计算布局（Yoga 布局引擎）
- 构建 Shadow Tree
- 不阻塞 UI 线程

```javascript
// 在 JS 线程执行
const App = () => {
  const [count, setCount] = useState(0);

  return (
    <View>
      <Text>{count}</Text>
      {/* 
        1. JS Thread: setState 触发重新渲染
        2. Shadow Thread: 计算新的布局
        3. UI Thread: 应用到原生视图
      */}
      <Button onPress={() => setCount(count + 1)} />
    </View>
  );
};
```

## 二、渲染原理

### 1. 渲染流程

```
JavaScript 组件
    ↓
React Reconciliation (Fiber)
    ↓
Shadow Tree (Yoga 布局计算)
    ↓
Native Views
```

### 2. Shadow Tree

Shadow Tree 是 UI 树的抽象表示：

```javascript
// JavaScript
<View style={{flexDirection: 'row', padding: 10}}>
  <Text>Hello</Text>
  <Image source={uri} />
</View>

// Shadow Tree (简化表示)
{
  viewName: 'RCTView',
  props: {style: {flexDirection: 'row', padding: 10}},
  children: [
    {viewName: 'RCTText', props: {}, children: ['Hello']},
    {viewName: 'RCTImage', props: {source: uri}, children: []}
  ]
}

// 经过 Yoga 布局计算后
{
  x: 0, y: 0, width: 375, height: 50,
  children: [
    {x: 10, y: 10, width: 50, height: 30},
    {x: 70, y: 10, width: 100, height: 30}
  ]
}

// 最终映射到原生视图
UIView / android.view.View
  ├─ UILabel / TextView
  └─ UIImageView / ImageView
```

### 3. Yoga 布局引擎

Yoga 是跨平台的 Flexbox 布局引擎（C++ 实现）：

```cpp
// Yoga 节点创建
YGNodeRef root = YGNodeNew();
YGNodeStyleSetFlexDirection(root, YGFlexDirectionRow);
YGNodeStyleSetPadding(root, YGEdgeAll, 10);

// 布局计算
YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

// 获取计算结果
float x = YGNodeLayoutGetLeft(root);
float y = YGNodeLayoutGetTop(root);
float width = YGNodeLayoutGetWidth(root);
float height = YGNodeLayoutGetHeight(root);
```

## 三、JavaScript 与 Native 通信

### 1. 旧架构通信方式（Bridge）

#### 通信流程

```javascript
// JavaScript 调用原生方法
import { NativeModules } from "react-native";

NativeModules.CalendarModule.createEvent("Party", "2024-12-25").then(
  (eventId) => console.log(eventId)
);

// 内部流程：
// 1. JS 将调用信息序列化为 JSON
// 2. 通过 Bridge 异步发送到 Native
// 3. Native 反序列化，执行方法
// 4. Native 将结果序列化为 JSON
// 5. 通过 Bridge 异步发送回 JS
// 6. JS 反序列化，触发 Promise 回调
```

#### Bridge 实现原理

```javascript
// 简化的 Bridge 实现
class MessageQueue {
  constructor() {
    this._callID = 0;
    this._callbacks = {};
    this._queue = [[], [], [], 0]; // [moduleIDs, methodIDs, params, callID]
  }

  enqueueNativeCall(moduleID, methodID, args, onSuccess, onFail) {
    const callID = this._callID++;

    this._queue[0].push(moduleID);
    this._queue[1].push(methodID);
    this._queue[2].push(args);

    if (onSuccess || onFail) {
      this._callbacks[callID] = { onSuccess, onFail };
    }

    // 刷新队列到 Native
    global.nativeFlushQueueImmediate(this._queue);
    this._queue = [[], [], [], 0];
  }

  invokeCallbackAndReturnFlushedQueue(callID, args) {
    const callback = this._callbacks[callID];
    if (callback) {
      callback.onSuccess(...args);
      delete this._callbacks[callID];
    }
  }
}
```

#### 原生侧（iOS）

```objective-c
// RCTBridge.m
- (void)enqueueJSCall:(NSString *)module
               method:(NSString *)method
                 args:(NSArray *)args
           completion:(dispatch_block_t)completion {

  // 将调用加入队列
  [self.javaScriptExecutor executeApplicationScript:script
                                           sourceURL:url
                                          onComplete:^(NSError *error) {
    // 执行 JavaScript 代码
  }];
}

// 处理来自 JS 的调用
- (void)handleBuffer:(NSArray *)buffer {
  NSArray *moduleIDs = buffer[0];
  NSArray *methodIDs = buffer[1];
  NSArray *params = buffer[2];

  for (NSUInteger i = 0; i < moduleIDs.count; i++) {
    NSNumber *moduleID = moduleIDs[i];
    NSNumber *methodID = methodIDs[i];
    NSArray *methodParams = params[i];

    // 查找并调用原生方法
    RCTModuleData *moduleData = _moduleDataByID[moduleID];
    [moduleData dispatchMethodWithID:methodID params:methodParams];
  }
}
```

### 2. 新架构通信方式（JSI + TurboModules）

#### JSI 同步调用

```javascript
// JavaScript 直接调用 C++ 方法
global.nativePerformanceNow = function () {
  // 通过 JSI 同步调用，无序列化开销
  return __nativePerformanceNow();
};

const startTime = global.nativePerformanceNow();
// 执行操作
const endTime = global.nativePerformanceNow();
console.log("Duration:", endTime - startTime);
```

#### TurboModule 定义

```typescript
// NativeCalculator.ts (JavaScript 接口定义)
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  add(a: number, b: number): number; // 同步方法
  addAsync(a: number, b: number): Promise<number>; // 异步方法
  addWithCallback(
    a: number,
    b: number,
    callback: (result: number) => void
  ): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>("Calculator");
```

```cpp
// NativeCalculator.cpp (C++ 实现)
#include "NativeCalculator.h"

namespace facebook::react {

NativeCalculator::NativeCalculator(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeCalculatorCxxSpec(std::move(jsInvoker)) {}

jsi::Value NativeCalculator::add(jsi::Runtime& rt, double a, double b) {
  // 同步方法，直接返回
  return jsi::Value(a + b);
}

jsi::Value NativeCalculator::addAsync(
    jsi::Runtime& rt,
    double a,
    double b) {

  // 创建 Promise
  auto promise = createPromise(rt);

  // 在后台线程执行
  std::thread([promise, a, b]() {
    double result = a + b;
    // 回到 JS 线程
    promise->resolve(jsi::Value(result));
  }).detach();

  return promise->jsiPromise(rt);
}

} // namespace facebook::react
```

### 3. 事件传递机制

#### 从 Native 到 JS 的事件

```objective-c
// iOS: 原生事件发射器
@implementation DeviceEventEmitter

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onBatteryLevelChange"];
}

- (void)startObserving {
  [[NSNotificationCenter defaultCenter]
    addObserver:self
       selector:@selector(batteryLevelChanged:)
           name:UIDeviceBatteryLevelDidChangeNotification
         object:nil];
}

- (void)batteryLevelChanged:(NSNotification *)notification {
  float level = [UIDevice currentDevice].batteryLevel;
  [self sendEventWithName:@"onBatteryLevelChange"
                     body:@{@"level": @(level)}];
}

@end
```

```javascript
// JavaScript: 监听原生事件
import { NativeEventEmitter, NativeModules } from "react-native";

const eventEmitter = new NativeEventEmitter(NativeModules.DeviceEventEmitter);

useEffect(() => {
  const subscription = eventEmitter.addListener(
    "onBatteryLevelChange",
    (event) => {
      console.log("Battery level:", event.level);
    }
  );

  return () => subscription.remove();
}, []);
```

### 4. 性能优化技巧

#### 批量更新

```javascript
// ❌ 不好的做法：多次调用原生方法
for (let i = 0; i < 1000; i++) {
  NativeModules.Storage.setItem(`key_${i}`, `value_${i}`);
}

// ✅ 好的做法：批量调用
const items = Array.from({ length: 1000 }, (_, i) => ({
  key: `key_${i}`,
  value: `value_${i}`,
}));
NativeModules.Storage.multiSet(items);
```

#### 避免不必要的序列化

```javascript
// ❌ 传递大对象
const largeData = {
  /* 大量数据 */
};
NativeModules.DataProcessor.process(largeData);

// ✅ 使用引用或分块传递
const dataId = await NativeModules.DataProcessor.store(largeData);
NativeModules.DataProcessor.processById(dataId);
```

#### 使用 InteractionManager

```javascript
// 将非紧急任务延迟到动画完成后
InteractionManager.runAfterInteractions(() => {
  // 执行耗时操作
  expensiveOperation();
});
```

## 四、性能优化深度解析

### 1. 列表性能优化

#### FlatList 优化原理

```javascript
// FlatList 虚拟化原理
// 只渲染可见区域及周边的元素，其他用空白占位

const OptimizedList = () => {
  return (
    <FlatList
      data={largeDataSet}
      // 关键优化属性
      renderItem={({ item }) => <ListItem item={item} />}
      keyExtractor={(item) => item.id}
      // 初始渲染数量
      initialNumToRender={10}
      // 每批渲染数量
      maxToRenderPerBatch={10}
      // 渲染窗口大小（屏幕高度的倍数）
      windowSize={5}
      // 移除 clipped 子视图
      removeClippedSubviews={true}
      // 更新优化
      updateCellsBatchingPeriod={50}
      // getItemLayout 提供精确尺寸，避免测量
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
    />
  );
};

// ListItem 组件优化
const ListItem = React.memo(
  ({ item }) => {
    // 避免内联函数
    const handlePress = useCallback(() => {
      console.log(item.id);
    }, [item.id]);

    return (
      <TouchableOpacity onPress={handlePress}>
        <Text>{item.title}</Text>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title
    );
  }
);
```

#### RecyclerListView（更高性能）

```javascript
import {
  RecyclerListView,
  DataProvider,
  LayoutProvider,
} from "recyclerlistview";

const HighPerformanceList = () => {
  // DataProvider：数据管理
  const [dataProvider, setDataProvider] = useState(
    new DataProvider((r1, r2) => r1.id !== r2.id)
  );

  // LayoutProvider：布局管理
  const layoutProvider = new LayoutProvider(
    (index) => dataProvider.getDataForIndex(index).type,
    (type, dim) => {
      dim.width = Dimensions.get("window").width;
      dim.height = type === "NORMAL" ? 100 : 150;
    }
  );

  const rowRenderer = (type, data) => {
    return <ListItem data={data} />;
  };

  return (
    <RecyclerListView
      dataProvider={dataProvider}
      layoutProvider={layoutProvider}
      rowRenderer={rowRenderer}
      // 真正的视图回收，性能更优
    />
  );
};
```

### 2. 动画性能优化

#### 使用原生驱动动画

```javascript
// ✅ 使用 useNativeDriver: true
// 动画在原生层执行，不经过 Bridge
const fadeAnim = useRef(new Animated.Value(0)).current;

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 1000,
  useNativeDriver: true, // 关键！
}).start();

// 支持 useNativeDriver 的属性：
// - opacity
// - transform (translate, scale, rotate)
//
// 不支持的属性：
// - width, height
// - backgroundColor
// - flex
```

#### Reanimated 2 性能优化

```javascript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const AdvancedAnimation = () => {
  // Shared Value 在 UI 线程运行
  const offset = useSharedValue(0);

  // 动画样式在 UI 线程计算
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const handleGesture = (e) => {
    // 直接在 UI 线程更新，无 Bridge 延迟
    offset.value = withTiming(e.nativeEvent.translationX);

    // 需要在 JS 线程执行的逻辑
    if (offset.value > 100) {
      runOnJS(doSomethingInJS)();
    }
  };

  return (
    <PanGestureHandler onGestureEvent={handleGesture}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </PanGestureHandler>
  );
};

// Reanimated Worklet: 在 UI 线程运行的 JS 代码
function workletExample() {
  "worklet"; // 标记为 worklet

  // 这段代码会被编译并在 UI 线程执行
  return Math.random() * 100;
}
```

### 3. 图片优化

```javascript
// 图片优化策略
const ImageOptimization = () => {
  return (
    <>
      {/* 1. 使用合适的图片格式和尺寸 */}
      <Image
        source={{ uri: "https://example.com/image.webp" }}
        style={{ width: 100, height: 100 }}
        // 2. 启用缓存
        cache="force-cache"
        // 3. 渐进式加载
        progressiveRenderingEnabled={true}
      />

      {/* 4. 使用 FastImage（第三方库） */}
      <FastImage
        source={{
          uri: "https://example.com/image.jpg",
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable,
        }}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* 5. 占位图 */}
      <Image source={require("./placeholder.png")} style={styles.image}>
        <Image source={{ uri: highResImageUrl }} style={styles.image} />
      </Image>
    </>
  );
};
```

### 4. Bundle 优化

#### 代码分割和懒加载

```javascript
// 使用 React.lazy 和 Suspense
const ProfileScreen = React.lazy(() => import("./ProfileScreen"));
const SettingsScreen = React.lazy(() => import("./SettingsScreen"));

const App = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Suspense>
  );
};
```

#### Metro Bundler 优化

```javascript
// metro.config.js
module.exports = {
  transformer: {
    // 启用内联 require
    inlineRequires: true,

    minifierConfig: {
      // 压缩配置
      compress: {
        drop_console: true,
        reduce_funcs: true,
      },
    },
  },

  serializer: {
    // 自定义模块过滤
    processModuleFilter: (module) => {
      // 排除开发工具
      if (module.path.includes("__tests__")) {
        return false;
      }
      return true;
    },
  },
};
```

#### Hermes 引擎优化

```bash
# Android: 启用 Hermes
# android/app/build.gradle
project.ext.react = [
    enableHermes: true
]

# iOS: 启用 Hermes
# Podfile
use_react_native!(
  :hermes_enabled => true
)
```

**Hermes 优势**：

- 更小的 Bundle 体积（字节码格式）
- 更快的启动时间（预编译）
- 更低的内存占用
- 更好的垃圾回收

### 5. 内存优化

```javascript
// 内存泄漏检测和防止
const MemorySafeComponent = () => {
  useEffect(() => {
    // 订阅事件
    const subscription = eventEmitter.addListener("event", handler);

    // 定时器
    const timer = setInterval(() => {
      // do something
    }, 1000);

    // 动画
    const animation = Animated.timing(value, config);
    animation.start();

    // 清理函数：防止内存泄漏
    return () => {
      subscription.remove();
      clearInterval(timer);
      animation.stop();
    };
  }, []);

  // 大对象及时释放
  const handleLargeData = async () => {
    let largeData = await fetchLargeData();
    processData(largeData);
    largeData = null; // 帮助 GC
  };

  return <View />;
};

// 使用 useMemo 避免重复计算
const ExpensiveComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return heavyComputation(data);
  }, [data]);

  return <List data={processedData} />;
};
```

### 6. 启动时间优化

```javascript
// 1. 延迟加载非关键模块
let heavyModule = null;

const loadHeavyModule = () => {
  if (!heavyModule) {
    heavyModule = require("./HeavyModule");
  }
  return heavyModule;
};

// 2. 使用启动屏优化感知
import SplashScreen from "react-native-splash-screen";

useEffect(() => {
  // 初始化完成后隐藏启动屏
  initializeApp().then(() => {
    SplashScreen.hide();
  });
}, []);

// 3. 预加载关键数据
const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 预加载字体
        await Font.loadAsync({
          "custom-font": require("./assets/font.ttf"),
        });

        // 预加载关键数据
        await AsyncStorage.multiGet(["user", "token"]);

        // 预热导航栈
        await Asset.loadAsync([require("./assets/splash.png")]);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return <MainApp />;
};
```

## 五、调试技巧

### 1. 性能监控

```javascript
// Performance Monitor
import { PerformanceObserver, performance } from "react-native-performance";

// 监控各种性能指标
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

observer.observe({ entryTypes: ["measure", "mark"] });

// 标记性能点
performance.mark("screen-mount-start");
// ... 渲染逻辑
performance.mark("screen-mount-end");
performance.measure("screen-mount", "screen-mount-start", "screen-mount-end");

// JS 帧率监控
import { JSBridge } from "react-native";

let lastFrameTime = performance.now();
const checkFrameRate = () => {
  const currentTime = performance.now();
  const fps = 1000 / (currentTime - lastFrameTime);
  lastFrameTime = currentTime;

  if (fps < 55) {
    console.warn("Frame drop detected:", fps.toFixed(2), "fps");
  }

  requestAnimationFrame(checkFrameRate);
};

checkFrameRate();
```

### 2. 内存分析

```javascript
// 使用 React DevTools Profiler
import { Profiler } from "react";

const onRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions
) => {
  console.log({
    id, // 组件名称
    phase, // "mount" 或 "update"
    actualDuration, // 本次渲染耗时
    baseDuration, // 理论最快渲染时间
  });
};

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>;

// 检测循环依赖
// 使用 why-did-you-render
import whyDidYouRender from "@welldone-software/why-did-you-render";

if (__DEV__) {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
  });
}
```

### 3. 网络调试

```javascript
// Flipper 网络插件
// 自动记录所有网络请求

// 自定义网络拦截器
const originalFetch = global.fetch;
global.fetch = async (...args) => {
  const startTime = Date.now();
  console.log("Request:", args[0]);

  try {
    const response = await originalFetch(...args);
    const duration = Date.now() - startTime;
    console.log(`Response: ${response.status} (${duration}ms)`);
    return response;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
};

// 使用 Reactotron 调试
import Reactotron from "reactotron-react-native";

Reactotron.configure()
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate/,
    },
  })
  .connect();

// 在代码中使用
Reactotron.log("Hello World");
Reactotron.display({
  name: "User Data",
  value: userData,
  preview: userData.name,
});
```

## 六、原生模块开发

### iOS 原生模块示例

```objective-c
// CalendarModule.m
#import "CalendarModule.h"
#import <EventKit/EventKit.h>

@implementation CalendarModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(createEvent:(NSString *)title
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  EKEventStore *store = [[EKEventStore alloc] init];
  EKEvent *event = [EKEvent eventWithEventStore:store];
  event.title = title;
  resolve(event.eventIdentifier);
}

@end
```

### Android 原生模块示例

```java
// CalendarModule.java
public class CalendarModule extends ReactContextBaseJavaModule {
    @Override
    public String getName() {
        return "CalendarModule";
    }

    @ReactMethod
    public void createEvent(String title, Promise promise) {
        // 创建日历事件
        promise.resolve(eventId);
    }
}
```

## 七、常见面试题

### 1. React Native 的工作原理是什么？

**核心机制**：

- JS 线程运行 JavaScript 代码
- Native 线程负责 UI 渲染
- Bridge 进行异步通信（旧架构）
- JSI 实现同步通信（新架构）

**渲染流程**：

```
JavaScript -> React Reconciliation -> Shadow Tree -> Yoga Layout -> Native Views
```

### 2. 新旧架构的区别？

| 对比项   | 旧架构                | 新架构               |
| -------- | --------------------- | -------------------- |
| 通信方式 | Bridge（异步+序列化） | JSI（同步+直接调用） |
| 渲染引擎 | 旧渲染器              | Fabric               |
| 原生模块 | NativeModules         | TurboModules         |
| 启动方式 | 全量加载              | 按需加载             |
| 类型安全 | 弱                    | 强（CodeGen）        |

### 3. 如何优化 FlatList 性能？

```javascript
<FlatList
  // 1. 提供精确的 item 尺寸
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  // 2. 优化渲染数量
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
  // 3. 移除不可见视图
  removeClippedSubviews={true}
  // 4. 更新优化
  updateCellsBatchingPeriod={50}
  // 5. 使用 keyExtractoror
  keyExtractor={(item) => item.id}
  // 6. 使用 React.memo/ 6. 使用 React.memo
  renderItem={({ item }) => <MemoizedItem item={item} />}
  renderItem={({ item }) => <MemoizedItem item={item} />}
/>
```

### 4. useNativeDriver 的原理？

**原理**：

- 动画配置在 JS 线程序列化后发送到 Native- 动画配置在 JS 线程序列化后发送到 Native
- Native 端独立执行动画，不经过 Bridgee 端独立执行动画，不经过 Bridge
- 动画运行在 UI 线程，60fps 流畅

**限制**：**限制**：

- 只支持 transform 和 opacityrm 和 opacity
- 不支持布局属性（width、height、flex 等）属性（width、backgroundColor、flex 等）

```javascript
// ✅ 支持
Animated.timing(value, {ming(value, {
  toValue: 100,  toValue: 100,
  useNativeDriver: true, // transform、opacityiveDriver: true, // transform、opacity
}).start();

// ❌ 不支持
Animated.timing(value, {ming(value, {
  toValue: 100,oValue: 100,
  useNativeDriver: true, // width、backgroundColor  useNativeDriver: true, // width、backgroundColor
}).start();
```

### 5. 如何实现 JS 和 Native 的双向通信？S 和 Native 的双向通信？

**JS 调用 Native**：S 调用 Native\*\*：
`javascript`javascript
NativeModules.MyModule.doSomething()odule.doSomething()

````

**Native 调用 JS**：
```javascript```javascript
// JS 端监听
eventEmitter.addListener('eventName', handler);

// Native 端发送// Native 端发送
[self sendEventWithName:@"eventName" body:@{@"data": data}];ame:@"eventName" body:@{@"data": data}];
````

### 6. Hermes 引擎的优势？

1. **字节码预编译**：APK 中包含字节码，启动更快，启动更快
2. **更小的内存占用**：优化的 GC 算法 2. **更小的内存占用**：优化的 GC 算法
3. **更快的启动速度**：减少 50% 启动时间少 50% 启动时间
4. **更小的体积**：字节码比 JS 源码小 4. **更小的体积**：字节码比 JS 源码小

### 7. 如何调试性能问题？

**工具**：

- Chrome DevTools（JS 性能）
- Flipper（网络、布局、性能）- Flipper（网络、布局、性能）
- Xcode Instruments（iOS 深度分析） Instruments（iOS 深度分析）
- Android Studio Profiler（Android 深度分析）dio Profiler（Android 深度分析）

**方法**：
`javascript`javascript
// 1. 开启性能监视器
// Dev Menu -> Show Perf Monitor

// 2. 使用 Profiler API
import { Profiler } from 'react';

const onRender = (id, phase, actualDuration) => {const onRender = (id, phase, actualDuration) => {
console.log(`${id} (${phase}) took ${actualDuration}ms`);actualDuration}ms`);
};

<Profiler id="App" onRender={onRender}><Profiler id="App" onRender={onRender}>
<App />
</Profiler>

// 3. 检测慢渲染/ 3. 检测慢渲染
if (actualDuration > 16) {(actualDuration > 16) {
console.warn('Slow render detected!'); console.warn('Slow render detected!');
}

````

### 8. 如何处理大图片？理大图片？

```javascript
// 1. 图片压缩
<Image
  source={{ uri: url }}
  resizeMode="cover"resizeMode="cover"
  // 指定尺寸让系统自动缩放  // 指定尺寸让系统自动缩放
  style={{ width: 100, height: 100 }}100, height: 100 }}
/>

// 2. 使用 FastImageastImage
import FastImage from 'react-native-fast-image';Image from 'react-native-fast-image';

<FastImage
  source={{
    uri: url,uri: url,
    priority: FastImage.priority.high,  priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable,    cache: FastImage.cacheControl.immutable,
  }}
/>

// 3. 渐进式加载渐进式加载
const [imageLoaded, setImageLoaded] = useState(false);eState(false);

<View>
  {!imageLoaded && <PlaceholderImage />}}
  <Image mage
    source={{ uri: highResUrl }}rce={{ uri: highResUrl }}
    onLoad={() => setImageLoaded(true)} onLoad={() => setImageLoaded(true)}
  />  />
</View>
````

### 9. 内存泄漏如何排查和避免？泄漏如何排查和避免？

**常见原因**：

- 未清理的定时器
- 未取消的网络请求- 未取消的网络请求
- 未移除的事件监听听
- 闭包引用大对象

**解决方案**：

```javascript
useEffect(() => {eEffect(() => {
  const timer = setInterval(() => {}, 1000);setInterval(() => {}, 1000);
  const subscription = eventEmitter.addListener('event', handler);entEmitter.addListener('event', handler);

  return () => {turn () => {
    clearInterval(timer);arInterval(timer);
    subscription.remove(); subscription.remove();
  };  };
}, []);
```

### 10. 如何实现热更新？

**方案**：**方案**：

1. **CodePush（微软）**（微软）\*\*
2. **自建方案**

`javascript`javascript
// CodePush 示例
import codePush from 'react-native-code-push';m 'react-native-code-push';

const App = () => {
useEffect(() => {
codePush.sync({ePush.sync({
updateDialog: true,ateDialog: true,
installMode: codePush.InstallMode.IMMEDIATE, installMode: codePush.InstallMode.IMMEDIATE,
});
}, []);}, []);

return <MainApp />;
};

export default codePush(App);(App);

````

### 11. Bridge 的性能瓶颈在哪？

**问题**：
1. **序列化开销**：所有数据需要 JSON 序列化SON 序列化
2. **异步通信**：无法同步返回结果2. **异步通信**：无法同步返回结果
3. **批处理延迟**：消息会被批量发送
4. **内存拷贝**：数据需要跨线程拷贝4. **内存拷贝**：数据需要跨线程拷贝

**解决**：使用新架构的 JSI 和 TurboModules**解决**：使用新架构的 JSI 和 TurboModules

### 12. 如何实现原生 UI 组件？

```objective-c```objective-c
// iOS - MyCustomView.mew.m
@implementation MyCustomViewManager@implementation MyCustomViewManager

RCT_EXPORT_MODULE()

- (UIView *)view {- (UIView *)view {
  return [[MyCustomView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(color, UIColor)EXPORT_VIEW_PROPERTY(color, UIColor)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end
```

```javascript```javascript
// JavaScript 使用
import { requireNativeComponent } from 'react-native';import { requireNativeComponent } from 'react-native';

const MyCustomView = requireNativeComponent('MyCustomView');mView = requireNativeComponent('MyCustomView');

<MyCustomView yCustomView
  color="red"olor="red"
  onPress={(event) => console.log(event)}  onPress={(event) => console.log(event)}
/>
````

### 13. Fabric 架构的改进？

**核心改进**：

1. **同步布局**：JS 可以同步读取布局信息
2. **类型安全**：通过 CodeGen 生成类型 2. **类型安全**：通过 CodeGen 生成类型
3. **简化架构**：C++ 统一实现，跨平台共享一实现，跨平台共享
4. **并发渲染**：支持 React 18 并发特性 4. **并发渲染**：支持 React 18 并发特性

### 14. 如何优化启动时间？动时间？

**策略**：
`javascript`javascript
// 1. 内联 requirequire
const MyComponent = require('./MyComponent');

// 2. 懒加载路由
const Profile = React.lazy(() => import('./Profile'));eact.lazy(() => import('./Profile'));

// 3. 预加载关键资源
useEffect(() => {
Promise.all([
Font.loadAsync({ ... }),t.loadAsync({ ... }),
Asset.loadAsync([...]), Asset.loadAsync([...]),
]).then(() => setReady(true)); setReady(true));
}, []);

// 4. 使用 Hermes// 4. 使用 Hermes
// 5. 启用 RAM Bundlele

````

### 15. 手势冲突如何处理？

```javascript
import { PanGestureHandler, State } from 'react-native-gesture-handler';e } from 'react-native-gesture-handler';

<PanGestureHandler
  onGestureEvent={handleGesture}ent={handleGesture}
  onHandlerStateChange={({ nativeEvent }) => {andlerStateChange={({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {if (nativeEvent.state === State.ACTIVE) {
      // 处理手势势
    }
  }}
  // 设置手势优先级 // 设置手势优先级
  shouldCancelWhenOutside={false}utside={false}
  simultaneousHandlers={otherGestureRef}rs={otherGestureRef}
>
  <Animated.View />  <Animated.View />
</PanGestureHandler>
````

### 16. 解释 Shadow Tree 和 Native Tree 的关系？dow Tree 和 Native Tree 的关系？

**Shadow Tree**：w Tree\*\*：

- 存在于 JS 侧的虚拟树- 存在于 JS 侧的虚拟树
- 用于 Yoga 布局计算
- 不直接渲染

**Native Tree**：**Native Tree**：

- 真实的原生 UI 组件树 UI 组件树
- 根据 Shadow Tree 的布局信息创建据 Shadow Tree 的布局信息创建

**流程**：

```
React Element Treeent Tree
    ↓ (React Reconciliation)
Shadow Tree (Yoga 计算布局)dow Tree (Yoga 计算布局)
    ↓ (映射)    ↓ (映射)
Native View Hierarchy (UIView/View)iew)
```

### 17. InteractionManager 的作用？r 的作用？

```javascript
// 作用：延迟执行非关键任务，等待交互和动画完成行非关键任务，等待交互和动画完成

const loadData = () => {nst loadData = () => {
  // 立即执行
  showLoadingSpinner();

  // 延迟到动画结束后执行
  InteractionManager.runAfterInteractions(() => {erInteractions(() => {
    fetchData().then(data => {chData().then(data => {
      setData(data); setData(data);
      hideLoadingSpinner();    hideLoadingSpinner();
    });    });
  });
};

// 原理：等待所有动画和手势结束束
// 使用场景：
// - 路由转场后加载数据- 路由转场后加载数据
// - 动画期间延迟重量级操作// - 动画期间延迟重量级操作
// - 优化用户体验
```

### 18. Metro Bundler 的工作原理？ 18. Metro Bundler 的工作原理？

**核心流程**：流程\*\*：

```
1. 解析入口文件（index.js）析入口文件（index.js）
   ↓
2. 递归解析依赖（require/import）归解析依赖（require/import）
   ↓
3. 转换代码（Babel）换代码（Babel）
   ↓
4. 生成依赖图（Dependency Graph）成依赖图（Dependency Graph）
   ↓
5. 序列化打包（Bundle）序列化打包（Bundle）
   ↓   ↓
6. 输出（development/production）elopment/production）
```

**优化配置**：

```javascript
// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({({
      transform: {ansform: {
        experimentalImportSupport: false, experimentalImportSupport: false,
        inlineRequires: true, // 性能优化    inlineRequires: true, // 性能优化
      },
    }),
  },
  resolver: {resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'], sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },  },
};
```

### 19. 如何实现深度链接（Deep Linking）？现深度链接（Deep Linking）？

```javascript
// 1. 配置原生端置原生端
// iOS: Info.plistInfo.plist
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>undleURLSchemes</key>
    <array>y>
      <string>myapp</string>tring>myapp</string>
    </array>    </array>
  </dict>
</array>

// Android: AndroidManifest.xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />ntent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />oid:name="android.intent.category.DEFAULT" />

// 2. JavaScript 处理
import { Linking } from 'react-native';

useEffect(() => {
  // 监听链接
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  // 处理冷启动
  Linking.getInitialURL().then(url => {
    if (url) handleDeepLink(url);
  });

  return () => subscription.remove();
}, []);

const handleDeepLink = (url) => {
  // myapp://product/123
  const route = url.replace(/.*?:\/\//g, '');
  const [screen, id] = route.split('/');
  navigation.navigate(screen, { id });
};
```

### 20. Reanimated 2 比 Animated 好在哪？

**对比**：

| 特性     | Animated       | Reanimated 2 |
| -------- | -------------- | ------------ |
| 运行线程 | JS 线程        | UI 线程      |
| 性能     | 受 Bridge 影响 | 原生级性能   |
| 手势集成 | 困难           | 简单         |
| 复杂动画 | 性能差         | 性能好       |
| 学习曲线 | 简单           | 较陡         |

**示例**：

```javascript
// Reanimated 2
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const Box = () => {
  const offset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const handlePress = () => {
    // 直接在 UI 线程更新，无延迟
    offset.value = withSpring(offset.value + 100);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={handlePress}>
        <Text>Move</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 21. 如何实现跨平台样式差异处理？

```javascript
// 1. Platform API
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// 2. 平台特定文件
// Button.ios.js
// Button.android.js
import Button from "./Button"; // 自动选择

// 3. 运行时检测
if (Platform.OS === "ios") {
  // iOS 特定逻辑
} else if (Platform.OS === "android") {
  // Android 特定逻辑
}

// 4. 版本检测
if (Platform.Version >= 29) {
  // Android 10+ 特性
}
```

### 22. 如何实现全局状态管理？

```javascript
// 1. Context + useReducer
const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// 2. Redux
import { createStore } from "redux";
import { Provider } from "react-redux";

const store = createStore(rootReducer);

<Provider store={store}>
  <App />
</Provider>;

// 3. Zustand（推荐，轻量）
import create from "zustand";

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

const Profile = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  // ...
};
```

### 23. 如何处理键盘遮挡输入框？

```javascript
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

const LoginScreen = () => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <TextInput placeholder="Email" />
        <TextInput placeholder="Password" secureTextEntry />
        <Button title="Login" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// 或使用 react-native-keyboard-aware-scroll-view
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

<KeyboardAwareScrollView enableOnAndroid extraScrollHeight={20}>
  {/* 内容 */}
</KeyboardAwareScrollView>;
```

### 24. 如何实现无限滚动列表？

```javascript
const InfiniteList = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetchData(page);
      setData([...data, ...newData]);
      setPage(page + 1);
      setHasMore(newData.length > 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ListItem item={item} />}
      keyExtractor={(item) => item.id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
};
```

### 25. 如何优化包体积？

**策略**：

```bash
# 1. 分析包体积
npx react-native-bundle-visualizer

# 2. 启用 Hermes（减少 30-40%）
# android/app/build.gradle
project.ext.react = [enableHermes: true]

# 3. 启用 ProGuard（Android）
# android/app/build.gradle
buildTypes {
  release {
    minifyEnabled true
    shrinkResources true
    proguardFiles getDefaultProguardFile('proguard-android.txt')
  }
}

# 4. 优化图片资源
- 使用 WebP 格式
- 按分辨率提供多套图片
- 移除未使用的资源

# 5. 按需加载
- 路由懒加载
- 模块动态导入

# 6. 移除未使用的依赖
npm prune
```

### 26. 如何实现离线功能？

```javascript
// 1. 网络状态检测
import NetInfo from "@react-native-community/netinfo";

const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return unsubscribe;
  }, []);

  return isConnected;
};

// 2. 数据缓存
import AsyncStorage from "@react-native-async-storage/async-storage";

const fetchWithCache = async (url, key) => {
  try {
    // 先尝试从缓存读取
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // 从网络获取
    const response = await fetch(url);
    const data = await response.json();

    // 保存到缓存
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch (error) {
    // 网络错误，返回缓存
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  }
};

// 3. 使用数据库（WatermelonDB、Realm）
import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
});

const database = new Database({
  adapter,
  modelClasses: [Post, Comment],
});
```

### 27. 性能监控和错误追踪？

```javascript
// 1. Sentry 错误追踪
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "YOUR_DSN",
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0,
});

// 2. 自定义性能监控
const PerformanceMonitor = () => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      logPerformance("ScreenRenderTime", duration);
    };
  }, []);
};

// 3. 崩溃报告
Sentry.captureException(new Error("Something went wrong"));

// 4. 用户行为追踪
Sentry.addBreadcrumb({
  message: "User clicked button",
  category: "action",
  level: "info",
});
```

### 28. 如何实现国际化？

```javascript
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        welcome: "Welcome",
        greeting: "Hello, {{name}}!",
      },
    },
    zh: {
      translation: {
        welcome: "欢迎",
        greeting: "你好，{{name}}！",
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

const App = () => {
  const { t, i18n } = useTranslation();

  return (
    <View>
      <Text>{t("welcome")}</Text>
      <Text>{t("greeting", { name: "User" })}</Text>
      <Button title="中文" onPress={() => i18n.changeLanguage("zh")} />
    </View>
  );
};
```

## 八、最佳实践总结

### 1. 代码组织

```
src/
  ├── components/      # 通用组件
  ├── screens/         # 页面组件
  ├── navigation/      # 导航配置
  ├── hooks/           # 自定义 Hooks
  ├── utils/           # 工具函数
  ├── services/        # API 服务
  ├── stores/          # 状态管理
  ├── constants/       # 常量定义
  ├── types/           # TypeScript 类型
  └── assets/          # 静态资源
```

### 2. 性能优化清单

- ✅ 使用 `React.memo` 和 `useMemo`
- ✅ 使用 `useCallback` 避免重新创建函数
- ✅ FlatList 使用 `getItemLayout`
- ✅ 图片使用 `FastImage`
- ✅ 动画使用 `useNativeDriver: true`
- ✅ 启用 Hermes 引擎
- ✅ 避免内联对象和函数
- ✅ 使用 InteractionManager 延迟非关键任务

### 3. 安全建议

```javascript
// 1. 敏感信息加密存储
import * as Keychain from "react-native-keychain";

await Keychain.setGenericPassword("username", "password");

// 2. API 密钥不要硬编码
// 使用环境变量
import Config from "react-native-config";
const API_KEY = Config.API_KEY;

// 3. 使用 HTTPS
// 4. 启用代码混淆
// 5. 实现证书固定（Certificate Pinning）
```

### 4. 测试策略

```javascript
// 单元测试（Jest）
import { render, fireEvent } from "@testing-library/react-native";

test("button press", () => {
  const onPress = jest.fn();
  const { getByText } = render(<Button title="Press me" onPress={onPress} />);

  fireEvent.press(getByText("Press me"));
  expect(onPress).toHaveBeenCalled();
});

// E2E 测试（Detox）
describe("Login", () => {
  it("should login successfully", async () => {
    await element(by.id("email")).typeText("user@example.com");
    await element(by.id("password")).typeText("password");
    await element(by.id("loginButton")).tap();
    await expect(element(by.text("Welcome"))).toBeVisible();
  });
});
```

## 九、核心面试题深度解析

### Q1: 详细解释 React Native 新架构（Fabric）的工作原理？

**传统架构问题**：

```
JS Thread ──[异步 Bridge]──> Shadow Thread ──> UI Thread
         (JSON 序列化)                (布局计算)
```

**新架构 Fabric**：

```
JS Thread ──[JSI 同步调用]──> C++ Core ──> UI Thread
         (直接内存访问)      (Fabric)
```

**关键改进**：

1. **JSI（JavaScript Interface）**：

   - 直接调用 C++，无序列化
   - 支持同步方法
   - 共享内存，零拷贝

2. **Shadow Tree 重构**：

   - C++ 实现，跨平台共享
   - 支持优先级调度
   - 可中断渲染

3. **类型安全**：
   - CodeGen 生成类型定义
   - 编译时类型检查

### Q2: Hermes 引擎相比 JSC/V8 的优势和劣势？

**优势**：

```
启动时间对比：
JSC:    Source → Parse → Compile → Execute (1000ms)
Hermes: Bytecode → Execute (400ms) ⬇️ 60%

内存占用：
JSC:    ~45MB
Hermes: ~25MB ⬇️ 44%
```

**技术细节**：

- 预编译字节码（HBC 格式）
- 优化的 GC（分代回收）
- 寄存器架构（vs 栈架构）
- 延迟解析函数

**劣势**：

- 无 JIT，长时间运行性能不如 V8
- 调试支持相对较弱
- 某些 ES6+ 特性支持较晚

### Q3: 如何系统性地定位和解决 React Native 性能问题？

**诊断工具链**：

```javascript
// 1. FPS 监控
const FPSMonitor = () => {
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;

    const checkFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = (frames * 1000) / (currentTime - lastTime);
        console.log("FPS:", fps.toFixed(2));

        if (fps < 55) {
          console.warn("⚠️ Frame drop detected");
        }

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(checkFPS);
    };

    checkFPS();
  }, []);
};

// 2. 渲染性能分析
import { Profiler } from "react";

<Profiler
  id="ExpensiveComponent"
  onRender={(id, phase, actualDuration) => {
    if (actualDuration > 16) {
      // 超过一帧时间
      console.warn(`Slow render: ${id} took ${actualDuration}ms`);
    }
  }}
>
  <ExpensiveComponent />
</Profiler>;

// 3. JS 线程阻塞检测
let lastCheckTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const delay = now - lastCheckTime - 100;

  if (delay > 50) {
    console.warn(`JS thread blocked for ${delay}ms`);
  }

  lastCheckTime = now;
}, 100);
```

**优化策略**：

1. **列表优化**：虚拟化、getItemLayout、removeClippedSubviews
2. **动画优化**：useNativeDriver、Reanimated 2
3. **图片优化**：FastImage、合适尺寸、WebP 格式
4. **代码分割**：懒加载路由、动态导入
5. **减少重渲染**：React.memo、useMemo、useCallback

### Q4: 深入解释 useNativeDriver 的实现原理？

**工作机制**：

```javascript
// 1. JS 端配置动画
Animated.timing(animatedValue, {
  toValue: 100,
  duration: 1000,
  useNativeDriver: true, // 关键参数
}).start();

// 2. 动画配置序列化发送到 Native
{
  type: 'timing',
  property: 'translateX',
  fromValue: 0,
  toValue: 100,
  duration: 1000,
  easing: 'linear'
}

// 3. Native 端接管动画执行
// iOS (Objective-C)
@implementation RCTNativeAnimatedModule

- (void)startAnimation:(NSDictionary *)config {
  CABasicAnimation *animation = [CABasicAnimation animationWithKeyPath:@"transform.translation.x"];
  animation.fromValue = config[@"fromValue"];
  animation.toValue = config[@"toValue"];
  animation.duration = [config[@"duration"] doubleValue] / 1000.0;

  [layer addAnimation:animation forKey:@"nativeAnimation"];
}

@end

// 4. 动画在 UI 线程执行，无需通过 Bridge
```

**为什么只支持 transform 和 opacity？**

- 这些属性由 GPU 加速，不触发布局重排
- 可以在合成线程直接操作
- 其他属性（width、backgroundColor）需要重新布局/绘制

### Q5: 如何实现一个高性能的无限滚动列表？

```javascript
const HighPerformanceInfiniteList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 使用 useCallback 避免函数重建
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetchData(page);

      // 使用函数式更新避免闭包陷阱
      setData((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
      setHasMore(newData.length === PAGE_SIZE);
    } catch (error) {
      console.error("Load failed:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  // 优化 renderItem
  const renderItem = useCallback(
    ({ item }) => <MemoizedListItem item={item} />,
    []
  );

  // 提供精确尺寸避免测量
  const getItemLayout = useCallback(
    (data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // 优化 keyExtractor
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      // 性能优化配置
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      // 无限滚动
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      // Footer
      ListFooterComponent={loading ? <ActivityIndicator size="large" /> : null}
      // 空状态
      ListEmptyComponent={<EmptyState />}
    />
  );
};

// 使用 React.memo 优化列表项
const MemoizedListItem = React.memo(
  ({ item }) => {
    // 避免内联函数和对象
    const handlePress = useCallback(() => {
      navigation.navigate("Detail", { id: item.id });
    }, [item.id]);

    const imageStyle = useMemo(
      () => ({
        width: 80,
        height: 80,
        borderRadius: 8,
      }),
      []
    );

    return (
      <TouchableOpacity onPress={handlePress} style={styles.item}>
        <FastImage
          source={{ uri: item.image }}
          style={imageStyle}
          resizeMode="cover"
        />
        <View style={styles.content}>
          <Text numberOfLines={2}>{item.title}</Text>
          <Text numberOfLines={1}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title
    );
  }
);
```

## 十、总结

### 核心技术栈

1. **架构层**：JSI + Fabric + TurboModules
2. **引擎层**：Hermes（字节码预编译）
3. **布局层**：Yoga（Flexbox 引擎）
4. **通信层**：同步 JSI / 异步 Bridge
5. **渲染层**：Shadow Tree → Native Views

### 性能优化核心

| 优化点     | 方案                   | 收益     |
| ---------- | ---------------------- | -------- |
| 启动时间   | Hermes + 懒加载        | -50%     |
| 列表滚动   | 虚拟化 + getItemLayout | 60 FPS   |
| 动画流畅度 | useNativeDriver        | 原生性能 |
| 包体积     | Hermes + ProGuard      | -40%     |
| 内存占用   | 及时释放 + 图片优化    | -30%     |

### 学习路径建议

```
Level 1: 基础使用
├─ React 基础（必须）
├─ RN 组件和 API
└─ 样式和布局

Level 2: 进阶开发
├─ 导航和路由
├─ 状态管理
├─ 网络请求
└─ 第三方库集成

Level 3: 性能优化
├─ 列表优化
├─ 动画优化
├─ 包体积优化
└─ 启动时间优化

Level 4: 深入原理
├─ 架构原理
├─ 原生模块开发
├─ JSI 和 Fabric
└─ 源码阅读

Level 5: 工程化
├─ CI/CD
├─ 热更新
├─ 监控和埋点
└─ 跨平台架构设计
```

### 常见面试重点

**必问**：

- [ ] 新旧架构区别
- [ ] Hermes 引擎特点
- [ ] Bridge 通信原理
- [ ] FlatList 优化
- [ ] useNativeDriver 原理

**高频**：

- [ ] 性能优化方案
- [ ] 内存泄漏排查
- [ ] 原生模块开发
- [ ] 热更新实现
- [ ] 跨平台差异处理

**加分项**：

- [ ] JSI 底层实现
- [ ] Fabric 架构细节
- [ ] Yoga 布局引擎
- [ ] 源码阅读经验
- [ ] 大型项目优化案例

### 参考资源

- 📚 官方文档：https://reactnative.dev
- 🏗️ 新架构：https://reactnative.dev/docs/the-new-architecture/landing-page
- 💻 GitHub：https://github.com/facebook/react-native
- 🚀 Hermes：https://hermesengine.dev
- 🎨 Reanimated：https://docs.swmansion.com/react-native-reanimated

---

**文档完成时间**：2025-11-20  
**适用版本**：React Native 0.72+  
**覆盖范围**：架构原理、性能优化、面试题库
