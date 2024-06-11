import { transform } from 'ol/proj.js';
import ol_Overlay from 'ol/Overlay.js';
/**
* 地图覆盖物
* @param {HTMLElement} element 覆盖物元素
* @param {Array<number>} position 坐标数组,可以是球面坐标、也可以是平面坐标
* @param {String} [positioning='center-center'] 覆盖物相对于坐标点的位置，取值可以是'bottom-left'、'bottom-center'、'bottom-right'、'center-left'、'center-center'、'center-right'、'top-left'、'top-center' 或 'top-right'
* @param {Array.<number>} [offset=[0,0]] 覆盖物相对于坐标点的像元偏移量
* @param {Boolean} [stopEvent=false] 阻止冒泡
* @example
    // 创建一个自定义覆盖物
    const overlayElement = document.createElement('div');
    overlayElement.className = 'bubble-item99'; // 添加自定义样式类

    // 创建覆盖物的内容
    const overlayContent = document.createElement('div');
    overlayContent.innerHTML = item.name;
    overlayElement.appendChild(overlayContent);
    
    // 创建一个Overlay覆盖物
    const overlay = new Overlay({
        element: this.$refs.listDetail,
        position: this.coordinate,
        positioning: 'bottom-center',
        stopEvent: true, // true阻止冒泡
        offset: [0, -14] // 设置偏移量
    }); 
    // 将Overlay添加到地图中
    window.map.addOverlay(overlay);

*/
class Overlay extends ol_Overlay {
    constructor(options = {}) {
        super(options);
        let coordinate = options.position;
        //若为经纬度坐标，则转换为投影坐标，否则直接使用
        if (coordinate[0] < 180 && coordinate[1] < 90) {
            coordinate = transform(coordinate, 'GCJ-02-Geo', 'GCJ-02-Mecator');
        }
        this.setPosition(coordinate);
    }
}

export default Overlay;
