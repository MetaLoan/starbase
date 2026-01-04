/**
 * Transit Calculator
 * 行运计算模块
 * 
 * 行运是最常用的"运势来源"
 * 天空中的行星走到本命盘关键点时，触发对应主题
 */

import { DateTime } from 'luxon';
import { 
  PLANETS, 
  PLANET_WEIGHTS,
  type PlanetId 
} from './constants';
import { 
  dateToJulianDay, 
  calculatePlanetPosition, 
  normalizeAngle 
} from './ephemeris';
import { 
  calculateTransitAspects, 
  calculateAspectScore,
  type AspectData, 
  type PlanetPosition 
} from './aspects';
import { type NatalChart } from './natal-chart';

export interface TransitEvent {
  date: Date;
  transitPlanet: PlanetId;
  natalPlanet: PlanetId;
  aspect: AspectData;
  phase: 'approaching' | 'exact' | 'separating';
  intensity: number;  // 0-100
  duration: {
    start: Date;
    peak: Date;
    end: Date;
  };
  interpretation: {
    theme: string;
    keywords: string[];
    advice: string;
  };
}

export interface TransitPeriod {
  startDate: Date;
  endDate: Date;
  events: TransitEvent[];
  overallScore: number;
  dominantThemes: string[];
}

export interface DailyTransit {
  date: Date;
  aspects: AspectData[];
  score: {
    total: number;
    harmonious: number;
    tense: number;
  };
  keyTheme: string;
  intensity: number;
}

/**
 * 获取指定日期的行运行星位置
 */
export function getTransitPositions(date: Date): PlanetPosition[] {
  const jd = dateToJulianDay(date);
  const positions: PlanetPosition[] = [];

  for (const planet of PLANETS) {
    const pos = calculatePlanetPosition(planet.id, jd);
    positions.push({
      id: planet.id as PlanetId,
      longitude: pos.longitude,
      latitude: pos.latitude,
    });
  }

  return positions;
}

/**
 * 计算指定日期的行运相位
 */
export function calculateDailyTransits(
  date: Date,
  natalChart: NatalChart
): DailyTransit {
  const transitPositions = getTransitPositions(date);
  const natalPositions: PlanetPosition[] = natalChart.planets.map(p => ({
    id: p.id,
    longitude: p.longitude,
    latitude: p.latitude,
  }));

  const aspects = calculateTransitAspects(transitPositions, natalPositions);
  const score = calculateAspectScore(aspects);

  // 确定主要主题
  let keyTheme = '平静期';
  if (aspects.length > 0) {
    const topAspect = aspects[0];
    const themes = getTransitTheme(topAspect.planet1, topAspect.planet2);
    keyTheme = themes.theme;
  }

  // 计算强度
  const intensity = Math.min(100, Math.abs(score.total) * 10 + aspects.length * 5);

  return {
    date,
    aspects,
    score: {
      total: score.total,
      harmonious: score.harmonious,
      tense: score.tense,
    },
    keyTheme,
    intensity,
  };
}

/**
 * 计算一段时间的行运趋势
 */
export function calculateTransitPeriod(
  startDate: Date,
  endDate: Date,
  natalChart: NatalChart,
  resolution: 'daily' | 'weekly' | 'monthly' = 'daily'
): TransitPeriod {
  const events: TransitEvent[] = [];
  const dailyTransits: DailyTransit[] = [];

  const step = resolution === 'daily' ? 1 : resolution === 'weekly' ? 7 : 30;
  let current = new Date(startDate);

  while (current <= endDate) {
    const daily = calculateDailyTransits(current, natalChart);
    dailyTransits.push(daily);

    // 检测重要行运事件
    for (const aspect of daily.aspects) {
      if (aspect.orb < 1) {  // 接近精确相位
        const event = createTransitEvent(current, aspect, natalChart);
        if (event) events.push(event);
      }
    }

    current = new Date(current.getTime() + step * 24 * 60 * 60 * 1000);
  }

  // 计算总体评分
  const avgScore = dailyTransits.reduce((sum, d) => sum + d.score.total, 0) / dailyTransits.length;

  // 提取主导主题
  const themeCount: Record<string, number> = {};
  for (const daily of dailyTransits) {
    themeCount[daily.keyTheme] = (themeCount[daily.keyTheme] || 0) + 1;
  }
  const dominantThemes = Object.entries(themeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);

  return {
    startDate,
    endDate,
    events,
    overallScore: avgScore,
    dominantThemes,
  };
}

/**
 * 创建行运事件详情
 */
function createTransitEvent(
  date: Date,
  aspect: AspectData,
  natalChart: NatalChart
): TransitEvent | null {
  const transitPlanet = PLANETS.find(p => p.id === aspect.planet1);
  const natalPlanet = PLANETS.find(p => p.id === aspect.planet2);
  
  if (!transitPlanet || !natalPlanet) return null;

  // 估算持续时间（根据行星速度）
  const durationDays = estimateTransitDuration(aspect.planet1);
  const peakDate = date;
  const startDate = new Date(date.getTime() - durationDays * 0.5 * 24 * 60 * 60 * 1000);
  const endDate = new Date(date.getTime() + durationDays * 0.5 * 24 * 60 * 60 * 1000);

  const theme = getTransitTheme(aspect.planet1, aspect.planet2);

  return {
    date,
    transitPlanet: aspect.planet1,
    natalPlanet: aspect.planet2,
    aspect,
    phase: aspect.applying ? 'approaching' : 'separating',
    intensity: aspect.strength * 100,
    duration: {
      start: startDate,
      peak: peakDate,
      end: endDate,
    },
    interpretation: theme,
  };
}

