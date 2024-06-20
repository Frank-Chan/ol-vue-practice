import { Icon, Text, Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Point } from 'ol/geom';
import { DoubleClickZoom } from 'ol/interaction';
import { containsCoordinate, containsExtent } from 'ol/extent';
import { XYZ as XYZSource } from 'ol/source';
import OSM from "ol/source/OSM";
import TileGrid from 'ol/tilegrid/TileGrid.js';
import TileLayer from 'ol/layer/Tile';
import Layer from 'ol/layer/Layer.js';
import AMap from 'AMap';
import * as olExtent from 'ol/extent';

import { gcj02Mercator, baidu09Mercator, transformToGCJ02Mecator } from './gcj02.js';
import Util from './util';
import { point as tPoint, featureCollection as tFeatureCollection } from '@turf/helpers';

/**
 * 基于OL的地理工具类
 * @constructor
 */
class GeoUtil {
    constructor() {}
}

/**
 * 设置底图
 * @param {String} baseMapID 底图id，可以是'GDVecTile'、'GDVector'、'GDImage'、'TXVector'、'TXImage'、'BDVector'、'BDImage'、'TDTVector'、'TDTImage'
 * @param {boolean} [withLabel=true] 是否显示文字注记
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
 * @returns
 */
GeoUtil.setBaseMap = function (baseMapID, withLabel = true, map = window.map) {
    //若选择的是当前展示的底图且注记没有变化需返回
    if (map.baseMapLabel) {
        //之前已经开启了文本注记，这次仍需开启，而且选择的是同一个底图
        if (withLabel && map.baseMapLayer && map.baseMapLayer.get('id') == baseMapID) {
            return;
        }
    } else {
        //之前没有开启文本注记，这次也不需要开启，而且选择的是同一个底图
        if (!withLabel && map.baseMapLayer && map.baseMapLayer.get('id') == baseMapID) {
            return;
        }
    }
    let source, labelSource, amapLayer;
    switch (baseMapID) {
        case 'GDVecTile': {
            //标准
            amapLayer = addGDVTMap('amap://styles/normal', withLabel);
            break;
        }
        case 'GDVecTile-dark': {
            //幻影黑
            amapLayer = addGDVTMap('amap://styles/dark', withLabel);
            break;
        }
        case 'GDVecTile-light': {
            //月光银
            amapLayer = addGDVTMap('amap://styles/light', withLabel);
            break;
        }
        case 'GDVecTile-whitesmoke': {
            //远山黛
            amapLayer = addGDVTMap('amap://styles/whitesmoke', withLabel);
            break;
        }
        case 'GDVecTile-fresh': {
            //草色青
            amapLayer = addGDVTMap('amap://styles/fresh', withLabel);
            break;
        }
        case 'GDVecTile-grey': {
            //雅士灰
            amapLayer = addGDVTMap('amap://styles/grey', withLabel);
            break;
        }
        case 'GDVecTile-graffiti': {
            //涂鸦
            amapLayer = addGDVTMap('amap://styles/graffiti', withLabel);
            break;
        }
        case 'GDVecTile-macaron': {
            //马卡龙
            amapLayer = addGDVTMap('amap://styles/macaron', withLabel);
            break;
        }
        case 'GDVecTile-blue': {
            //靛青蓝
            amapLayer = addGDVTMap('amap://styles/blue', withLabel);
            break;
        }
        case 'GDVecTile-darkblue': {
            //极夜蓝
            amapLayer = addGDVTMap('amap://styles/darkblue', withLabel);
            break;
        }
        case 'GDVecTile-wine': {
            //酱籽
            amapLayer = addGDVTMap('amap://styles/wine', withLabel);
            break;
        }
        case 'GDVector': {
            const url = withLabel
                ? '//webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&x={x}&y={y}&z={z}'
                : '//webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=2&style=8&x={x}&y={y}&z={z}';
            source = new XYZSource({
                projection: gcj02Mercator,
                url
            });
            break;
        }
        case 'GDImage': {
            source = new XYZSource({
                projection: gcj02Mercator,
                url: '//webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
            });
            if (withLabel) {
                labelSource = new XYZSource({
                    projection: gcj02Mercator,
                    url: '//webst0{1-4}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
                });
            }
            break;
        }
        case 'TXVector':
            source = new XYZSource({
                projection: gcj02Mercator,
                url: '//rt{0-3}.map.gtimg.com/tile?z={z}&x={x}&y={-y}&styleid=1&scene=0&version=347' //含注记的电子底图
            });
            break;
        case 'TXDark': //暗黑风格底图（夜间模式）
            source = new XYZSource({
                projection: gcj02Mercator,
                url: '//rt{0-3}.map.gtimg.com/tile?z={z}&x={x}&y={-y}&styleid=4&scene=0&version=347' //含注记的电子底图
            });
            break;
        case 'TXLightGreen': //浅绿色背景
            source = new XYZSource({
                projection: gcj02Mercator,
                url: '//rt{0-3}.map.gtimg.com/tile?z={z}&x={x}&y={-y}&styleid=8&scene=0&version=347' //含注记的电子底图
            });
            break;
        case 'TXSchoolHopital': //突出教育和医疗设施
            source = new XYZSource({
                projection: gcj02Mercator,
                url: '//rt{0-3}.map.gtimg.com/tile?z={z}&x={x}&y={-y}&styleid=9&scene=0&version=347' //含注记的电子底图
            });
            break;
        case 'TXImage': {
            const projectionExtent = gcj02Mercator.getExtent(); //范围
            const maxResolution = olExtent.getWidth(projectionExtent) / 256;
            const qmercResolutions = []; //分辨率数组
            for (let i = 0; i < 19; ++i) {
                qmercResolutions[i] = maxResolution / Math.pow(2, i);
            }
            source = new XYZSource({
                projection: gcj02Mercator,
                tileUrlFunction: function (coordinate) {
                    const z = coordinate[0];
                    const x = coordinate[1];
                    const y = -coordinate[2] - 1; //y轴取反，-1目的是为了从0开始计数
                    return `//p2.map.gtimg.com/sateTiles/${z}/${Math.floor(x / 16)}/${Math.floor(y / 16)}/${x}_${y}.jpg`;
                },
                tileGrid: new TileGrid({
                    origin: olExtent.getBottomLeft(projectionExtent), //TMS瓦片原点在左下角
                    resolutions: qmercResolutions,
                    extent: projectionExtent,
                    tileSize: [256, 256]
                })
            });
            if (withLabel) {
                labelSource = new XYZSource({
                    projection: gcj02Mercator,
                    url: '//rt{0-3}.map.gtimg.com/tile?z={z}&x={x}&y={-y}&styleid=2&scene=0&version=347' //影像注记
                });
            }
            break;
        }
        case 'TXDEM': {
            const projectionExtent = gcj02Mercator.getExtent(); //范围
            const maxResolution = olExtent.getWidth(projectionExtent) / 256;
            const qmercResolutions = []; //分辨率数组
            for (let i = 0; i < 19; ++i) {
                qmercResolutions[i] = maxResolution / Math.pow(2, i);
            }
            source = new XYZSource({
                projection: gcj02Mercator,
                tileUrlFunction: function (coordinate) {
                    const z = coordinate[0];
                    const x = coordinate[1];
                    const y = -coordinate[2] - 1; //y轴取反，-1目的是为了从0开始计数
                    return `//p2.map.gtimg.com/demTiles/${z}/${Math.floor(x / 16)}/${Math.floor(y / 16)}/${x}_${y}.jpg`;
                },
                tileGrid: new TileGrid({
                    origin: olExtent.getBottomLeft(projectionExtent), //TMS瓦片原点在左下角
                    resolutions: qmercResolutions,
                    extent: projectionExtent,
                    tileSize: [256, 256]
                })
            });
            if (withLabel) {
                labelSource = new XYZSource({
                    projection: gcj02Mercator,
                    url: '//rt{0-3}.map.gtimg.com/tile?z={z}&x={x}&y={-y}&styleid=3&version=376' //地形注记
                });
            }
            break;
        }        
        case 'BDVector': {
            const bmercResolutions = [];
            for (let i = 0; i < 19; i++) {
                bmercResolutions[i] = Math.pow(2, 18 - i);
            }
            source = new XYZSource({
                projection: baidu09Mercator,
                tileUrlFunction(tileCoord) {
                    if (!tileCoord) return '';
                    let z = tileCoord[0];
                    let x = tileCoord[1];
                    let y = -tileCoord[2] - 1;
                    if (x < 0) {
                        x = 'M' + -x;
                    }
                    if (y < 0) {
                        y = 'M' + -y;
                    }
                    /* let p = 0;
                    withLabel && (p = 1);
                    return `http://online3.map.bdimg.com/onlinelabel/?qt=tile&x=${x}&y=${y}&z=${z}&styles=pl&scaler=1&p=${p}`; */
                    if (withLabel) {
                        return `//maponline0.bdimg.com/tile/?qt=vtile&x=${x}&y=${y}&z=${z}&styles=pl&scaler=1&customid=normal`;
                    } else {
                        return `https://ss0.bdstatic.com/8bo_dTSlRsgBo1vgoIiO_jowehsv/tile/?qt=tile&x=${x}&y=${y}&z=${z}&styles=pl&scaler=1&p=0`;
                    }
                },
                tileGrid: new TileGrid({
                    origin: [0, 0],
                    resolutions: bmercResolutions,
                    extent: baidu09Mercator.getExtent(),
                    tileSize: [256, 256]
                })
            });
            break;
        }
        case 'BDImage': {
            const bmercResolutions = [];
            for (let i = 0; i < 19; i++) {
                bmercResolutions[i] = Math.pow(2, 18 - i);
            }
            const tileGrid = new TileGrid({
                resolutions: bmercResolutions,
                origin: [0, 0],
                extent: baidu09Mercator.getExtent(),
                tileSize: [256, 256]
            });
            source = new XYZSource({
                projection: baidu09Mercator, //设置为地图本身的坐标系
                tileUrlFunction(tileCoord) {
                    if (!tileCoord) {
                        return '';
                    }
                    let x = tileCoord[1];
                    let y = -tileCoord[2] - 1;
                    let z = tileCoord[0];

                    // 百度使用M来代表负号，所以需要调整
                    if (x < 0) {
                        x = 'M' + -x;
                    }
                    if (y < 0) {
                        y = 'M' + -y;
                    }
                    // return `http://shangetu0.map.bdimg.com/it/u=x=${x};y=${y};z=${z};v=009;type=sate&fm=46`;
                    return `//maponline1.bdimg.com/starpic/?qt=satepc&u=x=${x};y=${y};z=${z};v=009;type=sate&fm=46`;
                },
                tileGrid
            });
            if (withLabel) {
                labelSource = new XYZSource({
                    projection: baidu09Mercator, //设置为地图本身的坐标系
                    tileUrlFunction(tileCoord) {
                        if (!tileCoord) {
                            return '';
                        }
                        let x = tileCoord[1];
                        let y = -tileCoord[2] - 1;
                        let z = tileCoord[0];

                        // 百度使用M来代表负号，所以需要调整
                        if (x < 0) {
                            x = 'M' + -x;
                        }
                        if (y < 0) {
                            y = 'M' + -y;
                        }
                        // return `http://online3.map.bdimg.com/tile/?qt=tile&x=${x}&y=${y}&z=${z}&styles=sl&v=020`;
                        return `//maponline1.bdimg.com/tile/?qt=vtile&x=${x}&y=${y}&z=${z}&styles=sl&showtext=1&v=083&scaler=1`;
                    },
                    tileGrid
                });
            }
            break;
        }
        case 'TDTVector':
            source = new XYZSource({
                projection: 'EPSG:3857', //设置为地图本身的坐标系
                url: '//t{0-7}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=3d983e72097bf0ed01b065e680cd8f88' //矢量底图
            });
            if (withLabel) {
                labelSource = new XYZSource({
                    projection: 'EPSG:3857', //设置为地图本身的坐标系
                    url: '//t{0-7}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=3d983e72097bf0ed01b065e680cd8f88' //影像底图
                });
            }
            break;
        case 'TDTImage':
            source = new XYZSource({
                projection: 'EPSG:3857', //设置为地图本身的坐标系
                url: '//t{0-7}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=3d983e72097bf0ed01b065e680cd8f88' //影像底图
            });
            if (withLabel) {
                labelSource = new XYZSource({
                    projection: 'EPSG:3857', //设置为地图本身的坐标系
                    url: '//t{0-7}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=3d983e72097bf0ed01b065e680cd8f88' //影像底图
                });
            }
            break;
        case 'OSM':
            source = new OSM()
            break;
        default:
            console.warn(`暂不支持类型为${baseMapID}的底图！`);
            return;
    }
    map.baseMapLayer && map.removeLayer(map.baseMapLayer);
    map.baseMapLayer = undefined;
    map.baseMapLabel && map.removeLayer(map.baseMapLabel);
    map.baseMapLabel = undefined;
    if (!baseMapID.includes('GDVecTile')) {
        map.baseMapLayer = new TileLayer({
            source,
            zIndex: 0,
            properties: { id: baseMapID }
        });
        map.getView().setMaxZoom(18); //恢复最大层级
    } else {
        amapLayer.set('id', baseMapID);
        map.baseMapLayer = amapLayer;
    }
    map.getLayers().insertAt(0, map.baseMapLayer);
    if (withLabel) {
        if (labelSource) {
            map.baseMapLabel = new TileLayer({
                source: labelSource,
                zIndex: 1,
                properties: { id: baseMapID + '-Label' }
            });
            map.getLayers().insertAt(1, map.baseMapLabel);
        } else {
            //处理注记和底图融合在一起的情况
            map.baseMapLabel = {};
        }
    }
};

