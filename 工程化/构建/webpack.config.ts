/**
 * webpack配置文件
 * 包含了开发和生产环境的配置项
 * 
 * 主要功能：
 * 1. 构建性能优化
 *    - 使用文件系统缓存加速二次构建
 *    - 多线程压缩提升构建速度
 *    - 优化模块查找路径
 * 
 * 2. 生产环境优化
 *    - 代码压缩和混淆
 *    - CSS提取和压缩
 *    - Tree-shaking移除无用代码
 *    - 确定性的moduleId提升缓存命中率
 * 
 * 3. 资源处理
 *    - JS/JSX：使用babel转译
 *    - CSS：提取、前缀处理、压缩
 *    - 图片/字体：优化存放路径和命名
 * 
 * 4. 开发体验优化
 *    - 热模块替换提升开发效率
 *    - Source Map便于调试
 *    - ESLint实时代码检查
 *    - TypeScript类型检查
 * 
 * 5. 代码分割
 *    - 提取第三方库代码
 *    - 抽离公共模块
 *    - 按需加载优化首屏
 *    - Runtime代码分离
 */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const ESLintPlugin = require("eslint-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const webpack = require("webpack");
const { ModuleFederationPlugin } = webpack;

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    // 入口配置
    // 配置打包入口，支持多入口打包
    // - main: 项目主入口
    // - vendor: 提取第三方库，优化缓存命中率
    entry: {
      main: "./src/index.js",
      vendor: ["react", "react-dom"], // 分离第三方库，利于长期缓存
    },

    // 输出配置
    // 控制打包输出的文件名、路径等
    // - contenthash: 基于文件内容生成hash，用于缓存控制
    // - clean: 每次构建前清理输出目录
    // - publicPath: 配置资源的基础路径
    output: {
      filename: isProduction ? "[name].[contenthash].js" : "[name].js", // 生产环境使用contenthash
      path: path.resolve(__dirname, "dist"), // 输出目录
      clean: true, // 构建前清理dist目录
      publicPath: "/", // 资源访问路径前缀
    },

    // 开发服务器配置
    // webpack-dev-server配置，提供开发阶段的调试和预览能力
    // - hot: 启用热模块替换，提升开发效率
    // - historyApiFallback: SPA应用路由支持
    // - compress: 启用gzip压缩提升加载速度
    // - overlay: 直观展示编译错误
    // - proxy: 解决开发环境跨域问题
    devServer: {
      static: "./dist", // 静态资源目录
      hot: true, // 启用热模块替换，实时预览
      historyApiFallback: true, // 支持history路由模式
      port: 3000, // 开发服务器端口
      compress: true, // 启用gzip压缩，优化加载性能
      client: {
        overlay: true, // 将错误显示在浏览器中
        progress: true, // 在浏览器中显示编译进度
      },
      proxy: { // 接口代理配置，用于解决跨域
        "/api": {
          target: "http://localhost:8080", // 目标服务器
          changeOrigin: true, // 修改请求头中的Origin
          pathRewrite: { "^/api": "" }, // 路径重写
        },
      },
    },

    // 缓存配置
    // 使用文件系统缓存提升二次构建速度
    // - type: filesystem比memory缓存更持久
    // - buildDependencies: 指定缓存依赖，配置文件变更时重新构建
    cache: {
      type: "filesystem", // 使用文件系统缓存，持久化存储
      buildDependencies: {
        config: [__filename], // 将配置文件纳入缓存依赖
      },
    },

    // 模块处理规则
    // 配置不同类型文件的处理方式
    // - JS/JSX: 使用babel进行语法转换
    // - CSS: 提取、加载、预处理
    // - 资源文件: 优化存储位置和命名
    module: {
      rules: [
        // 处理JS/JSX
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"], // 语法转换预设
            },
          },
        },
        // 处理CSS
        // 生产环境提取CSS文件，开发环境使用style-loader
        // postcss-loader添加浏览器前缀
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader", // 生产环境提取CSS
            "css-loader", // 处理CSS模块化
            "postcss-loader", // 自动添加浏览器前缀
          ],
        },
        // 处理图片
        // 使用asset/resource优化图片加载
        // 统一存放到images目录
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
          generator: {
            filename: "images/[hash][ext][query]", // 生成带hash的文件名
          },
        },
        // 处理字体
        // 使用asset/resource处理字体文件
        // 统一存放到fonts目录
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "fonts/[hash][ext][query]", // 生成带hash的文件名
          },
        },
      ],
    },

    // 插件配置
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        favicon: "./public/favicon.ico",
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
        } : false,
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? "[name].[contenthash].css" : "[name].css",
      }),
      new webpack.DefinePlugin({ // 定义环境变量
        "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
      }),
      new ESLintPlugin({ // ESLint检查
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        fix: true,
      }),
      new ForkTsCheckerWebpackPlugin(), // TypeScript类型检查
      isProduction && new BundleAnalyzerPlugin({ // 打包分析
        analyzerMode: "static",
        openAnalyzer: false,
      }),
      isProduction && new ModuleFederationPlugin({ // Module Federation配置
        name: "host", // 当前应用的唯一标识名称
        filename: "remoteEntry.js", // 暴露的远程文件入口
        exposes: { // 暴露给其他应用的模块
          "./Button": "./src/components/Button", // 共享Button组件
          "./Header": "./src/components/Header" // 共享Header组件
        },
        remotes: { // 引入的远程模块
          app1: "app1@http://localhost:3001/remoteEntry.js", // 引入app1的远程模块
          app2: "app2@http://localhost:3002/remoteEntry.js" // 引入app2的远程模块
        },
        shared: { // 与其他应用共享的依赖
          react: { singleton: true }, // 确保React只加载一个实例
          "react-dom": { singleton: true }, // 确保ReactDOM只加载一个实例
          "@emotion/react": { singleton: true }, // 共享样式库
          "@emotion/styled": { singleton: true }
        }
      })
    ].filter(Boolean),

    // 优化配置
    optimization: {
      minimize: isProduction, // 生产环境开启压缩
      minimizer: [
        new TerserPlugin({ // JS压缩
          terserOptions: {
            compress: {
              drop_console: isProduction, // 生产环境下移除console
            },
          },
          parallel: true, // 多进程压缩
        }),
        new CssMinimizerPlugin(), // CSS压缩
      ],
      splitChunks: {
        chunks: "all", // 代码分割
        minSize: 20000, // 生成chunk的最小体积
        maxAsyncRequests: 30, // 最大异步请求数
        maxInitialRequests: 30, // 最大初始化请求数
        cacheGroups: {
          vendor: { // 第三方库分包
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          common: { // 公共模块分包
            minChunks: 2,
            name: "commons",
            chunks: "all",
            priority: 20,
          },
        },
      },
      runtimeChunk: "single", // 提取runtime代码
      moduleIds: "deterministic", // 确定的moduleId
    },

    // 外部依赖配置
    // 将常用库设置为外部依赖，通过CDN加载
    // 减小打包体积，利用浏览器缓存
    externals: isProduction ? {
      react: "React",
      "react-dom": "ReactDOM",
      vue: "Vue",
      "vue-router": "VueRouter",
      axios: "axios"
    } : {},



    // 解析配置
    resolve: {
      extensions: [".js", ".jsx", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    // 开发工具
    devtool: isProduction ? "source-map" : "eval-cheap-module-source-map",
  };
};
