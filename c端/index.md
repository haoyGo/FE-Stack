## 2025 年移动端适配完整方案

### 一、核心概念理解

#### 1. 三种视口（Viewport）

- **Layout Viewport（布局视口）**：网页布局的区域，`document.documentElement.clientWidth`
- **Visual Viewport（视觉视口）**：用户当前看到的区域，`window.innerWidth`
- **Ideal Viewport（理想视口）**：设备的屏幕宽度，通过 `width=device-width` 设置

#### 2. 像素相关概念

- **物理像素（Physical Pixel）**：设备屏幕的实际像素点
- **设备独立像素（DIP/DP）**：逻辑像素，CSS 像素
- **设备像素比（DPR）**：`window.devicePixelRatio = 物理像素 / 设备独立像素`
- **PPI/DPI**：每英寸的物理像素数，屏幕密度

```js
// 常见设备的 DPR
// iPhone 6/7/8: 2
// iPhone X/11/12/13/14: 3
// 大部分安卓旗舰机: 2.5-3
console.log(window.devicePixelRatio);
```

---

### 📌 为什么 750px 设计稿能适配所有设备？

**核心原理：vw 和 rem 是相对单位，会自动按比例缩放！**

假设设计稿上一个按钮宽度是 **300px**：

| 设备              | 屏幕宽度 | vw 方案（40vw） | rem 方案（3rem，font-size=13.333vw） |
| ----------------- | -------- | --------------- | ------------------------------------ |
| iPhone SE         | 375px    | 150px（40%）    | 150px（50px × 3）                    |
| iPhone 14         | 390px    | 156px（40%）    | 156px（52px × 3）                    |
| iPhone 14 Pro Max | 430px    | 172px（40%）    | 172px（57.33px × 3）                 |

**关键点**：

- 750px 只是设计师的画布大小和转换基准
- 实际显示时，元素会**按比例自动缩放**
- vw 方案：`300px → 40vw`（占屏幕宽度 40%）
- rem 方案：`300px → 3rem`（html font-size 用 vw 设置，也是按比例）

**验证方法**：Chrome DevTools 切换不同设备，观察元素始终占据相同比例 ✅

---

### 📌 PostCSS 是否必须使用？

**答案：强烈推荐！让你直接写 px，自动转 vw/rem**

```css
/* ❌ 不用 PostCSS：手动计算，易出错 */
.button {
  width: 40vw; /* 300/750*100 */
  font-size: 3.733vw; /* 28/750*100 */
}

/* ✅ 用 PostCSS：直接写设计稿标注的 px */
.button {
  width: 300px; /* 自动转为 40vw */
  font-size: 28px; /* 自动转为 3.733vw */
}
```

**核心价值**：

- ✅ 提高开发效率 3-5 倍（无需手动计算）
- ✅ 代码可读性强（直接看出原始尺寸）
- ✅ 团队协作友好（设计稿标注多少就写多少）
- ✅ 灵活控制（可配置黑名单）

---

### 二、主流适配方案对比（2025 推荐）

#### 方案 1：vw 方案 ⭐⭐⭐⭐⭐（首选推荐）

**原理**：1vw = 视口宽度的 1%，纯 CSS，无需 JS

**配置：**

```bash
npm install postcss-px-to-viewport-8-plugin -D
```

```js
// vite.config.js
import pxToViewport from "postcss-px-to-viewport-8-plugin";

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        pxToViewport({
          viewportWidth: 750, // 设计稿宽度
          unitPrecision: 5,
          selectorBlackList: [".ignore", "van-"], // 不转换的类
          minPixelValue: 1,
          exclude: [/node_modules/],
        }),
      ],
    },
  },
});
```

**使用：**

```css
/* 你写的代码 */
.box {
  width: 375px; /* → 50vw */
  font-size: 28px; /* → 3.733vw */
}
```

---

#### 方案 2：vw + rem 混合方案 ⭐⭐⭐⭐⭐（大厂推荐）

**原理**：用 vw 设置 html font-size，用 rem 布局（可限制最大最小值）

**步骤 1：设置 html font-size**

```css
html {
  /* 基础方案 */
  font-size: 13.333vw; /* 100/750*100，1rem = 100px */

  /* 推荐：限制范围 */
  font-size: clamp(42.667px, 13.333vw, 102.4px);
  /* 320px 屏幕最小 42.667px，768px 屏幕最大 102.4px */
}

body {
  font-size: 0.14rem; /* 重置为 14px */
}
```

**步骤 2：PostCSS 配置**

```bash
npm install postcss-pxtorem -D
```

```js
// vite.config.js
import pxToRem from "postcss-pxtorem";

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        pxToRem({
          rootValue: 100, // 1rem = 100px
          propList: ["*"],
          selectorBlackList: ["van-"],
          minPixelValue: 2,
        }),
      ],
    },
  },
});
```

**使用：**

```css
/* 你写的代码 */
.box {
  width: 375px; /* → 3.75rem */
  font-size: 28px; /* → 0.28rem */
}
```