/**
 * 添加高德矢量切片地图图层
 * @param {boolean} withLabel 是否显示注记
 * @param {Object} amapLayer 图层
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
 */
function addGDVTMap(mapStyle, withLabel, map = window.map) {
    map.getView().setMaxZoom(22);
    if (!window.amapBaseMap) {
        //重复实例化会销毁ol的地图容器
        window.amapBaseMap = new AMap.Map('olMap', {
            zooms: [0, 22],
            mapStyle //mapStyle: 'amap://styles/whitesmoke' //灰白风格
        });
        setTimeout(() => {
            //将高德地图的canvas容器置于底部
            window.amapBaseMap.getContainer().getElementsByClassName('amap-layer')[0].style = 'position: absolute;top: 0;left: 0;';
            //去除高德自带的图边要素
            window.amapBaseMap.getContainer().getElementsByClassName('amap-maps')[0].remove(); //避免影响交互
            window.amapBaseMap.getContainer().getElementsByClassName('amap-controls')[0]?.remove(); //移除高德的控件
            window.amapBaseMap.getContainer().getElementsByClassName('amap-logo')[0]?.remove(); //移除高德的logo
            window.amapBaseMap.getContainer().getElementsByClassName('amap-copyright')[0]?.remove(); //移除高德的版本号
        }, 0);
    }
    window.amapBaseMap.setMapStyle(mapStyle); //设置地图的显示样式
    //处理注记信息
    if (withLabel) {
        window.amapBaseMap.showLabel = true;
    } else {
        window.amapBaseMap.showLabel = false;
    }
    window.amapBaseMap.render();

    const amapLayer = new Layer({
        render: function (frameState) {
            if (!window.amapBaseMap) {
                return null;
            }
            const canvas = window.amapBaseMap.canvas;
            const viewState = frameState.viewState;
            const visible = amapLayer.getVisible();
            canvas.style.display = visible ? 'block' : 'none';
            const opacity = amapLayer.getOpacity();
            canvas.style.opacity = opacity;
            window.amapBaseMap.setZoomAndCenter(viewState.zoom, transformToGCJ02Mecator(viewState.center, false), true);
            return canvas;
        }
    });
    return amapLayer;
}

