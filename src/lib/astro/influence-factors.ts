/**
 * Influence Factors Layer
 * 影响因子层
 * 
 * 这是数据处理的中间层：
 * 原始占星数据 → 影响因子层 → 最终输出
 * 
 * 影响因子分类：
 * 1. 行星因子 - 尊贵度、逆行、速度
 * 2. 相位因子 - 入相/出相、容许度衰减
 * 3. 周期因子 - 外行星长周期、年限法主星链
 * 4. 时间因子 - 日/月/年节律
 * 5. 个人因子 - 基于本命盘的个人化权重
 * 6. 自定义因子 - 用户/开发者自定义
 */

import {
  type PlanetId,
  type ZodiacId,
  PLANETS,
  ZODIAC_SIGNS,
  PLANET_WEIGHTS
} from './constants';
import { type NatalChart } from './natal-chart';
import { type AspectData } from './aspects';

// ============================================================
// 类型定义
// ============================================================

/**
 * 影响因子配置
 */
export interface InfluenceFactorConfig {
  // 全局开关
  enabled: boolean;
  
  // 各类因子权重 (0-1)
  weights: {
    dignity: number;       // 尊贵度因子
    retrograde: number;    // 逆行因子
    aspectPhase: number;   // 相位阶段因子
    aspectOrb: number;     // 容许度衰减因子
    outerPlanet: number;   // 外行星周期因子
    profectionLord: number; // 年限法主星因子
    lunarPhase: number;    // 月相因子
    planetaryHour: number; // 行星时因子
    personal: number;      // 个人化因子
    custom: number;        // 自定义因子
  };
  
  // 自定义因子
  customFactors: CustomFactor[];
}

/**
 * 自定义因子
 */
export interface CustomFactor {
  id: string;
  name: string;
  description: string;
  
  // 应用条件
  condition: {
    type: 'always' | 'date_range' | 'transit' | 'planet_in_sign' | 'aspect' | 'custom';
    params?: Record<string, unknown>;
  };
  
  // 影响维度与系数
  effects: {
    overall?: number;          // 综合评分调整 (-1 到 1)
    career?: number;
    relationship?: number;
    health?: number;
    finance?: number;
    spiritual?: number;
  };
  
  // 优先级
  priority: number;
}

/**
 * 因子计算上下文
 */
export interface FactorContext {
  natalChart: NatalChart;
  date: Date;
  
  // 原始数据
  rawScores: {
    overall: number;
    dimensions: {
      career: number;
      relationship: number;
      health: number;
      finance: number;
      spiritual: number;
    };
  };
  
  // 当前状态
  currentState: {
    age: number;
    profectionHouse: number;
    lordOfYear: PlanetId;
    lunarPhase: string;
    planetaryDay: PlanetId;
    planetaryHour: PlanetId;
    moonSign: ZodiacId;
  };
  
  // 活跃行运
  activeTransits: AspectData[];
}

/**
 * 因子计算结果
 */
export interface FactorResult {
  // 最终调整后的分数
  adjustedScores: {
    overall: number;
    dimensions: {
      career: number;
      relationship: number;
      health: number;
      finance: number;
      spiritual: number;
    };
  };
  
  // 应用的因子详情
  appliedFactors: AppliedFactor[];
  
  // 总调整量
  totalAdjustment: number;
  
  // 调整说明
  summary: string;
}

/**
 * 已应用的因子
 */
export interface AppliedFactor {
  id: string;
  name: string;
  type: string;
  adjustment: number;
  dimension: string;
  reason: string;
}

// ============================================================
// 默认配置
// ============================================================

export const DEFAULT_FACTOR_CONFIG: InfluenceFactorConfig = {
  enabled: true,
  weights: {
    dignity: 0.8,
    retrograde: 0.6,
    aspectPhase: 0.7,
    aspectOrb: 0.9,
    outerPlanet: 0.85,
    profectionLord: 0.75,
    lunarPhase: 0.5,
    planetaryHour: 0.3,
    personal: 0.8,
    custom: 1.0,
  },
  customFactors: [],
};

// ============================================================
// 尊贵度因子
// ============================================================

/**
 * 行星尊贵度表
 * 庙(domicile): +5, 旺(exaltation): +4
 * 陷(detriment): -5, 落(fall): -4
 */
