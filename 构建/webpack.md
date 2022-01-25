## Webpack

### 初始化项目
* `npm init -y`
* `npm i -D webpack webpack-cli`

#### 配置
* 可以通过 webpack 直接打包一个 js 文件：`"build": "webpack ./src/main.js"`
* 但一般都过配置文件去打包：`"build": "webpack --config build/webpack.config.js"`

---

### 转义 JS
* `npm i -D babel-loader @babel/core @babel/preset-env @babel/plugin-transform-runtime`
* `npm i -S @babel/polyfill @babel/runtime @babel/runtime-corejs3`
  ``` js
  //webpack.config.js
  module.exports = {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: {
            loader:'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                [
                  "@babel/plugin-transform-runtime",
                  {
                    "corejs": 3
                  }
                ]
              ]
            }
          },
          exclude: /node_modules/ //排除 node_modules 目录
        }
      ]
    }
  }
  ```
  * `babel-loader`：loader
  * `@babel/core`：babel核心，必需
  * `@babel/preset-env`：插件包，包含的插件将支持所有最新的JS特性（ES2015,ES2016等，不包含 `stage阶段`），`stage阶段` 特性需要另外引用插件。
  根据你配置的目标环境，生成插件列表来编，官方推荐使用 `.browserslistrc` 文件来指定目标环境。
  * `@babel/polyfill`：语法转换只是将高版本的语法转换成低版本的，但是新的内置函数、实例方法无法转换，这时，就需要使用 polyfill 上场了。
  这意味着可以使用诸如 Promise 和 WeakMap 之类的新的内置组件、 Array.from 或 Object.assign 之类的静态方法等。为了添加这些功能，polyfill 将添加到全局范围和类似 String 这样的内置原型中(**会对全局环境造成污染**，后面我们会介绍不污染全局环境的方法)。
  **polyfill 是作为代码引入的，所以需要安装在 --save**
  * `@babel/preset-env` 提供了一个 `useBuiltIns` 参数，设置值为 `usage` 时，就只会包含代码需要的 polyfill 。有一点需要注意：配置此参数的值为 usage ，必须要同时设置 `corejs` (如果不设置，会给出警告，默认使用的是"corejs": 2) ，注意: 这里仍然需要安装 `@babel/polyfill`(当前 `@babel/polyfill` 版本默认会安装 `"corejs": 2`):
  * 首先说一下使用 `core-js@3` 的原因，`core-js@2` 分支中已经不会再添加新特性，新特性都会添加到 `core-js@3`。例如你使用了 `Array.prototype.flat()`，如果你使用的是 `core-js@2`，那么其不包含此新特性。为了可以使用更多的新特性，建议大家使用 `core-js@3`。
    ``` js
    //.babelrc
    const presets = [
      [
        "@babel/preset-env",
        {
          "useBuiltIns": "usage",
          "corejs": 3
        }
      ]
    ]
    ```
  * 使用 `@babel/plugin-transform-runtime` 插件，所有帮助程序都将引用模块 `@babel/runtime`，这样就可以避免编译后的代码中出现重复的帮助程序，有效减少包体积。`@babel/plugin-transform-runtime` 需要和 `@babel/runtime` 配合使用。
  `@babel/plugin-transform-runtime` 通常仅在开发时使用，但是运行时最终代码需要依赖 `@babel/runtime`，所以 `@babel/runtime` 必须要作为生产依赖被安装
  **`@babel/plugin-transform-runtime` + `corejs@3` 进行 polyfill 不会污染全局环境**
    ``` js
    //.babelrc
    {
      "presets": [
        [
          "@babel/preset-env",
          // {
          //  "useBuiltIns": "usage",
          //  "corejs": 3
          // }
        ]
      ],
      "plugins": [
        [
          "@babel/plugin-transform-runtime",
          {
            "corejs": 3
          }
        ]
      ]
    }
    ```
  * `presets`、`plugins` 顺序
    * plugins 在 Presets 前运行。
    * plugins 顺序从前往后排列。
    * Preset 顺序是颠倒的（从后往前）。
  * `preset`、`plugins` 都可以接受参数，**参数由插件名和参数对象组成一个数组**。

---

