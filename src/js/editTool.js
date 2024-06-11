import { Modify, Select } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { platformModifierKey } from 'ol/events/condition.js';
import GeoUtil from './geoUtil';
import { transformToGCJ02Mecator } from './gcj02';
import * as turf from 'turf/turf';

/**
 * 编辑工具类
 */
class EditTool {
    /**
     * 构造函数
     * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
     * @example
     * const editTool = new EditTool(window.map);
     */
    constructor(map = window.map) {
        this.map = map;
        this.editStatus = false; //编辑状态
        this.selectInteraction = null;
        this.modifyInteraction = null;
    }

    /**
     * 选择并编辑要素
     * @param {Object} options 编辑参数
     * @param {Array<Layer>} [options.layers] 对指定的图层进行编辑
     * @param {Feature} [options.feature] 对指定的要素数据进行编辑
     * @param {Style} [options.style] 被编辑要素的样式
     * @param {Boolean} [options.needSelect=false] 是否通过选择工具传入被编辑的要素，若为true则表示通过鼠标选中要素后进行编辑，否则通过传入指定要素进行编辑
     * @param {Boolean} [options.multi=false] 是否支持多选
     * @param {Boolean} [options.multiWithShift=true] 默认通过【shift+点击】要素实现多选，设置为false后通过【Ctrl+点击】实现多选
	 * @param {Function} [okHandler] 编辑完成时的回调，返回编辑完成时的要素对象
	 * @param {Function} [modifyingHandler] 编辑开始后的回调，返回编辑开始后的要素对象
     * @example
     * //example1 使用默认配置
        editTool.modify();

       //example2 传入指定要素和样式        
        editTool.modify({feature,style},(feature)=>{
            console.log(feature.getGeometry().getCoordinates());
        }); 
     */
    modify(options, okHandler, modifyingHandler) {
        let featureCollection;
        if (options?.feature) {
            if (options.feature instanceof Feature) {
                featureCollection = new Collection([options.feature]);
            } else {
                console.warn('EditTool.modify()传入的features参数不是Feature集合!');
            }
        }

        this.selectInteraction = new Select({
            style: options?.style,
            multi: options.multi, //是否支持多选
            features: options.needSelect ? undefined : featureCollection, //将传入的要素加入被选中的数据集中
            layers: options?.layers,
            filter: options?.filter, //过滤要素和图层的函数，可以被选中的返回true,否则返回false
            toggleCondition: options.multiWithShift ? undefined : platformModifierKey
        });
        this.map.addInteraction(this.selectInteraction);

        // let features2Modify = featureCollection ? featureCollection : this.selectInteraction.getFeatures();
        let features2Modify = options.needSelect ? this.selectInteraction.getFeatures() : featureCollection;

        this.modifyInteraction = new Modify({
            features: features2Modify //将传入的要素加入被编辑的数据集中
        }); //会自动开启捕捉

        //编辑开始后回调
        this.modifyInteraction.on('modifystart', evt => {
            var features = evt.features.getArray();
            var modifiedFeature = features[0];
            modifyingHandler && modifyingHandler(modifiedFeature);
        });
        //编辑完成回调
        this.modifyInteraction.on('modifyend', evt => {
            var features = evt.features.getArray();
            var modifiedFeature = features[0];
            okHandler && okHandler(modifiedFeature);
        });

        this.map.addInteraction(this.modifyInteraction);
        this._setEvents();
        this.setActive(true);
    }

    /**
     * 选择并高亮要素
     * @param {Object} options 选择参数
     * @param {Style} [options.style] 被选中要素的样式
     * @param {Array<Layer>} [options.layers] 对指定的图层进行选中
     * @param {Array<Feature>} [options.features] 对指定的要素进行高亮
     * @example
     *
     */
    selectFeature(options) {
        let featureCollection;
        if (options?.features) {
            if (options.features[0] instanceof Feature) {
                featureCollection = new Collection(options.features);
            } else {
                console.warn('EditTool.selectFeature()传入的features参数不是Feature集合!');
            }
        }

        this.selectInteraction = new Select({
            style: options?.style,
            multi: false, //是否支持多选,
            features: featureCollection, //将传入的要素加入被选中的数据集中
            layers: options?.layers,
            filter: options?.filter //过滤要素和图层的函数，可以被选中的返回true,否则返回false
        });
        this.map.addInteraction(this.selectInteraction);
        this._setEvents();
        this.setActive(true);
    }