/**
 * 估算行运持续时间（天）
 */
function estimateTransitDuration(planetId: PlanetId): number {
  const durations: Record<string, number> = {
    sun: 2,
    moon: 0.5,
    mercury: 3,
    venus: 4,
    mars: 7,
    jupiter: 30,
    saturn: 60,
    uranus: 180,
    neptune: 365,
    pluto: 730,
    northNode: 60,
    chiron: 90,
  };
  return durations[planetId] || 7;
}

/**
 * 获取行运主题解读
 */
function getTransitTheme(
  transitPlanet: PlanetId,
  natalPlanet: PlanetId
): { theme: string; keywords: string[]; advice: string } {
  const themes: Record<string, Record<string, { theme: string; keywords: string[]; advice: string }>> = {
    saturn: {
      sun: {
        theme: '结构性挑战',
        keywords: ['责任', '限制', '成熟'],
        advice: '接受现实限制，在约束中建立坚实基础',
      },
      moon: {
        theme: '情感考验',
        keywords: ['孤独', '内省', '情感成熟'],
        advice: '正视内心需求，建立情感边界',
      },
      venus: {
        theme: '关系考验',
        keywords: ['承诺', '价值重估', '关系责任'],
        advice: '认真对待关系，决定什么值得长期投入',
      },
      mars: {
        theme: '行动受限',
        keywords: ['挫折', '耐心', '策略调整'],
        advice: '放慢脚步，用智慧而非蛮力突破障碍',
      },
      default: {
        theme: '土星压力期',
        keywords: ['责任', '结构', '考验'],
        advice: '面对现实，踏实前行',
      },
    },
    jupiter: {
      sun: {
        theme: '扩张与机遇',
        keywords: ['成长', '机会', '信心'],
        advice: '把握机会扩展视野，但避免过度膨胀',
      },
      moon: {
        theme: '情感丰盛',
        keywords: ['满足', '慷慨', '家庭祝福'],
        advice: '享受情感上的富足，与亲人分享喜悦',
      },
      venus: {
        theme: '爱与财富增长',
        keywords: ['爱情', '财运', '享乐'],
        advice: '开放心扉，接受生活的馈赠',
      },
      mars: {
        theme: '行动力增强',
        keywords: ['动力', '勇气', '扩张'],
        advice: '大胆行动，这是开拓新领域的好时机',
      },
      default: {
        theme: '木星扩张期',
        keywords: ['机遇', '成长', '幸运'],
        advice: '保持乐观，积极把握机会',
      },
    },
    pluto: {
      sun: {
        theme: '深度转化',
        keywords: ['重生', '权力', '核心变革'],
        advice: '接受深层蜕变，释放旧的自我认同',
      },
      moon: {
        theme: '情感净化',
        keywords: ['情感深度', '疗愈', '释放'],
        advice: '面对深层情感模式，允许它们转化',
      },
      default: {
        theme: '冥王星转化期',
        keywords: ['崩塌', '重生', '权力'],
        advice: '接受不可逆转的改变，在废墟中重建',
      },
    },
    uranus: {
      sun: {
        theme: '突破与觉醒',
        keywords: ['自由', '突变', '独立'],
        advice: '拥抱改变，允许自己与众不同',
      },
      default: {
        theme: '天王星震荡期',
        keywords: ['突变', '解放', '创新'],
        advice: '期待意外，在变动中发现新可能',
      },
    },
    neptune: {
      sun: {
        theme: '灵性觉醒',
        keywords: ['理想', '迷惘', '艺术'],
        advice: '追随灵感，但保持一定的现实锚定',
      },
      default: {
        theme: '海王星迷雾期',
        keywords: ['梦想', '幻想', '灵性'],
        advice: '保持敏感与创意，但注意分辨现实与幻想',
      },
    },
    mars: {
      default: {
        theme: '能量激活',
        keywords: ['行动', '冲动', '竞争'],
        advice: '运用增强的能量，但避免冲突',
      },
    },
    venus: {
      default: {
        theme: '爱与和谐',
        keywords: ['关系', '美', '愉悦'],
        advice: '享受和谐氛围，适合社交与创造美',
      },
    },
    mercury: {
      default: {
        theme: '沟通活跃',
        keywords: ['思考', '交流', '学习'],
        advice: '适合沟通、学习、处理信息',
      },
    },
    sun: {
      default: {
        theme: '生命力激活',
        keywords: ['活力', '自我表达', '创造'],
        advice: '发挥创造力，展现自我',
      },
    },
    moon: {
      default: {
        theme: '情绪波动',
        keywords: ['情感', '直觉', '需求'],
        advice: '关注情感需求，照顾内在小孩',
      },
    },
  };

  const planetThemes = themes[transitPlanet];
  if (!planetThemes) {
    return {
      theme: '行星能量互动',
      keywords: ['变化', '调整'],
      advice: '保持觉察，顺应变化',
    };
  }

  return planetThemes[natalPlanet] || planetThemes.default || {
    theme: '能量交互',
    keywords: ['变化'],
    advice: '保持觉察',
  };
}

