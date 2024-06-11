/**
 * 通用非地理工具类
 * @constructor
 */
class Util {
    constructor() {}
}

/**
 * 判断颜色字符串的类型
 * @param {String} color 颜色字符串
 * @returns {String} 返回颜色字符串的类型，如16进制颜色字符串为'hex'、rgba为'rgba'
 * @example
    const color = "#ff0000"; // 16进制颜色字符串
    const colorPattern = Util.testColorPattern(color);
 */
Util.testColorPattern = function (color) {
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbaPattern = /^rgba?\((\d{1,3}), (\d{1,3}), (\d{1,3}),? ?(\d?\.?\d+)\)$/;

    let colorPattern = '';
    if (hexPattern.test(color)) {
        colorPattern = 'hex';
        // console.log("该颜色字符串是16进制格式");
    } else if (rgbaPattern.test(color)) {
        colorPattern = 'rgba';
        // console.log("该颜色字符串是RGBA格式");
    } else {
        // console.log("该颜色字符串不是有效的16进制或RGBA格式");
    }
    return colorPattern;
};

/**
 * 16进制转rgba颜色字符串
 * @example
  const hexColor = '#ff0000';
  const opacity = 0.5;
  const rgbaColor = hexToRGBA(hexColor, opacity);
  console.log(rgbaColor); // 输出：rgba(255, 0, 0, 0.5)
 */
Util.hexToRGBA = function (hex, opacity) {
    // 去除 # 号
    hex = hex.replace('#', '');

    // 检查是否是缩写形式
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    // 提取红、绿、蓝分量
    const red = parseInt(hex.substring(0, 2), 16);
    const green = parseInt(hex.substring(2, 4), 16);
    const blue = parseInt(hex.substring(4, 6), 16);

    // 组合成 RGBA 格式
    const rgba = `rgba(${red}, ${green}, ${blue}, ${opacity})`;

    return rgba;
};

/**
 * 修改rgba透明度值
 * @param {String} rgbaString RGBA字符串
 * @param {number} newAlpha 透明度,取值范围[0,1]
 * @returns {String} 返回修改后的RGBA字符串，如果传入的字符串不符合RGBA格式，则直接返回原始字符串
 * @example
    const originalRgba = "rgba(255, 0, 0, 0.5)";
    const modifiedRgba = Util.modifyAlpha(originalRgba, 0.8);
    console.log(modifiedRgba); // 输出 "rgba(255, 0, 0, 0.8)"
 */
Util.modifyAlpha = function (rgbaString, newAlpha) {
    if (!newAlpha) {
        //若未传入透明度值，直接返回原始字符串
        return rgbaString;
    }
    // 使用正则表达式匹配RGBA格式字符串
    const rgbaPattern = /^rgba?\((\d{1,3}), (\d{1,3}), (\d{1,3}),? ?(\d?\.?\d+)\)$/;

    // 检查传入的字符串是否符合RGBA格式
    if (rgbaPattern.test(rgbaString)) {
        // 提取原始RGBA值
        const rgbaValues = rgbaString.match(rgbaPattern);
        const red = rgbaValues[1];
        const green = rgbaValues[2];
        const blue = rgbaValues[3];

        // 将新的alpha值应用到RGBA字符串
        const modifiedRgbaString = `rgba(${red}, ${green}, ${blue}, ${newAlpha})`;
        return modifiedRgbaString;
    } else {
        // 如果传入的字符串不符合RGBA格式，则返回原始字符串
        return rgbaString;
    }
};

/**
 * 计算两点构成的直线的偏转角，逆时针方向，单位为弧度
 * @param {Array} start 起点坐标
 * @param {Array} end 终点坐标
 * @returns {number} 返回逆时针旋转的弧度值
 */
Util.computeRotation = function (start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return Math.atan2(dy, dx); //返回的的是一个逆时针旋转的弧度值
};
//rgb转16进制
Util.rgbToHex = function (rgbString) {
    var rgbValues = rgbString.match(/\d+/g);
    var r = parseInt(rgbValues[0]);
    var g = parseInt(rgbValues[1]);
    var b = parseInt(rgbValues[2]);

    // 将分量值转换为十六进制，并连接在一起
    var hexColor = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');

    return hexColor;
};
//rgba转16进制
Util.rgbaToHex = function (rgbaString) {
    var rgbaValues = rgbaString.match(/[\d.]+/g);
    var r = parseInt(rgbaValues[0]);
    var g = parseInt(rgbaValues[1]);
    var b = parseInt(rgbaValues[2]);

    // 将颜色值转换为十六进制，并连接在一起
    var hexColor = '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

    return hexColor;
};
export default Util;