### 清空旧打包文件
* `npm i -D clean-webpack-plugin`
``` js
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
module.exports = {
  // ...省略其他配置
  plugins:[
    // 清除旧的 js 打包文件
    new CleanWebpackPlugin()
  ]
}
```
* 参数 `cleanOnceBeforeBuildPatterns`：
  ``` js
  //webpack.config.js
  module.exports = {
      //...
      plugins: [
          new CleanWebpackPlugin({
              cleanOnceBeforeBuildPatterns:['**/*', '!dll', '!dll/**'] //不删除dll目录下的文件
          })
      ]
  }
  ```

---

### 处理 HTML
每次打包 js 文件会有 hash 值，用于在自动引入打包后的 js 文件
* `npm i -D html-webpack-plugin`
  ``` js
  // webpack.config.js
  const path = require('path');
  const HtmlWebpackPlugin = require('html-webpack-plugin');
  const config = require('./public/config')[isDev ? 'dev' : 'build'];
  module.exports = {
    //...
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname,'../public/index.html'),
        filename: 'index.html', //打包后的文件名
        // hash: true, //是否加上hash，默认是 false
        config: config.template, // config配置
        minify: {
            removeAttributeQuotes: false, //是否删除属性的双引号
            collapseWhitespace: false, //是否折叠空白
        },
      })
    ]
  }
  ```
* 对于多页面项目，可以配置多个 `html-webpack-plugin` 实例
  ``` js
  const path = require('path');
  const HtmlWebpackPlugin = require('html-webpack-plugin')

  module.exports = {
    mode:'development', // 开发模式
    entry: { // 多入口
      main: path.resolve(__dirname,'../src/main.js'),
      header: path.resolve(__dirname,'../src/header.js')
    }, 
    output: {
      filename: '[name].[hash:8].js',      // 打包后的文件名称
      path: path.resolve(__dirname,'../dist')  // 打包后的目录
    },
    plugins:[
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname,'../public/index.html'),
        filename: 'index.html',
        chunks: ['main'] // 与入口文件对应的模块名
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname,'../public/header.html'),
        filename: 'header.html',
        chunks: ['header'] // 与入口文件对应的模块名
      }),
    ]
  }
  ```

---

### dev-server
本地服务器
* `npm i -D webpack-dev-server`
  ``` js
  // webpack.config.js
  module.exports = {
    //...
    devServer: {
      port: '3000', //默认是8080
      quiet: false, //默认不启用
      inline: true, //默认开启 inline 模式，如果设置为false,开启 iframe 模式
      stats: "errors-only", //终端仅打印 error
      overlay: false, //默认不启用
      clientLogLevel: "silent", //日志等级
      compress: true, //是否启用 gzip 压缩
      hot: true, // 热更新
      proxy: { // 代理
        "/api": {
          target: 'http://localhost:4000',
          pathRewrite: { // 移除代理路由前缀
            '/api': ''
          }
        }
      }
    }
  }
  ```

---

### devtool
* devtool 中的一些设置，可以帮助我们将编译后的代码映射回原始源代码。不同的值会明显影响到构建和重新构建的速度。
  ``` js
  //webpack.config.js
  module.exports = {
    devtool: 'cheap-module-eval-source-map' //开发环境下使用
  }
  ```
* 生产环境可以使用 none 或者是 `source-map`，使用 `source-map` 最终会单独打包出一个 `.map文件`，我们可以根据报错信息和此 map 文件，进行错误解析，定位到源代码。
* `source-map` 和 `hidden-source-map` 都会打包生成单独的 .map 文件，区别在于，`source-map` 会在打包出的js文件中增加一个引用注释，以便开发工具知道在哪里可以找到它。`hidden-source-map` 则不会在打包的js中增加引用注释。

---

### 处理 CSS
* `npm i -D style-loader less-loader css-loader postcss-loader autoprefixer less`
  ``` js
  //webpack.config.js
  module.exports = {
    //...
    module: {
      rules: [
        {
          test: /\.(le|c)ss$/,
          use: ['style-loader', 'css-loader', {
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')({
                    "overrideBrowserslist": [
                      ">0.25%",
                      "not dead"
                    ]
                  })
                ]
              }
            }
          }, 'less-loader'],
          exclude: /node_modules/
        }
      ]
    }
  }
  ```
  * `style-loader` 动态创建 style 标签，将 css 插入到 head 中.
  * `css-loader` 负责处理 @import 等语句。
  * `postcss-loader` 和 `autoprefixer`，自动生成浏览器兼容性前缀
  * `less-loader` 负责处理编译 .less 文件,将其转为 css
  * **`loader` 执行顺序是反向的**。`loader` 其实还有一个参数，可以修改优先级，`enforce` 参数，其值可以为: `pre(优先执行)` 或 `post (滞后执行)`。

