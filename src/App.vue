<template>
  <div id="wrapper">
    <button
      v-for="tab in tabs"
      :key="tab.title"
      :class="['tab-button', { active: currentTab === tab.title }]"
      @click="currentTab = tab.title"
    >
      {{ tab.displayName }}
    </button>    
    <!-- 使用<keep-alive>元素将动态组件包裹起来可以保持组件的状态，避免切换标签页后重新渲染导致的性能问题 -->
    <keep-alive>
      <component :is="currentTabComponent" class="tab"></component>
    </keep-alive>
  </div>
</template>

<script>
import Business from "./components/Business.vue";
import HelloWorld from "./components/HelloWorld.vue";

export default {
  name: "App",
  components: {
    HelloWorld,
    Business,
  },
  data() {
    return {
      currentTab: "map",
      tabs: [
        { title: "map", displayName: "地图" },
        { title: "business", displayName: "业务" },
      ],
    };
  },
  computed: {
    currentTabComponent: function () {
      if (this.currentTab === "map") {
        return "HelloWorld";
      } else {
        return "Business";
      }
    },
  },
};
</script>

<style>
#wrapper {
  height: 100vh;
  overflow-y: hidden;
}
.tab-button {
  padding: 6px 10px;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border: solid 1px #ccc;
  cursor: pointer;
  background: #f0f0f0;
  margin-bottom: -1px;
  margin-right: -1px;
}
.tab-button:hover {
  background: #09e640;
}
.active {
  background: #1269ec;
}
.tab {
  border: solid 1px #ccc;
  /* padding: 10px; */
}
</style>