/**
 * 查找重大行运事件
 * 如土星回归、木星回归等
 */
export function findMajorTransits(
  birthDate: Date,
  fromYear: number,
  toYear: number
): Array<{
  name: string;
  date: Date;
  description: string;
  significance: 'high' | 'medium' | 'low';
}> {
  const events: Array<{
    name: string;
    date: Date;
    description: string;
    significance: 'high' | 'medium' | 'low';
  }> = [];

  const birthJd = dateToJulianDay(birthDate);
  const birthPositions: Record<string, number> = {};
  
  for (const planet of PLANETS) {
    const pos = calculatePlanetPosition(planet.id, birthJd);
    birthPositions[planet.id] = pos.longitude;
  }

  // 土星回归（约 29.5 年周期）
  const saturnPeriod = 29.457; // 年
  let saturnReturnAge = saturnPeriod;
  while (saturnReturnAge < 100) {
    const returnDate = new Date(birthDate);
    returnDate.setFullYear(returnDate.getFullYear() + Math.floor(saturnReturnAge));
    
    if (returnDate.getFullYear() >= fromYear && returnDate.getFullYear() <= toYear) {
      const returnNumber = Math.round(saturnReturnAge / saturnPeriod);
      events.push({
        name: `第${returnNumber}次土星回归`,
        date: returnDate,
        description: returnNumber === 1 
          ? '人生结构性转折点，从青年进入成年的门槛，重新定义人生方向与责任'
          : returnNumber === 2
          ? '中年结构性调整，审视人生成就与遗产，重新评估剩余时光的使用'
          : '晚年智慧整合期',
        significance: 'high',
      });
    }
    saturnReturnAge += saturnPeriod;
  }

  // 木星回归（约 11.86 年周期）
  const jupiterPeriod = 11.86;
  let jupiterReturnAge = jupiterPeriod;
  while (jupiterReturnAge < 100) {
    const returnDate = new Date(birthDate);
    returnDate.setFullYear(returnDate.getFullYear() + Math.floor(jupiterReturnAge));
    
    if (returnDate.getFullYear() >= fromYear && returnDate.getFullYear() <= toYear) {
      events.push({
        name: `木星回归 (${Math.round(jupiterReturnAge)}岁)`,
        date: returnDate,
        description: '扩张与机遇周期重新开始，适合设定新的成长目标',
        significance: 'medium',
      });
    }
    jupiterReturnAge += jupiterPeriod;
  }

  // 天王星对冲（约 42 岁）
  const uranusOppositionAge = 42;
  const uranusOppositionDate = new Date(birthDate);
  uranusOppositionDate.setFullYear(uranusOppositionDate.getFullYear() + uranusOppositionAge);
  
  if (uranusOppositionDate.getFullYear() >= fromYear && uranusOppositionDate.getFullYear() <= toYear) {
    events.push({
      name: '天王星对冲',
      date: uranusOppositionDate,
      description: '中年觉醒危机，强烈渴望打破常规，追求真实自我',
      significance: 'high',
    });
  }

  // 凯龙回归（约 50 岁）
  const chironReturnAge = 50;
  const chironReturnDate = new Date(birthDate);
  chironReturnDate.setFullYear(chironReturnDate.getFullYear() + chironReturnAge);
  
  if (chironReturnDate.getFullYear() >= fromYear && chironReturnDate.getFullYear() <= toYear) {
    events.push({
      name: '凯龙回归',
      date: chironReturnDate,
      description: '深层疗愈周期，整合人生伤痛，成为自己的疗愈者',
      significance: 'high',
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * 生成行运趋势评分时间序列
 * 用于绘制趋势图
 */
export function generateTransitTimeline(
  natalChart: NatalChart,
  startDate: Date,
  endDate: Date,
  resolution: number = 7 // 天
): Array<{
  date: Date;
  score: number;
  harmonious: number;
  tense: number;
  keyPlanet: PlanetId | null;
}> {
  const timeline: Array<{
    date: Date;
    score: number;
    harmonious: number;
    tense: number;
    keyPlanet: PlanetId | null;
  }> = [];

  let current = new Date(startDate);
  
  while (current <= endDate) {
    const daily = calculateDailyTransits(current, natalChart);
    
    let keyPlanet: PlanetId | null = null;
    if (daily.aspects.length > 0) {
      keyPlanet = daily.aspects[0].planet1;
    }

    timeline.push({
      date: new Date(current),
      score: daily.score.total,
      harmonious: daily.score.harmonious,
      tense: daily.score.tense,
      keyPlanet,
    });

    current = new Date(current.getTime() + resolution * 24 * 60 * 60 * 1000);
  }

  return timeline;
}

