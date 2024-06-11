import { Draw } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Fill, Stroke, Text, Circle as CircleStyle, RegularShape } from 'ol/style';
import { getDistance as ol_getDistance, getLength as ol_getLength, getArea as ol_getArea } from 'ol/sphere';
import { Point, LineString, Polygon, MultiPolygon } from 'ol/geom';
import Overlay from 'ol/Overlay';
import Geometry from 'ol/geom/Geometry';
import { getCenter } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import { transform } from 'ol/proj';

/**
 * 测量工具类，实现绘制并测量线的长度和面的面积
 */
class MeasureTool {
    /**
     * 构造函数
     * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
     * @example
       let measureTool = new MeasureTool(map);
     */
    constructor(map = window.map) {
        this.map = map;
        this.overlays = []; //测量提示信息集合
        this._listenerMapOnContextmenu; //监听鼠标右键功能
    }

    /**
     * 开始测量
     * @param {String} measureType 测量类型，目前支持'LineString'和'Polygon',分别是距离和面积测量
     * @returns {Draw} 返回测量的实例化对象 
     * @example
       this.measureHandler = measureTool.startMeasure("LineString");
     */
    startMeasure(measureType) {
        if (!this.source) {
            this.source = new VectorSource();
            this.vectorLayer = new VectorLayer({
                //绘制要素图层
                source: this.source,
                //要素绘制完成后默认的样式
                /* style: {
                    'fill-color': 'rgba(255, 255, 255, 0.2)',
                    'stroke-color': '#347fff',
                    'stroke-width': 2,
                    'circle-radius': 7,
                    'circle-fill-color': '#ffcc33'
                } */
                style: (feature) => {
                    return this._styleFunction(this, feature, this.showSegments);
                }
            });
            this.vectorLayer.set('id', 'id-sw-measure');
            this.map.addLayer(this.vectorLayer); //将用于绘制或编辑要素的图层添加到地图中
        }
        this.measureType = 'LineString'; //测量类型，默认为绘制线测量距离
        this.showSegments = true; //是否显示每一段的长度
        this._measureTooltipOverlay = null; //显示测量结果的Overlay
        this._measureTooltipElement = null; //承载测量数据的元素
        this._delImg = null; //删除测量结果图标元素

        /**
         * 测量绘制的鼠标点、线或面的样式
         */
        this.style = new Style({
            fill: new Fill({
                //绘制面的填充色
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new Stroke({
                //绘制线或面的边框线形和颜色
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2
            }),
            image: new CircleStyle({
                //绘制时鼠标位置点的样式
                radius: 5,
                stroke: new Stroke({
                    color: 'rgba(0, 0, 0, 0.7)'
                }),
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                })
            })
        });
        /**
         * 测量结果的标注样式
         */
        this.labelStyle = new Style({
            text: new Text({
                font: '14px Calibri,sans-serif',
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 1)'
                }),
                backgroundFill: new Fill({
                    color: 'rgba(0, 0, 0, 0.7)'
                }),
                padding: [3, 3, 3, 3],
                textBaseline: 'bottom',
                offsetY: -15
            }),
            //位置指向的三角形符号
            image: new RegularShape({
                radius: 8,
                points: 3,
                angle: Math.PI,
                displacement: [0, 10],
                fill: new Fill({
                    color: 'rgba(0, 0, 0, 0.7)'
                })
            })
        });

        /**
         * 测量提示信息样式
         */
        this.tipStyle = new Style({
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 1)'
                }),
                backgroundFill: new Fill({
                    color: 'rgba(0, 0, 0, 0.4)'
                }),
                padding: [2, 2, 2, 2],
                textAlign: 'left',
                offsetX: 15
            })
        });

        /**
         * 线段注记的样式
         */
        this.segmentStyle = new Style({
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 1)'
                }),
                backgroundFill: new Fill({
                    color: 'rgba(0, 0, 0, 0.4)'
                }),
                padding: [2, 2, 2, 2],
                textBaseline: 'bottom',
                offsetY: -12
            }),
            //位置指向的三角形符号
            image: new RegularShape({
                radius: 6,
                points: 3,
                angle: Math.PI,
                displacement: [0, 8],
                fill: new Fill({
                    color: 'rgba(0, 0, 0, 0.4)'
                })
            })
        });
        this.segmentStyles = [this.segmentStyle];

        return this._draw(measureType);
    }

    /**
     * 结束测量
     * @example
       measureTool.endMeasure();
     */
    endMeasure() {
        this.map.removeInteraction(this.drawHandler);
        this._measureTooltipOverlay = null;
        this._measureTooltipElement = null;
        this._delImg = null;
        unByKey(this._listenerMapOnContextmenu);
    }

    /**
     * 开始绘制和测量
     * @param {String} drawType 测量类型，目前支持'LineString'和'Polygon'
     * @param {	Object } featureStyle 绘制要素的样式
     * @returns {Draw} 返回绘制的实例化对象
     * @private
     */
    _draw(drawType = 'LineString') {
        let self = this;

        this.measureType = drawType;
        //测量过程提示
        const activeTip = '点击继续绘制' + (drawType === 'Polygon' ? '面' : '线' + '，双击或右键结束');
        //开始测量提示
        const idleTip = '点击开始测量' + (drawType === 'Polygon' ? '面积' : '距离');
        let tip = idleTip;

        this.drawHandler = new Draw({
            source: this.vectorLayer.getSource(),
            type: drawType,
            style: (feature) => {
                return self._styleFunction(self, feature, true, drawType, tip);
            }
        });
        this.map.addInteraction(this.drawHandler);

        this._listenerMapOnContextmenu = this.map.on('contextmenu', (evt) => {
            //修改右键事件的响应内容
            evt.preventDefault(); //取消默认事件
            self.drawHandler.removeLastPoint(); //移除右键添加的点
            self.drawHandler.finishDrawing(); //完成绘制，已绘制的内容会添加到绘制图层中
            self.drawHandler.status = 'finish'; //标记绘制完成
        });

        this.drawHandler.on('drawstart', function () {
            tip = activeTip;
        });

        this.drawHandler.on('drawend', function (evt) {
            tip = idleTip;
            self.drawHandler.status = 'finish'; //标记绘制完成
            self.drawHandler.setActive(false); //测量结束后，让测量工具失活
            //添加测量结果的Overlay
            self._addMeasureResultOverlay(evt.feature);
        });

        return this.drawHandler;
    }

    /**
     * 在绘制的过程中生成并动态改变测量结果和提示信息位置
     */
    _styleFunction(self, feature, segments, drawType, tip) {
        const styles = [];
        const geometry = feature.getGeometry();
        const geomType = geometry.getType(); //获取几何类型
        let point, label, line;
        //计算距离或面积并获取结果标注的位置
        if (!drawType || drawType === geomType || geomType === 'Point') {
            styles.push(self.style);
            if (geomType === 'Polygon') {
                point = geometry.getInteriorPoint(); //取面的内部点
                label = self._formatArea(geometry); //计算面积
                line = new LineString(geometry.getCoordinates()[0]);
            } else if (geomType === 'LineString') {
                point = new Point(geometry.getLastCoordinate()); //取线的最后一个点
                label = self._formatLength(geometry); //计算距离
                line = geometry;
            }
        }
        //设置测量结果的位置和内容
        if (label) {
            let coordinates = feature.getGeometry().getCoordinates();
            if (self.drawHandler.status === 'finish' && ((geomType === 'Polygon' && coordinates[0].length < 4) || (geomType === 'LineString' && coordinates.length < 2))) {
                //绘制完成时
                //如果多边形绘制的点少于4个（首位两个点是重复的）或者线只绘制了一个点，无需标注测量结果
                // console.log('绘制结束时的几何图形不完整，无需标注', self.drawHandler.status, geomType, feature.getGeometry().getCoordinates());
            } else if (self.drawHandler.status !== 'finish') {
                self.labelStyle.setGeometry(point);
                self.labelStyle.getText().setText(label);
                styles.push(self.labelStyle);
            }
        }
        //计算每一段线的长度，并标注
        if (segments && line) {
            let coordinates = feature.getGeometry().getCoordinates();
            if (self.drawHandler.status === 'finish' && ((geomType === 'Polygon' && coordinates[0].length < 4) || (geomType === 'LineString' && coordinates.length < 2))) {
                //绘制完成时
                //如果多边形绘制的点少于4个（首位两个点是重复的）或者线只绘制了一个点，无需标注测量结果
                self.source.removeFeature(feature);
            } else {
                let count = 0;
                line.forEachSegment(function (a, b) {
                    const segment = new LineString([a, b]);
                    const label = self._formatLength(segment);
                    if (self.segmentStyles.length - 1 < count) {
                        self.segmentStyles.push(self.segmentStyle.clone());
                    }
                    const segmentPoint = new Point(segment.getCoordinateAt(0.5)); //取线段的中点
                    self.segmentStyles[count].setGeometry(segmentPoint);
                    self.segmentStyles[count].getText().setText(label);
                    styles.push(self.segmentStyles[count]);
                    count++;
                });
            }
        }
        //测量时的提示
        if (tip && geomType === 'Point') {
            self.tipStyle.getText().setText(tip);
            styles.push(self.tipStyle);
        }
        return styles;
    }

    /**
     * 计算几何线的长度并格式化
     * @param {LineString} line 线几何对象
     * @return {Object} 保留两位小数后的值，大于100米单位为km，小于100米单位为m。
     * @private
     */
    _formatLength(line) {
        const length = ol_getLength(line, { projection: this.map.getView().getProjection().getCode() });
        let output;
        if (length > 100) {
            output = Math.round((length / 1000) * 100) / 100 + ' km';
        } else {
            output = Math.round(length * 100) / 100 + ' m';
        }
        return output;
    }

    /**
     * 计算几何面的面积并格式化
     * @param {Polygon} polygon 面几何对象
     * @return {Object} 保留两位小数后的值，大于10000平方米单位为km²，小于10000米单位为m²。
     * @private
     */
    _formatArea(polygon) {
        const area = ol_getArea(polygon, { projection: this.map.getView().getProjection().getCode() });
        let output;
        if (area > 10000) {
            output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
        } else {
            output = Math.round(area * 100) / 100 + ' m\xB2';
        }
        return output;
    }

    /**
     * 创建测量结果提示
     * @private
     */
    _createMeasureTooltip() {
        let measureToolipBox = document.createElement('div');
        measureToolipBox.className = 'swMap-tooltip swMap-tooltip-measure';
        measureToolipBox.style.background = 'rgba(0,0,0,0.5)';
        measureToolipBox.style.opacity = 1; //背景色透明度
        measureToolipBox.style.borderRadius = '4px';
        measureToolipBox.style.padding = '4px 8px';
        measureToolipBox.style.fontSize = '12px';
        measureToolipBox.style.fontWeight = 'bold';
        measureToolipBox.style.color = 'white'; //字体颜色

        this._measureTooltipElement = document.createElement('span'); //承载测量结果信息
        measureToolipBox.appendChild(this._measureTooltipElement);
        // this._measureTooltipElement.id = "swMap-tooltip-measureTooltip";

        //#region 添加删除按钮图标
        // 创建一个 <img> 元素
        this._delImg = document.createElement('img');
        // 设置图片的属性
        this._delImg.src = 'https://webapi.amap.com/images/destroy.png';
        this._delImg.alt = '删除';
        this._delImg.title = '删除本次测量结果';
        this._delImg.style.cursor = 'pointer';
        // 将 <img> 元素添加到 <div> 元素中
        measureToolipBox.appendChild(this._delImg);
        //#endregion
        this._measureTooltipOverlay = new Overlay({
            element: measureToolipBox,
            offset: [0, -6],
            positioning: 'bottom-center',
            stopEvent: false,
            insertFirst: false
        });
        this.overlays.push(this._measureTooltipOverlay);
        this.map.addOverlay(this._measureTooltipOverlay);
    }

    /**
     * 添加测量结果
     */
    _addMeasureResultOverlay(feature) {
        const { label, point, geomType } = this._getLabelPointContent(feature);
        let coordinates = feature.getGeometry().getCoordinates();
        if ((geomType === 'Polygon' && coordinates[0].length < 4) || (geomType === 'LineString' && coordinates.length < 2)) {
            //如果多边形绘制的点少于4个（首位两个点是重复的）或者线只绘制了一个点，无需标注测量结果
            return;
        }
        this._createMeasureTooltip();
        this._measureTooltipElement.innerHTML = label + ' ';
        this._measureTooltipOverlay.setPosition(point.getCoordinates());
        // 注册点击事件的监听器
        this._delImg.addEventListener('click', (event) => {
            //console.log('Overlay 被点击了', event);
            event.target.parentNode.parentNode.removeChild(event.target.parentNode); //移除当前被点击的元素
            this.source.removeFeature(feature); //移除测量绘制的要素
        });
    }

    /**
     * 获取要素的关键点和测量结果
     */
    _getLabelPointContent(feature) {
        const geometry = feature.getGeometry();
        const geomType = geometry.getType(); //获取几何类型
        let point, label;
        if (geomType === 'Polygon') {
            point = geometry.getInteriorPoint(); //取面的内部点
            label = this._formatArea(geometry); //计算面积
        } else if (geomType === 'LineString') {
            point = new Point(geometry.getLastCoordinate()); //取线的最后一个点
            label = this._formatLength(geometry); //计算距离
        }
        return { label, point, geomType };
    }
    /**
     * 获取两个地理坐标之间的距离（该距离为大圆最短距离）
     * @param {Array} c1 起点坐标数组
     * @param {Array} c2 终点坐标数组
     * @param {number} [radius] 地球椭球半径，默认使用WGS84椭球半径的平均值6371008.8
     * @returns 返回两个地理坐标之间的距离，单位为米
	 * @example
	 * measureTool.getDistance([114.04295222720063, 22.580692880250066],
		[114.04389629818274, 22.580446160188345]);
     */
    getDistance(c1, c2, radius) {
        return ol_getDistance(c1, c2, radius);
    }
    /**
     * 获取几何对象的长度
     * @param {Object} options 包含以下参数的Object对象，只需传入一个即可。
     * @param {Array<Array[Number]>} [options.coordinates] 构成几何对象的经纬度坐标数组
     * @param {Feature} [options.feature] 矢量要素
     * @param {Geometry} [options.geom] 几何对象，如LineString、Polygon、MultiPolygon
     * @returns {Number} 返回几何对象的长度，单位为米
     * @example
	   //example 1
       console.log("通过坐标数组获取的的长度为",this.measureTool.getLength({coordinates:
		[[114.04295222720063, 22.580692880250066],
		[114.04389629818274, 22.580446160188345],
		[114.04300863940934, 22.57950302274159],
		[114.04177957341537, 22.58006634465549],
		[114.04295222720063, 22.580692880250066]]
	   }));
	   //example 2
	   console.log("通过坐标数组获取的当前绘制的要素的长度为",this.measureTool.getLength   ({coordinates:feature.getGeometry().getCoordinates()[0]}));
	   //example 3
	   console.log("通过Geometry获取的当前绘制的要素的长度为",this.measureTool.getLength   ({geom:feature.getGeometry()}));
	   //example 4
	   console.log("通过Feature获取的当前绘制的要素的长度为",this.measureTool.getLength   ({feature:feature}));
    */
    getLength(options) {
        let geom, length;
        if (options.feature && options.feature.getGeometry && options.feature.getStyle) {
            //传入的是要素
            geom = options.feature.getGeometry();
        } else if (options.coordinates instanceof Array && options.coordinates.length == 2) {
            //传入的是2个坐标点构成的坐标数组
            const coordinates = [];
            options.coordinates.map((coordinate) => {
                coordinates.push(transform(coordinate, 'GCJ-02-Mecator', 'GCJ-02-Geo'));
            });
            length = this.getDistance(...coordinates);
        } else if (options.coordinates instanceof Array && options.coordinates.length > 2) {
            //传入的是多个坐标点构成的坐标数组
            geom = new Polygon([options.coordinates]); // 创建一个多边形
        } else if (options.geom instanceof Geometry) {
            //传入的是多边形几何对象
            geom = options.geom;
        }
        if (geom) {
            length = ol_getLength(geom, { projection: this.map.getView().getProjection().getCode() });
        } else {
            console.warn('MeasureTool.getLength传入的参数不符合要求，请重新设置！');
        }
        return length;
    }

    /**
     * 获取几何对象的面积
     * @param {Object} options 包含以下参数的Object对象，只需传入一个即可。
     * @param {Array<Array[Number]>} [options.coordinates] 构成几何对象的经纬度坐标数组
     * @param {Feature} [options.feature] 矢量要素
     * @param {Geometry} [options.geom] 几何对象，如Polygon、MultiPolygon
     * @returns {Number} 返回几何对象的面积，单位为平方米
     * @example
	   //example 1
       console.log("通过坐标数组获取的的面积为",this.measureTool.getArea({coordinates:
		[[114.04295222720063, 22.580692880250066],
		[114.04389629818274, 22.580446160188345],
		[114.04300863940934, 22.57950302274159],
		[114.04177957341537, 22.58006634465549],
		[114.04295222720063, 22.580692880250066]]
	   }));
	   //example 2
	   console.log("通过坐标数组获取的当前绘制的面要素的面积为",this.measureTool.getArea   ({coordinates:feature.getGeometry().getCoordinates()[0]}));
	   //example 3
	   console.log("通过Geometry获取的当前绘制的面要素的面积为",this.measureTool.getArea   ({geom:feature.getGeometry()}));
	   //example 4
	   console.log("通过Feature获取的当前绘制的面要素的面积为",this.measureTool.getArea   ({feature:feature}));
    */
    getArea(options) {
        let geom;
        //传入的是面要素，直接利用自带的方法计算面积
        if (options.feature && options.feature.getGeometry().getType() == 'Polygon') {
            //传入的是面要素
            geom = options.feature.getGeometry();
        } else if (options.coordinates instanceof Array && options.coordinates.length > 2) {
            //传入的是坐标数组
            geom = new Polygon([options.coordinates]); // 创建一个多边形
        } else if (options.geom instanceof Geometry) {
            //传入的是多边形几何对象
            geom = options.geom;
        }
        if (geom && geom.getType() != 'Circle') {
            return ol_getArea(geom, { projection: this.map.getView().getProjection().getCode() });
        } else {
            console.warn('MeasureTool.getArea传入的参数不符合要求，请重新设置！');
            return null;
        }
    }

    /**
     * 获取几何对象的中心点
     * @param {Object} options 包含以下参数的Object对象，但下述参数只需传入一个即可。
     * @param {Array<Array[Number]>} [options.coordinates] 构成几何对象的经纬度坐标数组
     * @param {Feature} [options.feature] 矢量要素
     * @param {Geometry} [options.geom] 几何对象，如Polygon、MultiPolygon
     * @param {Boolean} [options.interiorPoint=true] 是否获取多边形内部点，默认为内部点，否则为几何中心点
     * @returns {Array} 返回几何中心点经纬度坐标数组
     * @example
		//example 1   
		console.log("通过坐标数组获取的的中心点为",this.measureTool.getGeomCenter({coordinates:
			[[114.04295222720063, 22.580692880250066],
			[114.04389629818274, 22.580446160188345],
			[114.04300863940934, 22.57950302274159],
			[114.04177957341537, 22.58006634465549],
			[114.04295222720063, 22.580692880250066]]
		}));
		//example 2
		console.log("通过坐标数组获取的当前绘制的面要素的中心点为",this.measureTool.getGeomCenter({coordinates:feature.getGeometry().etCoordinates()[0]}));
		//example 3
		console.log("通过Geometry获取的当前绘制的面要素的中心点为",this.measureTool.getGeomCenter({geom:feature.getGeometry()}));
		//example 4
		let center = this.measureTool.getGeomCenter({feature:feature})
		console.log("通过Feature获取的当前绘制的面要素的中心点为",center);		
        const pointStyle = {
            image: require('@/assets/map/poi-marker1.png'),
			text:'深圳',        
            font: '12px Arial',
            fill: '#ffffff',
            offsetY: -5,
            textAlign: 'center'
        };
        const marker = vectorLayer.addPoint(center,pointStyle);         
     */
    getGeomCenter(options) {
        const { coordinates = null, feature = null, geom = null, interiorPoint = true } = options;
        let geometry;
        if (options.feature && options.feature.getGeometry().getType() == 'Polygon') {
            //传入的是面要素
            geometry = feature.getGeometry();
        } else if (coordinates instanceof Array && coordinates.length > 2) {
            //传入的是坐标数组
            // 创建一个多边形
            geometry = new Polygon([coordinates]);
        } else if (geom instanceof Geometry) {
            //传入的是多边形几何对象
            geometry = geom;
        }
        if (geometry) {
            let center;
            if ((interiorPoint && geometry instanceof Polygon) || geometry instanceof MultiPolygon) {
                //如果是多边形可取内部点
                center = geometry.getInteriorPoint().getCoordinates();
            } else {
                // 获取多边形的边界框
                let extent = geometry.getExtent();
                // 计算边界框的中心点坐标
                center = getCenter(extent);
            }
            return center;
        } else {
            console.warn('MeasureTool.getGeomCenter传入的参数不符合要求，请重新设置！');
            return null;
        }
    }

    /**
     * 清除所有的测量信息
     * @example
     * let measureTool = new MeasureTool(map);
     * measureTool.clear();
     */
    clear() {
        this.source?.clear();
        this.overlays.forEach((overlay) => {
            this.map.removeOverlay(overlay);
        });
    }

    /**
     * 销毁测量工具
     * @example
     * let measureTool = new MeasureTool(map);
     * measureTool.destroy();
     */
    destroy() {
        this.endMeasure();
        this.map.removeLayer(this.vectorLayer);
        this.source = null;
        this.vectorLayer = null;
        this.overlays = null;
        this.drawHandler = null;
    }
}
export default MeasureTool;
