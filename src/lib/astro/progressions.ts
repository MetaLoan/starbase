/**
 * Secondary Progressions Calculator
 * 推运计算模块
 * 
 * 规则：出生后第 N 天 ≈ 人生第 N 年
 * 它不看外界事件，而看内在心理成长曲线
 */

import { DateTime } from 'luxon';
import { 
  PLANETS, 
  ZODIAC_SIGNS,
  type PlanetId, 
  type ZodiacId 
} from './constants';
import { 
  dateToJulianDay, 
  julianDayToDate,
  calculatePlanetPosition, 
  normalizeAngle 
} from './ephemeris';
import { 
  calculateAllAspects,
  type AspectData, 
  type PlanetPosition 
} from './aspects';
import { type NatalChart, type PlanetPlacement } from './natal-chart';

export interface ProgressedChart {
  targetDate: Date;
  progressedDate: Date;  // 出生后第 N 天
  daysProgressed: number;
  yearsFromBirth: number;
  planets: ProgressedPlanet[];
  progressedAscendant: number;
  progressedMidheaven: number;
  aspects: AspectData[];
  lunarPhase: LunarPhase;
}

export interface ProgressedPlanet {
  id: PlanetId;
  name: string;
  symbol: string;
  natalLongitude: number;
  progressedLongitude: number;
  movement: number;  // 移动了多少度
  sign: ZodiacId;
  signName: string;
  signChanged: boolean;  // 是否换了星座
  house: number;
  houseChanged: boolean;
}

export interface LunarPhase {
  phase: 'new' | 'crescent' | 'first_quarter' | 'gibbous' | 'full' | 'disseminating' | 'last_quarter' | 'balsamic';
  angle: number;  // 推运月亮与推运太阳的角度
  name: string;
  description: string;
  keywords: string[];
}

/**
 * 计算推运盘（Secondary Progressions）
 * 1 天 = 1 年
 */