/**
 * 根据图层ID获取指定图层
 * @param {String} layerID 图层id值
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
 * @returns 返回获取到的图层
 */
GeoUtil.getLayerById = function (layerID, map = window.map) {
    const layers = map.getLayers().getArray();
    let idLayer;
    // 根据标识获取指定的图层
    layers.map((layer) => {
        if (layer.get('id') === layerID) {
            idLayer = layer;
        }
    });
    return idLayer;
};

/**
 * 根据图层ID移除指定图层
 * @param {String} layerID 图层id值
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
 * @returns 返回被移除的图层
 */
GeoUtil.removeLayerById = function (layerID, map = window.map) {
    const layers = map.getLayers().getArray();
    let idLayer;
    // 根据标识获取指定的图层
    layers.map((layer) => {
        if (layer.get('id') === layerID) {
            idLayer = layer;
            map.removeLayer(layer);
        }
    });
    return idLayer;
};

/**
 * 缩放视图至指定中心点和地图层级
 * @param {Object} options 包含以下参数的对象
 * @param {Array<number>} [options.center] 缩放结束后的视图中心点坐标；
 * @param {number} [options.zoom] 缩放结束后的地图层级；
 * @param {number} [options.duration=1000] 缩放动画持续的时间，单位为毫秒；
 * @param {Function} [callback] 缩放结束后的回调函数;
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
 * @example
 * GeoUtil.zoomToView({
 *   center: [113.567,22.456],
 *   zoom: 18
 * })
 */
