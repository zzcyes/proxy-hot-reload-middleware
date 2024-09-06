import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.js",
  output: [
    {
      file: "lib/index.cjs.js",
      format: "cjs",
    },
    {
      file: "lib/index.esm.js",
      format: "es",
    },
    {
      file: "lib/index.min.js",
      format: "umd",
      name: "proxyHotReloadMiddleware",
      plugins: [terser()],
    },
  ],
  external: ["http-proxy-middleware", "fs", "path"],
  plugins: [resolve(), commonjs()],
};
