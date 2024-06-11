const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  //定义 Vue CLI 的配置选项。
  transpileDependencies: true, //是否对依赖包进行编译
  devServer: {
    port: 8089, //指定研发的端口号
  },
  configureWebpack: {
    externals: {
      //指定哪些模块是外部依赖，并且不会被打包到最终的构建文件中
      AMap: "AMap", //配置AMap，以便能正常引入和使用
    },
  },
  //注意：本地部署打包前需要注释掉publicPath参数
  // publicPath: "/ol-vue-practice/", //配置为github仓库名,否则部署到GitHub Pages上后会获取不到页面内容。
});
