/**
 * 调试行星位置计算
 */

import { dateToJulianDay, normalizeAngle } from '../src/lib/astro/ephemeris';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const J2000 = 2451545.0;

// 2000-01-01 木星位置测试
// 预期：木星在 2000年初 应该在 白羊座末/金牛座初 (约 25-35°)

const testDate = new Date('2000-01-01T12:00:00Z');
const jd = dateToJulianDay(testDate);
const T = (jd - J2000) / 36525;

console.log('=== 木星位置调试 ===');
console.log(`日期: ${testDate.toISOString()}`);
console.log(`儒略日: ${jd}`);
console.log(`T (世纪): ${T.toFixed(6)}`);
console.log();

// 木星轨道参数
const jupiter = {
  a: 5.20288700, e: 0.04838624, i: 1.30439695, L: 34.39644051, w: 14.72847983, O: 100.47390909,
  aRate: -0.00011607, eRate: -0.00013253, iRate: -0.00183714, LRate: 3034.74612775, wRate: 0.21252668, ORate: 0.20469106
};

// 计算当前轨道要素
const L = normalizeAngle(jupiter.L + jupiter.LRate * T);
const w = normalizeAngle(jupiter.w + jupiter.wRate * T);
const O = normalizeAngle(jupiter.O + jupiter.ORate * T);
const e = jupiter.e + jupiter.eRate * T;
const a = jupiter.a + jupiter.aRate * T;
const i = jupiter.i + jupiter.iRate * T;

console.log('轨道要素:');
console.log(`  L (平黄经): ${L.toFixed(2)}°`);
console.log(`  w (近日点): ${w.toFixed(2)}°`);
console.log(`  O (升交点): ${O.toFixed(2)}°`);
console.log(`  e (偏心率): ${e.toFixed(6)}`);
console.log(`  a (半长轴): ${a.toFixed(4)} AU`);
console.log(`  i (倾角): ${i.toFixed(4)}°`);
console.log();

// 平近点角
const M = normalizeAngle(L - w);
console.log(`M (平近点角): ${M.toFixed(2)}°`);

// 开普勒方程
const Mrad = M * DEG_TO_RAD;
let E = Mrad;
for (let iter = 0; iter < 20; iter++) {
  E = Mrad + e * Math.sin(E);
}
console.log(`E (偏近点角): ${(E * RAD_TO_DEG).toFixed(2)}°`);

// 真近点角
const xv = a * (Math.cos(E) - e);
const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
const v = Math.atan2(yv, xv) * RAD_TO_DEG;
const r = Math.sqrt(xv * xv + yv * yv);
console.log(`v (真近点角): ${v.toFixed(2)}°`);
console.log(`r (日心距离): ${r.toFixed(4)} AU`);

// 日心黄经 = v + w
const helioLon = normalizeAngle(v + w);
console.log(`日心黄经: ${helioLon.toFixed(2)}°`);
console.log();

// 问题检查：
// 木星 2000年 日心黄经应该约 34° (参数 L 的初始值)
// 因为 T ≈ 0，L ≈ 34.4°

console.log('=== 问题分析 ===');
console.log(`预期 2000-01-01 木星日心黄经: ~34° (白羊座)`);
console.log(`计算得到: ${helioLon.toFixed(2)}°`);

// 检查 L 参数是否是日心黄经
console.log();
console.log('如果 L 就是日心平黄经，那么对于 T=0:');
console.log(`  L = ${jupiter.L.toFixed(2)}° (金牛座初)`);

// 加上地球位置（太阳反方向）
const sunLon = 280.4; // 2000-01-01 太阳约在摩羯座10°
const earthLon = normalizeAngle(sunLon + 180);
console.log();
console.log(`地球日心黄经: ${earthLon.toFixed(2)}° (巨蟹座)`);

// 视差修正（简化）
// 对于外行星，地心黄经 ≈ 日心黄经 + 小量修正
// 简化公式：地心黄经 ≈ 日心黄经
console.log();
console.log('=== 简化地心计算 ===');
console.log(`简化地心黄经 (≈ 日心黄经): ${helioLon.toFixed(2)}°`);
console.log(`预期地心黄经: ~25-35° (白羊座末)`);