const DIGNITY_TABLE: Record<PlanetId, Partial<Record<ZodiacId, number>>> = {
  sun: { leo: 5, aries: 4, aquarius: -5, libra: -4 },
  moon: { cancer: 5, taurus: 4, capricorn: -5, scorpio: -4 },
  mercury: { gemini: 5, virgo: 5, sagittarius: -5, pisces: -5 },
  venus: { taurus: 5, libra: 5, pisces: 4, aries: -5, scorpio: -5, virgo: -4 },
  mars: { aries: 5, scorpio: 5, capricorn: 4, libra: -5, taurus: -5, cancer: -4 },
  jupiter: { sagittarius: 5, pisces: 5, cancer: 4, gemini: -5, virgo: -5, capricorn: -4 },
  saturn: { capricorn: 5, aquarius: 5, libra: 4, cancer: -5, leo: -5, aries: -4 },
  uranus: { aquarius: 5, scorpio: 4, leo: -5, taurus: -4 },
  neptune: { pisces: 5, cancer: 4, virgo: -5, capricorn: -4 },
  pluto: { scorpio: 5, aries: 4, taurus: -5, libra: -4 },
  northNode: {},
  chiron: {},
};

/**
 * 计算尊贵度因子
 */
export function calculateDignityFactor(
  chart: NatalChart,
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  // 只计算内行星和发光体的尊贵度，避免累积过多
  const majorPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'];
  
  for (const planet of chart.planets) {
    if (!majorPlanets.includes(planet.id)) continue;
    
    const dignityScore = DIGNITY_TABLE[planet.id]?.[planet.sign] || 0;
    
    if (dignityScore !== 0) {
      // 降低调整值，从 10 降到 3
      const adjustment = (dignityScore / 5) * 3 * weight; // 最大±3分
      const planetInfo = PLANETS.find(p => p.id === planet.id);
      
      factors.push({
        id: `dignity_${planet.id}`,
        name: `${planetInfo?.name}尊贵度`,
        type: 'dignity',
        adjustment,
        dimension: 'overall',
        reason: dignityScore > 0 
          ? `${planetInfo?.name}在${planet.signName}${dignityScore === 5 ? '入庙' : '入旺'}，力量增强`
          : `${planetInfo?.name}在${planet.signName}${dignityScore === -5 ? '入陷' : '落陷'}，力量减弱`,
      });
    }
  }
  
  return factors;
}

// ============================================================
// 相位因子
// ============================================================

/**
 * 计算相位阶段因子（入相更强，出相减弱）
 */
export function calculateAspectPhaseFactor(
  aspects: AspectData[],
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  // 只取前3个最强相位，避免累积过多
  for (const aspect of aspects.slice(0, 3)) {
    // 入相位比出相位影响更强
    const phaseMultiplier = aspect.applying ? 1.1 : 0.8;
    // 降低基础调整值，从 5 降到 0.8
    const adjustment = aspect.weight * phaseMultiplier * 0.8 * weight;
    
    const p1 = PLANETS.find(p => p.id === aspect.planet1);
    const p2 = PLANETS.find(p => p.id === aspect.planet2);
    
    factors.push({
      id: `aspect_phase_${aspect.planet1}_${aspect.planet2}`,
      name: `${p1?.name}${aspect.aspectType}${p2?.name}`,
      type: 'aspectPhase',
      adjustment: aspect.applying ? adjustment : -adjustment * 0.5,
      dimension: 'overall',
      reason: aspect.applying 
        ? `入相位，影响正在增强` 
        : `出相位，影响正在消退`,
    });
  }
  
  return factors;
}

/**
 * 计算容许度衰减因子（越精确影响越大）
 */
export function calculateOrbDecayFactor(
  aspects: AspectData[],
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  // 只取前2个最精确的相位
  for (const aspect of aspects.slice(0, 2)) {
    // 精确度衰减：orb 越小，影响越大
    const orbDecay = Math.pow(aspect.strength, 1.5); // 非线性衰减
    // 降低基础调整值，从 3 降到 0.5
    const baseAdjustment = aspect.weight * 0.5;
    const adjustment = baseAdjustment * orbDecay * weight;
    
    if (aspect.orb < 1) {
      factors.push({
        id: `orb_exact_${aspect.planet1}_${aspect.planet2}`,
        name: `精确相位`,
        type: 'aspectOrb',
        adjustment: adjustment,
        dimension: 'overall',
        reason: `相位容许度仅 ${aspect.orb.toFixed(1)}°，影响极强`,
      });
    }
  }
  
  return factors;
}

