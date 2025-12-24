## Webpack 5 最佳实践指南

### 1. 项目初始化
```bash
npm init -y
npm install -D webpack webpack-cli webpack-dev-server
```

### 2. 基础配置
```js
// webpack.config.js
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

/**
 * Webpack基础配置
 * entry: 入口文件路径
 * output: 输出配置
 *   path: 输出目录绝对路径
 *   filename: 输出文件名，[name]表示入口名称，[contenthash:8]表示8位内容哈希
 *   assetModuleFilename: 资源模块输出路径格式
 * plugins: 插件配置
 *   CleanWebpackPlugin: 每次构建前自动清理dist目录
 */
module.exports = {
  entry: './src/index.js', // 单入口配置
  output: {
    path: path.resolve(__dirname, 'dist'), // 输出到dist目录
    filename: '[name].[contenthash:8].js', // 使用内容哈希实现长效缓存
    assetModuleFilename: 'assets/[hash][ext][query]' // 资源文件输出路径
  },
  plugins: [
    new CleanWebpackPlugin() // 自动清理输出目录
  ]
}
```

### 3. JavaScript处理
```bash
# 安装Babel相关依赖
# babel-loader: Webpack的Babel加载器
# @babel/core: Babel核心库
# @babel/preset-env: 智能预设，根据目标环境自动转换语法
# core-js: 提供polyfill功能
npm install -D babel-loader @babel/core @babel/preset-env core-js
```

```js
// babel.config.js
module.exports = {
  presets: [
    [
      '@babel/preset-env', 
      {
        useBuiltIns: 'usage', // 按需引入polyfill
        corejs: 3, // 指定core-js版本
        targets: '> 0.25%, not dead' // 浏览器兼容目标
      }
    ]
  ]
}

// webpack配置
module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/, // 匹配.js和.jsx文件
        exclude: /node_modules/, // 排除node_modules目录
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true // 启用缓存，提升构建速度
          }
        }
      }
    ]
  }
}
```

### 4. 开发服务器配置
```js
module.exports = {
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
    hot: true,
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    historyApiFallback: true
  }
}
```

### 5. 资源模块处理 (Webpack 5+)
Webpack 5 内置了四种资源模块类型：
1. `asset/resource` - 替换file-loader
2. `asset/inline` - 替换url-loader
3. `asset/source` - 替换raw-loader
4. `asset` - 自动选择（默认8kb大小分界）

```js
module.exports = {
  module: {
    rules: [
      // 图片资源
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]' // 统一放到images目录
        },
        parser: { 
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb以下转base64
          }
        }
      },
      // 字体文件
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext][query]' // 统一放到fonts目录
        }
      },
      // 媒体文件
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'media/[hash][ext][query]'
        }
      }
    ]
  },
  // 优化输出文件名
  output: {
    assetModuleFilename: 'assets/[hash][ext][query]' // 默认资源输出路径
  }
}

/**
 * 最佳实践:
 * 1. 按类型拆分到不同目录(images/fonts/media)
 * 2. 小图片(<8kb)使用base64内联
 * 3. 使用[hash]确保缓存更新
 * 4. 生产环境建议图像压缩插件
 * 
 * 可选插件:
 * - image-minimizer-webpack-plugin 图像压缩
 * - svgo-loader SVG优化
 */
```

---

### 6. HTML处理
```bash
npm install -D html-webpack-plugin
```

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    })
  ]
}
```


使用钩子修改 HTML 内容
  ``` js
  class MyPlugin {
    apply(compiler) {
      compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          'MyPlugin',
          (data, cb) => {
            // 修改生成的 HTML
            data.html = data.html.replace(
              '</body>',
              '<script>console.log("注入的内容")</script></body>'
            );
            cb(null, data);
          }
        );
      });
    }
  }

  module.exports = {
    plugins: [
      new HtmlWebpackPlugin(),
      new MyPlugin()
    ]
  }
  ```

### 7. CSS处理
```bash
npm install -D css-loader postcss-loader postcss-preset-env style-loader
```

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'postcss-preset-env'
                ]
              }
            }
          }
        ]
      }
    ]
  }
}
```

---

### 8. 生产环境优化
```js
// webpack.prod.js
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * 生产环境配置
 * mode: 'production' - 启用生产模式优化
 * optimization: 优化配置
 *   minimize: 启用代码压缩
 *   minimizer: 配置压缩工具
 *     TerserPlugin: JS压缩工具
 *       parallel: 启用多进程压缩
 *       terserOptions: 压缩选项
 *         compress.drop_console: 移除console.log
 *     CssMinimizerPlugin: CSS压缩工具
 *   splitChunks: 代码分割配置
 *     chunks: 'all' - 对所有类型的chunk进行分割
 *     cacheGroups: 缓存组配置
 *       vendors: 将node_modules中的代码单独打包
 */
module.exports = merge(baseConfig, {
  mode: 'production', // 生产模式会自动启用各种优化
  optimization: {
    minimize: true, // 启用最小化
    minimizer: [
      new TerserPlugin({ // JS压缩
        parallel: true, // 使用多进程并行运行
        terserOptions: {
          compress: {
            drop_console: true // 生产环境移除console
          }
        }
      }),
      new CssMinimizerPlugin() // CSS压缩
    ],
    splitChunks: { // 代码分割
      chunks: 'all', // 对所有chunk进行分割
      cacheGroups: {
        vendors: { // 抽离node_modules代码
          test: /[\\/]node_modules[\\/]/, // 匹配node_modules中的模块
          priority: -10, // 优先级
          reuseExistingChunk: true // 重用已存在的chunk
        }
      }
    }
  }
});
```

