# proxy-hot-reload-middleware

用于 webpack-dev-server 的 express 中间件，可以热更新项目 proxy 代理的请求路径。

## 使用方法

- config/webpackDevServer.config.js

```js
const proxyHotReloadMiddleware = require('proxy-hot-reload-middleware');

module.exports = function (proxy, allowedHost){
    return {
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

- config/proxy-config.js

```js
    module.exports = [ 
        {
            context: '/api',
            target: 'http://192.168.x.x:8902',
            changeOrigin: true,
        }
    ]

```

## 使用效果

使用 webpack-dev-server 来跑前端项目的时候，会遇到切换 proxy 代理的路径，但此时必须得重跑项目才会生效。

使用该插件后，即使修改了 proxy 代理的路径，也不需要再重新跑项目了。

PS: 在 webpack-dev-server 的 proxy 配置中，可以使用 http-proxy-middleware 中间件的 router，配合 hotRequire 加载 proxy.config 也能起到效果。


比如：

```js
 proxy: {
        '/api': {
            target: 'http://192.168.x.x:8902',
            changeOrigin: true,
            router: () => {
                //添加router配置
                return hotRequire('./target').login;
            },
        },
 }

```

 router 是 http-proxy-middleware 中间件提供的一个方法 ，可以重定向。但是修改后的 proxy 代理路径访问不通，终端还是会打印修改前的代理路径，不友好。

比如把代理端口切换为错误的端口 "8903", 此时终端会打印  <code>http://192.168.x.x:8902 </code> 代理访问错误的相关信息。