GeoUtil.zoomToView = function (options, callback, map = window.map) {
    const { center, zoom, duration, ...opts } = options;
    const _center = transformToGCJ02Mecator(center);
    if (callback) {
        map.getView().animate(
            {
                center: _center,
                zoom,
                duration,
                ...opts
            },
            callback
        );
    } else {
        map.getView().animate({
            center: _center,
            zoom,
            duration,
            ...opts
        });
    }
};

/**
 * 获取当前地图视图中心点经纬度坐标
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map;
 * @returns {Array.<number>} 返回地图视图中心点的经纬度坐标数组
 * @example
   const centerPoint = GeoUtil.getViewCenter();
   console.log('当前地图视图中心点为：', centerPoint);
 */
GeoUtil.getViewCenter = function (map = window.map) {
    let center = map.getView().getCenter();
    center = transformToGCJ02Mecator(center, false);
    return center;
};

/**
 * 获取可视区域范围
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map;
 * @returns {Array} 返回当前地图视图的4个角点坐标集合
 */
GeoUtil.getViewExtent = function (map = window.map) {
    let view = map.getView().calculateExtent(map.getSize());
    return [
        transformToGCJ02Mecator([view[0], view[1]], false),
        transformToGCJ02Mecator([view[2], view[1]], false),
        transformToGCJ02Mecator([view[2], view[3]], false),
        transformToGCJ02Mecator([view[0], view[3]], false)
    ];
};