// ============================================================
// 外行星周期因子
// ============================================================

/**
 * 外行星周期影响
 */
const OUTER_PLANET_CYCLES: Record<string, { period: number; theme: string; multiplier: number }> = {
  saturn: { period: 29.5, theme: '结构与责任', multiplier: 1.5 },
  uranus: { period: 84, theme: '变革与觉醒', multiplier: 1.3 },
  neptune: { period: 165, theme: '灵性与幻想', multiplier: 1.2 },
  pluto: { period: 248, theme: '转化与重生', multiplier: 1.4 },
};

/**
 * 计算外行星周期因子
 */
export function calculateOuterPlanetFactor(
  age: number,
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  // 土星周期关键点
  const saturnCycle = age % 29.5;
  if (saturnCycle < 1 || saturnCycle > 28.5) {
    factors.push({
      id: 'saturn_return',
      name: '土星回归',
      type: 'outerPlanet',
      adjustment: -15 * weight, // 挑战期
      dimension: 'overall',
      reason: '土星回归期，人生结构性调整与考验',
    });
  } else if (Math.abs(saturnCycle - 7) < 1) {
    factors.push({
      id: 'saturn_square_1',
      name: '土星四分',
      type: 'outerPlanet',
      adjustment: -8 * weight,
      dimension: 'career',
      reason: '土星四分期，事业面临压力测试',
    });
  } else if (Math.abs(saturnCycle - 14.75) < 1) {
    factors.push({
      id: 'saturn_opposition',
      name: '土星对冲',
      type: 'outerPlanet',
      adjustment: -10 * weight,
      dimension: 'overall',
      reason: '土星对冲期，需要平衡责任与自我',
    });
  }
  
  // 天王星对冲（约42岁）
  if (age >= 41 && age <= 43) {
    factors.push({
      id: 'uranus_opposition',
      name: '天王星对冲',
      type: 'outerPlanet',
      adjustment: -12 * weight,
      dimension: 'overall',
      reason: '中年觉醒危机，渴望打破常规',
    });
    factors.push({
      id: 'uranus_opposition_spiritual',
      name: '天王星觉醒',
      type: 'outerPlanet',
      adjustment: 15 * weight,
      dimension: 'spiritual',
      reason: '灵性觉醒的重要时期',
    });
  }
  
  // 凯龙回归（约50岁）
  if (age >= 49 && age <= 51) {
    factors.push({
      id: 'chiron_return',
      name: '凯龙回归',
      type: 'outerPlanet',
      adjustment: 10 * weight,
      dimension: 'spiritual',
      reason: '深层疗愈期，整合人生伤痛',
    });
  }
  
  return factors;
}

// ============================================================
// 年限法主星链因子
// ============================================================

/**
 * 计算年限法主星链因子
 */
export function calculateProfectionLordFactor(
  chart: NatalChart,
  lordOfYear: PlanetId,
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  // 找到年度主星在本命盘的位置
  const lordPlacement = chart.planets.find(p => p.id === lordOfYear);
  if (!lordPlacement) return factors;
  
  const lordInfo = PLANETS.find(p => p.id === lordOfYear);
  
  // 年度主星的尊贵度影响全年
  const dignityScore = DIGNITY_TABLE[lordOfYear]?.[lordPlacement.sign] || 0;
  if (dignityScore !== 0) {
    factors.push({
      id: 'lord_dignity',
      name: `年度主星${lordInfo?.name}尊贵度`,
      type: 'profectionLord',
      adjustment: (dignityScore / 5) * 15 * weight,
      dimension: 'overall',
      reason: dignityScore > 0 
        ? `年度主星${lordInfo?.name}在${lordPlacement.signName}力量强劲，全年运势加持`
        : `年度主星${lordInfo?.name}在${lordPlacement.signName}力量减弱，全年需更多努力`,
    });
  }
  
  // 年度主星所在宫位影响对应领域
  const houseInfluence: Record<number, { dim: string; name: string }> = {
    2: { dim: 'finance', name: '财务' },
    6: { dim: 'health', name: '健康' },
    7: { dim: 'relationship', name: '关系' },
    10: { dim: 'career', name: '事业' },
    12: { dim: 'spiritual', name: '灵性' },
  };
  
  const houseEffect = houseInfluence[lordPlacement.house];
  if (houseEffect) {
    factors.push({
      id: `lord_house_${houseEffect.dim}`,
      name: `年度主星在${lordPlacement.house}宫`,
      type: 'profectionLord',
      adjustment: 10 * weight,
      dimension: houseEffect.dim,
      reason: `年度主星${lordInfo?.name}在${lordPlacement.house}宫，${houseEffect.name}领域受到关注`,
    });
  }
  
  return factors;
}

