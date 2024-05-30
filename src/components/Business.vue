<template>
  <el-config-provider :size="size" :z-index="zIndex">
    <div class="business">
      <input v-model="content" />
      <div>
        <el-button type="danger">{{ content }}</el-button>
        <el-button type="success">Success</el-button>
      </div>
    </div>
  </el-config-provider>
</template>

<script>
import { ElConfigProvider } from "element-plus";
import { ElButton } from "element-plus";
export default {
  name: "businessComponent", //业务组件
  components: {
    ElConfigProvider,
    ElButton,
  },
  data() {
    return {
      size: "small", //'large'
      zIndex: 2000,
      content: "Vue学习，加油！",
    };
  },
  mounted() {},
  methods: {},
};
</script>

<style lang="scss" scoped>
.business {
  height: 100%;
}
</style>
