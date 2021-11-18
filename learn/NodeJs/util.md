### package.json `browser`
``` js
// 如果 module 在浏览器端使用，引用路径会被替换
"browser": {
  "./support/isBuffer.js": "./support/isBufferBrowser.js"
}

// browser: require('./support/isBufferBrowser')
exports.isBuffer = require('./support/isBuffer');
```

> https://github.com/SunshowerC/blog/issues/8