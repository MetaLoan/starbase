/**
 * Ephemeris Calculator
 * 星历计算引擎 - 计算行星在黄道上的位置
 * 
 * 使用 VSOP87 理论的简化版本进行行星位置计算
 * 对于专业应用，可替换为 Swiss Ephemeris
 */

import { DateTime } from 'luxon';

// 天文常量
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const J2000 = 2451545.0; // J2000.0 儒略日

/**
 * 计算儒略日
 */
export function dateToJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate() + 
    date.getUTCHours() / 24 + 
    date.getUTCMinutes() / 1440 + 
    date.getUTCSeconds() / 86400;

  let y = year;
  let m = month;
  
  if (month <= 2) {
    y = year - 1;
    m = month + 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return Math.floor(365.25 * (y + 4716)) + 
         Math.floor(30.6001 * (m + 1)) + 
         day + B - 1524.5;
}

/**
 * 儒略日转日期
 */
export function julianDayToDate(jd: number): Date {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  const dayInt = Math.floor(day);
  const dayFrac = day - dayInt;
  const hours = dayFrac * 24;
  const hourInt = Math.floor(hours);
  const minutes = (hours - hourInt) * 60;
  const minuteInt = Math.floor(minutes);
  const seconds = (minutes - minuteInt) * 60;
  
  return new Date(Date.UTC(year, month - 1, dayInt, hourInt, minuteInt, Math.floor(seconds)));
}

/**
 * 归一化角度到 0-360 度
 */
export function normalizeAngle(angle: number): number {
  let result = angle % 360;
  if (result < 0) result += 360;
  return result;
}

/**
 * 计算两个角度之间的最短距离
 */
export function angleDifference(angle1: number, angle2: number): number {
  let diff = normalizeAngle(angle1) - normalizeAngle(angle2);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return Math.abs(diff);
}

// 行星轨道要素（J2000.0 历元）
interface OrbitalElements {
  a: number;      // 半长轴 (AU)
  e: number;      // 偏心率
  i: number;      // 倾角 (度)
  L: number;      // 平黄经 (度)
  w: number;      // 近日点幅角 (度)
  O: number;      // 升交点黄经 (度)
  // 每世纪变化率
  aRate: number;
  eRate: number;
  iRate: number;
  LRate: number;
  wRate: number;
  ORate: number;
}

// 行星轨道参数（来自 NASA JPL）
const ORBITAL_ELEMENTS: Record<string, OrbitalElements> = {
  mercury: {
    a: 0.38709927, e: 0.20563593, i: 7.00497902, L: 252.25032350, w: 77.45779628, O: 48.33076593,
    aRate: 0.00000037, eRate: 0.00001906, iRate: -0.00594749, LRate: 149472.67411175, wRate: 0.16047689, ORate: -0.12534081
  },
  venus: {
    a: 0.72333566, e: 0.00677672, i: 3.39467605, L: 181.97909950, w: 131.60246718, O: 76.67984255,
    aRate: 0.00000390, eRate: -0.00004107, iRate: -0.00078890, LRate: 58517.81538729, wRate: 0.00268329, ORate: -0.27769418
  },
  earth: {
    a: 1.00000261, e: 0.01671123, i: -0.00001531, L: 100.46457166, w: 102.93768193, O: 0.0,
    aRate: 0.00000562, eRate: -0.00004392, iRate: -0.01294668, LRate: 35999.37244981, wRate: 0.32327364, ORate: 0.0
  },
  mars: {
    a: 1.52371034, e: 0.09339410, i: 1.84969142, L: -4.55343205, w: -23.94362959, O: 49.55953891,
    aRate: 0.00001847, eRate: 0.00007882, iRate: -0.00813131, LRate: 19140.30268499, wRate: 0.44441088, ORate: -0.29257343
  },
  jupiter: {
    a: 5.20288700, e: 0.04838624, i: 1.30439695, L: 34.39644051, w: 14.72847983, O: 100.47390909,
    aRate: -0.00011607, eRate: -0.00013253, iRate: -0.00183714, LRate: 3034.74612775, wRate: 0.21252668, ORate: 0.20469106
  },
  saturn: {
    a: 9.53667594, e: 0.05386179, i: 2.48599187, L: 49.95424423, w: 92.59887831, O: 113.66242448,
    aRate: -0.00125060, eRate: -0.00050991, iRate: 0.00193609, LRate: 1222.49362201, wRate: -0.41897216, ORate: -0.28867794
  },
  uranus: {
    a: 19.18916464, e: 0.04725744, i: 0.77263783, L: 313.23810451, w: 170.95427630, O: 74.01692503,
    aRate: -0.00196176, eRate: -0.00004397, iRate: -0.00242939, LRate: 428.48202785, wRate: 0.40805281, ORate: 0.04240589
  },
  neptune: {
    a: 30.06992276, e: 0.00859048, i: 1.77004347, L: -55.12002969, w: 44.96476227, O: 131.78422574,
    aRate: 0.00026291, eRate: 0.00005105, iRate: 0.00035372, LRate: 218.45945325, wRate: -0.32241464, ORate: -0.00508664
  },
  pluto: {
    a: 39.48211675, e: 0.24882730, i: 17.14001206, L: 238.92903833, w: 224.06891629, O: 110.30393684,
    aRate: -0.00031596, eRate: 0.00005170, iRate: 0.00004818, LRate: 145.20780515, wRate: -0.04062942, ORate: -0.01183482
  }
};