    /**
     * 取消所有已被选中的要素的选中状态
     */
    unSelectFeature() {
        const selectedFeatures = this.selectInteraction?.getFeatures();
        selectedFeatures?.clear();
    }
    /**
     * 移除所有已被选中的要素
     * @private
     */
    _setEvents() {
        const self = this;
        this.selectInteraction.on('change:active', function () {
            if (!self.editStatus) {
                self.unSelectFeature();
            }
        });
    }

    /**
     * 获取当前选中正在编辑的要素
     * @returns {Array<Feature>}
     */
    getEditingFeatures() {
        const features = this.selectInteraction?.getFeatures();
        if (features) {
            return features.getArray();
        } else {
            return [];
        }
    }

    /**
     * 结束或激活编辑
     * @param {Boolean} [active=true] 默认为激活
     * @example
     * editTool.setActive(false)
     */
    setActive(active = true) {
        this.selectInteraction?.setActive(active);
        this.modifyInteraction?.setActive(active);
        this.editStatus = active;

        if (!active) {
            // 结束编辑时清除选中要素
            this.selectInteraction?.getFeatures().clear();
        }
    }

    /**
     * 用线分割面
     * @param {Polygon} polygon 被分割的面要素
     * @param {LineString} splitLine 分割线
     * @returns {GeoJSON<FeatureCollection>} 返回分割后的多边形集合
     */
    splitPolygonByLine(polygon, splitLine) {
        let splitLineCoords = [],
            polygonCoordinates = [];
        let splitLineCoordsFlat = splitLine.getGeometry().getCoordinates();
        //线的平面坐标转球面坐标
        if (splitLineCoordsFlat[0][0] > 180 && splitLineCoordsFlat[0][1] > 90) {
            splitLineCoordsFlat.map(coordinate => {
                splitLineCoords.push(transformToGCJ02Mecator(coordinate, false));
            });
        } else {
            splitLineCoords = splitLineCoordsFlat;
        }
        let splitLineGeom = turf.lineString(splitLineCoords);
        let polygonCoordinatesFlat = polygon.getGeometry().getCoordinates();
        //面的平面坐标转球面坐标
        if (polygonCoordinatesFlat[0][0][0] > 180 && polygonCoordinatesFlat[0][0][1] > 90) {
            polygonCoordinatesFlat.map(polygonRing => {
                polygonRing.map(coordinate => {
                    polygonCoordinates.push(transformToGCJ02Mecator(coordinate, false));
                });
            });
            polygonCoordinates.push(polygonCoordinates[0]);
            polygonCoordinates = [polygonCoordinates];
        } else {
            polygonCoordinates = polygonCoordinatesFlat;
        }
        let splitedGeojsonFeatureCollection;

        for (let i = 0; i < polygonCoordinates.length; i++) {
            let polygonGeom = turf.polygon(polygonCoordinates);
            let geojsonFeatureCollection = this._splitPolygonByLine(polygonGeom, splitLineGeom);

            if (!splitedGeojsonFeatureCollection) {
                splitedGeojsonFeatureCollection = geojsonFeatureCollection;
            } else {
                splitedGeojsonFeatureCollection = turf.featureCollection(splitedGeojsonFeatureCollection.features.concat(geojsonFeatureCollection.features));
            }
        }
        return splitedGeojsonFeatureCollection;
    }

