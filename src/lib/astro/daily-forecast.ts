/**
 * Daily & Hourly Forecast Calculator
 * 每日/每时运势推演模块
 * 
 * 核心逻辑：
 * - 月亮是快变量（约2.5天换座），主导日内情绪节律
 * - 内行星（水金火）主导周级变化
 * - 行运相位的精确度决定当日强度
 */

import { DateTime } from 'luxon';
import { 
  PLANETS, 
  ZODIAC_SIGNS,
  HOUSES,
  type PlanetId,
  type ZodiacId 
} from './constants';
import { 
  dateToJulianDay, 
  calculatePlanetPosition, 
  normalizeAngle,
  angleDifference
} from './ephemeris';
import { 
  calculateTransitAspects,
  calculateAspectScore,
  type AspectData,
  type PlanetPosition 
} from './aspects';
import { type NatalChart } from './natal-chart';

// ============================================================
// 类型定义
// ============================================================

export interface HourlyForecast {
  hour: number;
  date: Date;
  moonLongitude: number;
  moonSign: ZodiacId;
  moonSignName: string;
  moonHouse: number;
  score: number;
  mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
  keywords: string[];
  bestFor: string[];
  avoidFor: string[];
}

export interface DailyForecast {
  date: Date;
  dayOfWeek: string;
  planetaryDay: PlanetId;  // 传统行星日
  planetaryHour: PlanetId; // 当前行星时
  
  // 月亮信息
  moonPhase: {
    phase: string;
    illumination: number;
    isVoidOfCourse: boolean;
    voidStart?: Date;
    voidEnd?: Date;
  };
  moonSign: ZodiacId;
  moonSignName: string;
  
  // 评分
  overallScore: number;
  dimensions: {
    action: number;      // 行动力
    communication: number; // 沟通
    emotion: number;     // 情感
    creativity: number;  // 创造力
    focus: number;       // 专注力
  };
  
  // 行运相位
  activeAspects: Array<{
    transitPlanet: PlanetId;
    natalPlanet: PlanetId;
    aspectType: string;
    exactness: number;  // 0-100，越高越精确
    applying: boolean;
    interpretation: string;
  }>;
  
  // 建议
  theme: string;
  advice: string;
  luckyHours: number[];
  challengingHours: number[];
  
  // 小时详情
  hourlyBreakdown: HourlyForecast[];
}

export interface WeeklyForecast {
  startDate: Date;
  endDate: Date;
  weekNumber: number;
  
  // 周概览
  overallTheme: string;
  keyDates: Array<{
    date: Date;
    event: string;
    significance: 'high' | 'medium' | 'low';
  }>;
  
  // 每日摘要
  dailySummaries: Array<{
    date: Date;
    dayOfWeek: string;
    score: number;
    moonSign: ZodiacId;
    theme: string;
  }>;
  
  // 本周行运
  weeklyTransits: Array<{
    planet: PlanetId;
    aspect: string;
    natalPlanet: PlanetId;
    peakDate: Date;
    description: string;
  }>;
  
  // 建议
  bestDaysFor: {
    action: Date[];
    communication: Date[];
    rest: Date[];
    creativity: Date[];
  };
}

// ============================================================
// 行星日/行星时 (Chaldean Order)
// ============================================================