/**
 * 获取垂直方向上距离地图视图顶部中心点指定比率的地图坐标
 * @param {number} rate 距离顶部位置的百分比
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map;
 * @example
 * GeoUtil.getVerticalRateCenter(0.3); //获取距离地图视图顶部30%位置的坐标点
 */
GeoUtil.getVerticalRateCenter = function (rate, map = window.map) {
    const mapSize = map.getSize();
    const screenX = mapSize[0] * 0.5;
    const screenY = mapSize[1] * rate;
    let rateCenter = map.getCoordinateFromPixel([screenX, screenY]);
    rateCenter = transformToGCJ02Mecator(rateCenter, false);
    return rateCenter;
};

/**
 * 将地图在垂直方向上上移或下移
 * @param {number} rate 地图上移或下移的百分比，上移为正，下移为负
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map;
 * @example
 * GeoUtil.moveMapOnVertical(0.3); //将地图上移30%
 */
GeoUtil.moveMapOnVertical = function (rate, map = window.map) {
    const mapSize = map.getSize();
    const offsetY = mapSize[1] * rate;
    const center = map.getView().getCenter();
    const resolution = map.getView().getResolution();
    const newCenter = [center[0], center[1] - offsetY * resolution];
    map.getView().setCenter(newCenter);
};

/**
 * 将地图在水平方向左移或右移
 * @param {number} rate 地图左移或右移的百分比，右移为正，左移为负
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map;
 * @example
 * GeoUtil.moveMapOnHorizontal(0.3); //将地图右移30%
 */
GeoUtil.moveMapOnHorizontal = function (rate, map = window.map) {
    const mapSize = map.getSize();
    const offsetX = mapSize[0] * rate;
    const center = map.getView().getCenter();
    const resolution = map.getView().getResolution();
    const newCenter = [center[0] - offsetX * resolution, center[1]];
    map.getView().setCenter(newCenter);
};

/**
 * 取消默认的双击后导致地图缩放的事件
 * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map;
 */
GeoUtil.cancleDoubleClickZoom = function (map = window.map) {
    map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
            interaction.setActive(false);
        }
    });
};