---

### 处理图片、字体
可以使用 `url-loader` 或者 `file-loader` 来处理本地的资源文件。`url-loader` 和 `file-loader` 的功能类似，但是 `url-loader` 可以指定在文件大小小于指定的限制时，返回 `DataURL`
* `npm i -D url-loader file-loader`
  ``` js
  // webpack.config.js
  module.exports = {
    // 省略其它配置 ...
    module: {
      rules: [
        // ...
        {
          test: /\.(png|jpe?g|gif|webp|svg|eot|ttf|woff|woff2)$/i, //图片文件
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 10240, // 10K
                fallback: {
                  loader: 'file-loader',
                  options: {
                    name: 'img/[name].[hash:8].[ext]'
                  }
                }
              }
            }
          ]
        },
      ]
    }
  }
  ```

---

### 静态资源拷贝
* `npm i -D copy-webpack-plugin`
  ``` js
  // webpack.config.js
  const CopyWebpackPlugin = require('copy-webpack-plugin');
  module.exports = {
    //...
    plugins: [
      new CopyWebpackPlugin([
        {
          from: 'public/js/*.js',
          to: path.resolve(__dirname, 'dist', 'js'),
          flatten: true,
        },
        {
          ignore: ['other.js']
        }
        //还可以继续配置其它要拷贝的文件
      ])
    ]
  }
  ```
* 如果我们要拷贝一个目录下的很多文件，但是想过滤掉某个或某些文件，那么 `CopyWebpackPlugin` 还为我们提供了 `ignore` 参数。

---

### 抽离 CSS
有些时候，我们可能会有抽离CSS的需求，即将CSS文件单独打包，这可能是因为打包成一个JS文件太大，影响加载速度，也有可能是为了缓存。
* `npm i -D mini-css-extract-plugin`
  ``` js
  // webpack.config.js
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');
  module.exports = {
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'css/[name].css'
        //个人习惯将css文件放在单独目录下
        //publicPath:'../'   //如果你的output的publicPath配置的是 './' 这种相对路径，那么如果将css文件放在单独目录下，记得在这里指定一下publicPath 
      })
    ],
    module: {
      rules: [
        {
          test: /\.(le|c)ss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader, //替换之前的 style-loader
              options: {
                hmr: isDev,
                reloadAll: true,
              }
            },
            'css-loader', {
              loader: 'postcss-loader',
              options: {
                plugins: function () {
                  return [
                    require('autoprefixer')({
                      "overrideBrowserslist": [
                        "defaults" // 可以本地配置 .browserlistrc 而不用传参
                      ]
                    })
                  ]
                }
              }
            }, 'less-loader'
          ],
          exclude: /node_modules/
        }
      ]
    }
  }
  ```
* `mini-css-extract-plugin` 和 `extract-text-webpack-plugin` 相比:
  * 异步加载
  * 不会重复编译(性能更好)
  * 更容易使用
  * 只适用CSS

---

### 压缩抽离的 CSS
使用 mini-css-extract-plugin，CSS 文件默认不会被压缩。
* `npm i -D optimize-css-assets-webpack-plugin`
  ``` js
  //webpack.config.js
  const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');

  module.exports = {
      entry: './src/index.js',
      //....
      plugins: [
          new OptimizeCssPlugin()
      ],
  }
  ```

---

### 按需加载
`import()` 语法，需要 `@babel/plugin-syntax-dynamic-import` 的插件支持，但是因为当前 `@babel/preset-env` 预设中已经包含了 `@babel/plugin-syntax-dynamic-import`，因此我们不需要再单独安装和配置。

---

### 热更新
* 首先配置 devServer 的 hot 为 true
* 并且在 plugins 中增加 `new webpack.HotModuleReplacementPlugin()`
``` js
// webpack.config.js
const webpack = require('webpack');
module.exports = {
  //....
  devServer: {
    hot: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin() //热更新插件
  ]
}
```

---

