import ol_WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON.js';
import GeoUtil from '../geoUtil';

/**
 * 点图层类,用于点状数据资源的批量渲染（WebGL或canvas）
 */
class PointsLayer {
    /**
     * 
     * @param {Object} options 包含以下参数的Object对象
     * @param {GeoJSON | String | Array<Feature> | VectorSource} options.data 数据资源，可以是GeoJSON对象、GeoJSON数据资源地址、要素数据集或者VectorSource资源。
     * @param {Object} [options.style] 包含以下参数的点样式对象
     * @param {String} [options.style.circleRadius=4] 圆点符号半径
     * @param {String} [options.style.fill='rgba(51,170,255,0.8)'] 圆点符号填充色
     * @param {String} [options.layerType='WebGL'] 点图层渲染的方式，默认为WebGL,否则为canvas方式
     * @example
        //example 1: 传入GeoJSON数据资源地址        
        const pointsLayer = new PointsLayer({data：'https://openlayers.org/data/vector/ecoregionsjson'});    

     * @example
        //example 2: 传入要素数据集
        const data = [
          new Feature({
            geometry: new Point(fromLonLat([0, 0])),
          }),
          new Feature({
            geometry: new Point(fromLonLat([10, 10])),
          }),
        ];
        const pointsLayer = new PointsLayer({data});    
     * @example
        //example 3: 传入VectorSource
        const vectorLayer = new VectorLayer({ visible: false });
        let fillColor;
        res.data.map(items => {
            items.dataList.map(itemss => {
                let coordinate = [itemss.x, itemss.y];
                vectorLayer.addPoint(coordinate);
            });
            fillColor = items.color;
        });
        const vectorSource = cloneDeep(vectorLayer.source);
        vectorLayer.source.clear();
        let pointsLayer = new PointsLayer({
            data: vectorSource,
            style: {
                circleRadius: 4,
                fill: fillColor //'red' //填充颜色
            }
        });  
        pointsLayer.set('id', `Point-999`);
        map.addLayer(pointsLayer);  
     */
    constructor(options) {
        const { layerType = 'WebGL' } = options;

        this._layerType = layerType;
        this._style = options.style;

        this.layer = null;
        this.initLayer(options);
        return this.layer;
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
            vectorSource = options.data;
        }

        if (this._layerType == 'WebGL') {
            this.layer = new ol_WebGLPointsLayer({
                source: vectorSource,
                style: this._style
                /* style: {
                    'circle-radius': this._style.circleRadius ? this._style.circleRadius : 4,
                    'circle-fill-color': this._style.fill ? this._style.fill : 'rgba(51,170,255,0.8)'
                } */
            });
        } else {
            this.layer = new VectorLayer({
                source: vectorSource,
                style: GeoUtil.createNewStyle('Point', { pointStyle: this._style }) //Todo:传递的样式未起作用，使用了默认的样式，需进一步分析具体原因
            });
        }
    }
}

export default PointsLayer;
