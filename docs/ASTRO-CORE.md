# 占星计算核心文档

## 概述

`src/lib/astro/` 是一个纯 TypeScript 实现的占星计算库，不依赖任何 UI 框架，可独立使用。

---

## 快速开始

```typescript
import {
  calculateNatalChart,
  calculateDailyForecast,
  calculateLifeTrend,
  type BirthData
} from './lib/astro';

// 定义出生数据
const birthData: BirthData = {
  date: new Date('1990-03-15T08:30:00'),
  latitude: 39.9042,   // 北京
  longitude: 116.4074,
  timezone: 'Asia/Shanghai',
  name: '示例用户'
};

// 计算本命盘
const chart = calculateNatalChart(birthData);
console.log(chart.planets);  // 行星位置
console.log(chart.aspects);  // 相位

// 计算今日运势
const today = calculateDailyForecast(new Date(), chart);
console.log(today.overallScore);  // 综合评分

// 计算人生趋势
const trend = calculateLifeTrend(chart, 1990, 2060, 'yearly');
console.log(trend.summary);  // 趋势摘要
```

---

## 核心模块

### 1. 常量定义 (`constants.ts`)

#### 黄道十二宫

```typescript
import { ZODIAC_SIGNS } from './lib/astro';

ZODIAC_SIGNS.forEach(sign => {
  console.log(sign.id);      // 'aries', 'taurus', ...
  console.log(sign.name);    // '白羊座', '金牛座', ...
  console.log(sign.symbol);  // '♈', '♉', ...
  console.log(sign.element); // 'fire', 'earth', 'air', 'water'
  console.log(sign.modality);// 'cardinal', 'fixed', 'mutable'
  console.log(sign.ruler);   // 守护星
});
```

#### 行星

```typescript
import { PLANETS } from './lib/astro';

PLANETS.forEach(planet => {
  console.log(planet.id);           // 'sun', 'moon', ...
  console.log(planet.name);         // '太阳', '月亮', ...
  console.log(planet.symbol);       // '☉', '☽', ...
  console.log(planet.type);         // 'luminary', 'personal', 'social', 'transpersonal'
  console.log(planet.orbitalPeriod);// 轨道周期（天）
});
```

#### 宫位

```typescript
import { HOUSES } from './lib/astro';

HOUSES.forEach(house => {
  console.log(house.id);         // 1-12
  console.log(house.name);       // '第一宫', ...
  console.log(house.theme);      // '自我', '资源', ...
  console.log(house.keywords);   // ['身份', '外表', ...]
  console.log(house.angularType);// 'angular', 'succedent', 'cadent'
});
```

#### 相位

```typescript
import { ASPECTS } from './lib/astro';

ASPECTS.forEach(aspect => {
  console.log(aspect.id);      // 'conjunction', 'opposition', ...
  console.log(aspect.name);    // '合相', '对冲', ...
  console.log(aspect.symbol);  // '☌', '☍', ...
  console.log(aspect.angle);   // 0, 180, 120, 90, 60, ...
  console.log(aspect.orb);     // 容许度
  console.log(aspect.harmony); // 'harmonious', 'tense', 'neutral'
});
```

---

### 2. 星历计算 (`ephemeris.ts`)

#### 儒略日转换

```typescript
import { dateToJulianDay, julianDayToDate } from './lib/astro';

const jd = dateToJulianDay(new Date('2026-01-04'));
// 2460674.5

const date = julianDayToDate(2460674.5);
// 2026-01-04T00:00:00.000Z
```

#### 行星位置

```typescript
import { calculatePlanetPosition, calculateAllPlanetPositions } from './lib/astro';

// 单个行星
const sunPos = calculatePlanetPosition('sun', jd);
console.log(sunPos.longitude);  // 黄经 (0-360)
console.log(sunPos.latitude);   // 黄纬
console.log(sunPos.distance);   // 距离 (AU)

// 所有行星
const positions = calculateAllPlanetPositions(new Date());
```

#### 宫位计算

```typescript
import { calculateAscendant, calculateMidheaven, calculateHouseCusps } from './lib/astro';

const asc = calculateAscendant(jd, latitude, longitude);
const mc = calculateMidheaven(jd, longitude);
const cusps = calculateHouseCusps(jd, latitude, longitude);  // 12个宫头
```

---

### 3. 相位计算 (`aspects.ts`)