// ============================================================
// 月相因子
// ============================================================

/**
 * 月相影响
 */
const LUNAR_PHASE_EFFECTS: Record<string, { overall: number; keywords: string[] }> = {
  '新月期': { overall: 5, keywords: ['开始', '播种', '设定意图'] },
  '眉月期': { overall: -3, keywords: ['挣扎', '突破', '建立动力'] },
  '上弦月期': { overall: 8, keywords: ['行动', '决策', '承诺'] },
  '盈凸月期': { overall: 5, keywords: ['完善', '准备', '调整'] },
  '满月期': { overall: 10, keywords: ['高峰', '收获', '照见'] },
  '亏凸月期': { overall: 3, keywords: ['分享', '传播', '教导'] },
  '下弦月期': { overall: -5, keywords: ['释放', '重估', '转向'] },
  '残月期': { overall: -8, keywords: ['结束', '休息', '预备'] },
};

/**
 * 计算月相因子
 */
export function calculateLunarPhaseFactor(
  lunarPhase: string,
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  const effect = LUNAR_PHASE_EFFECTS[lunarPhase];
  if (effect) {
    factors.push({
      id: 'lunar_phase',
      name: lunarPhase,
      type: 'lunarPhase',
      adjustment: effect.overall * weight,
      dimension: 'overall',
      reason: `${lunarPhase}：${effect.keywords.join('、')}`,
    });
  }
  
  return factors;
}

// ============================================================
// 行星时因子
// ============================================================

/**
 * 行星时影响
 */
const PLANETARY_HOUR_EFFECTS: Record<PlanetId, { overall: number; boost: string }> = {
  sun: { overall: 8, boost: 'career' },
  moon: { overall: 3, boost: 'relationship' },
  mercury: { overall: 5, boost: 'career' },
  venus: { overall: 7, boost: 'relationship' },
  mars: { overall: -3, boost: 'health' },
  jupiter: { overall: 10, boost: 'finance' },
  saturn: { overall: -5, boost: 'career' },
  uranus: { overall: 2, boost: 'spiritual' },
  neptune: { overall: 0, boost: 'spiritual' },
  pluto: { overall: -2, boost: 'spiritual' },
  northNode: { overall: 3, boost: 'spiritual' },
  chiron: { overall: 0, boost: 'health' },
};

/**
 * 计算行星时因子
 */
export function calculatePlanetaryHourFactor(
  planetaryHour: PlanetId,
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  const effect = PLANETARY_HOUR_EFFECTS[planetaryHour];
  const planetInfo = PLANETS.find(p => p.id === planetaryHour);
  
  if (effect && planetInfo) {
    factors.push({
      id: 'planetary_hour',
      name: `${planetInfo.name}时`,
      type: 'planetaryHour',
      adjustment: effect.overall * weight,
      dimension: 'overall',
      reason: `当前为${planetInfo.name}时，${effect.overall > 0 ? '能量提升' : '需要谨慎'}`,
    });
    
    if (effect.boost) {
      factors.push({
        id: `planetary_hour_boost_${effect.boost}`,
        name: `${planetInfo.name}时增益`,
        type: 'planetaryHour',
        adjustment: 5 * weight,
        dimension: effect.boost,
        reason: `${planetInfo.name}时有利于${effect.boost}相关事务`,
      });
    }
  }
  
  return factors;
}

// ============================================================
// 个人化因子
// ============================================================

/**
 * 计算个人化因子（基于本命盘配置）
 */
