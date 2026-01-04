/**
 * Natal Chart Calculator
 * 本命盘计算模块
 */

import { DateTime } from 'luxon';
import { 
  ZODIAC_SIGNS, 
  PLANETS, 
  HOUSES, 
  ELEMENTS, 
  MODALITIES,
  type PlanetId, 
  type ZodiacId,
  type ElementType,
  type ModalityType 
} from './constants';
import { 
  dateToJulianDay, 
  calculatePlanetPosition, 
  calculateHouseCusps, 
  calculateAscendant, 
  calculateMidheaven,
  normalizeAngle
} from './ephemeris';
import { 
  calculateAllAspects, 
  detectAspectPatterns, 
  type AspectData, 
  type AspectPattern,
  type PlanetPosition 
} from './aspects';

export interface BirthData {
  date: Date;
  latitude: number;
  longitude: number;
  timezone: string;
  name?: string;
}

export interface PlanetPlacement {
  id: PlanetId;
  name: string;
  symbol: string;
  longitude: number;
  latitude: number;
  sign: ZodiacId;
  signName: string;
  signSymbol: string;
  signDegree: number;  // 在该星座内的度数 (0-30)
  house: number;
  retrograde: boolean;
  dignityScore: number;  // 尊贵/落陷分数
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: ZodiacId;
  signDegree: number;
}

export interface NatalChart {
  birthData: BirthData;
  julianDay: number;
  planets: PlanetPlacement[];
  houses: HouseCusp[];
  ascendant: number;
  midheaven: number;
  aspects: AspectData[];
  patterns: AspectPattern[];
  elementBalance: Record<ElementType, number>;
  modalityBalance: Record<ModalityType, number>;
  dominantPlanets: PlanetId[];
  chartRuler: PlanetId;
}

/**
 * 根据黄经获取星座
 */
function getZodiacSign(longitude: number): typeof ZODIAC_SIGNS[number] {
  const normalizedLong = normalizeAngle(longitude);
  const signIndex = Math.floor(normalizedLong / 30);
  return ZODIAC_SIGNS[signIndex];
}

/**
 * 获取行星在星座内的度数
 */
function getSignDegree(longitude: number): number {
  return normalizeAngle(longitude) % 30;
}

/**
 * 判断行星所在宫位
 */
function getHouse(longitude: number, houseCusps: number[]): number {
  const normalizedLong = normalizeAngle(longitude);
  
  for (let i = 0; i < 12; i++) {
    const nextHouse = (i + 1) % 12;
    let start = houseCusps[i];
    let end = houseCusps[nextHouse];
    
    // 处理跨 0 度的情况
    if (end < start) {
      if (normalizedLong >= start || normalizedLong < end) {
        return i + 1;
      }
    } else {
      if (normalizedLong >= start && normalizedLong < end) {
        return i + 1;
      }
    }
  }
  
  return 1; // 默认
}

/**
 * 计算行星尊贵度（简化版）
 */
function calculateDignity(planetId: PlanetId, signId: ZodiacId): number {
  const dignities: Record<string, Record<string, number>> = {
    sun: { leo: 5, aries: 4, aquarius: -5, libra: -4 },
    moon: { cancer: 5, taurus: 4, capricorn: -5, scorpio: -4 },
    mercury: { gemini: 5, virgo: 5, sagittarius: -5, pisces: -5 },
    venus: { taurus: 5, libra: 5, pisces: 4, aries: -5, scorpio: -5, virgo: -4 },
    mars: { aries: 5, scorpio: 5, capricorn: 4, libra: -5, taurus: -5, cancer: -4 },
    jupiter: { sagittarius: 5, pisces: 5, cancer: 4, gemini: -5, virgo: -5, capricorn: -4 },
    saturn: { capricorn: 5, aquarius: 5, libra: 4, cancer: -5, leo: -5, aries: -4 },
    uranus: { aquarius: 5, leo: -5 },
    neptune: { pisces: 5, virgo: -5 },
    pluto: { scorpio: 5, taurus: -5 },
  };

  return dignities[planetId]?.[signId] || 0;
}

/**
 * 计算完整本命盘
 */
