# 组件库面试题（高级/资深）

## 📚 目录

- [一、架构设计](#一架构设计)
- [二、组件设计](#二组件设计)
- [三、工程化](#三工程化)
- [四、性能优化](#四性能优化)
- [五、质量保障](#五质量保障)
- [六、实战场景](#六实战场景)

---

## 一、架构设计

### 1.1 如何从 0 到 1 搭建一个企业级组件库？

**考察点**：整体架构能力、技术选型、工程化思维

**回答思路**：

#### 1. 技术选型

```javascript
// 基础技术栈
{
  "框架": "React 18 / Vue 3",
  "构建工具": "Vite / Rollup",
  "样式方案": "CSS-in-JS (styled-components) / Less / CSS Modules",
  "类型系统": "TypeScript",
  "文档工具": "Storybook / dumi / VitePress",
  "测试工具": "Vitest + Testing Library",
  "包管理": "pnpm + Monorepo (Turborepo/Nx)"
}
```

#### 2. 目录结构

```bash
my-ui/
├── packages/
│   ├── components/          # 组件源码
│   │   ├── button/
│   │   │   ├── src/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── button.less
│   │   │   │   └── types.ts
│   │   │   ├── __tests__/
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   └── ...
│   ├── theme/               # 主题配置
│   ├── utils/               # 工具函数
│   ├── hooks/               # 通用 Hooks
│   └── icons/               # 图标库
├── docs/                    # 文档站点
├── playground/              # 在线演示
├── scripts/                 # 构建脚本
└── .changeset/              # 版本管理
```

#### 3. 核心设计原则

| 原则             | 说明                         | 示例                       |
| ---------------- | ---------------------------- | -------------------------- |
| **单一职责**     | 每个组件只做一件事           | Button 不包含 Loading 逻辑 |
| **组合优于继承** | 通过组合小组件构建复杂组件   | Form = FormItem + Input    |
| **受控与非受控** | 支持两种模式                 | `value` + `defaultValue`   |
| **无障碍访问**   | 符合 ARIA 规范               | `aria-label`, `role`       |
| **主题可定制**   | CSS Variables + Design Token | `--primary-color: #1890ff` |

#### 4. 核心模块

```typescript
// 1. 主题系统
const theme = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 4,
    fontSize: 14,
  },
  components: {
    Button: {
      colorPrimary: "#00b96b",
    },
  },
};

// 2. ConfigProvider 全局配置
<ConfigProvider theme={theme} locale={zhCN}>
  <App />
</ConfigProvider>;

// 3. 样式隔离
import { StyleProvider } from "@ant-design/cssinjs";
<StyleProvider hashPriority="high">
  <App />
</StyleProvider>;
```

#### 5. 构建产物

```json
{
  "main": "lib/index.js", // CommonJS
  "module": "es/index.js", // ES Module
  "types": "es/index.d.ts", // TypeScript 类型
  "unpkg": "dist/my-ui.min.js", // UMD (CDN)
  "style": "dist/index.css", // 样式文件
  "sideEffects": ["*.css", "*.less"]
}
```

---

### 1.2 Monorepo vs Multi-repo，如何选择？

**对比**：

| 特性         | Monorepo              | Multi-repo         |
| ------------ | --------------------- | ------------------ |
| **代码复用** | ✅ 容易共享代码       | ❌ 需发布 npm      |
| **版本管理** | ✅ 统一版本，依赖一致 | ❌ 版本碎片化      |
| **构建效率** | ✅ 增量构建，缓存共享 | ❌ 独立构建        |
| **CI/CD**    | ⚠️ 配置复杂，但可优化 | ✅ 简单            |
| **团队协作** | ✅ 代码评审集中       | ❌ 跨仓库困难      |
| **适用场景** | 大型组件库、多包依赖  | 独立组件、小型项目 |

**推荐方案**：**Monorepo + pnpm + Turborepo**

```json
// pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "es/**", "lib/**"]
    },
    "test": {
      "cache": false
    }
  }
}
```

---

### 1.3 如何设计组件库的样式方案？

**常见方案对比**：

| 方案              | 优点               | 缺点               | 适用场景     |
| ----------------- | ------------------ | ------------------ | ------------ |
| **CSS Modules**   | 局部作用域，性能好 | 动态样式不便       | 中小型组件库 |
| **CSS-in-JS**     | 动态主题，类型安全 | 运行时开销         | 需要动态主题 |
| **Tailwind CSS**  | 快速开发，体积小   | 学习成本，定制困难 | 快速原型     |
| **Less/Sass**     | 生态成熟，灵活     | 全局污染风险       | 传统项目     |
| **CSS Variables** | 原生支持，性能最优 | 兼容性问题（IE）   | 现代浏览器   |

**推荐方案**：**CSS Variables + Less + CSS-in-JS（按需）**

```typescript
// 1. Design Token
export const token = {
  colorPrimary: '#1890ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  borderRadius: 4,
  fontSize: 14,
};

// 2. 注入 CSS Variables
const root = document.documentElement;
Object.entries(token).forEach(([key, value]) => {
  root.style.setProperty(`--${key}`, value);
});

// 3. Less 中使用
.button {
  background: var(--colorPrimary);
  border-radius: var(--borderRadius);
  font-size: var(--fontSize);
}
```

---

## 二、组件设计

### 2.1 如何设计一个高质量的 Table 组件？

**核心功能点**：

```typescript
interface TableProps<T = any> {
  // 1. 数据源
  dataSource: T[];
  columns: ColumnType<T>[];

  // 2. 分页
  pagination?: PaginationConfig | false;

  // 3. 排序
  onChange?: (pagination, filters, sorter) => void;

  // 4. 选择
  rowSelection?: RowSelectionConfig;

  // 5. 展开
  expandable?: ExpandableConfig;

  // 6. 固定列/表头
  sticky?: boolean;
  scroll?: { x?: number; y?: number };

  // 7. 虚拟滚动
  virtual?: boolean;

  // 8. 性能优化
  rowKey: string | ((record: T) => string);
}
```

**关键技术点**：

1. **虚拟滚动**（大数据场景）

```typescript
// 使用 react-window
import { FixedSizeList } from "react-window";

function VirtualTable({ data, columns }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {columns.map((col) => (
        <div key={col.key}>{data[index][col.dataIndex]}</div>
      ))}
    </div>
  );

  return (
    <FixedSizeList height={400} itemCount={data.length} itemSize={50}>
      {Row}
    </FixedSizeList>
  );
}
```

2. **固定列**（CSS sticky）

```css
.table-fixed-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
}
```

3. **性能优化**

```typescript
// useMemo 缓存列配置
const memoColumns = useMemo(() => {
  return columns.map((col) => ({
    ...col,
    render: col.render || ((text) => text),
  }));
}, [columns]);

// React.memo 优化行渲染
const TableRow = React.memo(
  ({ record, columns }) => {
    return (
      <tr>
        {columns.map((col) => (
          <td key={col.key}>{col.render(record[col.dataIndex], record)}</td>
        ))}
      </tr>
    );
  },
  (prev, next) => prev.record.id === next.record.id
);
```

---

### 2.2 Form 表单组件如何设计？

**核心架构**：

```typescript
// 1. FormStore 状态管理
class FormStore {
  private values: Record<string, any> = {};
  private errors: Record<string, string[]> = {};
  private callbacks: Set<Function> = new Set();

  setFieldValue(name: string, value: any) {
    this.values[name] = value;
    this.notify();
  }

  getFieldValue(name: string) {
    return this.values[name];
  }

  validateFields() {
    // 校验逻辑
  }

  subscribe(callback: Function) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notify() {
    this.callbacks.forEach((cb) => cb());
  }
}

// 2. Form 组件
function Form({ children, onFinish }) {
  const [store] = useState(() => new FormStore());

  const handleSubmit = (e) => {
    e.preventDefault();
    store.validateFields().then(() => {
      onFinish(store.getFieldsValue());
    });
  };

  return (
    <FormContext.Provider value={store}>
      <form onSubmit={handleSubmit}>{children}</form>
    </FormContext.Provider>
  );
}

// 3. FormItem 组件
function FormItem({ name, rules, children }) {
  const store = useContext(FormContext);
  const [value, setValue] = useState(store.getFieldValue(name));

  useEffect(() => {
    return store.subscribe(() => {
      setValue(store.getFieldValue(name));
    });
  }, []);

  const handleChange = (e) => {
    store.setFieldValue(name, e.target.value);
  };

  return React.cloneElement(children, {
    value,
    onChange: handleChange,
  });
}
```

**关键设计**：

1. ✅ **状态管理**：使用 Context + 订阅模式，避免全局更新
2. ✅ **性能优化**：FormItem 级别订阅，精确更新
3. ✅ **校验机制**：支持同步/异步校验，自定义规则
4. ✅ **联动控制**：`dependencies` 机制实现字段联动

---

### 2.3 如何实现一个通用的 Modal/Dialog 组件？

**核心功能**：

```typescript
interface ModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk?: () => void | Promise<void>;

  // 样式
  width?: number;
  centered?: boolean;
  maskClosable?: boolean;

  // 动画
  transitionName?: string;

  // 性能
  destroyOnClose?: boolean;
  forceRender?: boolean;

  // 命令式调用
  getContainer?: () => HTMLElement;
}
```

**实现要点**：

1. **Portal 渲染**

```typescript
import { createPortal } from "react-dom";

function Modal({ visible, children }) {
  if (!visible) return null;

  return createPortal(
    <div className="modal-mask">
      <div className="modal-wrap">{children}</div>
    </div>,
    document.body
  );
}
```

2. **命令式调用**

```typescript
// Modal.confirm
Modal.confirm = (config) => {
  const div = document.createElement("div");
  document.body.appendChild(div);

  const destroy = () => {
    ReactDOM.unmountComponentAtNode(div);
    document.body.removeChild(div);
  };

  ReactDOM.render(<Modal visible={true} onCancel={destroy} {...config} />, div);

  return { destroy };
};
```

3. **动画优化**

```typescript
import { CSSTransition } from "react-transition-group";

function Modal({ visible, children }) {
  return (
    <CSSTransition
      in={visible}
      timeout={300}
      classNames="modal-fade"
      unmountOnExit
    >
      <div className="modal">{children}</div>
    </CSSTransition>
  );
}
```

---

## 三、工程化

### 3.1 如何实现按需加载？

**方案对比**：

| 方案                    | 原理             | 优点     | 缺点           |
| ----------------------- | ---------------- | -------- | -------------- |
| **babel-plugin-import** | Babel 编译时转换 | 自动化   | 需配置 Babel   |
| **ES Module**           | Tree Shaking     | 原生支持 | 需打包工具配置 |
| **手动引入**            | 用户显式导入     | 最可控   | 用户体验差     |

**推荐方案**：**ES Module + Tree Shaking**

```javascript
// 1. 组件库导出
// es/index.js
export { default as Button } from './button';
export { default as Input } from './input';

// 2. package.json 配置
{
  "sideEffects": [
    "*.css",
    "*.less"
  ],
  "module": "es/index.js"
}

// 3. 用户使用（自动 Tree Shaking）
import { Button, Input } from 'my-ui';
```

**样式按需加载**：

```typescript
// babel-plugin-import 配置
{
  "plugins": [
    ["import", {
      "libraryName": "my-ui",
      "libraryDirectory": "es",
      "style": true  // 自动引入样式
    }]
  ]
}

// 转换前
import { Button } from 'my-ui';

// 转换后
import Button from 'my-ui/es/button';
import 'my-ui/es/button/style';
```

---

### 3.2 如何管理组件库版本？

**推荐工具**：**Changeset**

```bash
# 1. 初始化
pnpm add -Dw @changesets/cli
pnpm changeset init

# 2. 添加变更记录
pnpm changeset
# 选择变更类型：patch/minor/major
# 填写变更说明

# 3. 生成版本号和 CHANGELOG
pnpm changeset version

# 4. 发布
pnpm changeset publish
```

**版本规范（Semantic Versioning）**：

```
MAJOR.MINOR.PATCH
  |     |     |
  |     |     └─ Bug 修复（向后兼容）
  |     └─────── 新功能（向后兼容）
  └───────────── 破坏性变更
```

**示例**：

```markdown
# .changeset/xxx.md

---

## "@my-ui/components": minor

feat(Button): 新增 `size` 属性，支持 small/medium/large
```

---

### 3.3 如何搭建组件文档站点？

**方案对比**：

| 工具           | 特点                            | 适用场景     |
| -------------- | ------------------------------- | ------------ |
| **Storybook**  | 组件开发/测试/文档一体化        | 开发环境     |
| **dumi**       | Ant Design 团队出品，适合 React | 中文文档友好 |
| **VitePress**  | Vue 生态，速度快                | Vue 组件库   |
| **Docusaurus** | Meta 出品，功能强大             | 大型文档站点 |

**推荐：dumi**（React）

```typescript
// .dumirc.ts
export default {
  themeConfig: {
    name: "My UI",
    logo: "/logo.png",
    nav: [
      { title: "指南", link: "/guide" },
      { title: "组件", link: "/components" },
    ],
  },
  resolve: {
    atomDirs: [{ type: "component", dir: "src" }],
  },
};
```

```markdown
<!-- Button.md -->

# Button 按钮

## 基础用法

<code src="./demos/basic.tsx"></code>

## API

| 属性 | 说明     | 类型                 | 默认值    |
| ---- | -------- | -------------------- | --------- |
| type | 按钮类型 | `primary \| default` | `default` |
```

---

## 四、性能优化

### 4.1 组件库如何优化性能？

**关键技术点**：

#### 1. **懒加载 + Code Splitting**

```typescript
// 路由级懒加载
const Button = lazy(() => import("./components/Button"));

// 组件内部懒加载
function App() {
  const [showModal, setShowModal] = useState(false);
  const Modal = showModal ? lazy(() => import("./Modal")) : null;

  return <Suspense fallback={<Loading />}>{Modal && <Modal />}</Suspense>;
}
```

#### 2. **虚拟滚动**（长列表）

```typescript
import { FixedSizeList } from "react-window";

<FixedSizeList height={600} itemCount={10000} itemSize={50} width="100%">
  {Row}
</FixedSizeList>;
```

#### 3. **防抖/节流**

```typescript
// 搜索输入框
const debouncedSearch = useMemo(
  () => debounce((value) => onSearch(value), 300),
  [onSearch]
);

<Input onChange={(e) => debouncedSearch(e.target.value)} />;
```

#### 4. **Memo 优化**

```typescript
// React.memo 避免无效渲染
const Button = React.memo(
  ({ children, onClick }) => {
    return <button onClick={onClick}>{children}</button>;
  },
  (prev, next) => {
    return prev.children === next.children && prev.onClick === next.onClick;
  }
);

// useMemo 缓存计算结果
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);
```

#### 5. **CSS 性能优化**

```css
/* ❌ 避免通配符 */
* {
  margin: 0;
}

/* ✅ 使用类选择器 */
.button {
  margin: 0;
}

/* ✅ 开启 GPU 加速 */
.modal {
  transform: translateZ(0);
  will-change: transform;
}
```

---

### 4.2 如何优化打包体积？

**优化策略**：

```javascript
// 1. Tree Shaking（移除未使用代码）
// rollup.config.js
export default {
  output: {
    format: 'es',
  },
  treeshake: true,
};

// 2. 代码分割
output: {
  manualChunks: {
    'react-vendor': ['react', 'react-dom'],
    'icons': ['@ant-design/icons'],
  }
}

// 3. 压缩混淆
plugins: [
  terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  }),
]

// 4. 样式压缩
postcss({
  plugins: [
    cssnano({
      preset: 'default',
    }),
  ],
})
```

**体积分析**：

```bash
# rollup-plugin-visualizer
pnpm add -D rollup-plugin-visualizer
```

---

## 五、质量保障

### 5.1 如何进行组件测试？

**测试金字塔**：

```
        /\
       /  \  E2E 测试（5%）
      /____\
     /      \  集成测试（15%）
    /________\
   /          \  单元测试（80%）
  /__________\
```

#### 1. **单元测试**（Vitest + Testing Library）

```typescript
import { render, fireEvent, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("应该正确渲染", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("点击时应该触发 onClick", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disabled 时不应该响应点击", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>
    );

    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

#### 2. **快照测试**

```typescript
it("应该匹配快照", () => {
  const { container } = render(<Button type="primary">Button</Button>);
  expect(container.firstChild).toMatchSnapshot();
});
```

#### 3. **覆盖率要求**

```json
// vitest.config.ts
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
};
```

---

### 5.2 如何保证代码质量？

**工具链**：

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "prepare": "husky install"
  }
}
```

**Git Hooks（Husky + lint-staged）**：

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged

// .lintstagedrc.js
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'vitest related --run',
  ],
};
```

**CI/CD 流程**：

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm build
```

---

## 六、实战场景

### 6.1 如何处理组件库的主题定制？

**方案 1：CSS Variables（推荐）**

```typescript
// 1. 定义 Design Token
const lightTheme = {
  '--color-primary': '#1890ff',
  '--color-success': '#52c41a',
  '--border-radius': '4px',
};

const darkTheme = {
  '--color-primary': '#177ddc',
  '--color-success': '#49aa19',
  '--border-radius': '4px',
};

// 2. 动态注入
function ThemeProvider({ theme, children }) {
  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme]);

  return children;
}

// 3. 组件中使用
.button {
  background: var(--color-primary);
  border-radius: var(--border-radius);
}
```

**方案 2：CSS-in-JS**

```typescript
import { ThemeProvider } from "styled-components";

const theme = {
  colors: {
    primary: "#1890ff",
  },
};

const Button = styled.button`
  background: ${(props) => props.theme.colors.primary};
`;

<ThemeProvider theme={theme}>
  <Button>Click</Button>
</ThemeProvider>;
```

---

### 6.2 如何实现国际化（i18n）？

```typescript
// 1. 定义多语言文本
const locales = {
  "zh-CN": {
    "button.confirm": "确认",
    "button.cancel": "取消",
  },
  "en-US": {
    "button.confirm": "Confirm",
    "button.cancel": "Cancel",
  },
};

// 2. Context 传递
const LocaleContext = React.createContext("zh-CN");

function ConfigProvider({ locale, children }) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

// 3. 组件中使用
function Button() {
  const locale = useContext(LocaleContext);
  const t = (key) => locales[locale][key];

  return <button>{t("button.confirm")}</button>;
}
```

---

### 6.3 如何处理组件库的向后兼容？

**策略**：

1. **废弃（Deprecated）提示**

```typescript
function Button({ type, ...props }) {
  if (type === "ghost") {
    console.warn(
      '[Button] type="ghost" is deprecated, use type="default" instead.'
    );
  }

  return <button {...props} />;
}
```

2. **渐进式迁移**

```typescript
// v1.x
<Button type="ghost" />

// v2.x 过渡期（同时支持）
<Button type="ghost" />  // 警告但可用
<Button variant="outline" />  // 新 API

// v3.x 移除旧 API
<Button variant="outline" />
```

3. **Codemod 自动迁移**

```javascript
// transform.js (jscodeshift)
module.exports = function (file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.JSXElement, { openingElement: { name: { name: "Button" } } })
    .forEach((path) => {
      const typeAttr = path.value.openingElement.attributes.find(
        (attr) => attr.name.name === "type" && attr.value.value === "ghost"
      );

      if (typeAttr) {
        typeAttr.name.name = "variant";
        typeAttr.value.value = "outline";
      }
    })
    .toSource();
};
```

---

## 七、高频面试题

### Q1: Ant Design / Element Plus 的架构是怎样的？

**Ant Design 5.x 核心架构**：

```
┌─────────────────────────────────────┐
│         Application Layer            │
├─────────────────────────────────────┤
│  ConfigProvider (全局配置)           │
│  - Theme (主题)                      │
│  - Locale (国际化)                   │
│  - Direction (RTL)                   │
├─────────────────────────────────────┤
│  Component Layer (组件层)            │
│  - Basic (Button, Input...)          │
│  - Layout (Grid, Space...)           │
│  - Navigation (Menu, Tabs...)        │
│  - Data Entry (Form, Select...)      │
│  - Data Display (Table, Tree...)     │
│  - Feedback (Modal, Message...)      │
├─────────────────────────────────────┤
│  Core Layer (核心层)                 │
│  - @ant-design/cssinjs (样式系统)    │
│  - rc-xxx (基础组件)                 │
│  - @ant-design/icons (图标)          │
├─────────────────────────────────────┤
│  Utils Layer (工具层)                │
│  - classnames, dayjs, rc-util...     │
└─────────────────────────────────────┘
```

**核心特性**：

1. ✅ **CSS-in-JS**：动态主题、SSR 友好
2. ✅ **Design Token**：统一设计语言
3. ✅ **rc-component**：底层抽象，多框架复用

---

### Q2: 如何设计一个高性能的 Select 组件？

**核心优化**：

```typescript
function Select({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // 1. 虚拟滚动（选项 > 100）
  const VirtualList = useMemo(() => {
    if (options.length < 100) return null;
    return <FixedSizeList height={300} itemCount={options.length} />;
  }, [options]);

  // 2. 防抖搜索
  const debouncedSearch = useMemo(() => debounce(setSearch, 300), []);

  // 3. 过滤缓存
  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  // 4. 懒渲染（未打开不渲染下拉）
  return (
    <div>
      <input onClick={() => setOpen(true)} />
      {open && <Dropdown>{VirtualList || <OptionList />}</Dropdown>}
    </div>
  );
}
```

---

### Q3: 组件库如何支持 SSR？

**关键点**：

1. **样式注入**

```typescript
// 服务端
import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";

const cache = createCache();

const html = renderToString(
  <StyleProvider cache={cache}>
    <App />
  </StyleProvider>
);

const styleText = extractStyle(cache);
// 将 styleText 注入到 HTML <head>
```

2. **避免浏览器 API**

```typescript
// ❌ 错误
const width = window.innerWidth;

// ✅ 正确
const [width, setWidth] = useState(0);

useEffect(() => {
  if (typeof window !== "undefined") {
    setWidth(window.innerWidth);
  }
}, []);
```

3. **Portal 处理**

```typescript
// 服务端跳过 Portal 渲染
const isServer = typeof window === "undefined";

{
  !isServer && createPortal(<Modal />, document.body);
}
```

---

## 八、总结

### 核心能力模型

```
高级/资深前端 - 组件库方向
├── 架构设计能力 ⭐⭐⭐⭐⭐
│   ├── 技术选型
│   ├── Monorepo 管理
│   └── 样式方案设计
├── 组件设计能力 ⭐⭐⭐⭐⭐
│   ├── API 设计
│   ├── 状态管理
│   └── 性能优化
├── 工程化能力 ⭐⭐⭐⭐
│   ├── 构建配置
│   ├── 按需加载
│   └── 版本管理
├── 质量保障能力 ⭐⭐⭐⭐
│   ├── 单元测试
│   ├── E2E 测试
│   └── CI/CD
└── 协作能力 ⭐⭐⭐
    ├── 文档编写
    ├── Code Review
    └── 技术分享
```

### 学习路径

1. **基础阶段**：熟悉 React/Vue 核心 API
2. **进阶阶段**：深入 Ant Design 源码
3. **实战阶段**：从 0 搭建一个简易组件库
4. **专家阶段**：性能优化、架构设计

---

**参考资料**：

- [Ant Design 官方文档](https://ant.design/)
- [Ant Design 源码解析](https://github.com/ant-design/ant-design)
- [React Component Patterns](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Component-Driven Development](https://www.componentdriven.org/)