export function calculatePersonalFactor(
  chart: NatalChart,
  context: FactorContext,
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  // 基于主导元素的个人化调整
  const dominantElement = Object.entries(chart.elementBalance)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // 月亮星座与当日月亮星座的共鸣
  const natalMoon = chart.planets.find(p => p.id === 'moon');
  if (natalMoon && context.currentState.moonSign) {
    const natalMoonSign = ZODIAC_SIGNS.find(s => s.id === natalMoon.sign);
    const transitMoonSign = ZODIAC_SIGNS.find(s => s.id === context.currentState.moonSign);
    
    if (natalMoonSign && transitMoonSign) {
      // 同元素共鸣
      if (natalMoonSign.element === transitMoonSign.element) {
        factors.push({
          id: 'moon_element_resonance',
          name: '月亮元素共鸣',
          type: 'personal',
          adjustment: 8 * weight,
          dimension: 'relationship',
          reason: `今日月亮与你的本命月亮同为${natalMoonSign.element === 'fire' ? '火' : natalMoonSign.element === 'earth' ? '土' : natalMoonSign.element === 'air' ? '风' : '水'}象，情感共鸣增强`,
        });
      }
      
      // 同星座
      if (natalMoon.sign === context.currentState.moonSign) {
        factors.push({
          id: 'moon_sign_exact',
          name: '月亮回归',
          type: 'personal',
          adjustment: 12 * weight,
          dimension: 'overall',
          reason: `今日月亮回到你的本命月亮星座${natalMoon.signName}，情感能量特别敏感`,
        });
      }
    }
  }
  
  // 年度主星与本命盘主导行星的关系
  const lordOfYear = context.currentState.lordOfYear;
  if (chart.dominantPlanets.includes(lordOfYear)) {
    const lordInfo = PLANETS.find(p => p.id === lordOfYear);
    factors.push({
      id: 'lord_is_dominant',
      name: '主导行星主宰年',
      type: 'personal',
      adjustment: 10 * weight,
      dimension: 'overall',
      reason: `今年的年度主星${lordInfo?.name}正是你本命盘的主导行星之一，全年运势与个人特质高度共振`,
    });
  }
  
  return factors;
}

// ============================================================
// 自定义因子
// ============================================================

/**
 * 应用自定义因子
 */
export function applyCustomFactors(
  customFactors: CustomFactor[],
  context: FactorContext,
  weight: number
): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  
  for (const custom of customFactors) {
    // 检查条件是否满足
    if (!checkCustomCondition(custom.condition, context)) continue;
    
    // 应用效果
    for (const [dim, value] of Object.entries(custom.effects)) {
      if (value !== undefined) {
        factors.push({
          id: custom.id,
          name: custom.name,
          type: 'custom',
          adjustment: value * 20 * weight, // 自定义因子范围 -20 到 20
          dimension: dim,
          reason: custom.description,
        });
      }
    }
  }
  
  // 按优先级排序
  return factors.sort((a, b) => {
    const aCustom = customFactors.find(c => c.id === a.id);
    const bCustom = customFactors.find(c => c.id === b.id);
    return (bCustom?.priority || 0) - (aCustom?.priority || 0);
  });
}

/**
 * 检查自定义条件
 */
function checkCustomCondition(
  condition: CustomFactor['condition'],
  context: FactorContext
): boolean {
  switch (condition.type) {
    case 'always':
      return true;
      
    case 'date_range':
      const start = new Date(condition.params?.start as string);
      const end = new Date(condition.params?.end as string);
      return context.date >= start && context.date <= end;
      
    case 'transit':
      const transitPlanet = condition.params?.planet as string;
      return context.activeTransits.some(t => 
        t.planet1 === transitPlanet || t.planet2 === transitPlanet
      );
      
    case 'planet_in_sign':
      const planet = condition.params?.planet as string;
      const sign = condition.params?.sign as string;
      const placement = context.natalChart.planets.find(p => p.id === planet);
      return placement?.sign === sign;
      
    default:
      return false;
  }
}

// ============================================================
// 主计算函数
// ============================================================

/**
 * 应用所有影响因子
 */
