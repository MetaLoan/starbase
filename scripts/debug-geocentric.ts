/**
 * 调试地心转换
 */

import { dateToJulianDay, normalizeAngle } from '../src/lib/astro/ephemeris';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const J2000 = 2451545.0;

const testDate = new Date('2000-01-01T12:00:00Z');
const jd = dateToJulianDay(testDate);
const T = (jd - J2000) / 36525;

// 木星轨道参数
const jupiter = {
  a: 5.20288700, e: 0.04838624, i: 1.30439695, L: 34.39644051, w: 14.72847983, O: 100.47390909,
  aRate: -0.00011607, eRate: -0.00013253, iRate: -0.00183714, LRate: 3034.74612775, wRate: 0.21252668, ORate: 0.20469106
};

// 计算木星日心坐标
const L = normalizeAngle(jupiter.L + jupiter.LRate * T);
const w = normalizeAngle(jupiter.w + jupiter.wRate * T);
const O = normalizeAngle(jupiter.O + jupiter.ORate * T);
const e = jupiter.e + jupiter.eRate * T;
const a = jupiter.a + jupiter.aRate * T;
const i = (jupiter.i + jupiter.iRate * T) * DEG_TO_RAD;

const M = normalizeAngle(L - w) * DEG_TO_RAD;
let E = M;
for (let iter = 0; iter < 20; iter++) {
  E = M + e * Math.sin(E);
}

const xv = a * (Math.cos(E) - e);
const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
const v = Math.atan2(yv, xv) * RAD_TO_DEG;
const r = Math.sqrt(xv * xv + yv * yv);

// 日心黄道坐标
const lw = (v + w) * DEG_TO_RAD;
const ORad = O * DEG_TO_RAD;

// 3D 日心坐标 (当前代码)
const xh = r * (Math.cos(ORad) * Math.cos(lw) - Math.sin(ORad) * Math.sin(lw) * Math.cos(i));
const yh = r * (Math.sin(ORad) * Math.cos(lw) + Math.cos(ORad) * Math.sin(lw) * Math.cos(i));
const zh = r * Math.sin(lw) * Math.sin(i);

console.log('=== 木星 3D 日心坐标 ===');
console.log(`xh: ${xh.toFixed(4)}`);
console.log(`yh: ${yh.toFixed(4)}`);
console.log(`zh: ${zh.toFixed(4)}`);

// 直接从 3D 坐标计算日心黄经
const helioLonFromXY = normalizeAngle(Math.atan2(yh, xh) * RAD_TO_DEG);
console.log(`从 3D 坐标计算日心黄经: ${helioLonFromXY.toFixed(2)}°`);

// 简单方法：直接用 v + w 作为日心黄经
const simpleHelioLon = normalizeAngle(v + w);
console.log(`简单方法日心黄经: ${simpleHelioLon.toFixed(2)}°`);

console.log();
console.log('=== 地球日心坐标 ===');

// 地球位置 (太阳对面)
const sunL0 = normalizeAngle(280.4664567 + 36000.76983 * T);
const sunM = normalizeAngle(357.5291092 + 35999.0502909 * T) * DEG_TO_RAD;
const sunC = 1.9146 * Math.sin(sunM) + 0.02 * Math.sin(2 * sunM);
const sunLon = normalizeAngle(sunL0 + sunC);
const earthLon = normalizeAngle(sunLon + 180);

// 地球距离
const earthE = 0.016708634;
const sunV = sunM + sunC * DEG_TO_RAD;
const earthR = 1.0 * (1 - earthE * earthE) / (1 + earthE * Math.cos(sunV));

const earthLonRad = earthLon * DEG_TO_RAD;
const xe = earthR * Math.cos(earthLonRad);
const ye = earthR * Math.sin(earthLonRad);
const ze = 0;

console.log(`地球黄经: ${earthLon.toFixed(2)}°`);
console.log(`xe: ${xe.toFixed(4)}`);
console.log(`ye: ${ye.toFixed(4)}`);

console.log();
console.log('=== 地心坐标计算 ===');

const xg = xh - xe;
const yg = yh - ye;
const zg = zh - ze;

console.log(`xg: ${xg.toFixed(4)}`);
console.log(`yg: ${yg.toFixed(4)}`);

const geoLon = normalizeAngle(Math.atan2(yg, xg) * RAD_TO_DEG);
console.log(`地心黄经 (从 3D): ${geoLon.toFixed(2)}°`);

console.log();
console.log('=== 预期结果 ===');
console.log('2000-01-01 木星地心黄经预期: ~25-35° (白羊座末/金牛座初)');
console.log();

// 问题分析
console.log('=== 问题分析 ===');
console.log('如果 3D 坐标转换有问题，日心黄经从 xh,yh 计算会出错');
console.log('简单方法 (v+w) 应该直接得到日心黄经，不需要 3D 转换');

