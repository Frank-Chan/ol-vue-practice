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
// openLayers自带的数据源
import TileLayer from "ol/layer/Tile";
import { TileDebug } from "ol/source";
import { transform } from "ol/proj";

import GeoUtil from "@/js/geoUtil";
import { gcj02Geo, gcj02Mercator, transformToGCJ02Mecator } from "@/js/gcj02";
import MapSwitcher from "./MapSwitcher.vue";
import VectorLayer from "@/js/layer/VectorLayer";

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
      map: null,
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
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
        view,
        target: "olMap",
      });
      window.map = map;
      this.map = map;

      //添加虚拟网格瓦片图层
      const debugLayer = new TileLayer({
        source: new TileDebug(),
        zIndex: 1000,
      });
      map.addLayer(debugLayer);

      GeoUtil.setBaseMap("GDVecTile"); //设置底图为高德矢量切片底图
      // GeoUtil.setBaseMap("OSM"); //设置底图为OSM

      this.addMarkPoint();
    },
    /**
     * 添加标记点
     */
    addMarkPoint() {
      //添加2个高德坐标系的点(内绿外红的圆点)
      const vectorLayer = new VectorLayer();
      this.map.addLayer(vectorLayer);
      const pointStyle = {
        circleRadius: 10,
        fill: "#00F",
        circleStrokeColor: "#F00",
        circleStrokeWidth: 8,
      };
      vectorLayer.addPoint([114.062022, 22.54287], pointStyle); // 广东省深圳市福田区莲花街道深圳市人民政府深圳博物馆，东南角
      vectorLayer.addPoint([114.057249, 22.54419], pointStyle); //广东省深圳市福田区莲花街道福中路286号深圳市民中心，在市政府西北角
      //const wgs84Point = [114.05491187349624, 22.546044790720085];//市民中心，深圳市统计局天地图影像图锚点
      //#region wgs84坐标转gcj02Geo坐标后展示
      const wgs84Point = [103.85072079999999, 1.2898543999999998]; //新加坡高等法院wgs84坐标点
      const gcj02GeoPoint = transform(wgs84Point, "EPSG:4326", gcj02Geo); //WGS84转高德地理坐标系
      console.log("转换结果：", gcj02GeoPoint);
      vectorLayer.addPoint(gcj02GeoPoint, pointStyle); 
      //#endregion
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
