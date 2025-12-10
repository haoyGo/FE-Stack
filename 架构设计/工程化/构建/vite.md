# Vite

## 基本概念

### 为什么选择 Vite
- **开发服务器启动快**：利用浏览器原生 ESM 支持，无需打包
- **按需编译**：源码模块在浏览器请求时按需编译
- **HMR 更新快**：基于 ESM 的热更新，只更新变更模块
- **开箱即用**：内置对 TypeScript、JSX、CSS 等的支持

### 工作原理
1. **开发环境**
   - 基于浏览器原生 ESM 支持
   - 按需编译，无需打包
   - 智能预构建依赖

2. **生产环境**
   - 基于 Rollup 打包
   - 自动 CSS 代码分割
   - 自动预加载关键模块

## 项目配置

### 创建项目
```bash
# npm
npm create vite@latest my-app

# yarn
yarn create vite my-app

# pnpm
pnpm create vite my-app
```

### 配置文件
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 项目根目录
  root: process.cwd(),
  
  // 开发服务器选项
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // 构建选项
  build: {
    target: 'modules', // 浏览器兼容性
    outDir: 'dist',    // 输出目录
    assetsDir: 'assets', // 静态资源目录
    cssCodeSplit: true,  // CSS代码分割
    sourcemap: false,    // 是否生成sourcemap
    minify: 'terser',    // 压缩方式
    rollupOptions: {     // 自定义rollup配置
      output: {
        manualChunks: {  // 代码分割配置
          'vendor': ['vue', 'vue-router'],
          'utils': ['./src/utils']
        }
      }
    }
  },

  // 依赖优化选项
  optimizeDeps: {
    include: ['vue', 'vue-router'], // 预构建依赖
    exclude: ['your-package']        // 排除预构建
  },

  // 插件
  plugins: [
    vue(),  // Vue支持
    react() // React支持
  ],

  // 解析配置
  resolve: {
    alias: {
      '@': '/src',
      'components': '/src/components'
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  }
})
```

## 插件使用

### 常用官方插件
1. **@vitejs/plugin-vue**
   - Vue 3 单文件组件支持
   ```typescript
   import vue from '@vitejs/plugin-vue'

   export default {
     plugins: [vue()]
   }
   ```

2. **@vitejs/plugin-react**
   - React 支持（包含 Fast Refresh）
   ```typescript
   import react from '@vitejs/plugin-react'

   export default {
     plugins: [react()]
   }
   ```

3. **@vitejs/plugin-legacy**
   - 旧浏览器兼容性支持
   ```typescript
   import legacy from '@vitejs/plugin-legacy'

   export default {
     plugins: [
       legacy({
         targets: ['defaults', 'not IE 11']
       })
     ]
   }
   ```

### 社区插件
1. **vite-plugin-compression**
   - 构建时压缩资源
   ```typescript
   import viteCompression from 'vite-plugin-compression'

   export default {
     plugins: [viteCompression()]
   }
   ```

2. **vite-plugin-pwa**
   - PWA 支持
   ```typescript
   import { VitePWA } from 'vite-plugin-pwa'

   export default {
     plugins: [
       VitePWA({
         registerType: 'autoUpdate'
       })
     ]
   }
   ```

## 构建优化

### 依赖预构建
- **作用**：将 CommonJS / UMD 转换为 ESM 格式
- **优化**：将多个依赖合并，减少请求
- **配置**：
  ```typescript
  export default {
    optimizeDeps: {
      include: ['lodash-es', 'vue'],
      exclude: ['your-local-package']
    }
  }
  ```

### 代码分割
- **自动分割**：CSS 代码自动分割
- **手动分割**：使用 `rollupOptions.output.manualChunks`
  ```typescript
  export default {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router'],
            'ui': ['element-plus']
          }
        }
      }
    }
  }
  ```

### 资源处理
- **静态资源处理**：自动处理图片、字体等资源
- **SVG 组件**：通过插件支持 SVG 组件化
- **资源引入**：支持 URL 导入和 Base64 内联

## 高级特性

### 环境变量
- **定义**：在 `.env` 文件中定义
  ```plaintext
  VITE_APP_TITLE=My App
  VITE_API_URL=http://api.example.com
  ```

- **使用**：通过 `import.meta.env` 访问
  ```typescript
  console.log(import.meta.env.VITE_APP_TITLE)
  ```

### 模块热替换 (HMR)
- **Vue 单文件组件**：开箱即用
- **React 组件**：通过 `@vitejs/plugin-react` 支持
- **自定义 HMR**：
  ```typescript
  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      // 处理更新
    })
  }
  ```

### SSR 支持
- **开发服务器**：支持 SSR 开发
- **生产构建**：支持预渲染和完整 SSR
- **配置示例**：
  ```typescript
  export default {
    ssr: {
      external: ['some-external-package'],
      noExternal: ['some-package']
    }
  }
  ```

## 最佳实践

### 性能优化
1. **合理使用预构建**
   - 将频繁使用的依赖加入 `optimizeDeps.include`
   - 避免不必要的依赖预构建

2. **资源优化**
   - 使用适当的图片格式和大小
   - 合理配置资源压缩

3. **代码分割策略**
   - 按路由分割代码
   - 提取公共依赖

### 开发体验
1. **TypeScript 集成**
   - 使用 `vite-tsconfig-paths` 支持路径别名
   - 配置 `types` 目录管理类型声明

2. **调试配置**
   - 使用 source map
   - 配置 VS Code 调试

3. **规范工具链**
   - ESLint 集成
   - Prettier 格式化
   - Git Hooks 配置