<template>
  <div class="map_wrapper" id="olMap"></div>
</template>

<script>
import "ol/ol.css";
import { Map, View } from "ol";
// 图层
import { Tile } from "ol/layer";
// openLayers自带的数据源
import OSM from "ol/source/OSM";
export default {
  name: "olMap",
  data() {
    return {
      // 缩放层级
      zoom: 16,
      //   定位中心点
      center: {
        lon: 113.27,
        lat: 23.13,
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
        center: [this.center.lon, this.center.lat],
        //坐标系
        projection: "EPSG:4326",
      });
      // 建议将map实例放在全局变量中，如果放在data中，数据量太大会造成ol卡死
      window.map = new Map({
        layers: [tileOSM],
        view,
        target: "olMap",
      });
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

</style>
