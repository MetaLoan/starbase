/**
 * User Data Types
 * 用户数据类型定义
 */

import { type NatalChart, type BirthData, type PlanetId, type ZodiacId } from '../astro';

/**
 * 用户完整资料
 */
export interface UserProfile {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  // 基础信息
  name?: string;
  email?: string;
  avatar?: string;
  
  // 出生数据
  birthData: BirthData;
  
  // 本命盘（计算后缓存）
  natalChart: NatalChart;
  
  // 用户偏好
  preferences: UserPreferences;
  
  // 扩展数据（用于智能体）
  metadata: Record<string, unknown>;
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  // 显示偏好
  timezone: string;
  language: 'zh-CN' | 'en-US';
  
  // 占星系统偏好
  houseSystem: 'placidus' | 'whole-sign' | 'equal';
  aspectOrbs: 'tight' | 'standard' | 'wide';
  
  // 通知偏好
  dailyForecastTime?: string;  // "08:00"
  enableNotifications: boolean;
  
  // 关注的维度
  focusAreas: ('career' | 'relationship' | 'health' | 'finance' | 'spiritual')[];
}

/**
 * 用户当前状态快照
 * 用于智能体快速获取用户实时数据
 */
export interface UserStateSnapshot {
  userId: string;
  timestamp: Date;
  
  // 本命核心
  natal: {
    sunSign: ZodiacId;
    moonSign: ZodiacId;
    risingSign: ZodiacId;
    dominantPlanets: PlanetId[];
    chartRuler: PlanetId;
  };
  
  // 当前状态
  current: {
    age: number;
    
    // 年限法
    profectionHouse: number;
    profectionTheme: string;
    lordOfYear: PlanetId;
    
    // 推运月相
    progressedLunarPhase: string;
    
    // 今日状态
    todayScore: number;
    todayMoonSign: ZodiacId;
    todayTheme: string;
    
    // 本周状态
    weekScore: number;
    weekTheme: string;
  };
  
  // 重大行运
  activeTransits: Array<{
    transitPlanet: PlanetId;
    natalPlanet: PlanetId;
    aspect: string;
    exactness: number;
    interpretation: string;
  }>;
  
  // 即将到来的关键日期
  upcomingEvents: Array<{
    date: Date;
    event: string;
    significance: 'high' | 'medium' | 'low';
  }>;
  
  // 人生周期位置
  lifeCycle: {
    saturnCyclePhase: string;
    jupiterCyclePhase: string;
    profectionCycle: number;
    overallTrend: 'ascending' | 'descending' | 'fluctuating' | 'stable';
  };
}

/**
 * 智能体上下文
 * 传递给 AI 的完整上下文
 */
export interface AgentContext {
  user: UserStateSnapshot;
  
  // 用户问题/意图
  query?: string;
  intent?: 'forecast' | 'analysis' | 'advice' | 'explanation' | 'comparison';
  
  // 时间范围
  timeframe?: {
    start: Date;
    end: Date;
    resolution: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  
  // 聚焦维度
  focusArea?: 'career' | 'relationship' | 'health' | 'finance' | 'spiritual' | 'general';
  
  // 历史对话（用于上下文）
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

/**
 * 智能体响应
 */
export interface AgentResponse {
  content: string;
  
  // 结构化数据（可选）
  structured?: {
    summary?: string;
    keyPoints?: string[];
    advice?: string[];
    warnings?: string[];
    opportunities?: string[];
  };
  
  // 引用的占星数据
  references?: Array<{
    type: 'transit' | 'progression' | 'profection' | 'natal';
    description: string;
  }>;
  
  // 建议的后续问题
  suggestedFollowUps?: string[];
}

