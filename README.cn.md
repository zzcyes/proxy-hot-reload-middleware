# proxy-hot-reload-middleware

[English](./README.md) | 简体中文

proxy-hot-reload-middleware 中间件允许通过监控配置文件的变化来动态更新代理配置，实现代理设置的热重载，无需重启服务器。

## 使用方法

- 代理配置示例
  
```js
module.exports = [ 
    {
        context: '/api',
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
    }
]
```

### 方式一

直接在 webpack-dev-server 中使用，可以热更新项目 proxy 代理的请求路径。

```js
const proxyHotReloadMiddleware = require('proxy-hot-reload-middleware');

module.exports = function (proxy, allowedHost){
    return {
        before(app, server, compiler) {
             app.use(proxyHotReloadMiddleware(proxyConfigPath)); // proxyConfig.js
        }
    }
}
```


- config/webpackDevServer.config.js

```js
const proxyHotReloadMiddleware = require('proxy-hot-reload-middleware');

module.exports = function (proxy, allowedHost){
    return {
        // before webpack-dev-server V3
        // v4 is onBeforeSetupMiddleware
         before(app, server, compiler) {
            if (fs.existsSync(paths.proxyConfig)) {
                app.use(proxyHotReloadMiddleware(paths.proxyConfig));
            }
    },
    }
}
```

resolveApp('config/proxy-config.js') 为 config/proxy-config.js 的绝对路径

- config/paths.js
  
```js
const path = require('path');
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
   proxyConfig: resolveApp('config/proxy-config.js'),
}
```

## 使用效果

使用 webpack-dev-server 来启 react 项目的时候，会遇到切换 proxy 代理的路径，但此时必须得重跑项目才会生效。

使用该插件后，即使修改了 proxy 代理的路径，也不需要再重新跑项目了。


### 方式二  

直接在 express 中使用

```js
const express = require('express');
const app = express();
const proxyHotReloadMiddleware = require('proxy-hot-reload-middleware');

app.use(proxyHotReloadMiddleware(proxyConfigPath));

app.listen(3000);
```


