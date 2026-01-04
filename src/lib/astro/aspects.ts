/**
 * Aspect Calculator
 * 相位计算模块
 */

import { ASPECTS, PLANETS, PLANET_WEIGHTS, type AspectId, type PlanetId } from './constants';
import { angleDifference, normalizeAngle } from './ephemeris';

export interface AspectData {
  planet1: PlanetId;
  planet2: PlanetId;
  aspectType: AspectId;
  exactAngle: number;
  actualAngle: number;
  orb: number;
  applying: boolean;  // 入相位 vs 出相位
  strength: number;   // 0-1，越接近精确越强
  weight: number;     // 综合权重
}

export interface PlanetPosition {
  id: PlanetId;
  longitude: number;
  latitude: number;
  speed?: number;  // 用于判断入相位/出相位
}

/**
 * 检测两个行星之间是否形成相位
 */
export function detectAspect(
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  aspectDef: typeof ASPECTS[number]
): AspectData | null {
  const actualAngle = angleDifference(planet1.longitude, planet2.longitude);
  const orb = Math.abs(actualAngle - aspectDef.angle);

  if (orb <= aspectDef.orb) {
    // 计算相位强度（越接近精确越强）
    const strength = 1 - orb / aspectDef.orb;

    // 判断入相位/出相位
    let applying = true;
    if (planet1.speed !== undefined && planet2.speed !== undefined) {
      const relativeSpeed = planet1.speed - planet2.speed;
      const diff = normalizeAngle(planet2.longitude - planet1.longitude);
      applying = (diff < 180 && relativeSpeed > 0) || (diff >= 180 && relativeSpeed < 0);
    }

    // 计算综合权重
    const p1Weight = PLANET_WEIGHTS[planet1.id as keyof typeof PLANET_WEIGHTS] || 1;
    const p2Weight = PLANET_WEIGHTS[planet2.id as keyof typeof PLANET_WEIGHTS] || 1;
    const weight = strength * aspectDef.weight * (p1Weight + p2Weight) / 20;

    return {
      planet1: planet1.id,
      planet2: planet2.id,
      aspectType: aspectDef.id as AspectId,
      exactAngle: aspectDef.angle,
      actualAngle,
      orb,
      applying,
      strength,
      weight,
    };
  }

  return null;
}

/**
 * 计算所有行星之间的相位
 */
export function calculateAllAspects(
  positions: PlanetPosition[],
  aspectTypes: AspectId[] = ['conjunction', 'opposition', 'trine', 'square', 'sextile']
): AspectData[] {
  const aspects: AspectData[] = [];
  const selectedAspects = ASPECTS.filter(a => aspectTypes.includes(a.id as AspectId));

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      for (const aspectDef of selectedAspects) {
        const aspect = detectAspect(positions[i], positions[j], aspectDef);
        if (aspect) {
          aspects.push(aspect);
        }
      }
    }
  }

  // 按权重排序
  return aspects.sort((a, b) => b.weight - a.weight);
}

/**
 * 计算行运行星与本命行星之间的相位
 */
export function calculateTransitAspects(
  transitPositions: PlanetPosition[],
  natalPositions: PlanetPosition[],
  aspectTypes: AspectId[] = ['conjunction', 'opposition', 'trine', 'square', 'sextile']
): AspectData[] {
  const aspects: AspectData[] = [];
  const selectedAspects = ASPECTS.filter(a => aspectTypes.includes(a.id as AspectId));

  for (const transit of transitPositions) {
    for (const natal of natalPositions) {
      for (const aspectDef of selectedAspects) {
        const aspect = detectAspect(transit, natal, aspectDef);
        if (aspect) {
          aspects.push(aspect);
        }
      }
    }
  }

  return aspects.sort((a, b) => b.weight - a.weight);
}

/**
 * 获取相位的解释
 */
export function getAspectInterpretation(aspect: AspectData): {
  nature: string;
  keywords: string[];
  description: string;
} {
  const aspectDef = ASPECTS.find(a => a.id === aspect.aspectType);
  const p1 = PLANETS.find(p => p.id === aspect.planet1);
  const p2 = PLANETS.find(p => p.id === aspect.planet2);

  if (!aspectDef || !p1 || !p2) {
    return { nature: 'unknown', keywords: [], description: '' };
  }

  const interpretations: Record<string, { keywords: string[]; description: string }> = {
    conjunction: {
      keywords: ['融合', '强化', '聚焦'],
      description: `${p1.name}与${p2.name}能量融合，产生强烈的集中效应`,
    },
    opposition: {
      keywords: ['张力', '觉察', '整合'],
      description: `${p1.name}与${p2.name}形成对峙，需要在两极间寻求平衡`,
    },
    trine: {
      keywords: ['流动', '天赋', '和谐'],
      description: `${p1.name}与${p2.name}能量自然流动，带来顺遂与机会`,
    },
    square: {
      keywords: ['摩擦', '动力', '挑战'],
      description: `${p1.name}与${p2.name}产生内在冲突，驱动成长与改变`,
    },
    sextile: {
      keywords: ['机会', '合作', '发展'],
      description: `${p1.name}与${p2.name}形成支持性连接，有利于创造与合作`,
    },
    quincunx: {
      keywords: ['调整', '不适', '整合'],
      description: `${p1.name}与${p2.name}需要不断调整与适应`,
    },
  };

  const interp = interpretations[aspect.aspectType] || { keywords: [], description: '' };

  return {
    nature: aspectDef.harmony,
    keywords: interp.keywords,
    description: interp.description,
  };
}