/**
 * 创建指定几何类型的要素样式
 * @param {*} geomType
 * @param {Object} options  包含以下参数的Object对象
 *
 * @param {Object} [options.pointStyle] 包含以下参数的点样式对象
 * @param {String} [options.pointStyle.text] 注记文本内容
 * @param {String} [options.pointStyle.font='10px sans-serif'] 注记字体，参见CSS字体值: `https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font`
 * @param {String} [options.pointStyle.fill='#333'] 注记颜色，默认取值为'#333'
 * @param {String} [options.pointStyle.textAlign='center'] 文本框和文本对齐方式，取值包括'left'、'right'、'center'、'end' 或'start'。
 * @param {String} [options.pointStyle.justify='left'] 文本框内的文本对齐方式，如果未设置，文本将向textAlign锚点对齐，取值包括left'、'right'、'center'。
 * @param {String} [options.pointStyle.textBaseline='middle'] 文本基线，取值包括'bottom'、'top'、'middle'、'alphabetic'、'hanging'或'ideographic'。
 * @param {number} [options.pointStyle.offsetX = 0] 文本在水平方向上的偏移，向左为负，向右为正；
 * @param {number} [options.pointStyle.offsetY = 0] 文本在垂直方向上的偏移，向上为负，向下为正；
 * @param {number} [options.pointStyle.padding = [0,0,0,0]] 文本与背景色之间的填充空间，数组的取值模式为[top, right, bottom, left]；
 * @param {String} [options.pointStyle.backgroundFill] 背景色
 * @param {String} [options.pointStyle.strokeColor] 文字的描边颜色，默认为null
 * @param {number} [options.pointStyle.strokeWidth] 文字的描边宽度
 * @param {String} [options.pointStyle.circleRadius] 圆点符号半径
 * @param {String} [options.pointStyle.circleStrokeColor='rgba(0, 0, 0, 0.7)'] 圆点符号的描边颜色，默认为null
 * @param {number} [options.pointStyle.circleStrokeWidth=2] 圆点符号的描边宽度
 * @param {String} [options.pointStyle.image] 图片地址
 * @param {Array<number>} [options.pointStyle.size] 图片尺寸（单位为像素），如[20*32]
 * @param {Array<number>} [options.pointStyle.anchor=[0.5,0.5]] 图片位置锚点，默认值是图标中心
 * @param {String} [options.pointStyle.rotation] 旋转角，顺时针方向，单位为弧度
 * @param {String} [options.pointStyle.scale] 图片缩放比例
 * @param {String} [options.pointStyle.point] 确定图片位置的点，适用于诸如线添加箭头样式的操作
 *
 * @param {Object} [options.lineStyle] 包含以下参数的线样式对象
 * @param {String} [options.lineStyle.color] 线的颜色，默认为null
 * @param {number} [options.lineStyle.width = 2] 线的宽度，默认为2个像素
 * @param {Array<number>} [options.lineStyle.lineDash] 虚线模式，默认为实线，如[5, 5]表示5个像素为实、5个像素为虚
 *
 * @param {Object} [options.areaStyle] 包含以下参数的面样式对象
 * @param {String} [options.areaStyle.fillColor] 面的填充色和不透明度,可以是16进制或rgba颜色值，如'rgba(255, 255, 255, 0.2)'表示填充色为白色，不透明度为0.2
 * @param {number} [options.areaStyle.opacity] 面的填充色的不透明度，取值范围为[0,1]，若设置该值会覆盖fillColor的不透明度参数
 * @param {String} [options.areaStyle.strokeColor] 面的边框线颜色，默认为null
 * @param {number} [options.areaStyle.strokeWidth = 2] 面的边框线宽度，默认为2个像素
 * @param {String} [options.areaStyle.text] 注记文本内容，下述参数为文本样式：
 * @param {String} [options.areaStyle.font='10px sans-serif'] 注记字体，参见CSS字体值: `https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font`
 * @param {String} [options.areaStyle.textFillColor='#333'] 注记颜色，默认取值为'#333'
 * @param {String} [options.areaStyle.textAlign='center'] 文本对齐方式，取值包括left'、'right'、'center'、'end' 或'start'。
 * @param {String} [options.areaStyle.textBaseline='middle'] 文本基线，取值包括'bottom'、'top'、'middle'、'alphabetic'、'hanging'或'ideographic'。
 * @param {number} [options.areaStyle.offsetX = 0] 文本在水平方向上的偏移，向左为负，向右为正；
 * @param {number} [options.areaStyle.offsetY = 0] 文本在垂直方向上的偏移，向上为负，向下为正；
 * @param {number} [options.areaStyle.padding = [0,0,0,0]] 文本与背景色之间的填充空间，数组的取值模式为[top, right, bottom, left]；
 * @param {String} [options.areaStyle.backgroundFill] 背景色
 * @param {String} [options.areaStyle.textStrokeColor] 文字的描边颜色，默认为null
 * @param {number} [options.areaStyle.textStrokeWidth] 文字的描边宽度
 * @param {String} [options.areaStyle.rotation] 旋转角，顺时针方向，单位为弧度
 * @param {String} [options.areaStyle.scale] 缩放比例
 *
 *
 * @returns {Style} 返回生成的样式
 * @example
    //生成箭头样式
    let pointStyle = {
        image: require('@/assets/workbench/draw_rightArrow.png'),
        fill: items.geo.markColor,
        rotation: -Util.computeRotation(start, end),
        point: end, //确定箭头图标的位置
    };
    const arrowStyle = GeoUtil.createNewStyle('Point',{pointStyle});
 */