```typescript
import { calculateAllAspects, calculateAspectScore, detectAspectPatterns } from './lib/astro';

// 计算所有相位
const aspects = calculateAllAspects(planetPositions);

aspects.forEach(asp => {
  console.log(asp.planet1);      // 行星1
  console.log(asp.planet2);      // 行星2
  console.log(asp.aspectType);   // 'conjunction', 'trine', ...
  console.log(asp.orb);          // 实际容许度
  console.log(asp.strength);     // 0-1，越接近精确越强
  console.log(asp.applying);     // true=入相, false=出相
});

// 相位评分
const score = calculateAspectScore(aspects);
console.log(score.harmonious);  // 和谐相位总分
console.log(score.tense);       // 紧张相位总分

// 检测相位图案
const patterns = detectAspectPatterns(positions, aspects);
// 大三角、T三角、群星等
```

---

### 4. 本命盘 (`natal-chart.ts`)

```typescript
import { calculateNatalChart, generateChartSummary } from './lib/astro';

const chart = calculateNatalChart(birthData);

// 行星配置
chart.planets.forEach(p => {
  console.log(`${p.name} 在 ${p.signName} ${p.house}宫 ${p.signDegree.toFixed(1)}°`);
});

// 宫位
chart.houses.forEach(h => {
  console.log(`第${h.house}宫: ${h.sign} ${h.signDegree.toFixed(1)}°`);
});

// 上升/中天
console.log(`上升: ${chart.ascendant.toFixed(1)}°`);
console.log(`中天: ${chart.midheaven.toFixed(1)}°`);

// 元素/模式平衡
console.log(chart.elementBalance);   // { fire: 3, earth: 2, air: 4, water: 5 }
console.log(chart.modalityBalance);  // { cardinal: 3, fixed: 4, mutable: 7 }

// 主导行星 & 盘主星
console.log(chart.dominantPlanets);  // ['venus', 'neptune', 'moon']
console.log(chart.chartRuler);       // 'mercury'

// 生成摘要文本
const summary = generateChartSummary(chart);
```

---

### 5. 行运 (`transits.ts`)

```typescript
import {
  calculateDailyTransits,
  calculateTransitPeriod,
  findMajorTransits,
  generateTransitTimeline
} from './lib/astro';

// 今日行运
const daily = calculateDailyTransits(new Date(), chart);
console.log(daily.score);       // 评分
console.log(daily.aspects);     // 行运相位
console.log(daily.keyTheme);    // 主题

// 时间段行运
const period = calculateTransitPeriod(startDate, endDate, chart, 'daily');
console.log(period.events);     // 行运事件列表

// 重大行运（土星回归、木星回归等）
const major = findMajorTransits(birthDate, 2020, 2030);
major.forEach(m => {
  console.log(`${m.date.toDateString()}: ${m.name} - ${m.description}`);
});

// 趋势时间线
const timeline = generateTransitTimeline(chart, startDate, endDate, 7);
```

---

### 6. 推运 (`progressions.ts`)

```typescript
import { calculateProgressedChart, findProgressionEvents } from './lib/astro';

// 推运盘
const progressed = calculateProgressedChart(chart, targetDate);

console.log(progressed.yearsFromBirth);  // 推进年数
console.log(progressed.lunarPhase);      // 推运月相

progressed.planets.forEach(p => {
  console.log(`${p.name}: 本命 ${p.natalLongitude.toFixed(1)}° → 推运 ${p.progressedLongitude.toFixed(1)}°`);
  if (p.signChanged) {
    console.log(`  ↳ 已换座至 ${p.signName}`);
  }
});

// 推运事件
const events = findProgressionEvents(chart, 2020, 2030);
```

---

### 7. 年限法 (`profections.ts`)

```typescript
import {
  calculateAnnualProfection,
  calculateLifeProfectionMap,
  getProfectionWheelData
} from './lib/astro';

// 指定年龄的年限法
const profection = calculateAnnualProfection(chart, 35);

console.log(profection.year);         // 2025
console.log(profection.age);          // 35
console.log(profection.house);        // 12
console.log(profection.houseTheme);   // '超越'
console.log(profection.lordOfYear);   // 'neptune'
console.log(profection.description);  // 详细描述

// 人生年限法地图
const map = calculateLifeProfectionMap(chart, 35, 12);
console.log(map.currentYear);     // 当前年份
console.log(map.upcomingYears);   // 未来12年
console.log(map.cycleAnalysis);   // 周期分析

// 轮盘数据（用于可视化）
const wheelData = getProfectionWheelData(chart, 35);
```

