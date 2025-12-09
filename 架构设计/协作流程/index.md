### Q5: 如何管理团队协作流程？

**考察点：** 项目管理、流程规范、工具链

#### 标准答案

**1. Git 工作流（GitFlow）**

```
main (生产环境)
  ↑
release/v2.0 (预发布)
  ↑
develop (开发环境)
  ↑
feature/discovery-redesign (功能分支)
feature/shopping-cart (功能分支)
```

```bash
# 开发新功能
git checkout -b feature/discovery-redesign develop

# 完成后合并到 develop
git checkout develop
git merge --no-ff feature/discovery-redesign

# 发布新版本
git checkout -b release/v2.0 develop
# 测试、修复 bug
git checkout main
git merge --no-ff release/v2.0
git tag v2.0
```

**2. 代码规范（ESLint + Prettier + commitlint）**

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'airbnb',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    // i18n 规范
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/[\u4e00-\u9fa5]/]', // 禁止硬编码中文
        message: '请使用 i18n.t() 替代硬编码文本'
      }
    ],

    // React 规范
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off'
  }
};

// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**3. CI/CD 流程**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [develop, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: 安装依赖
        run: npm ci
      - name: 代码检查
        run: npm run lint
      - name: 类型检查
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: 单元测试
        run: npm run test
      - name: 上传覆盖率
        uses: codecov/codecov-action@v3

  i18n-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: 检查缺失翻译
        run: npm run i18n:check
      - name: 检查翻译覆盖率
        run: |
          COVERAGE=$(npm run i18n:coverage --silent)
          if [ $COVERAGE -lt 95 ]; then
            echo "❌ 翻译覆盖率不足 95%: $COVERAGE%"
            exit 1
          fi

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: E2E 测试
        run: npm run test:e2e
```

**4. 文档规范**

```markdown
# 功能开发规范

## 1. 分支命名

- feature/功能名称
- bugfix/问题描述
- hotfix/紧急修复

## 2. Commit 规范

feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具链

## 3. PR 规范

### 标题

[feature] 发现页改版

### 描述

**需求背景：** JIRA-1234
**技术方案：** 使用虚拟滚动优化列表性能
**测试用例：** 已通过 10 个单元测试 + 5 个 E2E 测试
**截图：** [上传截图]

## 4. Code Review Checklist

- [ ] 代码无硬编码文本（已使用 i18n）
- [ ] 已添加单元测试
- [ ] 性能指标符合要求（LCP < 2.5s）
- [ ] 已更新文档
```

---