GeoUtil.createNewStyle = function (geomType, options) {
    let newStyle;
    switch (geomType) {
        case 'Point':
        case 'MultiPoint':
            //点的样式
            if (options.pointStyle) {
                const {
                    font = '10px sans-serif',
                    fill = '#333',
                    textAlign = 'center',
                    justify = 'left',
                    textBaseline = 'middle',
                    anchor = [0.5, 0.5],
                    rotateWithView = true,
                    rotation = 0,
                    scale = 1,
                    offsetX = 0,
                    offsetY = 0
                } = options.pointStyle;
                let image = undefined;
                if (options.pointStyle.image) {
                    image = new Icon({
                        src: options.pointStyle.image,
                        color: options.pointStyle.fill && fill,
                        anchor,
                        rotateWithView,
                        rotation,
                        scale,
                        size: options.pointStyle.size
                    });
                } else if (options.pointStyle.circleRadius) {
                    image = new CircleStyle({
                        radius: options.pointStyle.circleRadius,
                        fill: new Fill({
                            color: fill
                        }),
                        stroke: new Stroke({
                            color: options.pointStyle.circleStrokeColor ? options.pointStyle.circleStrokeColor : 'rgba(0, 0, 0, 0.7)',
                            width: options.pointStyle.circleStrokeWidth ? options.pointStyle.circleStrokeWidth : 2
                        })
                    });
                }
                newStyle = new Style({
                    geometry: options.pointStyle.point && new Point(options.pointStyle.point),
                    image,
                    text:
                        options.pointStyle.text &&
                        new Text({
                            text: options.pointStyle.text,
                            font,
                            textAlign,
                            justify,
                            textBaseline,
                            offsetX,
                            offsetY,
                            fill: new Fill({
                                color: fill
                            }),
                            backgroundFill:
                                options.pointStyle.backgroundFill &&
                                new Fill({
                                    color: options.pointStyle.backgroundFill
                                }),
                            backgroundStroke:
                                options.pointStyle.backgroundStroke &&
                                new Stroke({
                                    color: options.pointStyle.backgroundStroke,
                                    width: 2
                                }),
                            rotateWithView,
                            rotation,
                            // scale,
                            // 描边样式
                            stroke:
                                options.pointStyle.strokeColor &&
                                new Stroke({
                                    color: options.pointStyle.strokeColor,
                                    width: options.pointStyle.strokeWidth
                                }),
                            padding: options.pointStyle.padding
                        })
                });
            }
            break;
        case 'LineString':
        case 'MultiLineString':
            //线的样式
            if (options.lineStyle) {
                if(options.lineStyle.lineDash){//按比例控制虚线的间隔
                    let ratio = 5/2;
                    let growth_ratio = options.lineStyle.width/2-1;//控制空白部分的增长速率
                    options.lineStyle.lineDash=[options.lineStyle.lineDash[0]*ratio,options.lineStyle.lineDash[1]*(ratio+growth_ratio)];
                }
                options.lineStyle.lineCap='square';
                newStyle = new Style({
                    stroke: new Stroke({ ...options.lineStyle })
                });
            }
            break;
        case 'Circle':
        case 'Box':
        case 'Polygon':
        case 'MtutiPolygon': {
            //面的样式
            let fillColor = options.areaStyle.fillColor;
            let alpha;
            const colorPattern = Util.testColorPattern(fillColor);
            if (colorPattern === 'hex') {
                //16进制颜色字符串
                alpha = !options.areaStyle.opacity ? 1 : options.areaStyle.opacity;
                fillColor = Util.hexToRGBA(fillColor, alpha);
            } else if (colorPattern === 'rgba') {
                if (options.areaStyle.opacity) {
                    alpha = options.areaStyle.opacity;
                }
                fillColor = Util.modifyAlpha(fillColor, alpha);
            }
            if (options.areaStyle) {
                const {
                    font = '10px sans-serif',
                    textFillColor = '#333',
                    textAlign = 'center',
                    textBaseline = 'middle',
                    rotateWithView = true,
                    rotation = 0,
                    scale = 1,
                    offsetX = 0,
                    offsetY = 0,
                    zIndex
                } = options.areaStyle;
                newStyle = new Style({
                    fill: new Fill({
                        color: fillColor //设置填充颜色和透明度
                    }),
                    stroke: new Stroke({
                        color: options.areaStyle.strokeColor, //设置边框颜色
                        width: options.areaStyle.strokeWidth //设置边框宽度
                    }),
                    text:
                        options.areaStyle.text &&
                        new Text({
                            text: options.areaStyle.text,
                            font,
                            textAlign,
                            textBaseline,
                            offsetX,
                            offsetY,
                            fill: new Fill({
                                color: textFillColor
                            }),
                            backgroundFill:
                                options.areaStyle.backgroundFill &&
                                new Fill({
                                    color: options.areaStyle.backgroundFill
                                }),
                            rotateWithView,
                            rotation,
                            scale,
                            // 文本描边样式
                            stroke:
                                options.areaStyle.textStrokeColor &&
                                new Stroke({
                                    color: options.areaStyle.textStrokeColor,
                                    width: options.areaStyle.textStrokeWidth
                                }),
                            padding: options.areaStyle.padding
                        }),
                    zIndex                    
                });
            }
            break;
        }
        default:
            console.warn(`不支持${geomType}的几何类型！`);
            break;
    }
    return newStyle;
};

