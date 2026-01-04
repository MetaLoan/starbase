'use client';

import React, { useMemo, useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Progress, 
  Button,
  ButtonGroup,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@heroui/react';
import { motion } from 'framer-motion';
import { 
  type DailyForecast,
  type ProcessedDailyForecast,
  type HourlyForecast,
  PLANETS,
  ZODIAC_SIGNS,
  type PlanetId,
  type ZodiacId
} from '@/lib/astro';

interface DailyForecastViewProps {
  forecast: DailyForecast | ProcessedDailyForecast;
  onHourSelect?: (hour: number) => void;
}

const PLANET_COLORS: Record<string, string> = {
  sun: '#ffd700',
  moon: '#c0c0c0',
  mercury: '#b5651d',
  venus: '#ff69b4',
  mars: '#dc143c',
  jupiter: '#daa520',
  saturn: '#8b7355',
  uranus: '#40e0d0',
  neptune: '#4169e1',
  pluto: '#800080',
};

const MOOD_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  good: '#84cc16',
  neutral: '#eab308',
  challenging: '#f97316',
  difficult: '#ef4444',
};

const MOOD_LABELS: Record<string, string> = {
  excellent: '极佳',
  good: '良好',
  neutral: '平稳',
  challenging: '挑战',
  difficult: '困难',
};

