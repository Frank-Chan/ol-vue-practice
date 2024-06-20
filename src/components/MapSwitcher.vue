<template>
  <!-- 底图切换组件 -->
  <div class="map-switcher-body">
    <!-- 触发图层弹窗按钮 -->
    <div
      class="map-switcher-button-box"
      :class="{ 'bg-active': maskType }"
      @click="maskType = !maskType"
    >
      <div>
        <img class="select-img" :src="selectObj.url" alt="" />
      </div>
      <div class="button-title ell-1">{{ selectObj.title }}</div>
    </div>
    <!-- 选择地图切换按钮 -->
    <div class="map-switcher" v-show="maskType">
      <div class="map-switcher-title">选择底图样式</div>
      <div class="title-change-box">
        <el-switch
          v-model="switchValue"
          active-text="显示底图文字"
          :disabled="switchDisabled"
          active-color="#347FFF"
          @change="changeBaseMap(selectObj, switchValue)"
        ></el-switch>
      </div>
      <div class="map-switcher-item-box">
        <div
          class="map-switcher-item"
          :class="{ active: selectedBaseMapID === item.id }"
          v-for="(item, key) in baseMaps"
          :key="key"
          @click="changeBaseMap(item, switchValue)"
        >
          <div><img class="map-img" :src="item.url" alt="" /></div>
          <div class="title ell-1">{{ item.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GeoUtil from "@/js/geoUtil";
export default {
  name: "MapSwitcher",
  data() {
    return {
      switchValue: true, //是否展示底图文字
      switchDisabled: false, //地图文字切换开关是否可用
      selectedBaseMapID: "GDVecTile", //被选中的底图
      baseMaps: [
        {
          url: require("@/assets/baseMapIcon/OSM.png"),
          title: "OSM",
          id: "OSM",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile.png"),
          title: "高德-高清",
          id: "GDVecTile",
        },
        {
          url: require("@/assets/baseMapIcon/GDVector.png"),
          title: "高德",
          id: "GDVector",
        },
        {
          url: require("@/assets/baseMapIcon/BDVector.png"),
          title: "百度",
          id: "BDVector",
        },
        {
          url: require("@/assets/baseMapIcon/TXVector.png"),
          title: "腾讯",
          id: "TXVector",
        },
        {
          url: require("@/assets/baseMapIcon/TDTVector.png"),
          title: "天地图",
          id: "TDTVector",
        },
        {
          url: require("@/assets/baseMapIcon/GDImage.png"),
          title: "高德卫星",
          id: "GDImage",
        },
        {
          url: require("@/assets/baseMapIcon/BDImage.png"),
          title: "百度卫星",
          id: "BDImage",
        },
        {
          url: require("@/assets/baseMapIcon/TXImage.png"),
          title: "腾讯卫星",
          id: "TXImage",
        },
        {
          url: require("@/assets/baseMapIcon/TDTImage.png"),
          title: "天地图卫星",
          id: "TDTImage",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-light.png"),
          title: "月光银",
          id: "GDVecTile-light",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-whitesmoke.png"),
          title: "远山黛",
          id: "GDVecTile-whitesmoke",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-fresh.png"),
          title: "草色青",
          id: "GDVecTile-fresh",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-macaron.png"),
          title: "马卡龙",
          id: "GDVecTile-macaron",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-graffiti.png"),
          title: "涂鸦",
          id: "GDVecTile-graffiti",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-wine.png"),
          title: "酱籽",
          id: "GDVecTile-wine",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-dark.png"),
          title: "幻影黑",
          id: "GDVecTile-dark",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-grey.png"),
          title: "雅士灰",
          id: "GDVecTile-grey",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-blue.png"),
          title: "靛青蓝",
          id: "GDVecTile-blue",
        },
        {
          url: require("@/assets/baseMapIcon/GDVecTile-darkblue.png"),
          title: "极夜蓝",
          id: "GDVecTile-darkblue",
        },
        {
          url: require("@/assets/baseMapIcon/TXLightGreen.png"),
          title: "浅绿",
          id: "TXLightGreen",
        },
        {
          url: require("@/assets/baseMapIcon/TXDEM.png"),
          title: "地形图",
          id: "TXDEM",
        },
        {
          url: require("@/assets/baseMapIcon/TXSchoolHopital.png"),
          title: "教育医疗",
          id: "TXSchoolHopital",
        },

        {
          url: require("@/assets/baseMapIcon/TXDark.png"),
          title: "暗黑",
          id: "TXDark",
        },
      ],
      selectObj: {
        url: require("@/assets/baseMapIcon/GDVecTile.png"),
        title: "高德-高清",
        id: "GDVecTile",
      }, //当前选中地图对象
      maskType: false,
    };
  },
  methods: {
    /**
     * 切换底图
     * @param {String} baseMapItem 底图信息
     * @param {boolean} [withLabel=true] 是否显示文字注记
     */
    changeBaseMap(baseMapItem, withLabel = true) {
      console.log("当前选择的底图：", baseMapItem.id, withLabel);
      this.selectObj = baseMapItem;
      if (
        baseMapItem.id.includes("TX") &&
        baseMapItem.id !== "TXImage" &&
        baseMapItem.id !== "TXDEM"
      ) {
        this.$nextTick(() => {
          this.switchValue = true;
          this.switchDisabled = true;
        });
        //如果已经渲染了对应的地图，则返回
        if (
          window.map.baseMapLayer &&
          window.map.baseMapLayer.get("id") == baseMapItem.id
        ) {
          return;
        }
      } else {
        this.switchValue = withLabel;
        this.switchDisabled = false;
      }
      this.selectedBaseMapID = baseMapItem.id; //高亮被选中的底图边框
      GeoUtil.setBaseMap(baseMapItem.id, withLabel);
    },
  },
  mounted() {},
};
</script>

<style lang="scss" scoped>
.map-switcher {
  position: absolute;
  right: 82px;
  bottom: 6px;
  width: 585px;
  background: #ffffff;
  border-radius: 4px;
  padding: 0 16px 10px;
  box-sizing: border-box;
  box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.1);
  .map-switcher-title {
    height: 64px;
    line-height: 64px;
    font-family: PingFangSC, PingFang SC;
    font-weight: 600;
    font-size: 18px;
    color: #303133;
    border-bottom: 1px solid rgba(238, 238, 238, 1);
  }
  .title-change-box {
    padding: 16px 0;
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 14px;
    color: #666666;
    line-height: 20px;
  }
  .map-switcher-item-box {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    .map-switcher-item {
      width: 83px;
      height: 89px;
      border-radius: 4px;
      border: 1px solid #eeeeee;
      overflow: hidden;
      margin-bottom: 8px;
      cursor: pointer;
      .map-img {
        width: 83px;
        height: 60px;
        vertical-align: middle;
      }
      .title {
        height: 29px;
        font-family: PingFangSC, PingFang SC;
        font-weight: 400;
        font-size: 12px;
        color: #303133;
        line-height: 29px;
        padding: 0 6px;
        box-sizing: border-box;
      }
    }
    .active {
      border: 2px solid #347fff !important;
      .title {
        color: #347fff;
      }
    }
    &:after {
      content: "";
      width: 15.5%;
    }
  }
}
.map-switcher-button-box {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 4px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.2);
  border: 2px solid #347fff;
  box-sizing: border-box;
  width: 68px;
  height: 52px;

  cursor: pointer;
  .select-img {
    width: 100%;
    height: 24px;
    border-radius: 2px;
  }
  .button-title {
    height: 14px;
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 12px;
    color: #2d2f33;
    line-height: 14px;
    text-align: center;
  }
}
.bg-active {
  background: #347fff;
  .button-title {
    color: #fff !important;
  }
}
</style>
<style>
.el-switch span {
  color: #666666; /* 默认文字颜色 */
}
</style>