    /**
     * 用线分割多边形
     * @private
     * @param {GeoJSON<Polygon>} polygonGeom 被分割的多边形
     * @param {GeoJSON<Linestring>} splitLineGeom 分割线
     * @param {number} [toleranceRadius=0.000001] 容差半径
     * @param {String} [toleranceUnit='kilometers'] 计算容差的单位，可以是'degrees'、'radians'、'miles'或者'kilometers'。
     * @returns {GeoJSON<FeatureCollection>} 返回被分割后的多边形集合
     */
    _splitPolygonByLine(polygonGeom, splitLineGeom, toleranceRadius = 0.000001, toleranceUnit = 'kilometers') {
        //分割线的类型检查,传入的必须为linestring
        if (splitLineGeom.geometry === void 0 || splitLineGeom.geometry.type.toLowerCase().indexOf('linestring') === -1) {
            return;
        }

        //1. 分割线的起点或终点必须在多边形之外
        if (splitLineGeom.geometry.type === 'LineString') {
            if (
                turf.booleanPointInPolygon(turf.point(splitLineGeom.geometry.coordinates[0]), polygonGeom) ||
                turf.booleanPointInPolygon(turf.point(splitLineGeom.geometry.coordinates[splitLineGeom.geometry.coordinates.length - 1]), polygonGeom)
            ) {
                return;
            }
        }

        // 2. 计算交点，并把线的点合并
        let intersectPoints = turf.lineIntersect(splitLineGeom, polygonGeom);
        const lineExp = turf.explode(splitLineGeom);
        for (let i = 0; i < lineExp.features.length - 1; i++) {
            intersectPoints.features.push(turf.point(lineExp.features[i].geometry.coordinates));
        }

        // 3. 计算线的缓冲区
        const lineBuffer = turf.buffer(splitLineGeom, toleranceRadius, {
            units: toleranceUnit
        });

        // 4. 执行分割。计算被裁切多边形和裁切线的缓冲面的difference，返回被裁切面位于缓冲面之外的"Polygon"或"MultiPolygon"，并将其拆开
        const diffPolygons = turf.difference(polygonGeom, lineBuffer);
        let pieces = [];
        if (diffPolygons.geometry.type === 'Polygon') {
            pieces.push(turf.polygon(diffPolygons.geometry.coordinates));
        } else {
            diffPolygons.geometry.coordinates.forEach(function (a) {
                pieces.push(turf.polygon(a));
            });
        }

        // 5. 处理分割面的顶点，用分割线上的点替换缓冲面的点
        for (let p = 0; p < pieces.length; p++) {
            const piece = pieces[p];
            for (let v in piece.geometry.coordinates[0]) {
                const vertex = piece.geometry.coordinates[0][v];
                const vertexPoint = turf.point(vertex);
                for (let i in intersectPoints.features) {
                    const intersectPoint = intersectPoints.features[i];
                    //判断两点距离,若分割线上的点与差异面的顶点的距离小于容差值，则用分割线的点替换差异面的对应顶点
                    if (turf.distance(intersectPoint, vertexPoint, toleranceUnit) <= toleranceRadius * 2) {
                        piece.geometry.coordinates[0][v] = intersectPoint.geometry.coordinates;
                    }
                }
            }
        }
        // 6. 将属性赋予每一个分割后的polygon，并处理id
        pieces.forEach((a, index) => {
            a.properties = Object.assign({}, polygonGeom.properties);
            a.properties.id += `-${index}`;
        });

        return turf.featureCollection(pieces);
    }

    /**
     * 销毁编辑工具
     */
    destroy() {
        this.map.removeInteraction(this.selectInteraction);
        this.map.removeInteraction(this.modifyInteraction);
        this.selectInteraction = null;
        this.modifyInteraction = null;
    }
}

/**
 * 更新指定要素的样式
 * @param {Feature} feature 要素对象
 * @param {Object} options 包含以下参数的Object对象
 *
 * @param {Object} [options.pointStyle] 包含以下参数的点样式对象
 * @param {String} [options.pointStyle.text] 注记文本内容
 * @param {String} [options.pointStyle.font='10px sans-serif'] 注记字体，参见CSS字体值: `https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font`
 * @param {String} [options.pointStyle.fill='#333'] 注记颜色，默认取值为'#333'
 * @param {String} [options.pointStyle.textAlign='center'] 文本对齐方式，取值包括left'、'right'、'center'、'end' 或'start'。
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
 * @returns {Style} 返回生成的样式
 * @example
 * updateFeatureStyle(feature,{
        pointStyle:{
            text:'数位大数据Test',
            font:'20px sans-serif', 
            fill:'#F00',
            textAlign:'center',
            backgroundFill:'#0F0',
            image: 'https://www.szshuwei.com/img/logo0.007f7eb1.png'
        },
        lineStyle:{
            color:'blue',
            width:8,
            lineDash:[5,10]
        },
        areaStyle:{
            fillColor:'red',
            strokeColor:'green',
            strokeWidth:5
        }
    })
 */
export function updateFeatureStyle(feature, options) {
    let geomType = feature.getGeometry().getType();
    const newStyle = GeoUtil.createNewStyle(geomType, options);
    newStyle && feature.setStyle(newStyle);
    return newStyle;
}

export default EditTool;
