import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import proxyHotReloadMiddleware from "./src/index.js";
import { EventEmitter } from "events";

describe("代理测试", () => {
  let serverA, serverB;
  let tempDir;
  let tempProxyConfigPath;
  const proxyReloadEmitter = new EventEmitter();

  beforeAll(async () => {
    console.log("开始设置测试环境...");
    try {
      tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), "proxy-test-")
      );
      tempProxyConfigPath = path.join(tempDir, "proxy.config.js");

      const initialConfig = `
        module.exports = [
          {
            context: ["/newproxy/api"],
            target: "http://localhost:3000",
            changeOrigin: true,
            pathRewrite: { "^/newproxy": "" },
          },
        ];
      `;
      await fs.promises.writeFile(tempProxyConfigPath, initialConfig);
      console.log("初始配置文件已创建");

      const appA = express();
      appA.get("/api", (req, res) => {
        res.send("代理成功");
      });
      serverA = await new Promise((resolve) => {
        const server = appA.listen(3000, () => {
          console.log("服务器A已启动");
          resolve(server);
        });
      });

      const appB = express();
      appB.use(
        proxyHotReloadMiddleware(tempProxyConfigPath, proxyReloadEmitter)
      );
      serverB = await new Promise((resolve) => {
        const server = appB.listen(3001, () => {
          console.log("服务器B已启动");
          resolve(server);
        });
      });
    } catch (error) {
      console.error("设置测试环境时出错:", error);
      throw error;
    }
  }, 20000);

  afterAll(async () => {
    console.log("开始清理测试环境...");
    try {
      await new Promise((resolve) => serverA.close(resolve));
      await new Promise((resolve) => serverB.close(resolve));
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      console.log("测试环境清理完成");
    } catch (error) {
      console.error("清理测试环境时出错:", error);
    }
  });

  it("应该成功代理请求", async () => {
    console.log("开始测试初始代理...");
    const response = await makeRequest("http://localhost:3001/newproxy/api");
    expect(response).toBe("代理成功");
    console.log("初始代理测试完成");
  }, 15000);

  it("更新配置文件后应该成功代理新的请求，旧的请求应该失败", async () => {
    console.log("开始测试代理更新...");
    const newConfig = `
      module.exports = [
        {
          context: ["/updateproxy/api"],
          target: "http://localhost:3000",
          changeOrigin: true,
          pathRewrite: { "^/updateproxy": "" },
        },
      ];
    `;
    await fs.promises.writeFile(tempProxyConfigPath, newConfig);
    console.log("新配置文件已写入");

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error("等待代理重新加载超时");
        resolve();
      }, 5000);
      proxyReloadEmitter.once("proxyReloaded", () => {
        clearTimeout(timeout);
        console.log("代理重新加载完成");
        resolve();
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("开始测试更新后的代理...");

    const [newProxyResponse, oldProxyResponse] = await Promise.all([
      makeRequest("http://localhost:3001/updateproxy/api").catch((err) => {
        console.error("新代理请求失败:", err);
        return err;
      }),
      makeRequest("http://localhost:3001/newproxy/api").catch((err) => {
        console.log("旧代理请求预期失败:", err.message);
        return err;
      }),
    ]);

    expect(newProxyResponse).toBe("代理成功");
    expect(oldProxyResponse).toBeInstanceOf(Error);
    console.log("代理更新测试完成");
  }, 20000);
});

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

// 添加全局的测试超时设置
vi.setConfig({ testTimeout: 60000 });