export function calculateProgressedChart(
  natalChart: NatalChart,
  targetDate: Date
): ProgressedChart {
  const birthDate = natalChart.birthData.date;
  
  // 计算从出生到目标日期的年数
  const yearsFromBirth = (targetDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  // 推运日期 = 出生日期 + 年数（天）
  const daysProgressed = yearsFromBirth;
  const progressedDate = new Date(birthDate.getTime() + daysProgressed * 24 * 60 * 60 * 1000);
  
  const progressedJd = dateToJulianDay(progressedDate);
  
  // 计算推运行星位置
  const progressedPlanets: ProgressedPlanet[] = [];
  const progressedPositions: PlanetPosition[] = [];
  
  for (const natalPlanet of natalChart.planets) {
    const progressedPos = calculatePlanetPosition(natalPlanet.id, progressedJd);
    const sign = getZodiacSign(progressedPos.longitude);
    const house = getHouseFromLongitude(progressedPos.longitude, natalChart);
    
    const progressedPlanet: ProgressedPlanet = {
      id: natalPlanet.id,
      name: natalPlanet.name,
      symbol: natalPlanet.symbol,
      natalLongitude: natalPlanet.longitude,
      progressedLongitude: progressedPos.longitude,
      movement: normalizeAngle(progressedPos.longitude - natalPlanet.longitude),
      sign: sign.id as ZodiacId,
      signName: sign.name,
      signChanged: sign.id !== natalPlanet.sign,
      house,
      houseChanged: house !== natalPlanet.house,
    };
    
    progressedPlanets.push(progressedPlanet);
    progressedPositions.push({
      id: natalPlanet.id,
      longitude: progressedPos.longitude,
      latitude: progressedPos.latitude,
    });
  }
  
  // 计算推运上升和中天（使用太阳弧推进法简化）
  const sunMovement = progressedPlanets.find(p => p.id === 'sun')?.movement || 0;
  const progressedAscendant = normalizeAngle(natalChart.ascendant + sunMovement);
  const progressedMidheaven = normalizeAngle(natalChart.midheaven + sunMovement);
  
  // 计算推运相位（推运与本命之间）
  const natalPositions: PlanetPosition[] = natalChart.planets.map(p => ({
    id: p.id,
    longitude: p.longitude,
    latitude: p.latitude,
  }));
  const aspects = calculateAllAspects([...progressedPositions, ...natalPositions]);
  
  // 计算月相
  const progressedSun = progressedPlanets.find(p => p.id === 'sun');
  const progressedMoon = progressedPlanets.find(p => p.id === 'moon');
  const lunarPhase = calculateLunarPhase(
    progressedSun?.progressedLongitude || 0,
    progressedMoon?.progressedLongitude || 0
  );
  
  return {
    targetDate,
    progressedDate,
    daysProgressed,
    yearsFromBirth,
    planets: progressedPlanets,
    progressedAscendant,
    progressedMidheaven,
    aspects,
    lunarPhase,
  };
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
 * 根据黄经获取宫位
 */
function getHouseFromLongitude(longitude: number, natalChart: NatalChart): number {
  const normalizedLong = normalizeAngle(longitude);
  
  for (let i = 0; i < 12; i++) {
    const nextHouse = (i + 1) % 12;
    let start = natalChart.houses[i].longitude;
    let end = natalChart.houses[nextHouse].longitude;
    
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
  
  return 1;
}

/**
 * 计算月相
 */
function calculateLunarPhase(sunLongitude: number, moonLongitude: number): LunarPhase {
  const angle = normalizeAngle(moonLongitude - sunLongitude);
  
  const phases: Array<{
    min: number;
    max: number;
    phase: LunarPhase['phase'];
    name: string;
    description: string;
    keywords: string[];
  }> = [
    {
      min: 0, max: 45,
      phase: 'new',
      name: '新月期',
      description: '新周期的开始，适合播种新意图，内在酝酿',
      keywords: ['新开始', '潜伏', '意图设定'],
    },
    {
      min: 45, max: 90,
      phase: 'crescent',
      name: '眉月期',
      description: '克服惯性，突破旧模式，建立新动力',
      keywords: ['突破', '挣扎', '前进'],
    },
    {
      min: 90, max: 135,
      phase: 'first_quarter',
      name: '上弦月期',
      description: '行动与决策的关键期，需要做出承诺',
      keywords: ['行动', '决策', '危机'],
    },
    {
      min: 135, max: 180,
      phase: 'gibbous',
      name: '盈凸月期',
      description: '精进与完善，为即将到来的高峰做准备',
      keywords: ['完善', '分析', '准备'],
    },
    {
      min: 180, max: 225,
      phase: 'full',
      name: '满月期',
      description: '觉醒与照见，关系与事业的高潮与收获',
      keywords: ['高峰', '照见', '收获'],
    },
    {
      min: 225, max: 270,
      phase: 'disseminating',
      name: '播散月期',
      description: '分享与传播，将所学传递给他人',
      keywords: ['分享', '传播', '教导'],
    },
    {
      min: 270, max: 315,
      phase: 'last_quarter',
      name: '下弦月期',
      description: '重新评估，释放不再服务于你的事物',
      keywords: ['释放', '重估', '转向'],
    },
    {
      min: 315, max: 360,
      phase: 'balsamic',
      name: '残月期',
      description: '结束与休息，为新周期的到来做准备',
      keywords: ['结束', '休息', '预示'],
    },
  ];
  
  for (const p of phases) {
    if (angle >= p.min && angle < p.max) {
      return {
        phase: p.phase,
        angle,
        name: p.name,
        description: p.description,
        keywords: p.keywords,
      };
    }
  }
  
  return {
    phase: phases[0].phase,
    angle,
    name: phases[0].name,
    description: phases[0].description,
    keywords: phases[0].keywords,
  };
}

/**
 * 查找推运中的重要事件
 */
export function findProgressionEvents(
  natalChart: NatalChart,
  fromYear: number,
  toYear: number
): Array<{
  year: number;
  event: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
}> {
  const events: Array<{
    year: number;
    event: string;
    description: string;
    significance: 'high' | 'medium' | 'low';
  }> = [];
  
  const birthYear = natalChart.birthData.date.getFullYear();
  
  for (let year = fromYear; year <= toYear; year++) {
    const age = year - birthYear;
    if (age < 0) continue;
    
    const targetDate = new Date(year, 6, 1);  // 使用年中
    const progressed = calculateProgressedChart(natalChart, targetDate);
    
    // 检查推运太阳换座
    const progressedSun = progressed.planets.find(p => p.id === 'sun');
    if (progressedSun?.signChanged) {
      events.push({
        year,
        event: `推运太阳进入${progressedSun.signName}`,
        description: `自我表达方式和生命力的表现开始转向${progressedSun.signName}的特质`,
        significance: 'high',
      });
    }
    
    // 检查推运月亮换座（约每 2.5 年）
    const progressedMoon = progressed.planets.find(p => p.id === 'moon');
    if (progressedMoon?.signChanged) {
      events.push({
        year,
        event: `推运月亮进入${progressedMoon.signName}`,
        description: `情感需求和内在反应模式转向${progressedMoon.signName}的特质`,
        significance: 'medium',
      });
    }
    
    // 检查月相变化
    if (Math.floor(progressed.lunarPhase.angle / 45) !== Math.floor((progressed.lunarPhase.angle - 1) / 45)) {
      events.push({
        year,
        event: `推运${progressed.lunarPhase.name}`,
        description: progressed.lunarPhase.description,
        significance: 'medium',
      });
    }
  }
  
  return events.sort((a, b) => a.year - b.year);
}

/**
 * 生成推运时间线
 */
export function generateProgressionTimeline(
  natalChart: NatalChart,
  startYear: number,
  endYear: number
): Array<{
  year: number;
  age: number;
  sunSign: ZodiacId;
  moonSign: ZodiacId;
  lunarPhase: string;
  lunarPhaseAngle: number;
}> {
  const timeline: Array<{
    year: number;
    age: number;
    sunSign: ZodiacId;
    moonSign: ZodiacId;
    lunarPhase: string;
    lunarPhaseAngle: number;
  }> = [];
  
  const birthYear = natalChart.birthData.date.getFullYear();
  
  for (let year = startYear; year <= endYear; year++) {
    const age = year - birthYear;
    if (age < 0) continue;
    
    const targetDate = new Date(year, 0, 1);
    const progressed = calculateProgressedChart(natalChart, targetDate);
    
    const sunSign = progressed.planets.find(p => p.id === 'sun')?.sign || 'aries';
    const moonSign = progressed.planets.find(p => p.id === 'moon')?.sign || 'aries';
    
    timeline.push({
      year,
      age,
      sunSign,
      moonSign,
      lunarPhase: progressed.lunarPhase.name,
      lunarPhaseAngle: progressed.lunarPhase.angle,
    });
  }
  
  return timeline;
}

