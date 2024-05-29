<template>
  <div class="business">
    <input v-model="content">
  </div>
  
</template>

<script>
export default {
  name: "businessComponent",//业务组件
  data() {
    return {
        content:'Vue学习，加油！'
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
