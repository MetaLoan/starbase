'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react';
import { motion } from 'framer-motion';
import { 
  type WeeklyForecast,
  PLANETS,
  ZODIAC_SIGNS,
  type PlanetId,
  type ZodiacId
} from '@/lib/astro';

interface WeeklyForecastViewProps {
  forecast: WeeklyForecast;
  onDaySelect?: (date: Date) => void;
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

export function WeeklyForecastView({ forecast, onDaySelect }: WeeklyForecastViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {/* 周概览 */}
      <Card className="glass-card">
        <CardBody className="py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm text-default-400 mb-1">
                第 {forecast.weekNumber} 周
              </div>
              <div className="text-xl font-display text-default-200">
                {forecast.startDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                {' - '}
                {forecast.endDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-default-400">本周主题</div>
              <div className="text-cosmic-nova">{forecast.overallTheme}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 七日概览 */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <h3 className="text-lg font-display text-cosmic-nova">七日能量图</h3>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-7 gap-2">
            {(forecast.dailySummaries || []).map((day, index) => {
              const isToday = day.date.getTime() === today.getTime();
              const moonSign = ZODIAC_SIGNS.find(s => s.id === day.moonSign);
              
              return (
                <motion.div
                  key={index}
                  className={`p-3 rounded-lg text-center cursor-pointer transition-all ${
                    isToday 
                      ? 'bg-cosmic-nova/20 ring-2 ring-cosmic-nova' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onDaySelect?.(day.date)}
                >
                  <div className="text-xs text-default-400">{day.dayOfWeek}</div>
                  <div className="text-lg font-display text-default-200">
                    {day.date.getDate()}
                  </div>
                  <div className="text-xl my-1">{moonSign?.symbol}</div>
                  <div 
                    className="text-lg font-mono"
                    style={{
                      color: day.score >= 70 ? '#22c55e' : 
                             day.score >= 50 ? '#eab308' : '#ef4444'
                    }}
                  >
                    {day.score}
                  </div>
                  {isToday && (
                    <Chip size="sm" color="danger" className="mt-1">今天</Chip>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* 关键日期 */}
      {forecast.keyDates && forecast.keyDates.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-display text-cosmic-nova">本周关键日期</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-2">
              {forecast.keyDates.map((keyDate, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    keyDate.significance === 'high' 
                      ? 'bg-cosmic-nova/10 border border-cosmic-nova/30' 
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-lg font-display text-default-200">
                        {keyDate.date.getDate()}
                      </div>
                      <div className="text-xs text-default-400">
                        {keyDate.date.toLocaleDateString('zh-CN', { weekday: 'short' })}
                      </div>
                    </div>
                    <div className="text-default-300">{keyDate.event}</div>
                  </div>
                  <Chip 
                    size="sm" 
                    color={keyDate.significance === 'high' ? 'danger' : 'default'}
                    variant="flat"
                  >
                    {keyDate.significance === 'high' ? '重要' : '关注'}
                  </Chip>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 最佳日期建议 */}
      {forecast.bestDaysFor && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardBody className="py-3 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-xs text-default-400 mb-2">行动日</div>
            {forecast.bestDaysFor.action?.length > 0 ? (
              <div className="space-y-1">
                {forecast.bestDaysFor.action.slice(0, 2).map((date, i) => (
                  <div key={i} className="text-sm text-default-300">
                    {date.toLocaleDateString('zh-CN', { weekday: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-default-500">本周暂无</div>
            )}
          </CardBody>
        </Card>

        <Card className="glass-card">
          <CardBody className="py-3 text-center">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-xs text-default-400 mb-2">沟通日</div>
            {forecast.bestDaysFor.communication?.length > 0 ? (
              <div className="space-y-1">
                {forecast.bestDaysFor.communication.slice(0, 2).map((date, i) => (
                  <div key={i} className="text-sm text-default-300">
                    {date.toLocaleDateString('zh-CN', { weekday: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-default-500">本周暂无</div>
            )}
          </CardBody>
        </Card>

        <Card className="glass-card">
          <CardBody className="py-3 text-center">
            <div className="text-2xl mb-1">🎨</div>
            <div className="text-xs text-default-400 mb-2">创意日</div>
            {forecast.bestDaysFor.creativity?.length > 0 ? (
              <div className="space-y-1">
                {forecast.bestDaysFor.creativity.slice(0, 2).map((date, i) => (
                  <div key={i} className="text-sm text-default-300">
                    {date.toLocaleDateString('zh-CN', { weekday: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-default-500">本周暂无</div>
            )}
          </CardBody>
        </Card>

        <Card className="glass-card">
          <CardBody className="py-3 text-center">
            <div className="text-2xl mb-1">🌙</div>
            <div className="text-xs text-default-400 mb-2">休息日</div>
            {forecast.bestDaysFor.rest?.length > 0 ? (
              <div className="space-y-1">
                {forecast.bestDaysFor.rest.slice(0, 2).map((date, i) => (
                  <div key={i} className="text-sm text-default-300">
                    {date.toLocaleDateString('zh-CN', { weekday: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-default-500">本周暂无</div>
            )}
          </CardBody>
        </Card>
      </div>
      )}

      {/* 本周行运 */}
      {forecast.weeklyTransits && forecast.weeklyTransits.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-display text-cosmic-nova">本周重要行运</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-2">
              {forecast.weeklyTransits.slice(0, 5).map((transit, index) => {
                const planet = PLANETS.find(p => p.id === transit.planet);
                const natalPlanet = PLANETS.find(p => p.id === transit.natalPlanet);
                
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <span 
                      className="text-xl"
                      style={{ color: PLANET_COLORS[transit.planet] }}
                    >
                      {planet?.symbol}
                    </span>
                    <span className="text-sm text-default-400">{transit.aspect}</span>
                    <span 
                      className="text-xl"
                      style={{ color: PLANET_COLORS[transit.natalPlanet] }}
                    >
                      {natalPlanet?.symbol}
                    </span>
                    <span className="text-sm text-default-300 flex-1">
                      {transit.description}
                    </span>
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

