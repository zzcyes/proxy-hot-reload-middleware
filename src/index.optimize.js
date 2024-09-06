/*!
 * proxy-hot-reload-middleware
 * Copyright(c) 2024 oyeitsmeow
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 * @private
 */

const { createProxyMiddleware } = require("http-proxy-middleware");
const fs = require("fs");
const path = require("path");

/**
 * Cache of loaded proxies.
 * @private
 */

let proxies = [];
let lastConfig = null;

/**
 * Middleware to reload proxy configurations on file change.
 * @public
 * @param {string} proxyPath - The path to the proxy configuration file.
 * @return {function} - Express middleware function.
 */

function proxyHotReloadMiddleware(proxyPath) {
  const absoluteProxyPath = path.resolve(proxyPath);

  return (req, res, next) => {
    if (!lastConfig) {
      setupProxies(req.app, absoluteProxyPath);
      watchConfigFile(req.app, absoluteProxyPath);
    }
    next();
  };
}

/**
 * Remove specific middleware from the application.
 * @private
 * @param {object} app - The Express application instance.
 * @param {function} middleware - The middleware to remove.
 */

function removeProxies(app, middleware) {
  app._router.stack = app._router.stack.filter(
    (layer) => layer.handle !== middleware
  );
}

/**
 * Clear all registered proxies from the application.
 * @private
 * @param {object} app - The Express application instance.
 */

function clearAllProxies(app) {
  proxies.forEach((middleware) => removeProxies(app, middleware));
  proxies = [];
}

/**
 * Set up proxies based on the configuration file.
 * @private
 * @param {object} app - The Express application instance.
 * @param {string} proxyPath - The path to the proxy configuration file.
 */

function setupProxies(app, proxyPath) {
  try {
    const newConfig = hotRequire(proxyPath);
    if (!isValidConfig(newConfig) || isEqualConfigs(newConfig, lastConfig)) {
      return;
    }

    lastConfig = newConfig;
    const proxyConfigArray = normalizeConfig(newConfig);

    clearAllProxies(app);
    proxyConfigArray.forEach(createAndUseProxy(app));
  } catch (err) {
    console.error(`设置代理中间件时出错: ${err.message}`);
  }
}

/**
 * Normalize proxy configuration object to an array format.
 * @private
 * @param {object} config - The proxy configuration object.
 * @return {Array} - The normalized proxy configuration array.
 */
function normalizeConfig(config) {
  return Array.isArray(config)
    ? config
    : Object.entries(config).map(([context, options]) => ({
        context,
        ...options,
      }));
}

function createAndUseProxy(app) {
  return (proxyItem) => {
    const newProxyMiddleware = createProxyMiddleware(
      proxyItem.context,
      proxyItem
    );
    proxies.push(newProxyMiddleware);
    app.use(newProxyMiddleware);
  };
}

function watchConfigFile(app, proxyPath) {
  fs.watch(proxyPath, (eventType) => {
    if (eventType === "change") {
      setupProxies(app, proxyPath);
    }
  });
}

function hotRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function isEqualConfigs(config1, config2) {
  return JSON.stringify(config1) === JSON.stringify(config2);
}

function isValidConfig(config) {
  return config && (typeof config === "object" || Array.isArray(config));
}

module.exports = proxyHotReloadMiddleware;
