/**
 * @module SWMap/layer/HeatmapLayer
 */
import ol_HeatmapLayer from 'ol/layer/Heatmap';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import Feature from 'ol/Feature';
/* import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { transformToGCJ02Mecator } from '../gcj02'; */

/**
 * @classdesc
 * 热力图图层类
 * @param {GeoJSON | String  | Array<Feature> | VectorSource} options.data 数据资源，可以是GeoJSON对象、GeoJSON数据资源地址、要素数据集或者VectorSource资源。
 * @param {string | function} [options.weight] 用于权重的要素属性或从要素中返回的权重的函数，权重值的范围应该在0到1之间。
 * @param {number} [options.radius=8] 热力点的半径，默认为8个像素；
 * @param {number} [options.blur=15] 热力边缘的模糊度，默认为15个像素；
 * @param {Array.<string>} [options.gradient=['#00f', '#0ff', '#0f0', '#ff0', '#f00']] 热力图的颜色梯度，指定为一个CSS颜色字符串数组；
 * @param {number} [options.zIndex=0] 图层渲染时的叠加顺序，默认为0；
 * @param {number} [options.opacity=1] 图层的不透明度，默认为0，取值范围为[0,1]；
 * @param {Boolean} [options.visible=true] 图层是否可见；
 * @param {Extent} [options.extent] 图层的渲染范围，超出范围的内容不渲染；
 * @param {number} [options.minResolution] 图层可见的最小分辨率(包括最小分辨率)。
 * @param {number} [options.maxResolution] 图层可见的最大分辨率(不包含)，低于此分辨率，此图层将可见。
 * @param {number} [options.minZoom] 最小视图缩放级别(不包含)，在此级别之上，此层将可见。
 * @param {number} [options.maxZoom] 显示该图层的最大视图缩放级别(包括缩放级别)。
 * 
 * @api
 * @example
    const heatMapLayer = new HeatmapLayer({
        data:geojson,
        weight:function(feature){
            return feature.get('count');//将count属性作为权重值
        },//设置权重
        zIndex: 11,
        blur: 15,//模糊度
        radius: 10,
        gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00']
    });
    map.addLayer(heatMapLayer);
 */
class HeatmapLayer extends ol_HeatmapLayer {
    constructor(options = {}) {
        super(options);
        this.initLayer(options);
    }

    initLayer(options) {
        let vectorSource;
        if (options.data instanceof String && options.data.toLowerCase().slice(-4) == 'json') {
            //传入的是GeoJSON资源
            vectorSource = new VectorSource({
                url: options.data, //'https://openlayers.org/data/vector/ecoregions.json',
                format: new GeoJSON(),
                loader: function () {
                    let url = this.getUrl();
                    if (url) {
                        fetch(url)
                            .then(function (response) {
                                if (response.ok) {
                                    return response.json();
                                } else {
                                    throw new Error('请求失败');
                                }
                            })
                            .then(function (data) {
                                //地理坐标转投影坐标
                                const features = vectorSource.getFormat().readFeatures(data, {
                                    dataProjection: 'GCJ-02-Geo',
                                    featureProjection: 'GCJ-02-Mecator'
                                });
                                vectorSource.addFeatures(features);
                            });
                    }
                }
            });
        } else if (options.data?.type == 'FeatureCollection') {
            //若传入的是GeoJSON对象
            vectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(options.data, {
                    dataProjection: 'GCJ-02-Geo',
                    featureProjection: 'GCJ-02-Mecator'
                })
            });
        } else if (options.data instanceof Array && options.data[0] instanceof Feature) {
            //若传入的是要素集合
            vectorSource = new VectorSource({
                features: options.data
            });
        } else if (options.data instanceof VectorSource) {
            vectorSource = options.vectorSource;
        }
        vectorSource && this.setSource(vectorSource);
    }
}

export default HeatmapLayer;