/**
 * 计算行星黄道坐标
 */
export function calculatePlanetPosition(planetId: string, jd: number): { longitude: number; latitude: number; distance: number } {
  // 太阳位置（地球相对）
  if (planetId === 'sun') {
    return calculateSunPosition(jd);
  }

  // 月亮位置
  if (planetId === 'moon') {
    return calculateMoonPosition(jd);
  }

  // 北交点
  if (planetId === 'northNode') {
    return calculateNorthNodePosition(jd);
  }

  // 凯龙星
  if (planetId === 'chiron') {
    return calculateChironPosition(jd);
  }

  const elements = ORBITAL_ELEMENTS[planetId];
  if (!elements) {
    throw new Error(`Unknown planet: ${planetId}`);
  }

  // 计算儒略世纪数
  const T = (jd - J2000) / 36525;

  // 计算当前轨道要素
  const a = elements.a + elements.aRate * T;
  const e = elements.e + elements.eRate * T;
  const i = (elements.i + elements.iRate * T) * DEG_TO_RAD;
  const L = normalizeAngle(elements.L + elements.LRate * T);
  const w = normalizeAngle(elements.w + elements.wRate * T);
  const O = normalizeAngle(elements.O + elements.ORate * T);

  // 平近点角
  const M = normalizeAngle(L - w) * DEG_TO_RAD;

  // 开普勒方程求解偏近点角
  let E = M;
  for (let iter = 0; iter < 10; iter++) {
    E = M + e * Math.sin(E);
  }

  // 真近点角
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv) * RAD_TO_DEG;
  const r = Math.sqrt(xv * xv + yv * yv);

  // 黄道坐标
  // 纬度参数 (argument of latitude) = v + w - O
  // 这是相对于升交点的角度
  const u = normalizeAngle(v + w - O) * DEG_TO_RAD;
  const iRad = i;
  const ORad = O * DEG_TO_RAD;

  // 日心黄道直角坐标
  const xh = r * (Math.cos(ORad) * Math.cos(u) - Math.sin(ORad) * Math.sin(u) * Math.cos(iRad));
  const yh = r * (Math.sin(ORad) * Math.cos(u) + Math.cos(ORad) * Math.sin(u) * Math.cos(iRad));
  const zh = r * Math.sin(u) * Math.sin(iRad);

  // 转换为地心坐标（需要地球位置）
  const earthPos = calculateHeliocentricEarth(jd);
  const xg = xh - earthPos.x;
  const yg = yh - earthPos.y;
  const zg = zh - earthPos.z;

  // 转换为黄道经纬度
  const longitude = normalizeAngle(Math.atan2(yg, xg) * RAD_TO_DEG);
  const latitude = Math.atan2(zg, Math.sqrt(xg * xg + yg * yg)) * RAD_TO_DEG;
  const distance = Math.sqrt(xg * xg + yg * yg + zg * zg);

  return { longitude, latitude, distance };
}

/**
 * 计算地球的日心坐标
 * 使用更精确的算法，与太阳位置计算保持一致
 */