const CHALDEAN_ORDER: PlanetId[] = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];
const DAY_RULERS: PlanetId[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

/**
 * 获取行星日（周日=太阳，周一=月亮...）
 */
export function getPlanetaryDay(date: Date): PlanetId {
  const dayOfWeek = date.getDay(); // 0=Sunday
  return DAY_RULERS[dayOfWeek];
}

/**
 * 获取行星时
 * 日出后第一个小时由当日行星主宰，之后按迦勒底序列轮转
 */
export function getPlanetaryHour(date: Date, sunriseHour: number = 6): PlanetId {
  const dayRuler = getPlanetaryDay(date);
  const startIndex = CHALDEAN_ORDER.indexOf(dayRuler);
  const hour = date.getHours();
  
  // 简化：假设日出6点，每小时轮转
  const hoursSinceSunrise = (hour - sunriseHour + 24) % 24;
  const planetIndex = (startIndex + hoursSinceSunrise) % 7;
  
  return CHALDEAN_ORDER[planetIndex];
}

// ============================================================
// 月相计算
// ============================================================

/**
 * 计算月相
 */
export function calculateMoonPhase(date: Date): {
  phase: string;
  illumination: number;
  angle: number;
} {
  const jd = dateToJulianDay(date);
  const sunPos = calculatePlanetPosition('sun', jd);
  const moonPos = calculatePlanetPosition('moon', jd);
  
  const angle = normalizeAngle(moonPos.longitude - sunPos.longitude);
  const illumination = (1 - Math.cos(angle * Math.PI / 180)) / 2 * 100;
  
  let phase: string;
  if (angle < 22.5 || angle >= 337.5) phase = '新月';
  else if (angle < 67.5) phase = '眉月';
  else if (angle < 112.5) phase = '上弦月';
  else if (angle < 157.5) phase = '盈凸月';
  else if (angle < 202.5) phase = '满月';
  else if (angle < 247.5) phase = '亏凸月';
  else if (angle < 292.5) phase = '下弦月';
  else phase = '残月';
  
  return { phase, illumination, angle };
}

/**
 * 检测月亮空亡（Void of Course）
 * 月亮在离开当前星座前不再形成任何主要相位
 */
export function checkVoidOfCourse(
  date: Date,
  natalChart: NatalChart
): { isVoid: boolean; voidStart?: Date; voidEnd?: Date } {
  // 简化实现：检查未来24小时内月亮是否有精确相位
  const jd = dateToJulianDay(date);
  const moonPos = calculatePlanetPosition('moon', jd);
  const currentSign = Math.floor(moonPos.longitude / 30);
  
  // 月亮大约每2.5天换座
  const hoursUntilSignChange = ((currentSign + 1) * 30 - moonPos.longitude) / 0.5; // 月亮约每小时走0.5度
  
  // 检查在换座前是否有精确相位
  let hasAspect = false;
  for (let h = 0; h < Math.min(hoursUntilSignChange, 48); h++) {
    const checkDate = new Date(date.getTime() + h * 60 * 60 * 1000);
    const checkJd = dateToJulianDay(checkDate);
    const checkMoonPos = calculatePlanetPosition('moon', checkJd);
    
    // 检查与本命行星的相位
    for (const planet of natalChart.planets) {
      const diff = angleDifference(checkMoonPos.longitude, planet.longitude);
      // 检查主要相位（0, 60, 90, 120, 180度）
      if ([0, 60, 90, 120, 180].some(angle => Math.abs(diff - angle) < 1)) {
        hasAspect = true;
        break;
      }
    }
    if (hasAspect) break;
  }
  
  return {
    isVoid: !hasAspect,
    voidStart: !hasAspect ? date : undefined,
    voidEnd: !hasAspect ? new Date(date.getTime() + hoursUntilSignChange * 60 * 60 * 1000) : undefined,
  };
}

// ============================================================
// 每小时预测
// ============================================================

/**
 * 计算单个小时的预测
 */
export function calculateHourlyForecast(
  date: Date,
  hour: number,
  natalChart: NatalChart
): HourlyForecast {
  const hourDate = new Date(date);
  hourDate.setHours(hour, 0, 0, 0);
  
  const jd = dateToJulianDay(hourDate);
  const moonPos = calculatePlanetPosition('moon', jd);
  const moonSignIndex = Math.floor(moonPos.longitude / 30);
  const moonSign = ZODIAC_SIGNS[moonSignIndex];
  
  // 计算月亮所在宫位
  let moonHouse = 1;
  for (let i = 0; i < 12; i++) {
    const nextHouse = (i + 1) % 12;
    let start = natalChart.houses[i].longitude;
    let end = natalChart.houses[nextHouse].longitude;
    
    if (end < start) {
      if (moonPos.longitude >= start || moonPos.longitude < end) {
        moonHouse = i + 1;
        break;
      }
    } else {
      if (moonPos.longitude >= start && moonPos.longitude < end) {
        moonHouse = i + 1;
        break;
      }
    }
  }
  
  // 计算行星时
  const planetaryHour = getPlanetaryHour(hourDate);
  
  // 计算该小时的行运相位
  const transitPositions: PlanetPosition[] = [];
  for (const planet of PLANETS.slice(0, 7)) { // 只看七曜
    const pos = calculatePlanetPosition(planet.id, jd);
    transitPositions.push({
      id: planet.id as PlanetId,
      longitude: pos.longitude,
      latitude: pos.latitude,
    });
  }
  
  const natalPositions = natalChart.planets.map(p => ({
    id: p.id,
    longitude: p.longitude,
    latitude: p.latitude,
  }));
  
  const aspects = calculateTransitAspects(transitPositions, natalPositions, ['conjunction', 'trine', 'square', 'sextile', 'opposition']);
  const moonAspects = aspects.filter(a => a.planet1 === 'moon');
  
  // 计算分数
  let score = 50;
  
  // 行星时加成
  const hourBonus: Record<string, number> = {
    sun: 10, jupiter: 10, venus: 8,
    mercury: 5, moon: 3,
    mars: -3, saturn: -5,
  };
  score += hourBonus[planetaryHour] || 0;
  
  // 月亮相位影响
  for (const aspect of moonAspects) {
    const isHarmonious = ['conjunction', 'trine', 'sextile'].includes(aspect.aspectType);
    score += isHarmonious ? aspect.strength * 15 : -aspect.strength * 10;
  }
  
  // 月亮宫位影响
  const houseBonus: Record<number, number> = {
    1: 5, 5: 8, 9: 6, 11: 7,
    4: 3, 7: 4,
    6: -3, 8: -5, 12: -4,
  };
  score += houseBonus[moonHouse] || 0;
  
  score = Math.max(0, Math.min(100, score));
  
  // 确定情绪等级
  let mood: HourlyForecast['mood'];
  if (score >= 80) mood = 'excellent';
  else if (score >= 65) mood = 'good';
  else if (score >= 45) mood = 'neutral';
  else if (score >= 30) mood = 'challenging';
  else mood = 'difficult';
  
  // 生成关键词
  const keywords = generateHourlyKeywords(moonSign.id as ZodiacId, moonHouse, planetaryHour);
  const { bestFor, avoidFor } = generateHourlyAdvice(moonSign.id as ZodiacId, moonHouse, score);
  
  return {
    hour,
    date: hourDate,
    moonLongitude: moonPos.longitude,
    moonSign: moonSign.id as ZodiacId,
    moonSignName: moonSign.name,
    moonHouse,
    score,
    mood,
    keywords,
    bestFor,
    avoidFor,
  };
}

function generateHourlyKeywords(moonSign: ZodiacId, moonHouse: number, planetaryHour: PlanetId): string[] {
  const signKeywords: Record<ZodiacId, string[]> = {
    aries: ['行动', '开始', '竞争'],
    taurus: ['稳定', '享受', '积累'],
    gemini: ['沟通', '学习', '多变'],
    cancer: ['情感', '家庭', '照顾'],
    leo: ['创造', '表达', '领导'],
    virgo: ['分析', '服务', '完善'],
    libra: ['合作', '平衡', '美感'],
    scorpio: ['深入', '转化', '掌控'],
    sagittarius: ['探索', '乐观', '自由'],
    capricorn: ['责任', '结构', '目标'],
    aquarius: ['创新', '独立', '群体'],
    pisces: ['直觉', '灵感', '融合'],
  };
  
  const houseKeywords: Record<number, string> = {
    1: '自我', 2: '资源', 3: '沟通', 4: '家庭',
    5: '创造', 6: '健康', 7: '关系', 8: '深度',
    9: '探索', 10: '事业', 11: '社群', 12: '内省',
  };
  
  return [...signKeywords[moonSign], houseKeywords[moonHouse]];
}

function generateHourlyAdvice(moonSign: ZodiacId, moonHouse: number, score: number): { bestFor: string[]; avoidFor: string[] } {
  const bestFor: string[] = [];
  const avoidFor: string[] = [];
  
  // 根据月亮星座
  const signAdvice: Record<ZodiacId, { best: string[]; avoid: string[] }> = {
    aries: { best: ['开始新项目', '运动', '竞争'], avoid: ['需要耐心的事'] },
    taurus: { best: ['财务决策', '美食', '艺术'], avoid: ['急躁的变化'] },
    gemini: { best: ['沟通', '学习', '社交'], avoid: ['需要专注的深度工作'] },
    cancer: { best: ['家庭事务', '情感交流', '烹饪'], avoid: ['冷漠的商业谈判'] },
    leo: { best: ['创意表达', '娱乐', '领导'], avoid: ['幕后工作'] },
    virgo: { best: ['组织整理', '健康检查', '细节工作'], avoid: ['需要大局观的决策'] },
    libra: { best: ['合作洽谈', '社交活动', '审美'], avoid: ['独立决断'] },
    scorpio: { best: ['研究调查', '心理工作', '投资'], avoid: ['表面社交'] },
    sagittarius: { best: ['学习', '旅行规划', '冒险'], avoid: ['细节琐事'] },
    capricorn: { best: ['工作', '长期规划', '责任'], avoid: ['放松娱乐'] },
    aquarius: { best: ['创新', '科技', '群体活动'], avoid: ['传统仪式'] },
    pisces: { best: ['冥想', '艺术', '助人'], avoid: ['需要清晰边界的事'] },
  };
  
  const advice = signAdvice[moonSign];
  bestFor.push(...advice.best.slice(0, 2));
  avoidFor.push(...advice.avoid);
  
  // 根据分数调整
  if (score >= 70) {
    bestFor.push('重要决策');
  } else if (score < 40) {
    avoidFor.push('重大决定', '激烈冲突');
  }
  
  return { bestFor, avoidFor };
}

// ============================================================
// 每日预测
// ============================================================

/**
 * 计算每日预测
 */
export function calculateDailyForecast(
  date: Date,
  natalChart: NatalChart
): DailyForecast {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const jd = dateToJulianDay(dayStart);
  
  // 行星日/时
  const planetaryDay = getPlanetaryDay(date);
  const planetaryHour = getPlanetaryHour(date);
  
  // 月相
  const moonPhaseData = calculateMoonPhase(date);
  const voidData = checkVoidOfCourse(date, natalChart);
  
  // 月亮位置
  const moonPos = calculatePlanetPosition('moon', jd);
  const moonSignIndex = Math.floor(moonPos.longitude / 30);
  const moonSign = ZODIAC_SIGNS[moonSignIndex];
  
  // 计算24小时的预测
  const hourlyBreakdown: HourlyForecast[] = [];
  for (let hour = 0; hour < 24; hour++) {
    hourlyBreakdown.push(calculateHourlyForecast(date, hour, natalChart));
  }
  
  // 计算每日行运相位
  const transitPositions: PlanetPosition[] = [];
  for (const planet of PLANETS) {
    const pos = calculatePlanetPosition(planet.id, jd);
    transitPositions.push({
      id: planet.id as PlanetId,
      longitude: pos.longitude,
      latitude: pos.latitude,
    });
  }
  
  const natalPositions = natalChart.planets.map(p => ({
    id: p.id,
    longitude: p.longitude,
    latitude: p.latitude,
  }));
  
  const aspects = calculateTransitAspects(transitPositions, natalPositions);
  
  // 提取活跃相位
  const activeAspects = aspects.slice(0, 5).map(aspect => {
    const transitPlanet = PLANETS.find(p => p.id === aspect.planet1);
    const natalPlanet = PLANETS.find(p => p.id === aspect.planet2);
    return {
      transitPlanet: aspect.planet1,
      natalPlanet: aspect.planet2,
      aspectType: aspect.aspectType,
      exactness: aspect.strength * 100,
      applying: aspect.applying,
      interpretation: `行运${transitPlanet?.name}${aspect.applying ? '入相' : '出相'}本命${natalPlanet?.name}`,
    };
  });
  
  // 计算维度分数
  const dimensions = calculateDailyDimensions(hourlyBreakdown, aspects, moonSign.id as ZodiacId);
  
  // 总分
  const overallScore = Math.round(
    hourlyBreakdown.reduce((sum, h) => sum + h.score, 0) / 24
  );
  
  // 找出最佳/挑战时段
  const sortedHours = [...hourlyBreakdown].sort((a, b) => b.score - a.score);
  const luckyHours = sortedHours.slice(0, 4).map(h => h.hour);
  const challengingHours = sortedHours.slice(-4).map(h => h.hour);
  
  // 生成主题和建议
  const { theme, advice } = generateDailyTheme(
    moonSign.id as ZodiacId,
    planetaryDay,
    overallScore,
    aspects
  );
  
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  return {
    date: dayStart,
    dayOfWeek: dayNames[date.getDay()],
    planetaryDay,
    planetaryHour,
    moonPhase: {
      phase: moonPhaseData.phase,
      illumination: moonPhaseData.illumination,
      isVoidOfCourse: voidData.isVoid,
      voidStart: voidData.voidStart,
      voidEnd: voidData.voidEnd,
    },
    moonSign: moonSign.id as ZodiacId,
    moonSignName: moonSign.name,
    overallScore,
    dimensions,
    activeAspects,
    theme,
    advice,
    luckyHours,
    challengingHours,
    hourlyBreakdown,
  };
}

function calculateDailyDimensions(
  hourly: HourlyForecast[],
  aspects: AspectData[],
  moonSign: ZodiacId
): DailyForecast['dimensions'] {
  const base = {
    action: 50,
    communication: 50,
    emotion: 50,
    creativity: 50,
    focus: 50,
  };
  
  // 月亮星座影响
  const signModifiers: Record<ZodiacId, Partial<typeof base>> = {
    aries: { action: 20, focus: -10 },
    taurus: { focus: 15, action: -10 },
    gemini: { communication: 20, focus: -15 },
    cancer: { emotion: 20, action: -10 },
    leo: { creativity: 20, focus: 10 },
    virgo: { focus: 20, creativity: -10 },
    libra: { communication: 15, creativity: 10 },
    scorpio: { emotion: 15, focus: 15 },
    sagittarius: { action: 15, creativity: 10 },
    capricorn: { focus: 20, emotion: -10 },
    aquarius: { creativity: 15, communication: 10 },
    pisces: { emotion: 15, creativity: 15, focus: -15 },
  };
  
  const mod = signModifiers[moonSign] || {};
  
  return {
    action: Math.max(0, Math.min(100, base.action + (mod.action || 0))),
    communication: Math.max(0, Math.min(100, base.communication + (mod.communication || 0))),
    emotion: Math.max(0, Math.min(100, base.emotion + (mod.emotion || 0))),
    creativity: Math.max(0, Math.min(100, base.creativity + (mod.creativity || 0))),
    focus: Math.max(0, Math.min(100, base.focus + (mod.focus || 0))),
  };
}

function generateDailyTheme(
  moonSign: ZodiacId,
  planetaryDay: PlanetId,
  score: number,
  aspects: AspectData[]
): { theme: string; advice: string } {
  const dayThemes: Record<PlanetId, string> = {
    sun: '自我表达与创造',
    moon: '情感与直觉',
    mars: '行动与竞争',
    mercury: '沟通与学习',
    jupiter: '扩展与机遇',
    venus: '爱与美',
    saturn: '责任与结构',
    uranus: '变革与创新',
    neptune: '灵感与梦想',
    pluto: '转化与深度',
    northNode: '命运方向',
    chiron: '疗愈与整合',
  };
  
  const theme = `${ZODIAC_SIGNS.find(s => s.id === moonSign)?.name}月亮 · ${dayThemes[planetaryDay]}日`;
  
  let advice: string;
  if (score >= 70) {
    advice = '今日能量充沛，适合推进重要事项和做出决定。';
  } else if (score >= 50) {
    advice = '今日能量平稳，按计划行事即可。';
  } else {
    advice = '今日宜守不宜攻，处理日常事务，避免重大决策。';
  }
  
  return { theme, advice };
}

// ============================================================
// 每周预测
// ============================================================

/**
 * 计算每周预测
 */
export function calculateWeeklyForecast(
  startDate: Date,
  natalChart: NatalChart
): WeeklyForecast {
  const weekStart = new Date(startDate);
  weekStart.setHours(0, 0, 0, 0);
  
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  
  // 计算每日摘要
  const dailySummaries: WeeklyForecast['dailySummaries'] = [];
  const allHourlyForecasts: HourlyForecast[] = [];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    
    const dailyForecast = calculateDailyForecast(dayDate, natalChart);
    
    dailySummaries.push({
      date: dayDate,
      dayOfWeek: dailyForecast.dayOfWeek,
      score: dailyForecast.overallScore,
      moonSign: dailyForecast.moonSign,
      theme: dailyForecast.theme,
    });
    
    allHourlyForecasts.push(...dailyForecast.hourlyBreakdown);
  }
  
  // 查找本周关键日期
  const keyDates: WeeklyForecast['keyDates'] = [];
  
  // 找出高分日和低分日
  const sortedDays = [...dailySummaries].sort((a, b) => b.score - a.score);
  if (sortedDays[0].score >= 70) {
    keyDates.push({
      date: sortedDays[0].date,
      event: '本周最佳能量日',
      significance: 'high',
    });
  }
  if (sortedDays[sortedDays.length - 1].score < 40) {
    keyDates.push({
      date: sortedDays[sortedDays.length - 1].date,
      event: '注意休息与调整',
      significance: 'medium',
    });
  }
  
  // 检测月相变化
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const moonPhase = calculateMoonPhase(dayDate);
    
    if (moonPhase.phase === '新月' || moonPhase.phase === '满月') {
      keyDates.push({
        date: dayDate,
        event: moonPhase.phase,
        significance: 'high',
      });
    }
  }
  
  // 本周主要行运
  const weeklyTransits: WeeklyForecast['weeklyTransits'] = [];
  const jd = dateToJulianDay(weekStart);
  
  // 检查慢行星相位
  const slowPlanets: PlanetId[] = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  for (const planetId of slowPlanets) {
    const pos = calculatePlanetPosition(planetId, jd);
    
    for (const natalPlanet of natalChart.planets) {
      const diff = angleDifference(pos.longitude, natalPlanet.longitude);
      
      // 检查接近精确相位
      const aspects = [
        { angle: 0, name: '合' },
        { angle: 60, name: '六分' },
        { angle: 90, name: '四分' },
        { angle: 120, name: '三分' },
        { angle: 180, name: '对冲' },
      ];
      
      for (const aspect of aspects) {
        if (Math.abs(diff - aspect.angle) < 3) {
          const planet = PLANETS.find(p => p.id === planetId);
          const natal = PLANETS.find(p => p.id === natalPlanet.id);
          weeklyTransits.push({
            planet: planetId,
            aspect: aspect.name,
            natalPlanet: natalPlanet.id,
            peakDate: weekStart,
            description: `行运${planet?.name}${aspect.name}本命${natal?.name}`,
          });
        }
      }
    }
  }
  
  // 最佳日期分类
  const actionDays = dailySummaries
    .filter(d => d.score >= 60 && ['aries', 'leo', 'sagittarius', 'capricorn'].includes(d.moonSign))
    .map(d => d.date);
  
  const commDays = dailySummaries
    .filter(d => d.score >= 50 && ['gemini', 'libra', 'aquarius'].includes(d.moonSign))
    .map(d => d.date);
  
  const restDays = dailySummaries
    .filter(d => ['cancer', 'pisces'].includes(d.moonSign) || d.score < 45)
    .map(d => d.date);
  
  const creativeDays = dailySummaries
    .filter(d => d.score >= 55 && ['leo', 'pisces', 'aquarius', 'gemini'].includes(d.moonSign))
    .map(d => d.date);
  
  // 生成周主题
  const avgScore = dailySummaries.reduce((sum, d) => sum + d.score, 0) / 7;
  let overallTheme: string;
  if (avgScore >= 65) {
    overallTheme = '积极进取的一周，适合推进重要项目';
  } else if (avgScore >= 50) {
    overallTheme = '平稳过渡的一周，稳步前行';
  } else {
    overallTheme = '需要耐心的一周，适合整理与反思';
  }
  
  // 计算周数
  const yearStart = new Date(weekStart.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((weekStart.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  return {
    startDate: weekStart,
    endDate,
    weekNumber,
    overallTheme,
    keyDates,
    dailySummaries,
    weeklyTransits,
    bestDaysFor: {
      action: actionDays,
      communication: commDays,
      rest: restDays,
      creativity: creativeDays,
    },
  };
}

// ============================================================
// 导出时间范围预测
// ============================================================

/**
 * 生成指定时间范围的预测数据
 */
export function generateForecastRange(
  natalChart: NatalChart,
  startDate: Date,
  endDate: Date,
  resolution: 'hourly' | 'daily' | 'weekly'
): Array<{
  date: Date;
  score: number;
  theme: string;
  moonSign: ZodiacId;
}> {
  const results: Array<{
    date: Date;
    score: number;
    theme: string;
    moonSign: ZodiacId;
  }> = [];
  
  let current = new Date(startDate);
  
  while (current <= endDate) {
    if (resolution === 'hourly') {
      const hourly = calculateHourlyForecast(current, current.getHours(), natalChart);
      results.push({
        date: new Date(current),
        score: hourly.score,
        theme: hourly.keywords.join('·'),
        moonSign: hourly.moonSign,
      });
      current = new Date(current.getTime() + 60 * 60 * 1000);
    } else if (resolution === 'daily') {
      const daily = calculateDailyForecast(current, natalChart);
      results.push({
        date: new Date(current),
        score: daily.overallScore,
        theme: daily.theme,
        moonSign: daily.moonSign,
      });
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    } else {
      const weekly = calculateWeeklyForecast(current, natalChart);
      const avgScore = weekly.dailySummaries.reduce((sum, d) => sum + d.score, 0) / 7;
      results.push({
        date: new Date(current),
        score: avgScore,
        theme: weekly.overallTheme,
        moonSign: weekly.dailySummaries[0].moonSign,
      });
      current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
  
  return results;
}