---

### 8. 每日预测 (`daily-forecast.ts`)

```typescript
import {
  calculateHourlyForecast,
  calculateDailyForecast,
  calculateWeeklyForecast,
  getPlanetaryDay,
  getPlanetaryHour,
  calculateMoonPhase
} from './lib/astro';

// 行星日/行星时
const planetaryDay = getPlanetaryDay(new Date());   // 'saturn' (周六)
const planetaryHour = getPlanetaryHour(new Date()); // 当前行星时

// 月相
const moonPhase = calculateMoonPhase(new Date());
console.log(moonPhase.phase);        // '上弦月'
console.log(moonPhase.illumination); // 52.3%

// 每小时预测
const hourly = calculateHourlyForecast(new Date(), 14, chart);
console.log(hourly.score);     // 能量评分
console.log(hourly.mood);      // 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult'
console.log(hourly.keywords);  // 关键词
console.log(hourly.bestFor);   // 适合做什么
console.log(hourly.avoidFor);  // 避免做什么

// 每日预测
const daily = calculateDailyForecast(new Date(), chart);
console.log(daily.overallScore);      // 综合评分
console.log(daily.dimensions);        // 五维度评分
console.log(daily.luckyHours);        // 最佳时段
console.log(daily.challengingHours);  // 需注意时段
console.log(daily.hourlyBreakdown);   // 24小时详情

// 每周预测
const weekly = calculateWeeklyForecast(new Date(), chart);
console.log(weekly.overallTheme);   // 本周主题
console.log(weekly.keyDates);       // 关键日期
console.log(weekly.bestDaysFor);    // 最佳日期建议
```

---

### 9. 人生趋势 (`life-trend.ts`)

```typescript
import { calculateLifeTrend, getYearSnapshot } from './lib/astro';

// 计算人生趋势
const trend = calculateLifeTrend(chart, 1990, 2060, 'yearly');

// 趋势点
trend.points.forEach(p => {
  console.log(`${p.year} (${p.age}岁): 评分 ${p.overallScore}`);
  console.log(`  年限法: 第${p.profection.house}宫 (${p.profection.theme})`);
  console.log(`  推运月相: ${p.lunarPhaseName}`);
  if (p.isMajorTransit) {
    console.log(`  ⭐ ${p.majorTransitName}`);
  }
});

// 摘要
console.log(trend.summary.overallTrend);      // 'ascending' | 'descending' | 'fluctuating' | 'stable'
console.log(trend.summary.peakYears);         // 高峰年份
console.log(trend.summary.challengeYears);    // 挑战年份
console.log(trend.summary.transformationYears); // 转化年份

// 周期
console.log(trend.cycles.saturnCycles);   // 土星周期
console.log(trend.cycles.jupiterCycles);  // 木星周期

// 单年快照
const snapshot = getYearSnapshot(chart, 2026);
```

---

## 类型定义

### BirthData

```typescript
interface BirthData {
  date: Date;           // 出生时间
  latitude: number;     // 纬度 (-90 ~ 90)
  longitude: number;    // 经度 (-180 ~ 180)
  timezone: string;     // 时区 (如 'Asia/Shanghai')
  name?: string;        // 姓名（可选）
}
```

### NatalChart

```typescript
interface NatalChart {
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
```

### PlanetPlacement

```typescript
interface PlanetPlacement {
  id: PlanetId;
  name: string;
  symbol: string;
  longitude: number;
  latitude: number;
  sign: ZodiacId;
  signName: string;
  signSymbol: string;
  signDegree: number;   // 0-30
  house: number;        // 1-12
  retrograde: boolean;
  dignityScore: number;
}
```

---

## 精度说明

| 计算项目 | 精度 | 有效范围 |
|---------|------|----------|
| 太阳位置 | < 0.01° | ±200年 |
| 月亮位置 | < 0.1° | ±50年 |
| 内行星 | < 0.1° | ±100年 |
| 外行星 | < 0.5° | ±200年 |
| 宫位计算 | < 1° | ±100年 |

对于专业应用，建议：
- 接入 Swiss Ephemeris 获得更高精度
- 使用真恒星时而非平恒星时
- 考虑岁差和章动修正

---

## 影响因子层 (`influence-factors.ts` & `data-processor.ts`)

影响因子层是数据处理的中间层，实现了：

