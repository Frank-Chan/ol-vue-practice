const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8089, //指定研发的端口号
  },
  //注意：本地部署打包前需要注释掉publicPath参数
  // publicPath: "/ol-vue-practice/", //配置为github仓库名,否则部署到GitHub Pages上后会获取不到页面内容。
});
