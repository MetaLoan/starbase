/**
 * Astrology Core Module
 * 占星核心模块导出
 */

// 常量
export * from './constants';

// 星历计算
export * from './ephemeris';

// 相位计算
export * from './aspects';

// 本命盘
export * from './natal-chart';

// 行运
export * from './transits';

// 推运
export * from './progressions';

// 年限法
export * from './profections';

// 综合趋势计算
export { calculateLifeTrend, type LifeTrendPoint, type LifeTrendData } from './life-trend';

// 每日/每时预测
export * from './daily-forecast';

// 影响因子层
export * from './influence-factors';

// 数据处理器
export * from './data-processor';

