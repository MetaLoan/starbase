/**
 * Life Trend Calculator
 * 人生趋势综合计算模块
 * 
 * 将行运、推运、年限法整合为一个综合趋势函数
 * 输出可用于时间线可视化的数据
 */

import { DateTime } from 'luxon';
import { PLANETS, type PlanetId } from './constants';
import { dateToJulianDay, calculatePlanetPosition, angleDifference, normalizeAngle } from './ephemeris';
import { type NatalChart } from './natal-chart';
import { calculateDailyTransits, findMajorTransits } from './transits';
import { calculateProgressedChart } from './progressions';
import { calculateAnnualProfection, type AnnualProfection } from './profections';

export interface LifeTrendPoint {
  date: Date;
  year: number;
  age: number;
  
  // 综合分数
  overallScore: number;       // -100 到 100
  harmonious: number;         // 顺遂度
  challenge: number;          // 挑战度
  transformation: number;     // 转化度
  
  // 细分维度
  dimensions: {
    career: number;           // 事业
    relationship: number;     // 关系
    health: number;           // 健康
    finance: number;          // 财务
    spiritual: number;        // 灵性成长
  };
  
  // 主导行星
  dominantPlanet: PlanetId;
  
  // 年限法
  profection: {
    house: number;
    theme: string;
    lordOfYear: PlanetId;
  };
  
  // 重要标记
  isMajorTransit: boolean;
  majorTransitName?: string;
  
  // 推运月相
  lunarPhaseName: string;
  lunarPhaseAngle: number;
}

export interface LifeTrendData {
  birthDate: Date;
  points: LifeTrendPoint[];
  summary: {
    overallTrend: 'ascending' | 'descending' | 'fluctuating' | 'stable';
    peakYears: number[];
    challengeYears: number[];
    transformationYears: number[];
  };
  cycles: {
    saturnCycles: Array<{ age: number; year: number; description: string }>;
    jupiterCycles: Array<{ age: number; year: number; description: string }>;
    profectionCycles: Array<{ startAge: number; endAge: number; theme: string }>;
  };
}

/**
 * 计算人生趋势
 * 
 * 这是核心的"趋势函数"，将多个占星系统的输出整合为可理解的分数
 */
export function calculateLifeTrend(
  natalChart: NatalChart,
  startYear: number,
  endYear: number,
  resolution: 'yearly' | 'quarterly' | 'monthly' = 'yearly'
): LifeTrendData {
  const points: LifeTrendPoint[] = [];
  const birthDate = natalChart.birthData.date;
  const birthYear = birthDate.getFullYear();
  
  // 查找重大行运
  const majorTransits = findMajorTransits(birthDate, startYear, endYear);
  const majorTransitYears = new Map(
    majorTransits.map(t => [t.date.getFullYear(), t.name])
  );
  
  // 计算每个时间点
  const step = resolution === 'yearly' ? 12 : resolution === 'quarterly' ? 3 : 1;
  
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month += step) {
      const date = new Date(year, month, 15);
      const age = year - birthYear + month / 12;
      
      if (age < 0) continue;
      
      const point = calculateTrendPoint(
        natalChart,
        date,
        year,
        age,
        majorTransitYears
      );
      
      points.push(point);
    }
  }
  
  // 生成摘要
  const summary = generateSummary(points);
  
  // 提取周期信息
  const cycles = extractCycles(natalChart, startYear, endYear);
  
  return {
    birthDate,
    points,
    summary,
    cycles,
  };
}

/**
 * 计算单个趋势点
 */
function calculateTrendPoint(
  natalChart: NatalChart,
  date: Date,
  year: number,
  age: number,
  majorTransitYears: Map<number, string>
): LifeTrendPoint {
  // 行运相位分数
  const dailyTransit = calculateDailyTransits(date, natalChart);
  
  // 推运信息
  const progressedChart = calculateProgressedChart(natalChart, date);
  
  // 年限法信息
  const profection = calculateAnnualProfection(natalChart, Math.floor(age));
  
  // 计算各维度分数
  const dimensions = calculateDimensionScores(dailyTransit, profection);
  
  // 计算综合分数
  const harmonious = dailyTransit.score.harmonious;
  const challenge = dailyTransit.score.tense;
  const transformation = calculateTransformationScore(dailyTransit, progressedChart);
  
  // 综合分数：顺遂 - 挑战*0.5 + 转化*0.3
  const overallScore = Math.max(-100, Math.min(100,
    harmonious * 2 - challenge + transformation * 0.5
  ));
  
  // 确定主导行星
  const dominantPlanet = determineDominantPlanet(dailyTransit, profection);
  
  // 检查是否是重大行运年
  const isMajorTransit = majorTransitYears.has(year);
  const majorTransitName = majorTransitYears.get(year);
  
  return {
    date,
    year,
    age: Math.floor(age),
    overallScore,
    harmonious,
    challenge,
    transformation,
    dimensions,
    dominantPlanet,
    profection: {
      house: profection.house,
      theme: profection.houseTheme,
      lordOfYear: profection.lordOfYear,
    },
    isMajorTransit,
    majorTransitName,
    lunarPhaseName: progressedChart.lunarPhase.name,
    lunarPhaseAngle: progressedChart.lunarPhase.angle,
  };
}

