import Draw, { createBox } from 'ol/interaction/Draw';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { LineString, Polygon, Circle } from 'ol/geom';
import Overlay from 'ol/Overlay';
import { unByKey } from 'ol/Observable';

import GeoUtil from './geoUtil';

const defaultFunc = () => {};

/**
 * 绘制工具类
 */
class DrawTool {
    /**
     * 构造函数
     * @param {Map} [map=window.map] OL的Map实例化对象，默认为window.map
     * @example
     * const drawTool = new DrawTool(window.map);
     */
    constructor(map = window.map) {
        this.map = map;
        this.source = new VectorSource();
        this.vectorLayer = new VectorLayer({
            //绘制要素图层
            source: this.source,
            //要素绘制完成后默认的样式
            style: {
                'fill-color': 'rgba(255, 255, 255, 0.2)',
                'stroke-color': 'red',
                'stroke-opacity': 0.1,
                'stroke-width': 2,
                'circle-radius': 7,
                'circle-fill-color': 'blue'
            },
            zIndex: 1000
        });
        this.vectorLayer.set('id', 'id-sw-draw-feature'); //设置id便于后续查找
        this.map.addLayer(this.vectorLayer); //将用于绘制或编辑要素的图层添加到地图中

        this.sketch = null;
        this._helpTooltipElement = null; //承载绘制提示信息的元素
        this._helpTooltip = null; //显示绘制提示信息的OverLay
        this._listenerMapOnPointerMove; //监听鼠标移动
        this._listenerLayerOnAddFeature; //监听绘制完成后要素被添加到图层中
    }

    /**
     * 绘制要素
     * @param {String} drawType 绘制类型，目前支持'Point'（点）、'LineString'（线）、'Polygon'（多边形）、'Box'（矩形）和'Circle'（圆）
     * @param {	Object } styleOptions 绘制要素的样式(样式参数定义请参见GeoUtil.createNewStyle的接口说明)
     * @param {	boolean } [needHelpTooltip=fasle] 是否使用绘制提示
     * @param {Function} [drawingHandler] 开始绘制后的回调，返回绘制过程中变化的几何对象
     * @param {Function} [okHandler] 绘制完成后的回调，返回绘制完成后的要素对象
     * @param {Function} [cancelHandler] 绘制取消后的回调
     * @returns {Draw} 返回绘制的实例化对象
     * @example
       let drawType="LineString";
       let featureStyle = {            
            'stroke-color': '#4585FF',  //线的颜色
            'stroke-width': 2, //线的宽度
        }
       const draw = drawTool.draw(drawType, featureStyle);
       //map.removeInteraction(draw); //移除编辑功能
     */
    draw(
        drawType = 'Polygon',
        /* featureStyle = {
            'circle-fill-color': '#4585FF'
        }, */
        styleOptions = {
            lineStyle: {
                color: 'rgba(255, 255, 255, 0.2)',
                width: 3
            },
            areaStyle: {
                fillColor: 'rgba(255, 255, 255, 0.2)',
                opacity: 0.1,
                strokeColor: '#4585FF',
                strokeWidth: 3
            }
        },
        needHelpTooltip = false,
        drawingHandler = defaultFunc,
        okHandler = defaultFunc,
        cancelHandler = defaultFunc
    ) {
        let self = this;

        let geometryFunction = undefined;
        if (drawType == 'Box') {
            //绘制矩形，最后是以Polygon的几何类型返回
            drawType = 'Circle';
            geometryFunction = createBox();
        }

        this.drawHandler = new Draw({
            // source:this.source,  //直接使用source无法将矢量图层的样式赋予最后生成的要素
            source: this.vectorLayer.getSource(), //使用矢量图层的source而不是直接实例化的source才能将图层上设置的样式赋予绘制后生成的要素
            type: drawType,
            geometryFunction,
            condition: function (event) {
                if (event.originalEvent.button === 2) {
                    //右键取消绘制
                    self.drawHandler.abortDrawing(); //放弃绘制，不会将已绘制的内容添加到绘制图层中
                    self.map.removeOverlay(self._helpTooltip);
                    cancelHandler();
                }
                return true;
            }
            // style:style //绘制时显示的样式
        });
        this.map.addInteraction(this.drawHandler);

        needHelpTooltip && this._createHelpTooltip();

        let listener, timerId;
        this.drawHandler.on('drawstart', (evt) => {
            // console.log("当前实时绘制的对象evt", evt);
            self.sketch = evt.feature;
            listener = self.sketch.getGeometry().on('change', (evt) => {
                // 如果已经设置了定时器，则清除之前的定时器
                if (timerId) {
                    clearTimeout(timerId);
                }
                // 设置一个新的定时器，降低监听的频率
                timerId = setTimeout(function () {
                    const geometry = evt.target;
                    drawingHandler && drawingHandler(geometry);
                }, 50);
            });
        });
        this.drawHandler.on('drawend', (e) => {
            // console.log('绘制结束后生成的要素：', e.feature);
            const style = GeoUtil.createNewStyle(drawType, styleOptions);
            style && e.feature.setStyle(style); //为绘制的要素应用自定义样式
            self.map.removeOverlay(self._helpTooltip);
            unByKey(listener);

            //绘制完成后，要素被添加到图层中的监听
            self._listenerLayerOnAddFeature = self.vectorLayer.getSource().on('addfeature', (evt) => {
                okHandler(evt.feature);
            });
        });
        //鼠标移动事件，显示绘制提示信息
        this._listenerMapOnPointerMove = this.map.on('pointermove', (evt) => {
            if (evt.dragging) {
                return;
            }
            let helpMsg = '点击开始绘制';
            const continuePolygonMsg = '点击继续绘制面，双击结束，右键取消';
            const continueLineMsg = '点击继续绘制线，双击结束，右键取消';
            const continueCircle = '点击完成圆的绘制，右键取消';

            if (self.sketch) {
                const geom = self.sketch.getGeometry();
                if (geom instanceof Polygon) {
                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof LineString) {
                    helpMsg = continueLineMsg;
                } else if (geom instanceof Circle) {
                    helpMsg = continueCircle;
                } else {
                    helpMsg = '点击继续绘制';
                }
            }

            if (needHelpTooltip) {
                self._helpTooltipElement.innerHTML = helpMsg;
                self._helpTooltip.setPosition(evt.coordinate);
                self._helpTooltipElement.classList.remove('hidden');
            }
            // console.log(`map.on的坐标${evt.coordinate}`);
        });
        return this.drawHandler;
    }