### resolve 配置
resolve 配置 webpack 如何寻找模块所对应的文件。
#### modules
resolve.modules 配置 webpack 去哪些目录下寻找第三方模块，默认情况下，只会去 node_modules 下寻找，如果你我们项目中某个文件夹下的模块经常被导入，不希望写很长的路径，那么就可以通过配置 resolve.modules 来简化。
``` js
// webpack.config.js
module.exports = {
  //....
  resolve: {
    modules: ['./src/components', 'node_modules'] // 从左到右依次查找
  }
}
```

#### alias
``` js
// webpack.config.js
module.exports = {
  //....
  resolve: {
    alias: {
      '@c': 'src/components'
    }
  }
}
```
#### extensions
适配多端的项目中，可能会出现 .web.js, .wx.js，例如在转web的项目中，我们希望首先找 .web.js，如果没有，再找 .js。
```  js
// webpack.config.js
module.exports = {
  //....
  resolve: {
    extensions: ['web.js', '.js'] // 当然，你还可以配置 .json, .css
  }
}
```

#### enforceExtension
如果配置了 `resolve.enforceExtension` 为 true，那么导入语句不能缺省文件后缀。

#### mainFields
有一些第三方模块会提供多份代码，例如 bootstrap，可以查看 bootstrap 的 `package.json` 文件
``` json
{
  "style": "dist/css/bootstrap.css",
  "sass": "scss/bootstrap.scss",
  "main": "dist/js/bootstrap",
}
```
`resolve.mainFields` 默认配置是 `['browser', 'main']`，即首先找对应依赖 `package.json` 中的 brower 字段，如果没有，找 main 字段。

---

### 区分不同的环境
目前为止我们 webpack 的配置，都定义在了 `webpack.config.js` 中，对于需要区分是开发环境还是生产环境的情况，我们根据 `process.env.NODE_ENV` 去进行了区分配置，但是配置文件中如果有多处需要区分环境的配置，这种显然不是一个好办法。

更好的做法是创建多个配置文件，如: `webpack.base.js、webpack.dev.js、webpack.prod.js`。

* `npm i -D webpack-merge` 用于合并 base-config
  ``` js
  // webpack.config.dev.js
  const merge = require('webpack-merge');
  const baseWebpackConfig = require('./webpack.config.base');

  module.exports = merge(baseWebpackConfig, {
      mode: 'development'
      //...其它的一些配置
  });
  ```

---

## Webpack 优化

### 量化
`speed-measure-webpack-plugin` 插件可以测量各个插件和loader所花费的时间
* `npm i -D speed-measure-webpack-plugin`
  ``` js
  //webpack.config.js
  const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
  const smp = new SpeedMeasurePlugin();

  const config = {
      //...webpack配置
  }

  module.exports = smp.wrap(config);
  ```

---

### exclude/include
* 可以通过 exclude、include 配置来确保转译尽可能少的文件。顾名思义，exclude 指定要排除的文件，include 指定要包含的文件。
* exclude 的优先级高于 include，在 include 和 exclude 中使用绝对路径数组，尽量避免 exclude，更倾向于使用 include。

---

### cache-loader
* `npm i -D cache-loader`：`cache-loader` 的配置很简单，放在其他 loader 之前即可
  ``` js
  module.exports = {
    //...
    module: {
      //我的项目中,babel-loader耗时比较长，所以我给它配置了`cache-loader`
      rules: [
        {
          test: /\.jsx?$/,
          use: ['cache-loader','babel-loader']
        }
      ]
    }
  }
  ```
* `babel-loader` 本身有配置项 `cacheDirectory`，默认值为 false。
  ``` js
  loaders: [
    {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: "babel-loader?optional=runtime&cacheDirectory"
    }
  ]

  // or
  rules: [
    {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      query: {
        optional: "runtime",
        cacheDirectory: true
      }
    }
  ]
  ```

---

### 多进程处理
#### happypack
* `npm i -D happypack`
  ``` js
  const Happypack = require('happypack');
  module.exports = {
    //...
    module: {
      rules: [
        {
          test: /\.js[x]?$/,
          use: 'Happypack/loader?id=js',
          include: [path.resolve(__dirname, 'src')]
        },
        {
          test: /\.css$/,
          use: 'Happypack/loader?id=css',
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules', 'bootstrap', 'dist')
          ]
        }
      ]
    },
    plugins: [
      new Happypack({
        id: 'js', //和rule中的id=js对应
        //将之前 rule 中的 loader 在此配置
        use: ['babel-loader'] //必须是数组
      }),
      new Happypack({
        id: 'css',//和rule中的id=css对应
        use: ['style-loader', 'css-loader','postcss-loader'],
      })
    ]
  }
  ```

