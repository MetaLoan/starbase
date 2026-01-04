/**
 * Data Processor
 * 数据处理器
 * 
 * 核心功能：
 * 原始占星数据 → 影响因子层 → 最终输出
 * 
 * 这是所有数据输出的中央处理点，确保所有数据都经过影响因子层处理
 */

import { type NatalChart } from './natal-chart';
import { calculateDailyForecast, calculateWeeklyForecast, type DailyForecast, type WeeklyForecast } from './daily-forecast';
import { calculateLifeTrend, type LifeTrendData, type LifeTrendPoint } from './life-trend';
import { PLANETS, ZODIAC_SIGNS, type PlanetId, type ZodiacId } from './constants';
import {
  applyInfluenceFactors,
  type InfluenceFactorConfig,
  type FactorContext,
  type FactorResult,
  type AppliedFactor,
  DEFAULT_FACTOR_CONFIG,
} from './influence-factors';
import { calculateDailyTransits, type TransitEvent, type DailyTransit } from './transits';
import { calculateAnnualProfection, type AnnualProfection } from './profections';
import { type AspectData } from './aspects';

// ============================================================
// 类型定义
// ============================================================

/**
 * 处理后的每日预测
 */
export interface ProcessedDailyForecast extends Omit<DailyForecast, 'dimensions'> {
  // 原始分数
  rawScore: number;
  
  // 影响因子结果
  factorResult: FactorResult;
  
  // 原始维度分数
  rawDimensions: {
    action: number;
    communication: number;
    emotion: number;
    creativity: number;
    focus: number;
  };
  
  // 维度分数（经过因子调整）
  dimensions: {
    career: number;
    relationship: number;
    health: number;
    finance: number;
    spiritual: number;
  };
  
  // 主要因子（前5个）
  topFactors: AppliedFactor[];
  
  // 处理状态
  processed: true;
}

/**
 * 处理后的周预测
 */
export interface ProcessedWeeklyForecast {
  startDate: Date;
  endDate: Date;
  days: ProcessedDailyForecast[];
  weeklyTheme: string;
  weeklyInsight: string;
  overallScore: number;
  
  // 周度因子汇总
  weeklyFactors: {
    positive: AppliedFactor[];
    negative: AppliedFactor[];
  };
  
  // 每日维度趋势
  dimensionTrends: {
    career: number[];
    relationship: number[];
    health: number[];
    finance: number[];
    spiritual: number[];
  };
}

/**
 * 处理后的人生趋势
 */
export interface ProcessedLifeTrend extends LifeTrendData {
  // 每个点的因子结果
  pointFactors: Map<number, FactorResult>;
  
  // 周期性因子分析
  cyclicFactors: {
    saturnCycle: { current: number; nextMajor: Date };
    jupiterCycle: { current: number; nextMajor: Date };
  };
}

/**
 * 综合用户数据快照
 */
export interface ProcessedUserSnapshot {
  timestamp: Date;
  
  // 本命盘基础信息
  natal: {
    sunSign: string;
    moonSign: string;
    risingSign: string;
    dominantPlanets: string[];
    chartRuler: string;
  };
  
  // 当前状态
  current: {
    age: number;
    profectionHouse: number;
    profectionTheme: string;
    lordOfYear: string;
    lordOfYearSign: string;
  };
  
  // 今日预测（经过因子处理）
  today: ProcessedDailyForecast;
  
  // 本周预测
  week: ProcessedWeeklyForecast;
  
  // 活跃因子
  activeFactors: AppliedFactor[];
  
  // 影响因子配置
  factorConfig: InfluenceFactorConfig;
}

// ============================================================
// 核心处理函数
// ============================================================

/**
 * 构建因子上下文
 */