/**
 * 计算相位图案（大三角、T三角、大十字等）
 */
export interface AspectPattern {
  type: 'grand_trine' | 't_square' | 'grand_cross' | 'yod' | 'stellium' | 'kite';
  planets: PlanetId[];
  element?: string;
  modality?: string;
  description: string;
}

export function detectAspectPatterns(
  positions: PlanetPosition[],
  aspects: AspectData[]
): AspectPattern[] {
  const patterns: AspectPattern[] = [];

  // 检测群星（Stellium）：4+行星在同一星座内（30度）
  const longitudeGroups: Record<number, PlanetPosition[]> = {};
  for (const pos of positions) {
    const sign = Math.floor(pos.longitude / 30);
    if (!longitudeGroups[sign]) longitudeGroups[sign] = [];
    longitudeGroups[sign].push(pos);
  }
  for (const planets of Object.values(longitudeGroups)) {
    if (planets.length >= 4) {
      patterns.push({
        type: 'stellium',
        planets: planets.map(p => p.id),
        description: `${planets.length}颗行星聚集形成群星，能量高度集中`,
      });
    }
  }

  // 检测大三角（Grand Trine）
  const trines = aspects.filter(a => a.aspectType === 'trine');
  for (let i = 0; i < trines.length; i++) {
    for (let j = i + 1; j < trines.length; j++) {
      const t1 = trines[i];
      const t2 = trines[j];
      // 检查是否共享一个行星且形成闭环
      const planets = new Set([t1.planet1, t1.planet2, t2.planet1, t2.planet2]);
      if (planets.size === 3) {
        // 检查第三条边
        const planetArray = Array.from(planets);
        const thirdTrine = trines.find(t =>
          (t.planet1 === planetArray[0] && t.planet2 === planetArray[2]) ||
          (t.planet1 === planetArray[2] && t.planet2 === planetArray[0]) ||
          (t.planet1 === planetArray[1] && t.planet2 === planetArray[2]) ||
          (t.planet1 === planetArray[2] && t.planet2 === planetArray[1])
        );
        if (thirdTrine) {
          patterns.push({
            type: 'grand_trine',
            planets: planetArray,
            description: '大三角：能量流动顺畅，天赋与幸运的三角循环',
          });
        }
      }
    }
  }

  // 检测 T 三角
  const squares = aspects.filter(a => a.aspectType === 'square');
  const oppositions = aspects.filter(a => a.aspectType === 'opposition');

  for (const opp of oppositions) {
    for (const sq1 of squares) {
      if (sq1.planet1 === opp.planet1 || sq1.planet2 === opp.planet1) {
        const apex = sq1.planet1 === opp.planet1 ? sq1.planet2 : sq1.planet1;
        const sq2 = squares.find(sq =>
          (sq.planet1 === apex && sq.planet2 === opp.planet2) ||
          (sq.planet2 === apex && sq.planet1 === opp.planet2)
        );
        if (sq2) {
          patterns.push({
            type: 't_square',
            planets: [opp.planet1, opp.planet2, apex],
            description: 'T三角：内在张力驱动行动，顶点行星是释放点',
          });
        }
      }
    }
  }

  return patterns;
}

/**
 * 计算相位总分（用于趋势分析）
 */
export function calculateAspectScore(aspects: AspectData[]): {
  total: number;
  harmonious: number;
  tense: number;
  neutral: number;
} {
  let harmonious = 0;
  let tense = 0;
  let neutral = 0;

  for (const aspect of aspects) {
    const aspectDef = ASPECTS.find(a => a.id === aspect.aspectType);
    if (!aspectDef) continue;

    const score = aspect.weight;
    switch (aspectDef.harmony) {
      case 'harmonious':
        harmonious += score;
        break;
      case 'tense':
        tense += score;
        break;
      default:
        neutral += score;
    }
  }

  return {
    total: harmonious - tense * 0.5 + neutral * 0.3,
    harmonious,
    tense,
    neutral,
  };
}

