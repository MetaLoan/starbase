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
  useDisclosure,
  Spinner
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLANETS, ZODIAC_SIGNS, type PlanetId } from '@/lib/astro';
import { useAstroData, type BirthDataInput, type ChartData } from '@/lib/api';
import { NatalChartSVG, ChartInfo } from '@/components/chart';
import { LifeTimeline, ProfectionWheel } from '@/components/timeline';
import { BirthDataForm } from '@/components/input';
import { DailyForecastView, WeeklyForecastView } from '@/components/forecast';
import { InfluenceFactorsPanel } from '@/components/factors/InfluenceFactorsPanel';

// 将 API 响应转换为组件需要的格式
function transformChartForDisplay(chart: ChartData): any {
  return {
    ...chart,
    birthData: {
      ...chart.birthData,
      date: new Date(chart.birthData.date),
    },
    // 确保 houses 有 longitude 属性（API 可能返回 cusp）
    houses: chart.houses?.map((h: any) => ({
      ...h,
      longitude: h.longitude ?? h.cusp ?? 0,
    })) || [],
  };
}

export default function HomePage() {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('chart');
  const [timelineRange, setTimelineRange] = useState<[number, number]>([1990, 2060]);
  const [forecastMode, setForecastMode] = useState<'daily' | 'weekly'>('daily');
  const [forecastDate, setForecastDate] = useState<Date>(new Date());
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 使用 API Hook
  const {
    birthData,
    chart,
    daily,
    weekly,
    lifeTrend,
    loading,
    error,
    initialize,
    refreshDaily,
    refreshWeekly,
    reset,
  } = useAstroData();

  // 处理出生数据提交
  const handleSubmit = useCallback(async (data: any) => {
    const birthDataInput: BirthDataInput = {
      name: data.name || 'Anonymous',
      date: data.date.toISOString(),
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone || 'UTC',
    };
    
    await initialize(birthDataInput);
    
    // 设置时间线范围
    const birthYear = data.date.getFullYear();
    setTimelineRange([birthYear, birthYear + 80]);
  }, [initialize]);

  // 日期变化时刷新预测
  const handleDateChange = useCallback(async (newDate: Date) => {
    setForecastDate(newDate);
    const dateStr = newDate.toISOString();
    
    if (forecastMode === 'daily') {
      await refreshDaily(dateStr);
    } else {
      await refreshWeekly(dateStr);
    }
  }, [forecastMode, refreshDaily, refreshWeekly]);

  // 转换数据格式供组件使用
  const displayChart = useMemo(() => {
    if (!chart) return null;
    return transformChartForDisplay(chart);
  }, [chart]);

  // 计算当前年龄
  const currentAge = useMemo(() => {
    if (!birthData) return 30;
    const birthDate = new Date(birthData.date);
    const now = new Date();
    return now.getFullYear() - birthDate.getFullYear();
  }, [birthData]);

  // 星盘摘要
  const chartSummary = useMemo(() => {
    if (!chart) return '';
    const sun = chart.planets.find((p: any) => p.id === 'sun');
    const moon = chart.planets.find((p: any) => p.id === 'moon');
    const risingIndex = Math.floor(chart.ascendant / 30);
    const rising = ZODIAC_SIGNS[risingIndex];
    return `☉ ${sun?.signName || ''} | ☽ ${moon?.signName || ''} | ASC ${rising?.name || ''}`;
  }, [chart]);

  // 转换每日预测数据
  const dailyForecastForView = useMemo(() => {
    if (!daily) return null;
    return {
      ...daily,
      date: new Date(daily.date),
      factorResult: daily.factors ? {
        totalAdjustment: daily.factors.totalAdjustment,
        summary: daily.factors.summary,
        appliedFactors: daily.factors.appliedFactors,
        adjustedScores: {
          overall: daily.overallScore,
          dimensions: daily.dimensions,
        },
      } : null,
      topFactors: daily.factors?.appliedFactors?.slice(0, 5) || [],
      processed: daily.processed,
    };
  }, [daily]);

  // 转换每周预测数据
  const weeklyForecastForView = useMemo(() => {
    if (!weekly) return null;
    const weeklyAny = weekly as any;
    const daysData = (weeklyAny.days || weeklyAny.dailySummaries || []).map((d: any) => ({
      ...d,
      date: new Date(d.date),
    }));
    return {
      ...weekly,
      startDate: new Date(weekly.startDate),
      endDate: new Date(weekly.endDate),
      days: daysData,
      dailySummaries: daysData, // 兼容组件期望的字段名
    };
  }, [weekly]);

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
            <Chip size="sm" variant="flat" color="success" className="ml-2">API</Chip>
          </div>
          
          {chart && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-default-400 hidden md:block">
                {birthData?.name || '命盘'} · {birthData?.date ? new Date(birthData.date).toLocaleDateString('zh-CN') : ''}
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
                  onSubmit={handleSubmit}
                  isLoading={loading}
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-red-400 text-sm"
                >
                  {error.message}
                </motion.div>
              )}

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
          ) : loading ? (
            // 加载中
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[80vh] flex flex-col items-center justify-center"
            >
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-default-400">正在计算星盘数据...</p>
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
                        {chartSummary}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {chart.dominantPlanets.slice(0, 3).map((planetId: string) => {
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
                {selectedTab === 'chart' && displayChart && (
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
                        chart={displayChart}
                        size={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 40 : 600)}
                        highlightPlanet={selectedPlanet}
                        onPlanetClick={setSelectedPlanet}
                      />
                    </div>
                    
                    {/* 信息面板 */}
                    <div className="lg:col-span-1">
                      <ChartInfo 
                        chart={displayChart}
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
                                handleDateChange(newDate);
                              }}
                            >
                              ←
                            </Button>
                            <input
                              type="date"
                              value={forecastDate.toISOString().split('T')[0]}
                              onChange={(e) => handleDateChange(new Date(e.target.value))}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm font-mono"
                            />
                            <Button 
                              size="sm" 
                              variant="flat"
                              onPress={() => {
                                const newDate = new Date(forecastDate);
                                newDate.setDate(newDate.getDate() + (forecastMode === 'daily' ? 1 : 7));
                                handleDateChange(newDate);
                              }}
                            >
                              →
                            </Button>
                            <Button 
                              size="sm" 
                              variant="flat"
                              color="primary"
                              onPress={() => handleDateChange(new Date())}
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
                    {forecastMode === 'daily' && dailyForecastForView && (
                      <DailyForecastView forecast={dailyForecastForView as any} />
                    )}
                    {forecastMode === 'weekly' && weeklyForecastForView && (
                      <WeeklyForecastView 
                        forecast={weeklyForecastForView as any}
                        onDaySelect={(date) => {
                          setForecastDate(date);
                          setForecastMode('daily');
                          refreshDaily(date.toISOString());
                        }}
                      />
                    )}
                    
                    {/* 当日影响因子概览 */}
                    {dailyForecastForView && dailyForecastForView.processed && dailyForecastForView.factorResult && (
                      <Card className="glass-card mt-4">
                        <CardBody>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white/80">
                              🔮 今日影响因子
                            </h4>
                            <Chip
                              size="sm"
                              color={dailyForecastForView.factorResult.totalAdjustment >= 0 ? 'success' : 'danger'}
                              variant="flat"
                            >
                              调整: {dailyForecastForView.factorResult.totalAdjustment >= 0 ? '+' : ''}
                              {dailyForecastForView.factorResult.totalAdjustment.toFixed(1)}
                            </Chip>
                          </div>
                          <p className="text-sm text-white/60 mb-3">
                            {dailyForecastForView.factorResult.summary}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dailyForecastForView.topFactors.map((factor: any, i: number) => (
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

                {selectedTab === 'factors' && dailyForecastForView?.factorResult && (
                  <motion.div
                    key="factors-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* 因子分析面板 */}
                    <InfluenceFactorsPanel
                      factorResult={dailyForecastForView.factorResult as any}
                      config={{ enabled: true, weights: {}, customFactors: [] } as any}
                      showConfig={false}
                    />

                    {/* 维度趋势 */}
                    {weeklyForecastForView && weeklyForecastForView.dimensionTrends && (
                      <Card className="glass-card">
                        <CardBody>
                          <h4 className="text-lg font-semibold text-white/90 mb-4">
                            📈 本周维度趋势
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {Object.entries(weeklyForecastForView.dimensionTrends).map(([dim, values]) => {
                              const avg = (values as number[]).reduce((s: number, v: number) => s + v, 0) / (values as number[]).length;
                              const trend = (values as number[])[6] - (values as number[])[0];
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
                        </CardBody>
                      </Card>
                    )}
                  </motion.div>
                )}

                {selectedTab === 'timeline' && lifeTrend && (
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
                            minValue={birthData ? new Date(birthData.date).getFullYear() : 1950}
                            maxValue={birthData ? new Date(birthData.date).getFullYear() + 100 : 2100}
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
                      trendData={lifeTrend}
                      currentYear={new Date().getFullYear()}
                    />

                    {/* 周期信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="glass-card">
                        <CardBody>
                          <h4 className="text-sm font-display text-cosmic-nova mb-2">土星周期</h4>
                          <div className="space-y-1">
                            {lifeTrend.cycles?.saturnCycles?.map((cycle: any, i: number) => (
                              <div key={i} className="text-xs text-default-400">
                                <span className="text-default-300">{cycle.age}岁</span> ({cycle.year})
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                      <Card className="glass-card">
                        <CardBody>
                          <h4 className="text-sm font-display text-cosmic-nova mb-2">木星周期</h4>
                          <div className="space-y-1">
                            {lifeTrend.cycles?.jupiterCycles?.slice(0, 4).map((cycle: any, i: number) => (
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
                            {lifeTrend.cycles?.profectionCycles?.slice(0, 4).map((cycle: any, i: number) => (
                              <div key={i} className="text-xs text-default-400">
                                <span className="text-default-300">{cycle.startAge}-{cycle.endAge}岁</span>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </motion.div>
                )}

                {selectedTab === 'profection' && displayChart && (
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
                        chart={displayChart}
                        currentAge={currentAge}
                      />
                    </div>

                    {/* 未来年份预览 */}
                    <Card className="glass-card">
                      <CardBody>
                        <h4 className="text-lg font-display text-cosmic-nova mb-4">未来 12 年概览</h4>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {Array.from({ length: 12 }, (_, i) => currentAge + i).map(age => {
                            const year = birthData ? new Date(birthData.date).getFullYear() + age : 2024;
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
                handleSubmit(data);
                onClose();
              }}
              initialData={birthData ? {
                ...birthData,
                date: new Date(birthData.date),
              } : undefined}
              isLoading={loading}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 页脚 */}
      <footer className="mt-12 py-6 border-t border-white/5">
        <div className="container mx-auto px-4 text-center text-xs text-default-400">
          <p>占星不是科学预测，而是人生时间叙事系统</p>
          <p className="mt-1 opacity-50">「你能算清楚什么时候浪大，但你永远不能替人决定是否下水」</p>
          <p className="mt-2 text-cosmic-nova/50">✨ Powered by API</p>
        </div>
      </footer>
    </main>
  );
}