export function applyInfluenceFactors(
  context: FactorContext,
  config: InfluenceFactorConfig = DEFAULT_FACTOR_CONFIG
): FactorResult {
  if (!config.enabled) {
    return {
      adjustedScores: context.rawScores,
      appliedFactors: [],
      totalAdjustment: 0,
      summary: '影响因子已禁用',
    };
  }
  
  const allFactors: AppliedFactor[] = [];
  
  // 1. 尊贵度因子
  if (config.weights.dignity > 0) {
    allFactors.push(...calculateDignityFactor(context.natalChart, config.weights.dignity));
  }
  
  // 2. 相位阶段因子
  if (config.weights.aspectPhase > 0) {
    allFactors.push(...calculateAspectPhaseFactor(context.activeTransits, config.weights.aspectPhase));
  }
  
  // 3. 容许度衰减因子
  if (config.weights.aspectOrb > 0) {
    allFactors.push(...calculateOrbDecayFactor(context.activeTransits, config.weights.aspectOrb));
  }
  
  // 4. 外行星周期因子
  if (config.weights.outerPlanet > 0) {
    allFactors.push(...calculateOuterPlanetFactor(context.currentState.age, config.weights.outerPlanet));
  }
  
  // 5. 年限法主星因子
  if (config.weights.profectionLord > 0) {
    allFactors.push(...calculateProfectionLordFactor(
      context.natalChart, 
      context.currentState.lordOfYear, 
      config.weights.profectionLord
    ));
  }
  
  // 6. 月相因子
  if (config.weights.lunarPhase > 0) {
    allFactors.push(...calculateLunarPhaseFactor(
      context.currentState.lunarPhase, 
      config.weights.lunarPhase
    ));
  }
  
  // 7. 行星时因子
  if (config.weights.planetaryHour > 0) {
    allFactors.push(...calculatePlanetaryHourFactor(
      context.currentState.planetaryHour, 
      config.weights.planetaryHour
    ));
  }
  
  // 8. 个人化因子
  if (config.weights.personal > 0) {
    allFactors.push(...calculatePersonalFactor(context.natalChart, context, config.weights.personal));
  }
  
  // 9. 自定义因子
  if (config.weights.custom > 0 && config.customFactors.length > 0) {
    allFactors.push(...applyCustomFactors(config.customFactors, context, config.weights.custom));
  }
  
  // 计算调整后的分数
  const adjustedScores = { ...context.rawScores };
  adjustedScores.dimensions = { ...context.rawScores.dimensions };
  
  let totalOverallAdjustment = 0;
  
  for (const factor of allFactors) {
    if (factor.dimension === 'overall') {
      adjustedScores.overall += factor.adjustment;
      totalOverallAdjustment += factor.adjustment;
    } else {
      const dim = factor.dimension as keyof typeof adjustedScores.dimensions;
      if (adjustedScores.dimensions[dim] !== undefined) {
        adjustedScores.dimensions[dim] += factor.adjustment;
      }
    }
  }
  
  // 归一化到合理范围
  adjustedScores.overall = Math.max(-100, Math.min(100, adjustedScores.overall));
  for (const dim of Object.keys(adjustedScores.dimensions) as (keyof typeof adjustedScores.dimensions)[]) {
    adjustedScores.dimensions[dim] = Math.max(0, Math.min(100, adjustedScores.dimensions[dim]));
  }
  
  // 生成摘要
  const positiveFactors = allFactors.filter(f => f.adjustment > 0);
  const negativeFactors = allFactors.filter(f => f.adjustment < 0);
  
  let summary = '';
  if (positiveFactors.length > 0) {
    summary += `有利因子：${positiveFactors.slice(0, 3).map(f => f.name).join('、')}`;
  }
  if (negativeFactors.length > 0) {
    if (summary) summary += '；';
    summary += `需注意：${negativeFactors.slice(0, 3).map(f => f.name).join('、')}`;
  }
  if (!summary) {
    summary = '当前无显著影响因子';
  }
  
  return {
    adjustedScores,
    appliedFactors: allFactors,
    totalAdjustment: totalOverallAdjustment,
    summary,
  };
}

// ============================================================
// 便捷函数
// ============================================================

/**
 * 快速获取调整后的分数
 */
export function getAdjustedScore(
  rawScore: number,
  context: FactorContext,
  config?: InfluenceFactorConfig
): number {
  const result = applyInfluenceFactors(context, config);
  return result.adjustedScores.overall;
}

/**
 * 获取影响因子摘要
 */
export function getFactorSummary(
  context: FactorContext,
  config?: InfluenceFactorConfig
): string {
  const result = applyInfluenceFactors(context, config);
  return result.summary;
}

/**
 * 创建自定义因子
 */
export function createCustomFactor(
  id: string,
  name: string,
  description: string,
  effects: CustomFactor['effects'],
  condition: CustomFactor['condition'] = { type: 'always' },
  priority: number = 0
): CustomFactor {
  return {
    id,
    name,
    description,
    condition,
    effects,
    priority,
  };
}

