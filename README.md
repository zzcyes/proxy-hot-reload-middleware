# proxy-hot-reload-middleware

English | [简体中文](./README.cn.md)

The proxy-hot-reload-middleware middleware allows for dynamic updates to proxy configurations by monitoring changes in the configuration file, achieving hot-reloading of proxy settings without restarting the server.

## Usage

- Proxy Configuration Example
  
```js
// proxyConfig.js
module.exports = [ 
    {
        context: '/api',
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
    }
]
```

### Method 1: Using with webpack-dev-server

You can integrate this middleware into webpack-dev-server to enable hot-reloading of proxy configuration when running a React or other frontend project. This eliminates the need to restart the project when proxy settings change.


- webpackDevServer.config.js

```js
const proxyHotReloadMiddleware = require('proxy-hot-reload-middleware');

module.exports = function (proxy, allowedHost){
    return {
        // before (used for webpack-dev-server v3)
        // for webpack-dev-server v4, use onBeforeSetupMiddleware
        before(app, server, compiler) {
            app.use(proxyHotReloadMiddleware(proxyConfigPath)); // Use proxy configuration file path
        },
    }
}
```

### Method 2: Using with Express

You can also use proxy-hot-reload-middleware directly in an Express server. This allows the proxy settings to be hot-reloaded without restarting the server when changes are made to the proxy configuration.


- Example usage in Express

```js
const express = require('express');
const app = express();
const proxyHotReloadMiddleware = require('proxy-hot-reload-middleware');

app.use(proxyHotReloadMiddleware(proxyConfigPath));

app.listen(3000);
```

## How It Works

In certain development environments, such as when using webpack-dev-server for React projects, modifying the proxy configuration often requires restarting the development server for the changes to take effect. With proxy-hot-reload-middleware, the proxy settings are automatically reloaded whenever the configuration file is updated, so there is no need to restart the project manually.

## Installation

1. Install the package:

```bash
npm install proxy-hot-reload-middleware
```

1. Set up your proxy configuration file (e.g., proxyConfig.js).

2. Use the middleware as shown in the examples above, either within a webpack-dev-server configuration or an Express server.

By using this middleware, you can streamline the proxy configuration process and improve your development experience by avoiding unnecessary server restarts when working with proxy-based requests.
