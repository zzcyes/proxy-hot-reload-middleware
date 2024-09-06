module.exports = [
  {
    context: ["/newproxy/api"],
    target: "http://localhost:3000",
    changeOrigin: true,
    pathRewrite: { "^/newproxy": "" },
  },
];
