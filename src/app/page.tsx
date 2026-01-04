'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Tabs, 
  Tab, 
  Card, 
  CardBody,
  Button,
  Chip,
  Slider,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  type BirthData,
  type NatalChart as NatalChartType,
  type PlanetId,
  type DailyForecast as DailyForecastType,
  type WeeklyForecast as WeeklyForecastType,
  type InfluenceFactorConfig,
  type ProcessedDailyForecast,
  type ProcessedWeeklyForecast,
  calculateNatalChart,
  calculateLifeTrend,
  generateChartSummary,
  processDailyForecast,
  processWeeklyForecast,
  getProcessedUserSnapshot,
  DEFAULT_FACTOR_CONFIG,
  PLANETS
} from '@/lib/astro';
import { NatalChartSVG, ChartInfo } from '@/components/chart';
import { LifeTimeline, ProfectionWheel } from '@/components/timeline';
import { BirthDataForm } from '@/components/input';
import { DailyForecastView, WeeklyForecastView } from '@/components/forecast';
import { InfluenceFactorsPanel } from '@/components/factors/InfluenceFactorsPanel';

export default function HomePage() {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [chart, setChart] = useState<NatalChartType | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('chart');
  const [timelineRange, setTimelineRange] = useState<[number, number]>([1990, 2060]);
  const [forecastMode, setForecastMode] = useState<'daily' | 'weekly'>('daily');
  const [forecastDate, setForecastDate] = useState<Date>(new Date());
  const [factorConfig, setFactorConfig] = useState<InfluenceFactorConfig>(DEFAULT_FACTOR_CONFIG);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 计算星盘
  const handleCalculate = useCallback(async (data: BirthData) => {
    setIsCalculating(true);
    
    // 模拟异步计算
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const natalChart = calculateNatalChart(data);
    setBirthData(data);
    setChart(natalChart);
    setIsCalculating(false);
    
    // 设置时间线范围
    const birthYear = data.date.getFullYear();
    setTimelineRange([birthYear, birthYear + 80]);
  }, []);

  // 计算人生趋势
  const trendData = useMemo(() => {
    if (!chart) return null;
    return calculateLifeTrend(chart, timelineRange[0], timelineRange[1], 'yearly');
  }, [chart, timelineRange]);

  // 计算当前年龄
  const currentAge = useMemo(() => {
    if (!birthData) return 30;
    const now = new Date();
    return now.getFullYear() - birthData.date.getFullYear();
  }, [birthData]);

  // 星盘摘要
  const chartSummary = useMemo(() => {
    if (!chart) return '';
    return generateChartSummary(chart);
  }, [chart]);

  // 每日预测（经过影响因子处理）
  const dailyForecast = useMemo(() => {
    if (!chart) return null;
    return processDailyForecast(chart, forecastDate, factorConfig);
  }, [chart, forecastDate, factorConfig]);

  // 每周预测（经过影响因子处理）
  const weeklyForecast = useMemo(() => {
    if (!chart) return null;
    // 获取本周一
    const weekStart = new Date(forecastDate);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);
    return processWeeklyForecast(chart, weekStart, factorConfig);
  }, [chart, forecastDate, factorConfig]);

  // 用户快照
  const userSnapshot = useMemo(() => {
    if (!chart) return null;
    return getProcessedUserSnapshot(chart, factorConfig);
  }, [chart, factorConfig]);

  return (
    <main className="min-h-screen relative">
      {/* 星空背景 */}
      <div className="starfield" />

      {/* 头部 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px #e94560)' }}>✧</div>
            <h1 className="text-xl font-display text-cosmic-nova tracking-wider">STAR</h1>
            <span className="text-xs text-default-400 hidden sm:block">占星时间系统</span>
          </div>
          
          {chart && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-default-400 hidden md:block">
                {birthData?.name || '命盘'} · {birthData?.date.toLocaleDateString('zh-CN')}
              </div>
              <Button 
                size="sm" 
                variant="flat" 
                color="primary"
                onPress={onOpen}
              >
                重新输入
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <div className="container mx-auto px-4 pt-20 pb-12">
        <AnimatePresence mode="wait">
          {!chart ? (
            // 输入界面
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[80vh] flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <h2 className="text-4xl md:text-5xl font-display text-cosmic-nova mb-4 glow-text">
                  探索你的星盘
                </h2>
                <p className="text-lg text-default-400 max-w-md mx-auto leading-relaxed">
                  输入出生信息，解锁本命盘、行运趋势与人生时间函数
                </p>
              </motion.div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <BirthDataForm 
                  onSubmit={handleCalculate}
                  isLoading={isCalculating}
                />
              </motion.div>

              {/* 装饰性星座符号 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((symbol, i) => (
                  <span
                    key={i}
                    className="absolute text-4xl opacity-5"
                    style={{
                      left: `${10 + (i % 4) * 25}%`,
                      top: `${10 + Math.floor(i / 4) * 30}%`,
                      transform: `rotate(${i * 30}deg)`,
                    }}
                  >
                    {symbol}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            // 结果界面
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* 摘要卡片 */}
              <Card className="glass-card">
                <CardBody className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-display text-cosmic-nova mb-1">
                        {birthData?.name || '你的星盘'}
                      </h2>
                      <p className="text-sm text-default-400 whitespace-pre-line font-mono">
                        {chartSummary.split('\n').slice(0, 2).join(' | ')}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {chart.dominantPlanets.slice(0, 3).map(planetId => {
                        const planet = PLANETS.find(p => p.id === planetId);
                        return (
                          <Chip 
                            key={planetId}
                            variant="flat"
                            size="sm"
                            style={{ 
                              borderColor: planet?.color,
                              color: planet?.color 
                            }}
                          >
                            {planet?.symbol} {planet?.name}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* 标签页导航 */}
              <Tabs 
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                variant="underlined"
                color="primary"
                classNames={{
                  tabList: 'gap-6',
                  cursor: 'bg-cosmic-nova',
                  tab: 'text-default-400 data-[selected=true]:text-cosmic-nova',
                }}
              >
                <Tab key="chart" title="本命盘" />
                <Tab key="forecast" title="每日运势" />
                <Tab key="factors" title="影响因子" />
                <Tab key="timeline" title="人生趋势" />
                <Tab key="profection" title="年限法" />
              </Tabs>

              {/* 内容区域 */}
              <AnimatePresence mode="wait">
                {selectedTab === 'chart' && (
                  <motion.div
                    key="chart-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* 星盘 SVG */}
                    <div className="lg:col-span-2 flex justify-center">
                      <NatalChartSVG 
                        chart={chart}
                        size={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 40 : 600)}
                        highlightPlanet={selectedPlanet}
                        onPlanetClick={setSelectedPlanet}
                      />
                    </div>
                    
                    {/* 信息面板 */}
                    <div className="lg:col-span-1">
                      <ChartInfo 
                        chart={chart}
                        selectedPlanet={selectedPlanet}
                        onPlanetSelect={setSelectedPlanet}
                      />
                    </div>
                  </motion.div>
                )}

                {selectedTab === 'forecast' && (
                  <motion.div
                    key="forecast-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* 日期选择与模式切换 */}
                    <Card className="glass-card">
                      <CardBody className="py-3">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="flat"
                              onPress={() => {
                                const newDate = new Date(forecastDate);
                                newDate.setDate(newDate.getDate() - (forecastMode === 'daily' ? 1 : 7));
                                setForecastDate(newDate);
                              }}
                            >
                              ←
                            </Button>
                            <input
                              type="date"
                              value={forecastDate.toISOString().split('T')[0]}
                              onChange={(e) => setForecastDate(new Date(e.target.value))}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm font-mono"
                            />
                            <Button 
                              size="sm" 
                              variant="flat"
                              onPress={() => {
                                const newDate = new Date(forecastDate);
                                newDate.setDate(newDate.getDate() + (forecastMode === 'daily' ? 1 : 7));
                                setForecastDate(newDate);
                              }}
                            >
                              →
                            </Button>
                            <Button 
                              size="sm" 
                              variant="flat"
                              color="primary"
                              onPress={() => setForecastDate(new Date())}
                            >
                              今天
                            </Button>
                          </div>
                          <Divider orientation="vertical" className="h-6 hidden sm:block" />
                          <div className="flex gap-2">
                            <Chip
                              className="cursor-pointer"
                              color={forecastMode === 'daily' ? 'primary' : 'default'}
                              variant={forecastMode === 'daily' ? 'solid' : 'flat'}
                              onClick={() => setForecastMode('daily')}
                            >
                              每日
                            </Chip>
                            <Chip
                              className="cursor-pointer"
                              color={forecastMode === 'weekly' ? 'primary' : 'default'}
                              variant={forecastMode === 'weekly' ? 'solid' : 'flat'}
                              onClick={() => setForecastMode('weekly')}
                            >
                              每周
                            </Chip>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* 预测内容 */}
                    {forecastMode === 'daily' && dailyForecast && (
                      <DailyForecastView forecast={dailyForecast} />
                    )}
                    {forecastMode === 'weekly' && weeklyForecast && (
                      <WeeklyForecastView 
                        forecast={weeklyForecast as any}
                        onDaySelect={(date) => {
                          setForecastDate(date);
                          setForecastMode('daily');
                        }}
                      />
                    )}
                    
                    {/* 当日影响因子概览 */}
                    {dailyForecast && dailyForecast.processed && (
                      <Card className="glass-card mt-4">
                        <CardBody>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white/80">
                              🔮 今日影响因子
                            </h4>
                            <Chip
                              size="sm"
                              color={dailyForecast.factorResult.totalAdjustment >= 0 ? 'success' : 'danger'}
                              variant="flat"
                            >
                              调整: {dailyForecast.factorResult.totalAdjustment >= 0 ? '+' : ''}
                              {dailyForecast.factorResult.totalAdjustment.toFixed(1)}
                            </Chip>
                          </div>
                          <p className="text-sm text-white/60 mb-3">
                            {dailyForecast.factorResult.summary}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dailyForecast.topFactors.map((factor, i) => (
                              <Chip
                                key={i}
                                size="sm"
                                variant="flat"
                                color={factor.adjustment >= 0 ? 'success' : 'warning'}
                              >
                                {factor.name}
                              </Chip>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="light"
                            className="mt-3"
                            onPress={() => setSelectedTab('factors')}
                          >
                            查看完整因子分析 →
                          </Button>
                        </CardBody>
                      </Card>
                    )}
                  </motion.div>
                )}

                {selectedTab === 'factors' && dailyForecast && (
                  <motion.div
                    key="factors-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* 因子分析面板 */}
                    <InfluenceFactorsPanel
                      factorResult={dailyForecast.factorResult}
                      config={factorConfig}
                      onConfigChange={setFactorConfig}
                      showConfig={false}
                    />

                    {/* 维度趋势（来自周预测） */}
                    {weeklyForecast && (
                      <Card className="glass-card">
                        <CardBody>
                          <h4 className="text-lg font-semibold text-white/90 mb-4">
                            📈 本周维度趋势
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {Object.entries(weeklyForecast.dimensionTrends).map(([dim, values]) => {
                              const avg = values.reduce((s, v) => s + v, 0) / values.length;
                              const trend = values[6] - values[0];
                              const dimLabels: Record<string, string> = {
                                career: '💼 事业',
                                relationship: '💕 关系',
                                health: '🏃 健康',
                                finance: '💰 财务',
                                spiritual: '🧘 灵性',
                              };
                              return (
                                <div key={dim} className="bg-white/5 rounded-lg p-3 text-center">
                                  <div className="text-sm text-white/70 mb-1">{dimLabels[dim]}</div>
                                  <div className="text-2xl font-bold text-white/90">
                                    {Math.round(avg)}
                                  </div>
                                  <div className={`text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 简易折线图 */}
                          <div className="mt-6">
                            <h5 className="text-sm text-white/70 mb-3">7日能量走势</h5>
                            <div className="flex items-end justify-between h-24 gap-1">
                              {weeklyForecast.days.map((day, i) => {
                                const score = day.overallScore;
                                const height = Math.max(10, (score / 100) * 100);
                                const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center">
                                    <div
                                      className={`w-full rounded-t transition-all ${
                                        score >= 70 ? 'bg-green-500' :
                                        score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ height: `${height}%` }}
                                    />
                                    <div className="text-xs text-white/50 mt-1">
                                      周{weekdays[day.date.getDay()]}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {/* 周度因子汇总 */}
                    {weeklyForecast && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="glass-card">
                          <CardBody>
                            <h4 className="text-sm font-semibold text-green-400 mb-3">
                              ✅ 本周有利因子
                            </h4>
                            <div className="space-y-2">
                              {weeklyForecast.weeklyFactors.positive.map((factor, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-white/70">{factor.name}</span>
                                  <span className="text-green-400">+{factor.adjustment.toFixed(1)}</span>
                                </div>
                              ))}
                              {weeklyForecast.weeklyFactors.positive.length === 0 && (
                                <p className="text-white/40 text-sm">暂无显著有利因子</p>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                        <Card className="glass-card">
                          <CardBody>
                            <h4 className="text-sm font-semibold text-red-400 mb-3">
                              ⚠️ 本周需注意
                            </h4>
                            <div className="space-y-2">
                              {weeklyForecast.weeklyFactors.negative.map((factor, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-white/70">{factor.name}</span>
                                  <span className="text-red-400">{factor.adjustment.toFixed(1)}</span>
                                </div>
                              ))}
                              {weeklyForecast.weeklyFactors.negative.length === 0 && (
                                <p className="text-white/40 text-sm">暂无显著不利因子</p>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {/* 周洞察 */}
                    {weeklyForecast && (
                      <Card className="glass-card bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                        <CardBody>
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">💡</span>
                            <div>
                              <h4 className="text-sm font-semibold text-white/90 mb-1">
                                {weeklyForecast.weeklyTheme}
                              </h4>
                              <p className="text-sm text-white/70">
                                {weeklyForecast.weeklyInsight}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </motion.div>
                )}

                {selectedTab === 'timeline' && trendData && (
                  <motion.div
                    key="timeline-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* 时间范围选择 */}
                    <Card className="glass-card">
                      <CardBody className="py-3">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-default-400 whitespace-nowrap">时间范围:</span>
                          <Slider
                            size="sm"
                            step={1}
                            minValue={birthData ? birthData.date.getFullYear() : 1950}
                            maxValue={birthData ? birthData.date.getFullYear() + 100 : 2100}
                            value={timelineRange}
                            onChange={(value) => setTimelineRange(value as [number, number])}
                            className="flex-1"
                            formatOptions={{ useGrouping: false }}
                          />
                          <span className="text-sm font-mono text-default-300">
                            {timelineRange[0]} - {timelineRange[1]}
                          </span>
                        </div>
                      </CardBody>
                    </Card>

                    {/* 时间线图表 */}
                    <LifeTimeline 
                      trendData={trendData}
                      currentYear={new Date().getFullYear()}
                    />

                    {/* 周期信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="glass-card">
                        <CardBody>
                          <h4 className="text-sm font-display text-cosmic-nova mb-2">土星周期</h4>
                          <div className="space-y-1">
                            {trendData.cycles.saturnCycles.map((cycle, i) => (
                              <div key={i} className="text-xs text-default-400">
                                <span className="text-default-300">{cycle.age}岁</span> ({cycle.year}): {cycle.description.split('：')[0]}
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                      <Card className="glass-card">
                        <CardBody>
                          <h4 className="text-sm font-display text-cosmic-nova mb-2">木星周期</h4>
                          <div className="space-y-1">
                            {trendData.cycles.jupiterCycles.slice(0, 4).map((cycle, i) => (
                              <div key={i} className="text-xs text-default-400">
                                <span className="text-default-300">{cycle.age}岁</span> ({cycle.year})
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                      <Card className="glass-card">
                        <CardBody>
                          <h4 className="text-sm font-display text-cosmic-nova mb-2">年限法周期</h4>
                          <div className="space-y-1">
                            {trendData.cycles.profectionCycles.slice(0, 4).map((cycle, i) => (
                              <div key={i} className="text-xs text-default-400">
                                <span className="text-default-300">{cycle.startAge}-{cycle.endAge}岁</span>: {cycle.theme.split('：')[0]}
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </motion.div>
                )}

                {selectedTab === 'profection' && (
                  <motion.div
                    key="profection-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {/* 年限法轮盘 */}
                    <div className="flex justify-center">
                      <ProfectionWheel 
                        chart={chart}
                        currentAge={currentAge}
                      />
                    </div>

                    {/* 未来年份预览 */}
                    <Card className="glass-card">
                      <CardBody>
                        <h4 className="text-lg font-display text-cosmic-nova mb-4">未来 12 年概览</h4>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {Array.from({ length: 12 }, (_, i) => currentAge + i).map(age => {
                            const year = birthData ? birthData.date.getFullYear() + age : 2024;
                            const house = (age % 12) + 1;
                            const isAngular = [1, 4, 7, 10].includes(house);
                            const isCurrent = age === currentAge;

                            return (
                              <div 
                                key={age}
                                className={`p-3 rounded-lg border transition-all ${
                                  isCurrent 
                                    ? 'bg-cosmic-nova/20 border-cosmic-nova' 
                                    : isAngular
                                    ? 'bg-white/5 border-white/20'
                                    : 'bg-transparent border-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className={`text-lg font-display ${isCurrent ? 'text-cosmic-nova' : 'text-default-300'}`}>
                                      {year}
                                    </span>
                                    <span className="text-sm text-default-400">{age}岁</span>
                                    {isCurrent && <Chip size="sm" color="danger">当前</Chip>}
                                    {isAngular && !isCurrent && <Chip size="sm" variant="flat">角宫年</Chip>}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-default-300">第{house}宫</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 重新输入 Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent className="glass-card">
          <ModalHeader className="font-display text-cosmic-nova">重新输入出生信息</ModalHeader>
          <ModalBody className="pb-6">
            <BirthDataForm 
              onSubmit={(data) => {
                handleCalculate(data);
                onClose();
              }}
              initialData={birthData || undefined}
              isLoading={isCalculating}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 页脚 */}
      <footer className="mt-12 py-6 border-t border-white/5">
        <div className="container mx-auto px-4 text-center text-xs text-default-400">
          <p>占星不是科学预测，而是人生时间叙事系统</p>
          <p className="mt-1 opacity-50">「你能算清楚什么时候浪大，但你永远不能替人决定是否下水」</p>
        </div>
      </footer>
    </main>
  );
}