/**
 * 计算维度分数
 */
function calculateDimensionScores(
  dailyTransit: ReturnType<typeof calculateDailyTransits>,
  profection: AnnualProfection
): LifeTrendPoint['dimensions'] {
  // 基础分数来自行运
  let career = 50;
  let relationship = 50;
  let health = 50;
  let finance = 50;
  let spiritual = 50;
  
  // 根据年限法宫位调整
  const houseModifiers: Record<number, Partial<LifeTrendPoint['dimensions']>> = {
    1: { health: 20, career: 10 },
    2: { finance: 20 },
    3: { career: 10 },
    4: { relationship: 10, spiritual: 10 },
    5: { relationship: 15 },
    6: { health: 20, career: 10 },
    7: { relationship: 20 },
    8: { finance: 10, spiritual: 15 },
    9: { spiritual: 20 },
    10: { career: 20 },
    11: { spiritual: 10, relationship: 10 },
    12: { spiritual: 20, health: -10 },
  };
  
  const modifier = houseModifiers[profection.house] || {};
  career += modifier.career || 0;
  relationship += modifier.relationship || 0;
  health += modifier.health || 0;
  finance += modifier.finance || 0;
  spiritual += modifier.spiritual || 0;
  
  // 根据行运调整
  for (const aspect of dailyTransit.aspects) {
    const intensity = aspect.strength * 20;
    const isHarmonious = ['conjunction', 'trine', 'sextile'].includes(aspect.aspectType);
    const mod = isHarmonious ? intensity : -intensity * 0.5;
    
    // 根据涉及的行星分配到不同维度
    if (['saturn', 'mars', 'sun'].includes(aspect.planet1) || 
        ['saturn', 'mars', 'sun'].includes(aspect.planet2)) {
      career += mod;
    }
    if (['venus', 'moon'].includes(aspect.planet1) || 
        ['venus', 'moon'].includes(aspect.planet2)) {
      relationship += mod;
    }
    if (['mars', 'saturn'].includes(aspect.planet1) || 
        ['mars', 'saturn'].includes(aspect.planet2)) {
      health += mod * 0.5;
    }
    if (['jupiter', 'venus'].includes(aspect.planet1) || 
        ['jupiter', 'venus'].includes(aspect.planet2)) {
      finance += mod;
    }
    if (['neptune', 'pluto', 'chiron'].includes(aspect.planet1) || 
        ['neptune', 'pluto', 'chiron'].includes(aspect.planet2)) {
      spiritual += mod;
    }
  }
  
  // 归一化到 0-100
  return {
    career: Math.max(0, Math.min(100, career)),
    relationship: Math.max(0, Math.min(100, relationship)),
    health: Math.max(0, Math.min(100, health)),
    finance: Math.max(0, Math.min(100, finance)),
    spiritual: Math.max(0, Math.min(100, spiritual)),
  };
}

/**
 * 计算转化度
 */
function calculateTransformationScore(
  dailyTransit: ReturnType<typeof calculateDailyTransits>,
  progressedChart: ReturnType<typeof calculateProgressedChart>
): number {
  let score = 0;
  
  // 外行星相位带来转化
  const transformativePlanets = ['pluto', 'neptune', 'uranus', 'saturn'];
  for (const aspect of dailyTransit.aspects) {
    if (transformativePlanets.includes(aspect.planet1) || 
        transformativePlanets.includes(aspect.planet2)) {
      score += aspect.strength * 30;
    }
  }
  
  // 推运月相处于转折点增加转化度
  const lunarAngle = progressedChart.lunarPhase.angle;
  if (lunarAngle < 45 || lunarAngle > 315) {
    score += 20;  // 新月期
  } else if (Math.abs(lunarAngle - 180) < 45) {
    score += 15;  // 满月期
  }
  
  return Math.min(100, score);
}

/**
 * 确定主导行星
 */