---

### 9. 高级特性

#### 9.1 Tree Shaking（摇树优化）
```js
module.exports = {
  optimization: {
    usedExports: true, // 标记被使用的导出
    sideEffects: true, // 启用sideEffects优化
    concatenateModules: true, // 启用作用域提升
    minimize: true // 启用代码压缩
  }
}

// package.json 需要配置
{
  "sideEffects": [
    "*.css", // 标记CSS文件有副作用
    "*.scss",
    "@babel/polyfill" // 标记polyfill有副作用
  ]
}
```

**Tree Shaking 工作原理**:
1. 通过ES6模块的静态分析识别import/export
2. 标记未被使用的export
3. 在压缩阶段移除未被使用的代码

**最佳实践**:
1. 使用ES6模块语法（import/export）
2. 避免在模块顶层有副作用代码
3. 正确配置package.json的sideEffects
4. 生产模式会自动启用Tree Shaking

**常见问题解决**:
1. 代码未被移除：
   - 检查是否使用CommonJS模块
   - 确认babel配置未将ES模块转CommonJS
2. 误删有副作用代码：
   - 在package.json中正确标记
3. 第三方库不支持：
   - 使用支持Tree Shaking的库（如lodash-es）

#### 9.2 模块联邦
```js
// app1/webpack.config.js (模块提供方)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app1', // 应用名称，必须唯一
      filename: 'remoteEntry.js', // 远程入口文件名
      exposes: { // 暴露的模块
        './Button': './src/Button' // key: 模块名称, value: 模块路径
      }
    })
  ]
}

// app2/webpack.config.js (模块消费方)
new ModuleFederationPlugin({
  name: 'app2', // 当前应用名称
  remotes: { // 引用的远程模块
    // 格式: "app1@[远程地址]/remoteEntry.js"
    app1: 'app1@http://localhost:3001/remoteEntry.js'
  }
})

/**
 * 模块联邦说明:
 * 1. 允许将应用拆分为多个独立构建的模块
 * 2. 模块可以在不同应用间共享
 * 3. 每个模块可以独立开发、部署
 * 4. 运行时动态加载远程模块
 * 
 * 典型应用场景:
 * - 微前端架构
 * - 跨项目共享组件
 * - 独立部署的公共模块
 */
```

#### 9.3 持久化缓存（构建加速）
```js
module.exports = {
  cache: {
    type: 'filesystem', // 使用文件系统缓存
    version: '1.0', // 缓存版本，修改后会失效
    cacheDirectory: path.resolve(__dirname, '.cache/webpack'), // 缓存路径
    buildDependencies: {
      config: [__filename], // 当配置文件修改时缓存失效
      dependencies: ['package.json'] // 依赖变更时缓存失效
    },
    // 缓存配置
    managedPaths: [
      path.resolve(__dirname, 'node_modules') // 只缓存node_modules
    ],
    profile: true, // 输出缓存使用情况
    maxAge: 24 * 60 * 60 * 1000 // 缓存有效期24小时
  }
}
```

**缓存策略说明**:
1. 开发模式: 默认启用内存缓存
2. 生产模式: 推荐使用文件系统缓存
3. 缓存失效条件:
   - Webpack版本变更
   - 配置文件修改
   - 依赖包版本变化
4. 性能提升:
   - 二次构建速度提升50%-80%
   - 适合CI/CD环境复用缓存

