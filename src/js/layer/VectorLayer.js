/**
 * @module SWMap/layer/VectorLayer
 */
import ol_VectorLayer from 'ol/layer/Vector.js';
import { Vector as VectorSource } from 'ol/source';
import { Point, LineString, Polygon } from 'ol/geom';
import { circular } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { updateFeatureStyle } from '../editTool';
import { transformToGCJ02Mecator } from '../gcj02';

/**
 * @classdesc
 * 矢量图层类，用于逐个添加点、线、面和圆矢量要素
 * @param {VectorSource|VectorTile} [options.source] 矢量数据资源
 * @param {number} [options.zIndex=0] 图层渲染时的叠加顺序，默认为0,
 
 * @api
 * @example
 * const vectorLayer = new VectorLayer();
 * map.addLayer(vectorLayer)
 */
class VectorLayer extends ol_VectorLayer {
    constructor(options = {}) {
        super(options);
        options.source = options.source !== undefined ? options.source : new VectorSource();
        this.setSource(options.source);
        this.source = options.source;
    }

    /**
     * 添加点图标（可包含图片和文本注记）
     * @param {Array<number>} coordinate 二维坐标数组(兼容平面和球面坐标)    
     * @param {Object} [pointStyle] 包含以下参数的点样式对象
     * @param {String} [pointStyle.text] 注记文本内容
     * @param {String} [pointStyle.font='10px sans-serif'] 注记字体，参见CSS字体值: `https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font`
     * @param {String} [pointStyle.fill='#333'] 注记颜色，默认取值为'#333'
     * @param {String} [pointStyle.textAlign='center'] 文本框和文本对齐方式，取值包括'left'、'right'、'center'、'end' 或'start'。
     * @param {String} [pointStyle.justify='left'] 文本框内的文本对齐方式，如果未设置，文本将向textAlign锚点对齐，取值包括left'、'right'、'center'。
     * @param {String} [pointStyle.textBaseline='middle'] 文本基线，取值包括'bottom'、'top'、'middle'、'alphabetic'、'hanging'或'ideographic'。
     * @param {number} [pointStyle.offsetX = 0] 文本在水平方向上的偏移，向左为负，向右为正；
     * @param {number} [pointStyle.offsetY = 0] 文本在垂直方向上的偏移，向上为负，向下为正；
     * @param {number} [pointStyle.padding = [0,0,0,0]] 文本与背景色之间的填充空间，数组的取值模式为[top, right, bottom, left]；
     * @param {String} [pointStyle.backgroundFill] 背景色
     * @param {String} [pointStyle.strokeColor] 文字的描边颜色，默认为null
     * @param {number} [pointStyle.strokeWidth] 文字的描边宽度
     * @param {String} [pointStyle.circleRadius] 圆点符号半径
     * @param {String} [pointStyle.circleStrokeColor='rgba(0, 0, 0, 0.7)'] 圆点符号的描边颜色，默认为null
     * @param {number} [pointStyle.circleStrokeWidth=2] 圆点符号的描边宽度
     * @param {String} [pointStyle.image] 图片地址
     * @param {Array<number>} [pointStyle.size] 图片尺寸（单位为像素），如[20*32]
     * @param {Array<number>} [pointStyle.anchor=[0.5,0.5]] 图片位置锚点，默认值是图标中心
     * @param {String} [pointStyle.rotation] 旋转角，顺时针方向，单位为弧度
     * @param {String} [pointStyle.scale] 图片缩放比例
     * @param {String} [pointStyle.point] 确定图片位置的点，适用于诸如线添加箭头样式的操作
     *
     * @returns {Feature} 返回生成的点图标要素
     * @example
        const coordinate = [114.123,23.125],
        const pointStyle = {
            image:'http://maponline0.bdimg.com/sty/map_icons2x/MapRes/jing_zidian_mingsheng.png',// 设置图标的URL
            scale: 0.5, // 设置图标的缩放比例   
            text:'深圳',         
            font: '12px Arial',
            fill: '#ffffff',
            offsetY: -5,
            textAlign: 'center'
        };
        const marker = vectorLayer.addPoint(coordinate,pointStyle);         
     */
    addPoint(coordinate, pointStyle) {
        const pos = transformToGCJ02Mecator(coordinate);
        const point = new Point(pos);
        const feature = new Feature(point);
        if (pointStyle) {
            updateFeatureStyle(feature, { pointStyle });
        }
        this.source.addFeature(feature);
        return feature;
    }

    /**
     * 添加线要素
     * @param {Array<Array<number>>} coordinates 坐标数组集合(兼容平面和球面坐标)
     * @param {Object} [lineStyle] 包含以下参数的线样式对象
     * @param {String} [lineStyle.color] 线的颜色，默认为null
     * @param {number} [lineStyle.width = 2] 线的宽度，默认为2个像素
     * @param {Array<number>} [lineStyle.lineDash] 虚线模式，默认为实线，如[5, 5]表示5个像素为实、5个像素为虚
     *
     * @returns {Feature} 返回生成的线要素
     * @example
       vectorLayer.addLine([[113.43,22.39],[114.243,22.66],[114.35,22.38]],{
            lineStyle:{
                color:'rgba(69,133,255,1)',
                width:2,
                lineDash:[10,5]
            }
        }) 
     */
    addLine(coordinates, lineStyle) {
        let poss = [];
        if (coordinates[0][0] < 180 && coordinates[0][1] < 90) {
            coordinates.map((coordinate) => {
                poss.push(transformToGCJ02Mecator(coordinate));
            });
        } else {
            poss = coordinates;
        }
        const lineString = new LineString(poss);
        const feature = new Feature(lineString);
        if (lineStyle) {
            updateFeatureStyle(feature, { lineStyle });
        }
        this.source.addFeature(feature);
        return feature;
    }