---

#### 🔥 方案对比

| 对比项       | vw 方案                           | rem 方案                           |
| ------------ | --------------------------------- | ---------------------------------- |
| **插件**     | `postcss-px-to-viewport-8-plugin` | `postcss-pxtorem`                  |
| **输出**     | px → vw                           | px → rem（配合 vw 设置 font-size） |
| **限制大小** | ❌ 不能                           | ✅ clamp 或媒体查询                |
| **推荐场景** | 不需要限制尺寸                    | 需要限制最大最小尺寸               |

**核心提醒**：两个方案都在 CSS 中写 px，由 PostCSS 自动转换！

---

#### 方案 3：Container Query 容器查询 ⭐⭐⭐⭐⭐（未来趋势）

**浏览器支持**：Chrome 105+, Safari 16+（2023 年后主流浏览器已支持）

```css
/* 定义容器 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* 根据容器宽度设置样式 */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: block;
  }
}

/* 容器查询单位 */
.card-title {
  font-size: 5cqw; /* 容器宽度的 5% */
}
```

**cq 单位**：

- `cqw`：容器宽度的 1%
- `cqh`：容器高度的 1%
- `cqi`：容器行内方向的 1%
- `cqb`：容器块方向的 1%

---

### 三、1px 边框解决方案

#### 方法 1：transform scale（推荐，兼容性最好）

```scss
// 单边边框
.border-1px {
  position: relative;
  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: #333;
    transform: scaleY(0.5);
    transform-origin: 0 0;
  }
}

// 四边边框
.border-all::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  border: 1px solid #333;
  transform: scale(0.5);
  transform-origin: 0 0;
  box-sizing: border-box;
}
```

#### 方法 2：CSS 变量 + 媒体查询

```css
:root {
  --hairline: 1px;
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  :root {
    --hairline: 0.5px;
  }
}

.border {
  border-bottom: var(--hairline) solid #333;
}
```

---

### 四、安全区域适配（刘海屏/挖孔屏）

#### 1. viewport-fit 与 env()

```html
<!-- viewport-fit=cover 让页面占满整个屏幕 -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover"
/>
```

```css
/* env() 获取安全区域边距 */
body {
  /* 兼容写法 */
  padding-top: constant(safe-area-inset-top); /* iOS 11.0-11.2 */
  padding-top: env(safe-area-inset-top); /* iOS 11.2+ */

  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 固定底部按钮 */
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #fff;
}

/* 使用 max 确保最小间距 */
.safe-area-box {
  padding: max(12px, env(safe-area-inset-top)) max(
      16px,
      env(safe-area-inset-right)
    )
    max(12px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
}
```

#### 2. CSS 变量统一管理

```css
:root {
  --safe-top: env(safe-area-inset-top);
  --safe-right: env(safe-area-inset-right);
  --safe-bottom: env(safe-area-inset-bottom);
  --safe-left: env(safe-area-inset-left);

  /* 常用的组合值 */
  --page-padding-top: max(16px, var(--safe-top));
  --page-padding-bottom: max(16px, var(--safe-bottom));
}
```

---

### 五、字体适配

```css
/* 方案1：流式字体（推荐） */
:root {
  --font-size-base: clamp(14px, 3.733vw, 18px);
  --font-size-large: clamp(16px, 4.267vw, 20px);
}

body {
  font-size: var(--font-size-base);
  -webkit-text-size-adjust: 100%; /* 禁止 iOS 自动调整字体 */
}

/* 长文本建议固定字体 */
.article-content {
  font-size: 16px; /* 不随屏幕缩放 */
  max-width: 680px;
  margin: 0 auto;
}
```

---

### 六、图片适配

```html
<!-- srcset：根据屏幕密度加载 -->
<img
  src="image.jpg"
  srcset="image@1x.jpg 1x, image@2x.jpg 2x, image@3x.jpg 3x"
  alt="图片"
/>

<!-- picture：现代格式降级 -->
<picture>
  <source type="image/avif" srcset="image.avif 1x, image@2x.avif 2x" />
  <source type="image/webp" srcset="image.webp 1x, image@2x.webp 2x" />
  <img src="image.jpg" srcset="image@2x.jpg 2x" alt="图片" />
</picture>
```

```css
/* CSS 背景图 */
.bg-image {
  background-image: image-set(
    url("image@1x.jpg") 1x,
    url("image@2x.jpg") 2x,
    url("image@3x.jpg") 3x
  );
  background-size: cover;
}
```

---

### 七、横竖屏适配

```css
@media screen and (orientation: portrait) {
  .container {
    flex-direction: column;
  }
}

@media screen and (orientation: landscape) {
  .container {
    flex-direction: row;
  }
  html {
    font-size: 12px;
  } /* 横屏时减小字体 */
}
```

```js
// JS 监听横竖屏切换
const mediaQuery = window.matchMedia("(orientation: portrait)");
mediaQuery.addEventListener("change", (e) => {
  console.log(e.matches ? "竖屏" : "横屏");
});
```

---