export function calculateNatalChart(birthData: BirthData): NatalChart {
  const jd = dateToJulianDay(birthData.date);
  
  // 计算宫位
  const houseCusps = calculateHouseCusps(jd, birthData.latitude, birthData.longitude);
  const ascendant = calculateAscendant(jd, birthData.latitude, birthData.longitude);
  const midheaven = calculateMidheaven(jd, birthData.longitude);
  
  // 计算行星位置
  const planets: PlanetPlacement[] = [];
  const planetPositions: PlanetPosition[] = [];
  
  for (const planet of PLANETS) {
    const pos = calculatePlanetPosition(planet.id, jd);
    const sign = getZodiacSign(pos.longitude);
    const house = getHouse(pos.longitude, houseCusps);
    const signDegree = getSignDegree(pos.longitude);
    
    const placement: PlanetPlacement = {
      id: planet.id as PlanetId,
      name: planet.name,
      symbol: planet.symbol,
      longitude: pos.longitude,
      latitude: pos.latitude,
      sign: sign.id as ZodiacId,
      signName: sign.name,
      signSymbol: sign.symbol,
      signDegree,
      house,
      retrograde: false, // 需要计算速度来判断
      dignityScore: calculateDignity(planet.id as PlanetId, sign.id as ZodiacId),
    };
    
    planets.push(placement);
    planetPositions.push({
      id: planet.id as PlanetId,
      longitude: pos.longitude,
      latitude: pos.latitude,
    });
  }
  
  // 计算宫位信息
  const houses: HouseCusp[] = houseCusps.map((cusp, index) => {
    const sign = getZodiacSign(cusp);
    return {
      house: index + 1,
      longitude: cusp,
      sign: sign.id as ZodiacId,
      signDegree: getSignDegree(cusp),
    };
  });
  
  // 计算相位
  const aspects = calculateAllAspects(planetPositions);
  
  // 检测相位图案
  const patterns = detectAspectPatterns(planetPositions, aspects);
  
  // 计算元素平衡
  const elementBalance: Record<ElementType, number> = {
    fire: 0, earth: 0, air: 0, water: 0
  };
  
  // 计算模式平衡
  const modalityBalance: Record<ModalityType, number> = {
    cardinal: 0, fixed: 0, mutable: 0
  };
  
  // 行星权重用于平衡计算
  const planetWeights: Record<string, number> = {
    sun: 4, moon: 4, mercury: 3, venus: 3, mars: 3,
    jupiter: 2, saturn: 2, uranus: 1, neptune: 1, pluto: 1
  };
  
  for (const planet of planets) {
    const sign = ZODIAC_SIGNS.find(s => s.id === planet.sign);
    if (sign) {
      const weight = planetWeights[planet.id] || 1;
      elementBalance[sign.element as ElementType] += weight;
      modalityBalance[sign.modality as ModalityType] += weight;
    }
  }
  
  // 确定主导行星（根据尊贵度、相位数量等）
  const planetScores = planets.map(p => {
    const aspectCount = aspects.filter(a => a.planet1 === p.id || a.planet2 === p.id).length;
    return {
      id: p.id,
      score: p.dignityScore * 2 + aspectCount + (p.house <= 4 ? 2 : 0)
    };
  }).sort((a, b) => b.score - a.score);
  
  const dominantPlanets = planetScores.slice(0, 3).map(p => p.id);
  
  // 盘主星（上升星座守护星）
  const ascSign = getZodiacSign(ascendant);
  const chartRuler = ascSign.ruler as PlanetId;
  
  return {
    birthData,
    julianDay: jd,
    planets,
    houses,
    ascendant,
    midheaven,
    aspects,
    patterns,
    elementBalance,
    modalityBalance,
    dominantPlanets,
    chartRuler,
  };
}

/**
 * 生成本命盘摘要
 */
export function generateChartSummary(chart: NatalChart): string {
  const sun = chart.planets.find(p => p.id === 'sun');
  const moon = chart.planets.find(p => p.id === 'moon');
  const asc = getZodiacSign(chart.ascendant);
  
  const dominantElement = Object.entries(chart.elementBalance)
    .sort((a, b) => b[1] - a[1])[0][0] as ElementType;
  
  const dominantModality = Object.entries(chart.modalityBalance)
    .sort((a, b) => b[1] - a[1])[0][0] as ModalityType;
  
  return `
太阳 ${sun?.signName} ${sun?.house}宫 | 月亮 ${moon?.signName} ${moon?.house}宫 | 上升 ${asc.name}

主导元素：${ELEMENTS[dominantElement].name}（${ELEMENTS[dominantElement].keywords.join('、')}）
主导模式：${MODALITIES[dominantModality].name}（${MODALITIES[dominantModality].keywords.join('、')}）

盘主星：${PLANETS.find(p => p.id === chart.chartRuler)?.name}
主导行星：${chart.dominantPlanets.map(id => PLANETS.find(p => p.id === id)?.name).join('、')}

相位图案：${chart.patterns.length > 0 ? chart.patterns.map(p => p.description).join('；') : '无特殊图案'}
`.trim();
}

/**
 * 获取行星详细解读
 */
export function getPlanetInterpretation(placement: PlanetPlacement): {
  title: string;
  keywords: string[];
  description: string;
} {
  const planet = PLANETS.find(p => p.id === placement.id);
  const sign = ZODIAC_SIGNS.find(s => s.id === placement.sign);
  const house = HOUSES.find(h => h.id === placement.house);
  
  if (!planet || !sign || !house) {
    return { title: '', keywords: [], description: '' };
  }
  
  return {
    title: `${planet.name} ${sign.name} ${house.name}`,
    keywords: [...house.keywords.slice(0, 2)],
    description: `${planet.name}落在${sign.name}${house.name}，将${house.theme}主题与${sign.name}的特质结合。${
      placement.dignityScore > 0 ? '这是一个有力的配置。' : 
      placement.dignityScore < 0 ? '这个位置需要更多努力来整合能量。' : ''
    }`,
  };
}