export function buildFactorContext(
  chart: NatalChart,
  date: Date,
  rawScores: FactorContext['rawScores'],
  profection?: AnnualProfection,
  dailyForecast?: DailyForecast,
  transitAspects?: AspectData[]
): FactorContext {
  // 计算年龄
  const birthDate = chart.birthData.date;
  const age = Math.floor((date.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  // 如果没有提供年限法结果，计算它
  const prof = profection || calculateAnnualProfection(chart, age);
  
  // 如果没有提供每日预测，计算它
  const daily = dailyForecast || calculateDailyForecast(date, chart);
  
  return {
    natalChart: chart,
    date,
    rawScores,
    currentState: {
      age,
      profectionHouse: prof.house,
      lordOfYear: prof.lordOfYear,
      lunarPhase: daily.moonPhase?.phase || '新月期',
      planetaryDay: daily.planetaryDay || 'sun',
      planetaryHour: daily.planetaryHour || 'sun',
      moonSign: daily.moonSign || 'aries',
    },
    activeTransits: transitAspects || [],
  };
}

/**
 * 处理每日预测
 */
export function processDailyForecast(
  chart: NatalChart,
  date: Date,
  config: InfluenceFactorConfig = DEFAULT_FACTOR_CONFIG
): ProcessedDailyForecast {
  // 1. 获取原始每日预测
  const rawForecast = calculateDailyForecast(date, chart);
  
  // 2. 获取年龄和年限法
  const birthDate = chart.birthData.date;
  const age = Math.floor((date.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const profection = calculateAnnualProfection(chart, age);
  
  // 3. 获取活跃行运
  const transits = calculateDailyTransits(date, chart);
  
  // 4. 构建原始分数
  const rawScores = {
    overall: rawForecast.overallScore,
    dimensions: {
      career: 50 + Math.random() * 30, // 基础分数
      relationship: 50 + Math.random() * 30,
      health: 50 + Math.random() * 30,
      finance: 50 + Math.random() * 30,
      spiritual: 50 + Math.random() * 30,
    },
  };
  
  // 5. 构建因子上下文
  const context = buildFactorContext(
    chart,
    date,
    rawScores,
    profection,
    rawForecast,
    transits.aspects
  );
  
  // 6. 应用影响因子
  const factorResult = applyInfluenceFactors(context, config);
  
  // 7. 构建处理后的预测
  const { dimensions: _, ...forecastWithoutDimensions } = rawForecast;
  
  return {
    ...forecastWithoutDimensions,
    overallScore: factorResult.adjustedScores.overall,
    rawScore: rawForecast.overallScore,
    rawDimensions: rawForecast.dimensions,
    factorResult,
    dimensions: factorResult.adjustedScores.dimensions,
    topFactors: factorResult.appliedFactors.slice(0, 5),
    processed: true,
  };
}

/**
 * 处理周预测
 */
export function processWeeklyForecast(
  chart: NatalChart,
  startDate: Date,
  config: InfluenceFactorConfig = DEFAULT_FACTOR_CONFIG
): ProcessedWeeklyForecast {
  const days: ProcessedDailyForecast[] = [];
  const allPositiveFactors: AppliedFactor[] = [];
  const allNegativeFactors: AppliedFactor[] = [];
  
  const dimensionTrends: ProcessedWeeklyForecast['dimensionTrends'] = {
    career: [],
    relationship: [],
    health: [],
    finance: [],
    spiritual: [],
  };
  
  // 处理每一天
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const processed = processDailyForecast(chart, date, config);
    days.push(processed);
    
    // 收集因子
    for (const factor of processed.factorResult.appliedFactors) {
      if (factor.adjustment > 0) {
        allPositiveFactors.push(factor);
      } else if (factor.adjustment < 0) {
        allNegativeFactors.push(factor);
      }
    }
    
    // 收集维度趋势
    dimensionTrends.career.push(processed.dimensions.career);
    dimensionTrends.relationship.push(processed.dimensions.relationship);
    dimensionTrends.health.push(processed.dimensions.health);
    dimensionTrends.finance.push(processed.dimensions.finance);
    dimensionTrends.spiritual.push(processed.dimensions.spiritual);
  }
  
  // 计算周综合分数
  const overallScore = days.reduce((sum, d) => sum + d.overallScore, 0) / days.length;
  
  // 去重并排序因子
  const uniquePositive = deduplicateFactors(allPositiveFactors).slice(0, 5);
  const uniqueNegative = deduplicateFactors(allNegativeFactors).slice(0, 5);
  
  // 生成周主题和洞察
  const weeklyTheme = generateWeeklyTheme(uniquePositive, uniqueNegative);
  const weeklyInsight = generateWeeklyInsight(days, uniquePositive, uniqueNegative);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return {
    startDate,
    endDate,
    days,
    weeklyTheme,
    weeklyInsight,
    overallScore,
    weeklyFactors: {
      positive: uniquePositive,
      negative: uniqueNegative,
    },
    dimensionTrends,
  };
}

/**
 * 处理人生趋势
 */
export function processLifeTrend(
  chart: NatalChart,
  startYear: number,
  endYear: number,
  config: InfluenceFactorConfig = DEFAULT_FACTOR_CONFIG
): ProcessedLifeTrend {
  const rawTrend = calculateLifeTrend(chart, startYear, endYear);
  const pointFactors = new Map<number, FactorResult>();
  
  // 为每个关键点计算因子（重要行运年份）
  for (const point of rawTrend.points) {
    if (point.isMajorTransit) {
      const profection = calculateAnnualProfection(chart, point.age);
      const context = buildFactorContext(
        chart,
        point.date,
        {
          overall: point.overallScore,
          dimensions: point.dimensions,
        },
        profection
      );
      
      const factorResult = applyInfluenceFactors(context, config);
      pointFactors.set(point.age, factorResult);
      
      // 更新点的分数
      point.overallScore = factorResult.adjustedScores.overall;
    }
  }
  
  // 计算周期因子
  const currentAge = Math.floor(
    (new Date().getTime() - chart.birthData.date.getTime()) / 
    (365.25 * 24 * 60 * 60 * 1000)
  );
  
  const saturnCyclePosition = currentAge % 29.5;
  const jupiterCyclePosition = currentAge % 12;
  
  const nextSaturnMajor = new Date(chart.birthData.date);
  nextSaturnMajor.setFullYear(
    nextSaturnMajor.getFullYear() + Math.ceil(currentAge / 29.5) * 29.5
  );
  
  const nextJupiterMajor = new Date(chart.birthData.date);
  nextJupiterMajor.setFullYear(
    nextJupiterMajor.getFullYear() + Math.ceil(currentAge / 12) * 12
  );
  
  return {
    ...rawTrend,
    pointFactors,
    cyclicFactors: {
      saturnCycle: {
        current: saturnCyclePosition,
        nextMajor: nextSaturnMajor,
      },
      jupiterCycle: {
        current: jupiterCyclePosition,
        nextMajor: nextJupiterMajor,
      },
    },
  };
}

/**
 * 获取完整用户快照（经过因子处理）
 */
export function getProcessedUserSnapshot(
  chart: NatalChart,
  config: InfluenceFactorConfig = DEFAULT_FACTOR_CONFIG
): ProcessedUserSnapshot {
  const now = new Date();
  
  // 获取本命盘信息
  const sun = chart.planets.find(p => p.id === 'sun');
  const moon = chart.planets.find(p => p.id === 'moon');
  const risingSignIndex = Math.floor(chart.ascendant / 30);
  const rising = ZODIAC_SIGNS[risingSignIndex];
  
  // 计算年龄和获取年限法
  const birthDate = chart.birthData.date;
  const age = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const profection = calculateAnnualProfection(chart, age);
  const lordPlanet = PLANETS.find(p => p.id === profection.lordOfYear);
  const lordPlacement = chart.planets.find(p => p.id === profection.lordOfYear);
  
  // 获取今日和本周预测
  const today = processDailyForecast(chart, now, config);
  const week = processWeeklyForecast(chart, now, config);
  
  // 收集所有活跃因子
  const activeFactors = today.factorResult.appliedFactors;
  
  return {
    timestamp: now,
    natal: {
      sunSign: sun?.signName || '',
      moonSign: moon?.signName || '',
      risingSign: rising?.name || '',
      dominantPlanets: chart.dominantPlanets.map(
        id => PLANETS.find(p => p.id === id)?.name || ''
      ),
      chartRuler: PLANETS.find(p => p.id === chart.chartRuler)?.name || '',
    },
    current: {
      age: profection.age,
      profectionHouse: profection.house,
      profectionTheme: profection.houseTheme,
      lordOfYear: lordPlanet?.name || '',
      lordOfYearSign: lordPlacement?.signName || '',
    },
    today,
    week,
    activeFactors,
    factorConfig: config,
  };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 因子去重
 */
function deduplicateFactors(factors: AppliedFactor[]): AppliedFactor[] {
  const seen = new Set<string>();
  const result: AppliedFactor[] = [];
  
  // 按影响大小排序
  const sorted = [...factors].sort(
    (a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment)
  );
  
  for (const factor of sorted) {
    // 使用类型+名称作为去重键
    const key = `${factor.type}_${factor.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(factor);
    }
  }
  
  return result;
}

/**
 * 生成周主题
 */
function generateWeeklyTheme(
  positive: AppliedFactor[],
  negative: AppliedFactor[]
): string {
  const themes: string[] = [];
  
  // 基于正面因子
  if (positive.some(f => f.type === 'profectionLord')) {
    themes.push('年度主题深化');
  }
  if (positive.some(f => f.type === 'lunarPhase')) {
    themes.push('月相能量支持');
  }
  if (positive.some(f => f.type === 'dignity')) {
    themes.push('行星力量加持');
  }
  if (positive.some(f => f.type === 'personal')) {
    themes.push('个人能量共振');
  }
  
  // 基于负面因子
  if (negative.some(f => f.type === 'outerPlanet')) {
    themes.push('外行星考验');
  }
  if (negative.some(f => f.type === 'retrograde')) {
    themes.push('逆行反思期');
  }
  
  return themes.length > 0 ? themes.slice(0, 2).join(' · ') : '平稳过渡期';
}

/**
 * 生成周洞察
 */
function generateWeeklyInsight(
  days: ProcessedDailyForecast[],
  positive: AppliedFactor[],
  negative: AppliedFactor[]
): string {
  const avgScore = days.reduce((s, d) => s + d.overallScore, 0) / days.length;
  const bestDay = days.reduce((best, d) => d.overallScore > best.overallScore ? d : best);
  const worstDay = days.reduce((worst, d) => d.overallScore < worst.overallScore ? d : worst);
  
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  let insight = '';
  
  if (avgScore >= 70) {
    insight = `本周整体能量充沛。${weekdays[bestDay.date.getDay()]}最适合推进重要事项`;
  } else if (avgScore >= 50) {
    insight = `本周能量平稳。${weekdays[bestDay.date.getDay()]}为最佳行动日，${weekdays[worstDay.date.getDay()]}建议休整`;
  } else {
    insight = `本周需注意能量管理。建议${weekdays[worstDay.date.getDay()]}多休息，${weekdays[bestDay.date.getDay()]}再行动`;
  }
  
  // 添加主要因子提示
  if (positive.length > 0) {
    insight += `。有利因素：${positive[0].name}`;
  }
  if (negative.length > 0) {
    insight += `。需留意：${negative[0].name}`;
  }
  
  return insight;
}

// ============================================================
// 因子配置管理
// ============================================================

/**
 * 创建自定义因子配置
 */
export function createFactorConfig(
  overrides: Partial<InfluenceFactorConfig>
): InfluenceFactorConfig {
  return {
    ...DEFAULT_FACTOR_CONFIG,
    ...overrides,
    weights: {
      ...DEFAULT_FACTOR_CONFIG.weights,
      ...overrides.weights,
    },
    customFactors: [
      ...DEFAULT_FACTOR_CONFIG.customFactors,
      ...(overrides.customFactors || []),
    ],
  };
}

/**
 * 预设配置：保守模式（因子影响较小）
 */
export const CONSERVATIVE_FACTOR_CONFIG = createFactorConfig({
  weights: {
    dignity: 0.5,
    retrograde: 0.3,
    aspectPhase: 0.4,
    aspectOrb: 0.6,
    outerPlanet: 0.5,
    profectionLord: 0.4,
    lunarPhase: 0.3,
    planetaryHour: 0.1,
    personal: 0.5,
    custom: 1.0,
  },
});

/**
 * 预设配置：激进模式（因子影响较大）
 */
export const AGGRESSIVE_FACTOR_CONFIG = createFactorConfig({
  weights: {
    dignity: 1.0,
    retrograde: 0.9,
    aspectPhase: 0.9,
    aspectOrb: 1.0,
    outerPlanet: 1.0,
    profectionLord: 0.9,
    lunarPhase: 0.7,
    planetaryHour: 0.5,
    personal: 1.0,
    custom: 1.0,
  },
});

/**
 * 预设配置：关注特定维度
 */
export function createDimensionFocusConfig(
  dimension: 'career' | 'relationship' | 'health' | 'finance' | 'spiritual'
): InfluenceFactorConfig {
  const dimensionFactors: Record<string, Partial<InfluenceFactorConfig['weights']>> = {
    career: { profectionLord: 1.0, dignity: 1.0, outerPlanet: 0.9 },
    relationship: { lunarPhase: 0.9, personal: 1.0, aspectPhase: 0.9 },
    health: { retrograde: 0.9, planetaryHour: 0.5, lunarPhase: 0.7 },
    finance: { profectionLord: 0.9, dignity: 0.9, outerPlanet: 0.8 },
    spiritual: { outerPlanet: 1.0, lunarPhase: 0.8, personal: 0.9 },
  };
  
  return createFactorConfig({
    weights: {
      ...DEFAULT_FACTOR_CONFIG.weights,
      ...dimensionFactors[dimension],
    },
  });
}

