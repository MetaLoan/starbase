/**
 * User Service
 * 用户数据服务层
 * 
 * 这是核心的数据访问层，智能体通过这个服务获取用户数据
 */

import { 
  calculateNatalChart,
  calculateDailyForecast,
  calculateWeeklyForecast,
  calculateLifeTrend,
  calculateAnnualProfection,
  calculateProgressedChart,
  findMajorTransits,
  // 影响因子处理器
  processDailyForecast,
  processWeeklyForecast,
  getProcessedUserSnapshot,
  DEFAULT_FACTOR_CONFIG,
  type NatalChart,
  type BirthData,
  type DailyForecast,
  type WeeklyForecast,
  type LifeTrendData,
  type AnnualProfection,
  type ProgressedChart,
  type InfluenceFactorConfig,
  type ProcessedDailyForecast,
  type ProcessedWeeklyForecast,
  type ProcessedUserSnapshot,
  ZODIAC_SIGNS,
  PLANETS
} from '../astro';

import type { 
  UserProfile, 
  UserStateSnapshot, 
  AgentContext,
  UserPreferences 
} from '../types/user';

/**
 * 内存存储（生产环境应替换为数据库）
 */
const userStore = new Map<string, UserProfile>();

/**
 * 创建用户
 */
export function createUser(
  id: string,
  birthData: BirthData,
  preferences?: Partial<UserPreferences>
): UserProfile {
  const natalChart = calculateNatalChart(birthData);
  
  const user: UserProfile = {
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    name: birthData.name,
    birthData,
    natalChart,
    preferences: {
      timezone: birthData.timezone,
      language: 'zh-CN',
      houseSystem: 'equal',
      aspectOrbs: 'standard',
      enableNotifications: false,
      focusAreas: ['career', 'relationship'],
      ...preferences,
    },
    metadata: {},
  };
  
  userStore.set(id, user);
  return user;
}

/**
 * 获取用户
 */
export function getUser(id: string): UserProfile | null {
  return userStore.get(id) || null;
}

/**
 * 更新用户
 */
export function updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
  const user = userStore.get(id);
  if (!user) return null;
  
  const updated = {
    ...user,
    ...updates,
    updatedAt: new Date(),
  };
  
  // 如果更新了出生数据，重新计算本命盘
  if (updates.birthData) {
    updated.natalChart = calculateNatalChart(updates.birthData);
  }
  
  userStore.set(id, updated);
  return updated;
}

/**
 * 删除用户
 */
export function deleteUser(id: string): boolean {
  return userStore.delete(id);
}

/**
 * 获取所有用户 ID
 */
export function getAllUserIds(): string[] {
  return Array.from(userStore.keys());
}

// ============================================================
// 智能体数据接口
// ============================================================

/**
 * 获取用户状态快照
 * 这是智能体最常用的接口，一次调用获取所有需要的数据
 */
export function getUserStateSnapshot(userId: string): UserStateSnapshot | null {
  const user = getUser(userId);
  if (!user) return null;
  
  const now = new Date();
  const birthYear = user.birthData.date.getFullYear();
  const currentAge = now.getFullYear() - birthYear;
  
  // 计算各种数据
  const dailyForecast = calculateDailyForecast(now, user.natalChart);
  const weeklyForecast = calculateWeeklyForecast(now, user.natalChart);
  const profection = calculateAnnualProfection(user.natalChart, currentAge);
  const progressedChart = calculateProgressedChart(user.natalChart, now);
  
  // 查找重大行运
  const majorTransits = findMajorTransits(
    user.birthData.date,
    now.getFullYear(),
    now.getFullYear() + 2
  );
  
  // 获取上升星座
  const risingSignIndex = Math.floor(user.natalChart.ascendant / 30);
  const risingSign = ZODIAC_SIGNS[risingSignIndex];
  
  return {
    userId,
    timestamp: now,
    
    natal: {
      sunSign: user.natalChart.planets.find(p => p.id === 'sun')?.sign || 'aries',
      moonSign: user.natalChart.planets.find(p => p.id === 'moon')?.sign || 'aries',
      risingSign: risingSign.id as any,
      dominantPlanets: user.natalChart.dominantPlanets,
      chartRuler: user.natalChart.chartRuler,
    },
    
    current: {
      age: currentAge,
      profectionHouse: profection.house,
      profectionTheme: profection.houseTheme,
      lordOfYear: profection.lordOfYear,
      progressedLunarPhase: progressedChart.lunarPhase.name,
      todayScore: dailyForecast.overallScore,
      todayMoonSign: dailyForecast.moonSign,
      todayTheme: dailyForecast.theme,
      weekScore: weeklyForecast.dailySummaries.reduce((sum, d) => sum + d.score, 0) / 7,
      weekTheme: weeklyForecast.overallTheme,
    },
    
    activeTransits: dailyForecast.activeAspects.map(a => ({
      transitPlanet: a.transitPlanet,
      natalPlanet: a.natalPlanet,
      aspect: a.aspectType,
      exactness: a.exactness,
      interpretation: a.interpretation,
    })),
    
    upcomingEvents: [
      ...majorTransits.slice(0, 5).map(t => ({
        date: t.date,
        event: t.name,
        significance: t.significance,
      })),
      ...weeklyForecast.keyDates.slice(0, 3),
    ],
    
    lifeCycle: {
      saturnCyclePhase: getSaturnCyclePhase(currentAge),
      jupiterCyclePhase: getJupiterCyclePhase(currentAge),
      profectionCycle: Math.floor(currentAge / 12) + 1,
      overallTrend: 'stable', // 需要计算
    },
  };
}