    /**
     * 结束绘制
     * @example
     * drawTool.endDraw();
     */
    endDraw() {
        this.map.removeInteraction(this.drawHandler);
        this.map.removeOverlay(this._helpTooltip);
        this.sketch = null;
        this._helpTooltipElement = null;
        this._helpTooltip = null;
        unByKey(this._listenerMapOnPointerMove);
        unByKey(this._listenerLayerOnAddFeature);
    }

    /**
     * 创建绘制帮助提示
     * @private
     */
    _createHelpTooltip() {
        if (this._helpTooltipElement) {
            this._helpTooltipElement.parentNode.removeChild(this._helpTooltipElement);
        }
        this._helpTooltipElement = document.createElement('div');
        // this._helpTooltipElement.id = "swMap-tooltip-helpTooltip"
        this._helpTooltipElement.className = 'swMap-tooltip hidden';
        this._helpTooltipElement.style.background = 'rgba(0,0,0,0.5)';
        this._helpTooltipElement.style.opacity = 0.7; //背景色透明度
        this._helpTooltipElement.style.borderRadius = '4px';
        this._helpTooltipElement.style.padding = '4px 8px';
        this._helpTooltipElement.style.fontSize = '12px';
        this._helpTooltipElement.style.color = 'white'; //字体颜色

        this._helpTooltip = new Overlay({
            element: this._helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        this.map.addOverlay(this._helpTooltip);
    }

    /**
     * 清除所有的绘制记录
     * @example
     * const drawTool = new DrawTool(window.map);
     * drawTool.clear();
     */
    clear() {
        this.source.clear();
    }

    /**
     * 销毁绘制工具
     * @example
     * drawTool.destroy();
     */
    destroy() {
        this.endDraw();
        this.map.removeLayer(this.vectorLayer);
        this.source = null;
        this.vectorLayer = null;
        this.drawHandler = null;
    }
}
export default DrawTool;