**注意事项**:
- 避免缓存node_modules之外的目录
- 大型项目可设置更大的maxAge
- 监控缓存目录大小，定期清理
```

---

### 10. 性能优化

#### 10.1 构建速度优化
```js
module.exports = {
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ]
  }
}
```

#### 10.2 代码分割优化
```js
module.exports = {
  optimization: {
    runtimeChunk: 'single', // 提取runtime代码到单独文件
    splitChunks: {
      chunks: 'all', // 对所有chunk进行分割(initial/async/all)
      minSize: 20000, // 生成chunk的最小体积(20KB)
      maxSize: 50000, // 尝试拆分大于50KB的chunk
      minChunks: 1, // 被引用次数阈值
      maxAsyncRequests: 30, // 按需加载最大请求数
      maxInitialRequests: 30, // 入口最大请求数
      enforceSizeThreshold: 50000, // 强制拆分阈值
      cacheGroups: {
        vendor: { // 第三方库
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors', // chunk名称
          priority: 10, // 优先级
          chunks: 'all',
        },
        common: { // 公共模块
          minChunks: 2, // 最小共享次数
          name: 'commons',
          priority: 5,
          reuseExistingChunk: true, // 重用已有chunk
          enforce: true, // 强制执行
        },
        styles: { // 样式文件
          name: 'styles',
          test: /\.(css|scss)$/,
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
}
```

**配置详解**:
1. `runtimeChunk`: 
   - 提取webpack运行时代码
   - 避免hash变化影响长效缓存

2. `cacheGroups`策略分组:
   - vendor: node_modules中的第三方库
   - common: 项目公用组件/工具
   - styles: 提取的CSS文件

3. **性能优化建议**:
   - 大型第三方库(React等)单独分包
   - 路由组件使用动态导入
   - 分析工具定位优化点

4. **监控指标**:
   - 分包数量(建议5-15个)
   - 平均chunk大小
   - 冗余代码比例
```

#### 10.3 预加载
```js
import(/* webpackPreload: true */ 'ChartingLibrary');
```

---

### 11. 常用插件

#### 11.1 Bundle分析
```bash
npm install -D webpack-bundle-analyzer
```

```js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}
```

#### 11.2 进度条
```bash
npm install -D progress-bar-webpack-plugin
```

```js
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

module.exports = {
  plugins: [
    new ProgressBarPlugin()
  ]
}
```

#### 11.3 环境变量
```bash
npm install -D dotenv-webpack
```

```js
const Dotenv = require('dotenv-webpack');

module.exports = {
  plugins: [
    new Dotenv()
  ]
}
```

---

## 最佳实践总结

1. **开发环境**:
   - 使用 `eval-cheap-module-source-map` 快速构建
   - 启用 HMR 热模块替换
   - 使用 React Fast Refresh 提升开发体验

2. **生产环境**:
   - 使用 `source-map` 生成完整的 source map
   - 启用代码压缩和优化
   - 使用 Tree Shaking 移除未使用代码
   - 合理配置代码分割

3. **通用优化**:
   - 使用持久化缓存提升构建速度
   - 合理配置 resolve 选项
   - 使用 Webpack 5 的资源模块
   - 考虑使用模块联邦实现微前端

4. **监控与分析**:
   - 定期使用 Bundle Analyzer 分析包大小
   - 监控构建性能
   - 使用 `stats` 配置生成构建报告

## 常见问题解决方案

1. **构建速度慢**:
   - 使用 `cache-loader` 或 Webpack 5 内置缓存
   - 配置 `resolve.modules` 减少模块查找范围
   - 使用 `thread-loader` 多进程构建

2. **包体积过大**:
   - 启用 Tree Shaking
   - 使用代码分割
   - 按需加载第三方库
   - 使用 Webpack Bundle Analyzer 分析

3. **兼容性问题**:
   - 合理配置 Babel
   - 使用 core-js 3 进行 polyfill
   - 配置 browserslist 明确目标环境

---

## 版本升级指南

### Webpack 4 → 5 主要变化

1. **资源模块**:
   - 移除 `file-loader`/`url-loader`/`raw-loader`
   - 使用 `type: 'asset'` 替代

2. **缓存**:
   - 内置文件系统缓存
   - 移除 `cache-loader`

3. **Node.js polyfill**:
   - 默认不再自动 polyfill Node.js 核心模块
   - 需要显式配置

4. **构建优化**:
   - 改进 Tree Shaking
   - 持久化缓存开箱即用
   - 模块联邦新特性

### 迁移步骤

1. 更新依赖版本:
```bash
npm install webpack@latest webpack-cli@latest
```

2. 替换废弃的 loader 为资源模块

3. 配置持久化缓存:
```js
module.exports = {
  cache: {
    type: 'filesystem'
  }
}
```

4. 处理 Node.js 核心模块:
```js
module.exports = {
  resolve: {
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify")
    }
  }
}
```

---

## 附录

### 常用命令

```bash
# 开发模式
webpack serve --mode development --config webpack.dev.js

# 生产构建
webpack --mode production --config webpack.prod.js

# 分析构建
webpack --profile --json > stats.json
```

### 推荐配置

1. **.browserslistrc**:
```
> 0.5%
last 2 versions
not dead
not IE 11
```

2. **.editorconfig**:
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

3. **.gitignore**:
```
node_modules/
dist/
*.log
.DS_Store
.idea
.vscode
```

### 参考资源

1. [Webpack 官方文档](https://webpack.js.org/)
2. [Webpack 5 新特性](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
3. [Babel 配置指南](https://babeljs.io/docs/en/config-files)
4. [Webpack 性能优化](https://webpack.js.org/guides/build-performance/)
