### Q1: 前端国际化方案如何设计？

**考察点：** 国际化方案设计、技术选型、工程化能力

#### 标准答案

**1. 技术选型对比**

| 方案           | 优点                                | 缺点              | 适用场景   |
| -------------- | ----------------------------------- | ----------------- | ---------- |
| **react-intl** | React 生态成熟、支持复数/日期格式化 | 包体积大（~45KB） | 中大型项目 |
| **i18next**    | 框架无关、插件丰富、轻量（~15KB）   | 配置复杂          | 多框架项目 |
| **formatjs**   | 性能最优、支持 ICU 语法             | 生态较小          | 高性能要求 |

**推荐方案：i18next + react-i18next**

```javascript
// i18n.config.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend) // 懒加载翻译文件
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "zh-CN", "ja", "ar", "th", "vi"],

    // 命名空间分离（按模块拆分翻译文件）
    ns: ["common", "home", "discovery", "profile"],
    defaultNS: "common",

    // 懒加载配置（性能优化）
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      requestOptions: {
        cache: "force-cache", // 利用 HTTP 缓存
      },
    },

    // 检测优先级
    detection: {
      order: ["cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["cookie"],
    },

    // 插值配置（防止 XSS）
    interpolation: {
      escapeValue: false, // React 已转义
    },

    // 性能优化
    react: {
      useSuspense: true, // 配合 React.lazy 懒加载
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added",
      transEmptyNodeValue: "",
      transSupportBasicHtmlNodes: true, // 支持基础 HTML 标签
    },
  });

export default i18n;
```

**2. 翻译文件组织结构**

```
locales/
├── en/
│   ├── common.json          # 公共文案（按钮、标签）
│   ├── home.json            # 首页
│   ├── discovery.json       # 发现页
│   └── profile.json         # 个人主页
├── zh-CN/
│   ├── common.json
│   ├── home.json
│   └── ...
├── ar/                      # 阿拉伯语（RTL 布局）
│   └── ...
└── ja/                      # 日语
    └── ...
```

**3. 核心问题解决方案**

#### (1) RTL 布局支持（阿拉伯语/希伯来语）

RTL 语言列表
语言代码 语言名称 说明
ar Arabic（阿拉伯语） 全球约 3.1 亿使用者
he Hebrew（希伯来语） 以色列官方语言
fa Persian（波斯语/法尔西语） 伊朗、阿富汗
ur Urdu（乌尔都语） 巴基斯坦官方语言
yi Yiddish（意第绪语） 犹太人语言
ku Kurdish（库尔德语） 部分方言 RTL

```javascript
// RTL 布局全局配置
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

function App() {
  const { i18n } = useTranslation();
  const isRTL = ["ar", "he"].includes(i18n.language); // 阿拉伯语(Arabic)、希伯来语(Hebrew)

  useEffect(() => {
    // 动态设置 HTML dir 属性
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRTL]);

  return <div className={isRTL ? "rtl" : "ltr"}>...</div>;
}
```

```css
- margin-inline 左右
- margin-block 上下
- padding-block 左右
- padding-block 上下
- border-block 左右
- border-block 上下
- left -> inset-inline-start
- right -> inset-inline-end
- top -> inset-block-start
- bottom -> inset-block-end
- text-align: left -> start, right -> end
- float: left -> inline-start
- float: right -> inline-end

/* RTL 样式适配 */
.card {
  margin-left: 20px;
  padding-right: 10px;
}

/* RTL 下自动翻转 */
[dir="rtl"] .card {
  margin-left: 0;
  margin-right: 20px;
  padding-right: 0;
  padding-left: 10px;
}

/* 使用逻辑属性（推荐） */
.card {
  margin-inline-start: 20px; /* 自动适配 LTR/RTL */
  padding-inline-end: 10px;
}
```

#### (2) 复数和性别处理

```json
// en/common.json
{
  "likeCount": "{{count}} like",
  "likeCount_plural": "{{count}} likes",

  "commentCount": "{{count}} comment",
  "commentCount_plural": "{{count}} comments",

  "savedBy": "Saved by {{name}}",
  "savedBy_female": "Saved by her",
  "savedBy_male": "Saved by him"
}
```

```javascript
// 使用
const { t } = useTranslation();

t("likeCount", { count: 1 }); // "1 like"
t("likeCount", { count: 5 }); // "5 likes"
```

#### (3) 日期/时间/货币格式化