function determineDominantPlanet(
  dailyTransit: ReturnType<typeof calculateDailyTransits>,
  profection: AnnualProfection
): PlanetId {
  // 年度主星有很大权重
  const planetScores: Record<string, number> = {
    [profection.lordOfYear]: 50,
  };
  
  // 行运相位中的行星
  for (const aspect of dailyTransit.aspects) {
    planetScores[aspect.planet1] = (planetScores[aspect.planet1] || 0) + aspect.weight * 10;
    planetScores[aspect.planet2] = (planetScores[aspect.planet2] || 0) + aspect.weight * 10;
  }
  
  // 找最高分
  let maxPlanet: PlanetId = profection.lordOfYear;
  let maxScore = 0;
  
  for (const [planet, score] of Object.entries(planetScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxPlanet = planet as PlanetId;
    }
  }
  
  return maxPlanet;
}

/**
 * 生成趋势摘要
 */
function generateSummary(points: LifeTrendPoint[]): LifeTrendData['summary'] {
  const scores = points.map(p => p.overallScore);
  const avgFirst = scores.slice(0, Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / (scores.length / 2);
  const avgSecond = scores.slice(Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / (scores.length / 2);
  
  let overallTrend: LifeTrendData['summary']['overallTrend'];
  if (avgSecond - avgFirst > 10) {
    overallTrend = 'ascending';
  } else if (avgFirst - avgSecond > 10) {
    overallTrend = 'descending';
  } else {
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - (avgFirst + avgSecond) / 2, 2), 0) / scores.length;
    overallTrend = variance > 400 ? 'fluctuating' : 'stable';
  }
  
  // 找出峰值年和挑战年
  const sortedByScore = [...points].sort((a, b) => b.overallScore - a.overallScore);
  const peakYears = sortedByScore.slice(0, 5).map(p => p.year);
  const challengeYears = sortedByScore.slice(-5).map(p => p.year);
  
  // 转化年
  const transformationYears = points
    .filter(p => p.transformation > 50 || p.isMajorTransit)
    .map(p => p.year);
  
  return {
    overallTrend,
    peakYears: [...new Set(peakYears)],
    challengeYears: [...new Set(challengeYears)],
    transformationYears: [...new Set(transformationYears)],
  };
}

/**
 * 提取周期信息
 */
function extractCycles(
  natalChart: NatalChart,
  startYear: number,
  endYear: number
): LifeTrendData['cycles'] {
  const birthYear = natalChart.birthData.date.getFullYear();
  
  // 土星周期（约 29.5 年）
  const saturnCycles: Array<{ age: number; year: number; description: string }> = [];
  for (let cycle = 1; cycle <= 3; cycle++) {
    const age = Math.round(cycle * 29.5);
    const year = birthYear + age;
    if (year >= startYear && year <= endYear) {
      saturnCycles.push({
        age,
        year,
        description: cycle === 1 
          ? '第一次土星回归：成年的门槛，确立人生结构'
          : cycle === 2
          ? '第二次土星回归：中年整合，重新评估人生成就'
          : '第三次土星回归：晚年智慧，精神遗产',
      });
    }
  }
  
  // 木星周期（约 12 年）
  const jupiterCycles: Array<{ age: number; year: number; description: string }> = [];
  for (let cycle = 1; cycle <= 8; cycle++) {
    const age = Math.round(cycle * 11.86);
    const year = birthYear + age;
    if (year >= startYear && year <= endYear) {
      jupiterCycles.push({
        age,
        year,
        description: `第${cycle}次木星回归：扩张与机遇的新周期`,
      });
    }
  }
  
  // 年限法周期（12 年）
  const profectionCycles: Array<{ startAge: number; endAge: number; theme: string }> = [];
  const cycleThemes = [
    '建立自我认知与基本生存能力',
    '社会化、教育与身份探索',
    '事业建立、关系稳定、责任承担',
    '中年调整、价值重估、成熟智慧',
    '经验分享、社会角色转变',
    '人生整合、精神深化',
    '放下与超越',
    '晚年智慧与圆融',
  ];
  
  for (let i = 0; i < 8; i++) {
    const startAge = i * 12;
    const endAge = (i + 1) * 12 - 1;
    const startCycleYear = birthYear + startAge;
    const endCycleYear = birthYear + endAge;
    
    if (endCycleYear >= startYear && startCycleYear <= endYear) {
      profectionCycles.push({
        startAge,
        endAge,
        theme: cycleThemes[i] || '持续的生命旅程',
      });
    }
  }
  
  return {
    saturnCycles,
    jupiterCycles,
    profectionCycles,
  };
}

/**
 * 快速获取某一年的趋势快照
 */
export function getYearSnapshot(
  natalChart: NatalChart,
  year: number
): LifeTrendPoint {
  const date = new Date(year, 6, 1);
  const birthYear = natalChart.birthData.date.getFullYear();
  const age = year - birthYear;
  
  const majorTransits = findMajorTransits(natalChart.birthData.date, year, year);
  const majorTransitYears = new Map(
    majorTransits.map(t => [t.date.getFullYear(), t.name])
  );
  
  return calculateTrendPoint(natalChart, date, year, age, majorTransitYears);
}