#### thread-loader
* `npm i -D thread-loader`
  ``` js
  module.exports = {
    module: {
      //我的项目中,babel-loader耗时比较长，所以我给它配置 thread-loader
      rules: [
        {
          test: /\.jsx?$/,
          use: ['thread-loader', 'cache-loader', 'babel-loader']
        }
      ]
    }
  }
  ```

---

### 开启 JS 多进程压缩
虽然很多 webpack 优化的文章上会提及多进程压缩的优化，不管是 `webpack-parallel-uglify-plugin` 或者是 `uglifyjs-webpack-plugin` 配置 parallel。不过这里我要说一句，没必要单独安装这些插件，它们并不会让你的 Webpack 构建速度提升。
当前 Webpack 默认使用的是 `TerserWebpackPlugin`，默认就开启了多进程和缓存，构建时，你的项目中可以看到 terser 的缓存文件 node_modules/.cache/`terser-webpack-plugin`。

---

### noParse
* 使用 noParse 来标识这个模块，这样 Webpack 会引入这些模块，但是不进行转化和解析，从而提升 Webpack 的构建性能 ，例如：jquery 、lodash。
* noParse 属性的值是一个正则表达式或者是一个 function。
  ``` js
  //webpack.config.js
  module.exports = {
    //...
    module: {
      noParse: /jquery|lodash/
    }
  }
  ```

---

### externals
我们可以将一些JS文件存储在 CDN 上(减少 Webpack打包出来的 js 体积)，在 index.html 中通过 `<script>` 标签引入，如:
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <div id="root">root</div>
    <script src="http://libs.baidu.com/jquery/2.0.0/jquery.min.js"></script>
</body>
</html>
```

我们希望在使用时，仍然可以通过 import 的方式去引用(如 `import $ from 'jquery'`)，并且希望 webpack 不会对其进行打包，此时就可以配置 **`externals`**。
``` js
//webpack.config.js
module.exports = {
  //...
  externals: {
    //jquery通过script引入之后，全局中即有了 jQuery 变量
    'jquery': 'jQuery'
  }
}
```

---

### DllPlugin 拆分bundles
* 有些时候，如果所有的JS文件都打成一个JS文件，会导致最终生成的JS文件很大，这个时候，我们就要考虑 **拆分bundles**。
* `DllPlugin` 和 `DLLReferencePlugin` 可以实现拆分 bundles，并且可以大大提升构建速度，`DllPlugin` 和 `DLLReferencePlugin` 都是 webpack 的内置模块。
* 我们使用 DllPlugin 将不会频繁更新的库进行编译，当这些依赖的版本没有变化时，就不需要重新编译。我们新建一个 webpack 的配置文件，来专门用于编译动态链接库，例如名为: webpack.config.dll.js，这里我们将 react 和 react-dom 单独打包成一个动态链接库。
``` js
//webpack.config.dll.js
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    react: ['react', 'react-dom']
  },
  mode: 'production',
  output: {
    filename: '[name].dll.[hash:6].js',
    path: path.resolve(__dirname, 'dist', 'dll'),
    library: '[name]_dll' //暴露给外部使用
    //libraryTarget 指定如何暴露内容，缺省时就是 var
  },
  plugins: [
    new webpack.DllPlugin({
      //name和library一致
      name: '[name]_dll', 
      path: path.resolve(__dirname, 'dist', 'dll', 'manifest.json') //manifest.json的生成路径
    })
  ]
}
```

在 `package.json` 的 scripts 中增加:
``` json
{
  "scripts": {
    "dev": "NODE_ENV=development webpack-dev-server",
    "build": "NODE_ENV=production webpack",
    "build:dll": "webpack --config webpack.config.dll.js"
  },
}
```

修改 webpack 的主配置文件: `webpack.config.js` 的配置：
``` js
//webpack.config.js
const webpack = require('webpack');
const path = require('path');
module.exports = {
  //...
  devServer: {
    contentBase: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.DllReferencePlugin({
      manifest: path.resolve(__dirname, 'dist', 'dll', 'manifest.json') // manifest.json 用于让 DLLReferencePlugin 映射到相关依赖上。
    }),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['**/*', '!dll', '!dll/**'] //不删除dll目录
    }),
    //...
  ]
}
```