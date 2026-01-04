/**
 * 调试月亮位置计算
 * 
 * 参考：Meeus "Astronomical Algorithms" 第47章
 */

import { dateToJulianDay, normalizeAngle } from '../src/lib/astro/ephemeris';

const DEG_TO_RAD = Math.PI / 180;
const J2000 = 2451545.0;

// 测试日期
const testDate = new Date('2000-01-01T12:00:00Z');
const jd = dateToJulianDay(testDate);
const T = (jd - J2000) / 36525;

console.log('=== 月亮位置调试 ===');
console.log(`日期: ${testDate.toISOString()}`);
console.log(`JD: ${jd}, T: ${T.toFixed(8)}`);
console.log();

// 当前代码的计算
const L_current = normalizeAngle(218.3164477 + 481267.88123421 * T);
console.log('当前代码:');
console.log(`  L (平黄经): ${L_current.toFixed(2)}°`);

// Meeus 算法（更完整版本）
// 月亮平黄经 L'
const Lp = normalizeAngle(218.3164477 + 481267.88123421 * T 
                          - 0.0015786 * T * T 
                          + T * T * T / 538841 
                          - T * T * T * T / 65194000);

// 月亮平距角 D
const D = normalizeAngle(297.8501921 + 445267.1114034 * T 
                         - 0.0018819 * T * T 
                         + T * T * T / 545868);

// 太阳平近点角 M
const Ms = normalizeAngle(357.5291092 + 35999.0502909 * T 
                          - 0.0001536 * T * T);

// 月亮平近点角 M'
const Mp = normalizeAngle(134.9633964 + 477198.8675055 * T 
                          + 0.0087414 * T * T 
                          + T * T * T / 69699);

// 月亮升交点距角 F
const F = normalizeAngle(93.2720950 + 483202.0175233 * T 
                         - 0.0036539 * T * T 
                         - T * T * T / 3526000);

console.log();
console.log('Meeus 完整公式:');
console.log(`  L' (平黄经): ${Lp.toFixed(2)}°`);
console.log(`  D (平距角): ${D.toFixed(2)}°`);
console.log(`  Ms (太阳平近点角): ${Ms.toFixed(2)}°`);
console.log(`  Mp (月亮平近点角): ${Mp.toFixed(2)}°`);
console.log(`  F (升交点距角): ${F.toFixed(2)}°`);

// 转为弧度
const Dr = D * DEG_TO_RAD;
const Msr = Ms * DEG_TO_RAD;
const Mpr = Mp * DEG_TO_RAD;
const Fr = F * DEG_TO_RAD;

// 主要经度修正项 (Table 47.A 前几项)
let sumL = 0;
sumL += 6288774 * Math.sin(Mpr);
sumL += 1274027 * Math.sin(2 * Dr - Mpr);
sumL += 658314 * Math.sin(2 * Dr);
sumL += 213618 * Math.sin(2 * Mpr);
sumL += -185116 * Math.sin(Msr);
sumL += -114332 * Math.sin(2 * Fr);
sumL += 58793 * Math.sin(2 * Dr - 2 * Mpr);
sumL += 57066 * Math.sin(2 * Dr - Msr - Mpr);
sumL += 53322 * Math.sin(2 * Dr + Mpr);
sumL += 45758 * Math.sin(2 * Dr - Msr);

// sumL 的单位是 0.000001 度，需要转换
const moonLongitude = normalizeAngle(Lp + sumL / 1000000);

console.log();
console.log('经度修正:');
console.log(`  sumL: ${sumL} (单位: 0.000001°)`);
console.log(`  修正: ${(sumL / 1000000).toFixed(4)}°`);
console.log();
console.log(`最终月亮黄经: ${moonLongitude.toFixed(2)}°`);

// 对比预期
console.log();
console.log('=== 验证 ===');
console.log('预期 2000-01-01 12:00 UT 月亮约在: 125° (狮子座初)');
console.log(`计算结果: ${moonLongitude.toFixed(2)}°`);

// 计算星座
const signs = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
const signIndex = Math.floor(moonLongitude / 30);
console.log(`星座: ${signs[signIndex]}座 ${(moonLongitude % 30).toFixed(2)}°`);