function calculateHeliocentricEarth(jd: number): { x: number; y: number; z: number } {
  const T = (jd - J2000) / 36525;
  
  // 使用与太阳计算相同的公式（地球在太阳对面）
  const L0 = normalizeAngle(280.4664567 + 36000.76983 * T + 0.0003032 * T * T);
  const M = normalizeAngle(357.5291092 + 35999.0502909 * T) * DEG_TO_RAD;
  const C = (1.9146 - 0.004817 * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.00029 * Math.sin(3 * M);
  const sunLongitude = normalizeAngle(L0 + C);
  
  // 地球位置在太阳对面 180°
  const earthLongitude = normalizeAngle(sunLongitude + 180);
  
  // 地球轨道半径
  const e = 0.016708634 - 0.000042037 * T;
  const v = M + C * DEG_TO_RAD;
  const r = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(v));
  
  const lonRad = earthLongitude * DEG_TO_RAD;
  
  return {
    x: r * Math.cos(lonRad),
    y: r * Math.sin(lonRad),
    z: 0
  };
}

/**
 * 计算太阳位置（地心视黄经）
 */
function calculateSunPosition(jd: number): { longitude: number; latitude: number; distance: number } {
  const T = (jd - J2000) / 36525;

  // 太阳平黄经 (Meeus, Astronomical Algorithms)
  const L0 = normalizeAngle(280.4664567 + 36000.76983 * T + 0.0003032 * T * T);
  
  // 太阳平近点角
  const M = normalizeAngle(357.5291092 + 35999.0502909 * T) * DEG_TO_RAD;

  // 中心差
  const C = (1.9146 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.00029 * Math.sin(3 * M);

  // 真黄经
  const longitude = normalizeAngle(L0 + C);

  // 距离（AU）
  const e = 0.016708634 - 0.000042037 * T;
  const v = M + C * DEG_TO_RAD;
  const distance = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(v));

  return { longitude, latitude: 0, distance };
}

/**
 * 计算月亮位置（简化算法）
 */
function calculateMoonPosition(jd: number): { longitude: number; latitude: number; distance: number } {
  const T = (jd - J2000) / 36525;

  // 月亮平黄经
  const L = normalizeAngle(218.3164477 + 481267.88123421 * T);
  
  // 月亮平近点角
  const M = normalizeAngle(134.9633964 + 477198.8675055 * T) * DEG_TO_RAD;
  
  // 太阳平近点角
  const Ms = normalizeAngle(357.5291092 + 35999.0502909 * T) * DEG_TO_RAD;
  
  // 月亮平均距角
  const D = normalizeAngle(297.8501921 + 445267.1114034 * T) * DEG_TO_RAD;
  
  // 月亮升交点平黄经
  const F = normalizeAngle(93.2720950 + 483202.0175233 * T) * DEG_TO_RAD;

  // 经度修正
  let longitude = L
    + 6.289 * Math.sin(M)
    - 1.274 * Math.sin(2 * D - M)
    + 0.658 * Math.sin(2 * D)
    + 0.214 * Math.sin(2 * M)
    - 0.186 * Math.sin(Ms)
    - 0.114 * Math.sin(2 * F);

  // 纬度
  const latitude = 5.128 * Math.sin(F)
    + 0.281 * Math.sin(M + F)
    - 0.278 * Math.sin(F - M)
    - 0.173 * Math.sin(F - 2 * D);

  // 距离（地球半径）
  const distance = 385000.56 / 6378.14; // 转换为地球半径单位

  return { longitude: normalizeAngle(longitude), latitude, distance };
}

/**
 * 计算北交点位置
 */
function calculateNorthNodePosition(jd: number): { longitude: number; latitude: number; distance: number } {
  const T = (jd - J2000) / 36525;
  
  // 月亮升交点平黄经（真交点需要更多修正）
  const O = normalizeAngle(125.0445479 - 1934.1362891 * T);

  return { longitude: O, latitude: 0, distance: 1 };
}

/**
 * 计算凯龙星位置（简化）
 */