```javascript
import { formatDistance, format } from "date-fns";
import { zhCN, enUS, ja, ar } from "date-fns/locale";

const localeMap = {
  "zh-CN": zhCN,
  en: enUS,
  ja: ja,
  ar: ar,
};

// 相对时间（"3 小时前"）
function formatRelativeTime(date, locale) {
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: localeMap[locale],
  });
}

// 货币格式化
function formatPrice(amount, currency, locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency, // 'USD', 'CNY', 'JPY'
  }).format(amount);
}

// 使用
formatRelativeTime(new Date("2024-01-01"), "zh-CN"); // "11 个月前"
formatPrice(99.99, "USD", "en"); // "$99.99"
formatPrice(99.99, "CNY", "zh-CN"); // "¥99.99"
```

#### (4) 动态加载翻译文件（性能优化）

```javascript
// 按需加载翻译文件
import { lazy, Suspense } from "react";

const DiscoveryPage = lazy(() => {
  const locale = i18n.language;

  // 预加载翻译文件
  return Promise.all([
    import(`../locales/${locale}/discovery.json`),
    import("./DiscoveryPage"),
  ]).then(([translations, module]) => {
    i18n.addResourceBundle(locale, "discovery", translations.default);
    return module;
  });
});

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <DiscoveryPage />
    </Suspense>
  );
}
```

**4. 翻译流程自动化**

```javascript
// scripts/extract-i18n.js - 提取待翻译文本
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");

function extractTranslations(code) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const keys = new Set();

  traverse(ast, {
    CallExpression(path) {
      // 匹配 t('key') 或 i18n.t('key')
      if (
        path.node.callee.name === "t" ||
        (path.node.callee.object?.name === "i18n" &&
          path.node.callee.property?.name === "t")
      ) {
        const key = path.node.arguments[0]?.value;
        if (key) keys.add(key);
      }
    },
  });

  return Array.from(keys);
}

// 使用
const code = fs.readFileSync("src/App.jsx", "utf-8");
const keys = extractTranslations(code);
console.log("需要翻译的 key:", keys);
```

**5. 性能优化策略**

```javascript
// (1) 翻译文本预加载
function preloadLocale(locale) {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = `/locales/${locale}/common.json`;
  document.head.appendChild(link);
}

// (2) 使用 Service Worker 缓存翻译文件
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/locales/")) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchResponse) => {
            return caches.open("i18n-v1").then((cache) => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          })
        );
      })
    );
  }
});

// (3) CDN 加速
const cdnUrl = "https://cdn.xiaohongshu.com/i18n";
i18n.use(Backend).init({
  backend: {
    loadPath: `${cdnUrl}/{{lng}}/{{ns}}.json`,
  },
});
```

---

### Q2: 如何监控和优化国际化项目的性能？

**考察点：** 性能监控、数据分析、优化策略

#### 标准答案

**1. 性能指标监控**

```javascript
// 监控翻译加载时间
i18n.on("loaded", (loaded) => {
  const languages = Object.keys(loaded);
  languages.forEach((lang) => {
    performance.mark(`i18n-${lang}-loaded`);
  });
});

// 上报到监控平台
import { reportMetric } from "@/utils/monitor";

function trackI18nPerformance() {
  const entries = performance
    .getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/locales/"));

  entries.forEach((entry) => {
    reportMetric({
      metric: "i18n_load_time",
      value: entry.duration,
      tags: {
        language: entry.name.match(/\/locales\/(.+?)\//)?.[1],
        namespace: entry.name.match(/\/(.+?)\.json$/)?.[1],
      },
    });
  });
}

window.addEventListener("load", trackI18nPerformance);
```

**2. 覆盖率监控（检测缺失翻译）**

```javascript
// 监听缺失翻译
i18n.on("missingKey", (lngs, namespace, key) => {
  // 上报到监控系统
  reportError({
    type: "i18n_missing_key",
    message: `Missing translation: ${namespace}:${key}`,
    tags: { languages: lngs.join(",") },
  });

  // 本地开发环境警告
  if (process.env.NODE_ENV === "development") {
    console.warn(`🚨 Missing translation: ${namespace}:${key} for ${lngs}`);
  }
});
```

**3. 包体积优化**

```javascript
// Webpack 配置 - 按需加载
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        i18n: {
          test: /[\\/]locales[\\/]/,
          name: "i18n",
          chunks: "async",
          priority: 10,
        },
      },
    },
  },
};

// 动态 import 翻译文件
async function loadLocale(locale) {
  const translations = await import(`../locales/${locale}/common.json`);
  i18n.addResourceBundle(locale, "common", translations.default);
}
```

---
