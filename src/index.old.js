/*!
 * proxy-hot-reload-middleware
 * Copyright(c) 2024 Your Name
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
 * Module exports.
 * @public
 */

module.exports = proxyHotReloadMiddleware;

/**
 * Middleware to reload proxy configurations on file change.
 * @public
 * @param {string} proxyPath - The path to the proxy configuration file.
 * @return {function} - Express middleware function.
 */

function proxyHotReloadMiddleware(proxyPath) {
  console.debug("proxyHotReloadMiddleware>>>>", proxyPath);
  // Resolve the path to an absolute path
  const absoluteProxyPath = path.isAbsolute(proxyPath)
    ? proxyPath
    : path.resolve(process.cwd(), proxyPath);

  return (req, res, next) => {
    const app = req.app;

    if (!lastConfig) {
      // console.debug(`Init proxy config from ${absoluteProxyPath} path`);
      setupProxies(app, absoluteProxyPath);

      fs.watch(absoluteProxyPath, (eventType) => {
        // console.debug(`fs watch:`, eventType);
        if (eventType === "change") {
          // console.debug(`Reloading proxy config due to ${eventType} event`);
          setupProxies(app, absoluteProxyPath);
        }
      });
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

    console.debug("[config]", newConfig);

    if (
      !newConfig ||
      (typeof newConfig !== "object" && !Array.isArray(newConfig))
    ) {
      clearAllProxies(app);
      return;
    }

    // 比较新旧配置，仅更新发生变化的部分
    if (isEqualConfigs(newConfig, lastConfig)) {
      console.debug("No change in proxy configuration");
      return;
    }

    // 更新最新的配置
    lastConfig = newConfig;

    // Normalize config to array if it's an object
    const proxyConfigArray = Array.isArray(newConfig)
      ? newConfig
      : normalizeConfigToArray(newConfig);

    if (proxyConfigArray.length === 0) {
      clearAllProxies(app);
      return;
    }

    // Clear existing proxies
    clearAllProxies(app);

    proxyConfigArray.forEach((proxyItem) => {
      const newProxyMiddleware = createProxyMiddleware(
        proxyItem.context,
        proxyItem
      );
      console.debug("newProxyMiddleware", newProxyMiddleware);
      proxies.push(newProxyMiddleware);
      app.use(newProxyMiddleware);
    });
  } catch (err) {
    console.error(`Error setting up proxyMiddleware: ${err.message}`);
  }
}

/**
 * Normalize proxy configuration object to an array format.
 * @private
 * @param {object} config - The proxy configuration object.
 * @return {Array} - The normalized proxy configuration array.
 */
function normalizeConfigToArray(config) {
  return Object.keys(config).map((context) => ({
    context,
    ...config[context],
  }));
}

function hotRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function isEqualConfigs(config1, config2) {
  return JSON.stringify(config1) === JSON.stringify(config2);
}