function calculateChironPosition(jd: number): { longitude: number; latitude: number; distance: number } {
  const T = (jd - J2000) / 36525;
  
  // 凯龙星轨道要素（简化）
  const a = 13.648;
  const e = 0.3814;
  const i = 6.931 * DEG_TO_RAD;
  const O = 209.35 * DEG_TO_RAD;
  const w = 339.55 * DEG_TO_RAD;
  const n = 0.01953; // 日运动（度/天）
  
  // 平近点角
  const M = normalizeAngle(78.0 + n * (jd - J2000)) * DEG_TO_RAD;

  // 开普勒方程
  let E = M;
  for (let iter = 0; iter < 10; iter++) {
    E = M + e * Math.sin(E);
  }

  // 真近点角
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  // 黄道坐标
  const lw = v + w;
  const xh = r * (Math.cos(O) * Math.cos(lw) - Math.sin(O) * Math.sin(lw) * Math.cos(i));
  const yh = r * (Math.sin(O) * Math.cos(lw) + Math.cos(O) * Math.sin(lw) * Math.cos(i));
  const zh = r * Math.sin(lw) * Math.sin(i);

  // 转换为地心坐标
  const earthPos = calculateHeliocentricEarth(jd);
  const xg = xh - earthPos.x;
  const yg = yh - earthPos.y;
  const zg = zh - earthPos.z;

  const longitude = normalizeAngle(Math.atan2(yg, xg) * RAD_TO_DEG);
  const latitude = Math.atan2(zg, Math.sqrt(xg * xg + yg * yg)) * RAD_TO_DEG;
  const distance = Math.sqrt(xg * xg + yg * yg + zg * zg);

  return { longitude, latitude, distance };
}

/**
 * 计算所有行星位置
 */
export function calculateAllPlanetPositions(date: Date): Record<string, { longitude: number; latitude: number; distance: number }> {
  const jd = dateToJulianDay(date);
  const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'chiron'];
  
  const positions: Record<string, { longitude: number; latitude: number; distance: number }> = {};
  
  for (const planet of planets) {
    positions[planet] = calculatePlanetPosition(planet, jd);
  }
  
  return positions;
}

/**
 * 计算恒星时（用于宫位计算）
 */
export function calculateSiderealTime(jd: number, longitude: number): number {
  const T = (jd - J2000) / 36525;
  
  // 格林威治平恒星时
  let GMST = 280.46061837 
           + 360.98564736629 * (jd - J2000)
           + 0.000387933 * T * T
           - T * T * T / 38710000;
  
  // 转换为当地恒星时
  const LST = normalizeAngle(GMST + longitude);
  
  return LST;
}

/**
 * 计算上升点（Placidus 宫位制）
 */
export function calculateAscendant(jd: number, latitude: number, longitude: number): number {
  const LST = calculateSiderealTime(jd, longitude);
  const RAMC = LST * DEG_TO_RAD; // 中天赤经
  const latRad = latitude * DEG_TO_RAD;
  const obliquity = 23.4393 * DEG_TO_RAD; // 黄赤交角

  // 上升点计算
  const tanAsc = Math.cos(RAMC) / (-Math.sin(RAMC) * Math.cos(obliquity) - Math.tan(latRad) * Math.sin(obliquity));
  let asc = Math.atan(tanAsc) * RAD_TO_DEG;

  // 象限调整
  if (Math.cos(RAMC) < 0) {
    asc += 180;
  }

  return normalizeAngle(asc);
}

/**
 * 计算中天
 */
export function calculateMidheaven(jd: number, longitude: number): number {
  const LST = calculateSiderealTime(jd, longitude);
  const RAMC = LST * DEG_TO_RAD;
  const obliquity = 23.4393 * DEG_TO_RAD;

  const tanMC = Math.tan(RAMC) / Math.cos(obliquity);
  let mc = Math.atan(tanMC) * RAD_TO_DEG;

  // 象限调整
  if (RAMC > Math.PI / 2 && RAMC < 3 * Math.PI / 2) {
    mc += 180;
  }

  return normalizeAngle(mc);
}

/**
 * 计算所有宫位宫头（等宫制）
 */
export function calculateHouseCusps(jd: number, latitude: number, longitude: number): number[] {
  const asc = calculateAscendant(jd, latitude, longitude);
  const cusps: number[] = [];

  for (let i = 0; i < 12; i++) {
    cusps.push(normalizeAngle(asc + i * 30));
  }

  return cusps;
}