### 八、常见问题

#### 1. iOS 输入框聚焦缩放

```css
/* 设置字体 >= 16px，防止自动放大 */
input,
textarea {
  font-size: 16px;
}
```

#### 2. 软键盘遮挡输入框

```js
window.addEventListener("resize", () => {
  if (window.innerHeight < document.documentElement.clientHeight) {
    setTimeout(() => {
      document.activeElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
  }
});
```

#### 3. iOS 键盘弹出时固定定位错位

```js
if ("visualViewport" in window) {
  const viewport = window.visualViewport;
  viewport.addEventListener("resize", () => {
    const offsetBottom = viewport.height - window.innerHeight;
    document.getElementById("fixed-button").style.bottom = -offsetBottom + "px";
  });
}
```

#### 4. 点击延迟

```css
* {
  touch-action: manipulation;
}
```

---

### 九、完整的工程化配置

#### Vite + Vue3 完整配置

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import autoprefixer from "autoprefixer";
import pxToViewport from "postcss-px-to-viewport-8-plugin";

export default defineConfig({
  plugins: [vue()],
  css: {
    postcss: {
      plugins: [
        autoprefixer({
          overrideBrowserslist: ["Android >= 4.4", "iOS >= 9"],
        }),
        pxToViewport({
          viewportWidth: 750,
          viewportHeight: 1334,
          unitPrecision: 5,
          viewportUnit: "vw",
          selectorBlackList: [".ignore", ".hairlines", "van-"],
          minPixelValue: 1,
          mediaQuery: false,
          exclude: [/node_modules\/vant/],
        }),
      ],
    },
  },
  server: {
    host: "0.0.0.0", // 局域网访问
    port: 3000,
  },
});
```

#### HTML 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    />
    <meta name="format-detection" content="telephone=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <title>移动端应用</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html,
      body {
        width: 100%;
        height: 100%;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* 限制最大宽度，防止在 PC 或 Pad 上过大 */
      body {
        max-width: 540px;
        margin: 0 auto;
      }

      /* 防止点击高亮 */
      * {
        -webkit-tap-highlight-color: transparent;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

#### SCSS Mixins

```scss
// styles/mixins.scss

// 1px 边框
@mixin hairline($direction: bottom, $color: #e5e5e5) {
  position: relative;

  &::after {
    content: "";
    position: absolute;
    pointer-events: none;
    box-sizing: border-box;

    @if $direction == all {
      top: 0;
      left: 0;
      width: 200%;
      height: 200%;
      border: 1px solid $color;
      transform: scale(0.5);
      transform-origin: 0 0;
    } @else if $direction == bottom {
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: $color;
      transform: scaleY(0.5);
    }
  }
}

// 安全区域
@mixin safe-area-padding($position: bottom, $base-padding: 0) {
  @if $position == bottom {
    padding-bottom: calc(#{$base-padding} + env(safe-area-inset-bottom));
  } @else if $position == top {
    padding-top: calc(#{$base-padding} + env(safe-area-inset-top));
  }
}

// 使用
.page-footer {
  @include safe-area-padding(bottom, 16px);
  @include hairline(top);
}
```

---

### 十、方案选择建议

#### 2025 推荐技术栈

| 项目类型       | 推荐方案                             |
| -------------- | ------------------------------------ |
| **小型项目**   | vw + PostCSS + Vite                  |
| **中大型项目** | vw + rem 混合 + PostCSS              |
| **超大型项目** | Container Queries + vw + rem + UI 库 |

**❌ 不推荐**：纯 rem + flexible.js（已过时）

#### 快速上手

```bash
# 创建项目
npm create vite@latest my-mobile-app -- --template vue-ts
cd my-mobile-app

# 安装依赖
npm install -D postcss-px-to-viewport-8-plugin autoprefixer

# 配置 vite.config.ts，开始开发
npm run dev
```

---

### 十一、必测清单

- [ ] **iPhone SE**（375px）、**iPhone 14**（390px）、**iPhone 14 Pro Max**（430px）
- [ ] **主流安卓机**（小米/华为/OPPO）
- [ ] **横竖屏切换**、**软键盘弹出收起**
- [ ] **系统字体放大缩小**、**深色模式**

---

---

## 总结

### 🎯 核心要点

1. **750px 设计稿能适配所有设备**：因为 vw 和 rem 是相对单位，按比例自动缩放
2. **PostCSS 是关键**：让你写 px，自动转 vw/rem
   - vw 方案：`postcss-px-to-viewport-8-plugin`
   - rem 方案：`postcss-pxtorem` + CSS 设置 font-size
3. **推荐方案**：
   - 小项目：**vw**（简单）
   - 大项目：**vw + rem 混合**（可限制大小）
   - 未来：**Container Queries**

### ✅ 核心规则

- ✅ CSS 中写 px，不要写 vw 或 rem
- ✅ PostCSS 自动转换，无需手动计算
- ✅ 1px 边框用 transform scale
- ✅ 安全区域用 env()
- ✅ 真机测试不可少