/**
 * 获取用户的每日预测
 */
export function getUserDailyForecast(userId: string, date?: Date): DailyForecast | null {
  const user = getUser(userId);
  if (!user) return null;
  
  return calculateDailyForecast(date || new Date(), user.natalChart);
}

/**
 * 获取用户的每日预测（经过影响因子处理）
 */
export function getUserProcessedDailyForecast(
  userId: string, 
  date?: Date,
  factorConfig?: InfluenceFactorConfig
): ProcessedDailyForecast | null {
  const user = getUser(userId);
  if (!user) return null;
  
  return processDailyForecast(
    user.natalChart, 
    date || new Date(), 
    factorConfig || DEFAULT_FACTOR_CONFIG
  );
}

/**
 * 获取用户的每周预测
 */
export function getUserWeeklyForecast(userId: string, startDate?: Date): WeeklyForecast | null {
  const user = getUser(userId);
  if (!user) return null;
  
  return calculateWeeklyForecast(startDate || new Date(), user.natalChart);
}

/**
 * 获取用户的每周预测（经过影响因子处理）
 */
export function getUserProcessedWeeklyForecast(
  userId: string, 
  startDate?: Date,
  factorConfig?: InfluenceFactorConfig
): ProcessedWeeklyForecast | null {
  const user = getUser(userId);
  if (!user) return null;
  
  return processWeeklyForecast(
    user.natalChart, 
    startDate || new Date(), 
    factorConfig || DEFAULT_FACTOR_CONFIG
  );
}

/**
 * 获取用户完整快照（经过影响因子处理）
 */
export function getUserFullSnapshot(
  userId: string,
  factorConfig?: InfluenceFactorConfig
): ProcessedUserSnapshot | null {
  const user = getUser(userId);
  if (!user) return null;
  
  return getProcessedUserSnapshot(
    user.natalChart,
    factorConfig || DEFAULT_FACTOR_CONFIG
  );
}

/**
 * 获取用户的人生趋势
 */
export function getUserLifeTrend(
  userId: string, 
  startYear?: number, 
  endYear?: number
): LifeTrendData | null {
  const user = getUser(userId);
  if (!user) return null;
  
  const birthYear = user.birthData.date.getFullYear();
  const start = startYear || birthYear;
  const end = endYear || birthYear + 80;
  
  return calculateLifeTrend(user.natalChart, start, end, 'yearly');
}

/**
 * 获取用户的年限法信息
 */
export function getUserProfection(userId: string, age?: number): AnnualProfection | null {
  const user = getUser(userId);
  if (!user) return null;
  
  const currentAge = age ?? (new Date().getFullYear() - user.birthData.date.getFullYear());
  return calculateAnnualProfection(user.natalChart, currentAge);
}

/**
 * 获取用户的推运信息
 */
export function getUserProgression(userId: string, date?: Date): ProgressedChart | null {
  const user = getUser(userId);
  if (!user) return null;
  
  return calculateProgressedChart(user.natalChart, date || new Date());
}

/**
 * 构建智能体上下文
 */
export function buildAgentContext(
  userId: string,
  options?: {
    query?: string;
    intent?: AgentContext['intent'];
    focusArea?: AgentContext['focusArea'];
    timeframe?: AgentContext['timeframe'];
  }
): AgentContext | null {
  const snapshot = getUserStateSnapshot(userId);
  if (!snapshot) return null;
  
  return {
    user: snapshot,
    query: options?.query,
    intent: options?.intent,
    focusArea: options?.focusArea,
    timeframe: options?.timeframe,
  };
}

// ============================================================
// 辅助函数
// ============================================================

function getSaturnCyclePhase(age: number): string {
  const yearsInCycle = age % 29.5;
  if (yearsInCycle < 7) return '播种期';
  if (yearsInCycle < 14) return '成长期';
  if (yearsInCycle < 21) return '收获期';
  return '整合期';
}

function getJupiterCyclePhase(age: number): string {
  const yearsInCycle = age % 12;
  if (yearsInCycle < 3) return '扩张期';
  if (yearsInCycle < 6) return '巩固期';
  if (yearsInCycle < 9) return '调整期';
  return '准备期';
}

// ============================================================
// 批量查询接口（用于智能体批量处理）
// ============================================================

/**
 * 批量获取用户快照
 */
export function batchGetUserSnapshots(userIds: string[]): Map<string, UserStateSnapshot> {
  const results = new Map<string, UserStateSnapshot>();
  
  for (const id of userIds) {
    const snapshot = getUserStateSnapshot(id);
    if (snapshot) {
      results.set(id, snapshot);
    }
  }
  
  return results;
}

/**
 * 查询符合条件的用户
 */
export function queryUsers(filter: {
  sunSign?: string;
  moonSign?: string;
  ageRange?: [number, number];
}): UserProfile[] {
  const results: UserProfile[] = [];
  
  for (const user of userStore.values()) {
    const sunSign = user.natalChart.planets.find(p => p.id === 'sun')?.sign;
    const moonSign = user.natalChart.planets.find(p => p.id === 'moon')?.sign;
    const age = new Date().getFullYear() - user.birthData.date.getFullYear();
    
    if (filter.sunSign && sunSign !== filter.sunSign) continue;
    if (filter.moonSign && moonSign !== filter.moonSign) continue;
    if (filter.ageRange && (age < filter.ageRange[0] || age > filter.ageRange[1])) continue;
    
    results.push(user);
  }
  
  return results;
}