/**
 * 利用坐标点的json对象创建GeoJSON
 * @param {Array} data 包含经纬度和属性值的坐标点数据集合
 * @returns {GeoJSON} 返回GeoJSON数据对象
 * @example
 * // 假设你有一个坐标点集合的数组，每个点包含经度、纬度和属性信息
  const coordinates = [
    { lng: 113.25, lat: 22.56, name: 'Point 1' },
    { lng: 113.36, lat: 22.66, name: 'Point 2' },
    { lng: 114.05, lat: 22.54, name: 'Point 3' },
    // ...
  ];
  const geojson = GeoUtil.createGeoJSON(coordinates);
  console.log(geojson);
 */
GeoUtil.createGeoJSON = function (data) {
    if (!(data instanceof Array)) {
        console.warn('GeoUtil.createGeoJSON:请确保传入的参数为数组！');
        return;
    }
    // 创建一个点集，并为每个点添加属性信息
    const points = data.map((coord) => {
        const { lng, lat, ...properties } = coord;
        return tPoint([lng, lat], properties);
    });

    // 创建一个GeoJSON对象
    const featureCollection = tFeatureCollection(points);
    return featureCollection;
};

/**
 * 改变字符串中的bbox值的经纬度顺序
 * @param {String} str 包含bbox值的字符串（BBOX字符串格式为 经度1,纬度1,经度2,纬度2）
 * @returns {String} 新的字符串（BBOX字符串格式为 纬度1,经度1,纬度2,经度2）
 */
GeoUtil.extractBboxAndChangeLatLonOrder = function (str) {
    const bboxStr = str.match(/BBOX=([^&]+)/)[1]; // 使用正则表达式提取 BBOX 子字符串
    const bboxArr = bboxStr.split('%2C'); //将 BBOX 子字符串分割成数组，逗号的转义字符为%2C
    // 遍历数组，交换每个经纬度对的顺序
    for (let i = 0; i < bboxArr.length; i += 2) {
        const temp = bboxArr[i];
        bboxArr[i] = bboxArr[i + 1];
        bboxArr[i + 1] = temp;
    }
    const newBboxStr = 'BBOX=' + bboxArr.join(','); // 将数组重新组合成字符串
    const newStr = str.replace(/BBOX=([^&]+)/, newBboxStr); // 将 BBOX 子字符串替换为新的字符串
    return newStr;
};

/**
 * 判断点是否在矩形范围内（包含在边界上的情况）
 * @param {Extent} extent 矩形范围坐标数组，包含左下角和右上角的坐标点数值
 * @param {Point} coordinate 待判断的坐标点
 * @returns {boolean} 在矩形范围内返回true,否则返回false
 * @example
 * const extent = [113.935705, 22.512108,113.969179, 22.579012];
 * const center = [113.935705, 22.512108];
 * console.log(GeoUtil.containsCoordinate(extent,center));
 */
GeoUtil.containsCoordinate = function (extent, coordinate) {
    return containsCoordinate(extent, coordinate);
};

/**
 * 判断一个矩形是否在另一个矩形范围内
 * @param {Extent} extent1 矩形范围坐标数组，包含左下角和右上角的坐标点数值
 * @param {Extent} extent1 矩形范围坐标数组，包含左下角和右上角的坐标点数值
 * @returns {boolean} 矩形2如果在矩形1范围内则返回true，否则返回false
 * @example
 * const extent1 = [113.935705, 22.512108,113.969179, 22.579012];
 * const extent2 = [113.93572, 22.512108,113.969179, 22.579012];
 * console.log(GeoUtil.containsExtent(extent1,extent2));
 */
GeoUtil.containsExtent = function (extent1, extent2) {
    return containsExtent(extent1, extent2);
};
export default GeoUtil;
