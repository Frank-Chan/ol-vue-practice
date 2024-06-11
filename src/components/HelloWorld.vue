<template>
  <div class="map_wrapper" id="olMap">
    <!-- 底图切换 -->
    <div
      class="map-switcher-box"
      @mouseleave="$refs.mapSwitcherRef.maskType = false"
    >
      <map-switcher ref="mapSwitcherRef"></map-switcher>
    </div>
  </div>
</template>

<script>
import "ol/ol.css";
import { Map, View } from "ol";
// 图层
import { Tile } from "ol/layer";
// openLayers自带的数据源
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import { TileDebug } from "ol/source";
import GeoUtil from "@/js/geoUtil";
import { gcj02Mercator, transformToGCJ02Mecator } from "@/js/gcj02";
import MapSwitcher from "./MapSwitcher.vue";

export default {
  name: "olMap",
  components: {
    MapSwitcher,
  },
  data() {
    return {
      // 缩放层级
      zoom: 13,
      //   定位中心点
      center: {
        lon: 114.07,
        lat: 22.53,
      },
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      let tileOSM = new Tile({
        // ol自带的数据源
        source: new OSM(),
        // 如果要引入其他地图的数据源，通过XYZ引入
        // source: new XYZ({
        //   url: "http://t3.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=你的密钥，",
        // }),
      });

      let view = new View({
        zoom: this.zoom,
        /* center: [this.center.lon, this.center.lat],        
        projection: "EPSG:4326",//WGS84地理坐标系 */
        //GCJ02墨卡托投影坐标系
        center: transformToGCJ02Mecator([this.center.lon, this.center.lat]),
        projection: gcj02Mercator,
      });
      // 建议将map实例放在全局变量中，如果放在data中，数据量太大会造成ol卡死
      let map = new Map({
        layers: [tileOSM],
        view,
        target: "olMap",
      });
      window.map = map;

      //添加虚拟网格瓦片图层
      const debugLayer = new TileLayer({
        source: new TileDebug(),
        zIndex: 1000,
      });
      map.addLayer(debugLayer);

      map.baseMapLayer = tileOSM;
      GeoUtil.setBaseMap("GDVecTile"); //设置底图为高德矢量切片底图
    },
  },
};
</script>

<style lang="scss" scoped>
.map_wrapper {
  height: 100%;
}
// 去除右下角水印
::v-deep .ol-attribution {
  display: none;
}
// 去除左上角控制栏
::v-deep .ol-control {
  display: none;
}

.map-switcher-box {
  z-index: 1000;
  position: fixed;
  right: 0;
  bottom: 0;
  width: 120px;
  height: 90px;
}
</style>