```
原始占星数据 → 影响因子层 → 最终输出
```

### 核心概念

影响因子会对原始计算结果进行二次处理，产生更精细化的评分和建议。

### 因子类型

| 因子类型 | 说明 | 影响范围 |
|---------|------|----------|
| dignity | 行星尊贵度（庙旺陷落） | ±10分 |
| retrograde | 行星逆行 | 负面影响 |
| aspectPhase | 相位入相/出相 | 入相更强 |
| aspectOrb | 容许度精确度 | 精确相位加成 |
| outerPlanet | 外行星周期（土星回归等） | ±15分 |
| profectionLord | 年限法主星 | ±15分 |
| lunarPhase | 月相 | ±10分 |
| planetaryHour | 行星时 | ±10分 |
| personal | 个人化因子 | ±12分 |
| custom | 自定义因子 | ±20分 |

### 使用示例

```typescript
import {
  processDailyForecast,
  processWeeklyForecast,
  getProcessedUserSnapshot,
  DEFAULT_FACTOR_CONFIG,
  createFactorConfig
} from './lib/astro';

// 使用默认配置处理每日预测
const processed = processDailyForecast(chart, new Date());
console.log(processed.overallScore);      // 调整后分数
console.log(processed.rawScore);          // 原始分数
console.log(processed.factorResult);      // 因子详情
console.log(processed.dimensions);        // 维度分数

// 自定义因子权重
const customConfig = createFactorConfig({
  weights: {
    dignity: 1.0,        // 加强尊贵度影响
    lunarPhase: 0.3,     // 减弱月相影响
    planetaryHour: 0,    // 禁用行星时
  }
});

const customProcessed = processDailyForecast(chart, new Date(), customConfig);
```

### 因子配置

```typescript
interface InfluenceFactorConfig {
  enabled: boolean;           // 总开关
  weights: {
    dignity: number;          // 0-1
    retrograde: number;
    aspectPhase: number;
    aspectOrb: number;
    outerPlanet: number;
    profectionLord: number;
    lunarPhase: number;
    planetaryHour: number;
    personal: number;
    custom: number;
  };
  customFactors: CustomFactor[];
}
```

### 预设配置

- `DEFAULT_FACTOR_CONFIG` - 标准模式
- `CONSERVATIVE_FACTOR_CONFIG` - 保守模式（因子影响较小）
- `AGGRESSIVE_FACTOR_CONFIG` - 激进模式（因子影响较大）

### 自定义因子

```typescript
import { createCustomFactor } from './lib/astro';

const myFactor = createCustomFactor(
  'mercury_retrograde_protection',
  '水逆保护',
  '水星逆行期间的特殊保护措施',
  { overall: -0.1, communication: -0.2 },
  { type: 'transit', params: { planet: 'mercury', retrograde: true } },
  10  // 优先级
);
```

### 因子结果结构

```typescript
interface FactorResult {
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
  appliedFactors: AppliedFactor[];
  totalAdjustment: number;
  summary: string;
}
```

---

## 数据处理器 (`data-processor.ts`)

数据处理器是所有数据输出的中央处理点，确保所有数据都经过影响因子层处理。

### 主要函数

| 函数 | 说明 | 返回类型 |
|------|------|----------|
| `processDailyForecast()` | 处理每日预测 | `ProcessedDailyForecast` |
| `processWeeklyForecast()` | 处理周预测 | `ProcessedWeeklyForecast` |
| `processLifeTrend()` | 处理人生趋势 | `ProcessedLifeTrend` |
| `getProcessedUserSnapshot()` | 获取完整用户快照 | `ProcessedUserSnapshot` |
| `buildFactorContext()` | 构建因子计算上下文 | `FactorContext` |

### ProcessedDailyForecast

```typescript
interface ProcessedDailyForecast extends Omit<DailyForecast, 'dimensions'> {
  rawScore: number;
  rawDimensions: { action, communication, emotion, creativity, focus };
  factorResult: FactorResult;
  dimensions: { career, relationship, health, finance, spiritual };
  topFactors: AppliedFactor[];
  processed: true;
}
```

### 完整用户快照

```typescript
const snapshot = getProcessedUserSnapshot(chart);

// 包含：
// - 本命盘基础信息
// - 当前状态（年龄、年限法、年度主星）
// - 今日预测（经因子处理）
// - 本周预测（经因子处理）
// - 所有活跃因子
// - 因子配置
```