    /**
     * 添加面要素
     * @param {Array<Array<Array<number>>>} coordinates 经纬度坐标数组集合
     * @param {Object} [areaStyle] 包含以下参数的面样式对象
     * @param {String} [areaStyle.fillColor] 面的填充色和不透明度,可以是16进制或rgba颜色值，如'rgba(255, 255, 255, 0.2)'表示填充色为白色，不透明度为0.2
     * @param {number} [areaStyle.opacity] 面的填充色的不透明度，取值范围为[0,1]，若设置该值会覆盖fillColor的不透明度参数
     * @param {String} [areaStyle.strokeColor] 面的边框线颜色，默认为null
     * @param {number} [areaStyle.strokeWidth = 2] 面的边框线宽度，默认为2个像素
     * @param {String} [areaStyle.text] 注记文本内容，下述参数为文本样式：
     * @param {String} [areaStyle.font='10px sans-serif'] 注记字体，参见CSS字体值: `https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font`
     * @param {String} [areaStyle.textFillColor='#333'] 注记颜色，默认取值为'#333'
     * @param {String} [areaStyle.textAlign='center'] 文本对齐方式，取值包括left'、'right'、'center'、'end' 或'start'。
     * @param {String} [areaStyle.textBaseline='middle'] 文本基线，取值包括'bottom'、'top'、'middle'、'alphabetic'、'hanging'或'ideographic'。
     * @param {number} [areaStyle.offsetX = 0] 文本在水平方向上的偏移，向左为负，向右为正；
     * @param {number} [areaStyle.offsetY = 0] 文本在垂直方向上的偏移，向上为负，向下为正；
     * @param {number} [areaStyle.padding = [0,0,0,0]] 文本与背景色之间的填充空间，数组的取值模式为[top, right, bottom, left]；
     * @param {String} [areaStyle.backgroundFill] 背景色
     * @param {String} [areaStyle.textStrokeColor] 文字的描边颜色，默认为null
     * @param {number} [areaStyle.textStrokeWidth] 文字的描边宽度
     * @param {String} [areaStyle.rotation] 旋转角，顺时针方向，单位为弧度
     * @param {String} [areaStyle.scale] 缩放比例
     * @returns {Feature} 返回生成的面要素
     * @example
        vectorLayer.addPolygon(
            [[[113.43,22.39],[114.243,22.66],[114.35,22.38],[113.43,22.39]]],
            {
                strokeColor:'rgba(69,133,255,1)',
                strokeWidth:5,
                fillColor:'rgba(255, 255, 255, 0.2)'
            }
        )
     */
    addPolygon(coordinates, areaStyle) {
        let poss = [];
        if (coordinates[0][0][0] < 180 && coordinates[0][0][1] < 90) {
            coordinates.map((polygonCoordinates) => {
                polygonCoordinates.map((coordinate) => {
                    poss.push(transformToGCJ02Mecator(coordinate));
                });
            });
            poss = [poss];
        } else {
            poss = coordinates;
        }
        const polygon = new Polygon(poss);
        const feature = new Feature(polygon);
        if (areaStyle) {
            updateFeatureStyle(feature, { areaStyle });
        }
        this.source.addFeature(feature);
        return feature;
    }

    /**
     * 添加圆要素
     * @param {Array} center 经纬度坐标数组
     * @param {number} radius 半径，单位为米
     * @param {Object} [style] 包含以下参数的圆样式对象
     * @param {String} [style.fillColor] 面的填充色和不透明度,可以是16进制或rgba颜色值，如'rgba(255, 255, 255, 0.2)'表示填充色为白色，不透明度为0.2
     * @param {number} [style.opacity] 面的填充色的不透明度，取值范围为[0,1]，若设置该值会覆盖fillColor的不透明度参数
     * @param {String} [style.strokeColor] 面的边框线颜色，默认为null
     * @param {number} [style.strokeWidth = 2] 面的边框线宽度，默认为2个像素
     * @returns {Feature} 返回生成的圆要素
     * @example
       let center= [114.123,22.356];
       let radius = 3000;
       const style = {
            fillColor: Util.hexToRGBA('#4585FF', 0.5), //填充色和透明度,rgb对应#4585FF
            strokeColor: '#4585FF', //边框颜色
            strokeWidth: 2
       }
       vectorLayer.addCircle(center,radius,style);
     */
    addCircle(center, radius, style) {
        const pos = transformToGCJ02Mecator(center, false);
        const circleGCJGeo = circular(pos, radius, 128);
        const circleGCJMercator = circleGCJGeo.clone().transform('GCJ-02-Geo', 'GCJ-02-Mecator');
        const feature = new Feature(circleGCJMercator);
        if (style) {
            updateFeatureStyle(feature, { areaStyle: style });
        }
        this.source.addFeature(feature);
        return feature;
    }
}

export default VectorLayer;