export function DailyForecastView({ forecast, onHourSelect }: DailyForecastViewProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const currentHour = new Date().getHours();

  const planetDayInfo = PLANETS.find(p => p.id === forecast.planetaryDay);
  const moonSignInfo = ZODIAC_SIGNS.find(s => s.id === forecast.moonSign);

  // 生成24小时热力图
  const hourlyHeatmap = useMemo(() => {
    if (!forecast.hourlyBreakdown || forecast.hourlyBreakdown.length === 0) {
      return [];
    }
    return forecast.hourlyBreakdown.map((h, index) => ({
      ...h,
      isCurrent: index === currentHour,
      isLucky: forecast.luckyHours?.includes(index) || false,
      isChallenging: forecast.challengingHours?.includes(index) || false,
    }));
  }, [forecast, currentHour]);

  const selectedHourData = selectedHour !== null 
    ? forecast.hourlyBreakdown?.[selectedHour] 
    : forecast.hourlyBreakdown?.[currentHour];

  return (
    <div className="space-y-4">
      {/* 日期头部 */}
      <Card className="glass-card">
        <CardBody className="py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-display text-cosmic-nova">
                  {forecast.date.getDate()}
                </div>
                <div className="text-sm text-default-400">
                  {forecast.date.toLocaleDateString('zh-CN', { month: 'long' })}
                </div>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div>
                <div className="text-lg font-display text-default-200">
                  {forecast.dayOfWeek}
                </div>
                <div className="flex items-center gap-2 text-sm text-default-400">
                  <span 
                    className="text-lg"
                    style={{ 
                      color: PLANET_COLORS[forecast.planetaryDay],
                      filter: `drop-shadow(0 0 3px ${PLANET_COLORS[forecast.planetaryDay]})`
                    }}
                  >
                    {planetDayInfo?.symbol}
                  </span>
                  <span>{planetDayInfo?.name}日</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* 月亮信息 */}
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{moonSignInfo?.symbol}</span>
                  <span className="text-default-300">{forecast.moonSignName}</span>
                </div>
                {forecast.moonPhase && (
                  <div className="text-xs text-default-400">
                    {forecast.moonPhase.phase} · {Math.round(forecast.moonPhase.illumination || 0)}%
                  </div>
                )}
                {forecast.moonPhase?.isVoidOfCourse && (
                  <Chip size="sm" color="warning" variant="flat" className="mt-1">
                    月亮空亡
                  </Chip>
                )}
              </div>

              {/* 总分 */}
              <div className="text-center">
                <div 
                  className="text-4xl font-display"
                  style={{ 
                    color: forecast.overallScore >= 70 ? '#22c55e' : 
                           forecast.overallScore >= 50 ? '#eab308' : '#ef4444' 
                  }}
                >
                  {forecast.overallScore}
                </div>
                <div className="text-xs text-default-400">综合能量</div>
              </div>
            </div>
          </div>

          {/* 主题与建议 */}
          <div className="mt-4 p-3 rounded-lg bg-white/5">
            <div className="text-sm text-default-300">{forecast.theme}</div>
            <div className="text-xs text-default-400 mt-1">{forecast.advice}</div>
          </div>
        </CardBody>
      </Card>

      {/* 五维度雷达 */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <h3 className="text-lg font-display text-cosmic-nova">能量维度</h3>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(forecast.dimensions).map(([key, value]) => {
              const labels: Record<string, string> = {
                action: '行动力',
                communication: '沟通',
                emotion: '情感',
                creativity: '创造力',
                focus: '专注力',
              };
              return (
                <div key={key} className="text-center">
                  <div className="text-xs text-default-400 mb-1">{labels[key]}</div>
                  <Progress
                    size="sm"
                    value={value}
                    color={value >= 70 ? 'success' : value >= 50 ? 'warning' : 'danger'}
                    className="mb-1"
                  />
                  <div className="text-sm font-mono text-default-300">{value}</div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* 24小时热力图 */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-display text-cosmic-nova">24小时能量图</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-success" /> 最佳时段
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-danger" /> 需注意
              </span>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-24 gap-0.5">
            {hourlyHeatmap.map((hour) => (
              <div key={hour.hour} className="relative group">
                <motion.div
                  className={`h-10 rounded cursor-pointer transition-all ${
                    hour.isCurrent ? 'ring-2 ring-cosmic-nova' : ''
                  }`}
                  style={{
                    backgroundColor: MOOD_COLORS[hour.mood],
                    opacity: selectedHour === hour.hour ? 1 : 0.6,
                  }}
                  whileHover={{ scale: 1.2, opacity: 1 }}
                  onClick={() => {
                    setSelectedHour(hour.hour);
                    onHourSelect?.(hour.hour);
                  }}
                />
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="bg-cosmic-nebula border border-white/10 rounded-lg p-2 text-xs whitespace-nowrap shadow-xl">
                    <div className="font-bold">{hour.hour}:00</div>
                    <div>能量: {hour.score}</div>
                    <div>状态: {MOOD_LABELS[hour.mood]}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-default-400 mt-1">
            <span>0:00</span>
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </CardBody>
      </Card>

      {/* 选中小时详情 */}
      {selectedHourData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card border-l-4" style={{ borderColor: MOOD_COLORS[selectedHourData.mood] }}>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-display text-default-200">
                    {selectedHourData.hour}:00
                  </span>
                  <Chip 
                    size="sm" 
                    style={{ backgroundColor: MOOD_COLORS[selectedHourData.mood] + '30', color: MOOD_COLORS[selectedHourData.mood] }}
                  >
                    {MOOD_LABELS[selectedHourData.mood]}
                  </Chip>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono" style={{ color: MOOD_COLORS[selectedHourData.mood] }}>
                    {selectedHourData.score}
                  </div>
                  <div className="text-xs text-default-400">能量值</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-default-400 mb-1">月亮位置</div>
                  <div className="flex items-center gap-2">
                    <span>{ZODIAC_SIGNS.find(s => s.id === selectedHourData.moonSign)?.symbol}</span>
                    <span>{selectedHourData.moonSignName}</span>
                    <span className="text-default-400">第{selectedHourData.moonHouse}宫</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-default-400 mb-1">关键词</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedHourData.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                <div>
                  <div className="text-success mb-1">✓ 适合</div>
                  <ul className="text-default-300 space-y-0.5">
                    {selectedHourData.bestFor.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-danger mb-1">✗ 避免</div>
                  <ul className="text-default-300 space-y-0.5">
                    {selectedHourData.avoidFor.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* 活跃行运 */}
      {forecast.activeAspects && forecast.activeAspects.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-display text-cosmic-nova">今日活跃行运</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-2">
              {forecast.activeAspects.map((aspect, index) => {
                const transitPlanet = PLANETS.find(p => p.id === aspect.transitPlanet);
                const natalPlanet = PLANETS.find(p => p.id === aspect.natalPlanet);
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-lg"
                        style={{ color: PLANET_COLORS[aspect.transitPlanet] }}
                      >
                        {transitPlanet?.symbol}
                      </span>
                      <span className="text-xs text-default-400">{aspect.aspectType}</span>
                      <span 
                        className="text-lg"
                        style={{ color: PLANET_COLORS[aspect.natalPlanet] }}
                      >
                        {natalPlanet?.symbol}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-default-300">{aspect.interpretation}</div>
                      <div className="text-xs text-default-400">
                        精确度: {Math.round(aspect.exactness)}% · {aspect.applying ? '入相' : '出相'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

