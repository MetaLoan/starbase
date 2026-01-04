'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { 
  type LifeTrendData, 
  type LifeTrendPoint,
  PLANETS,
  type PlanetId 
} from '@/lib/astro';

interface LifeTimelineProps {
  trendData: LifeTrendData;
  currentYear?: number;
  onYearSelect?: (year: number) => void;
}

// 行星颜色
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
  northNode: '#9370db',
  chiron: '#20b2aa',
};

export function LifeTimeline({ 
  trendData, 
  currentYear = new Date().getFullYear(),
  onYearSelect 
}: LifeTimelineProps) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<keyof LifeTrendPoint['dimensions'] | 'overall'>('overall');

  // 获取年度数据（每年一个点）
  const yearlyData = useMemo(() => {
    const yearMap = new Map<number, LifeTrendPoint>();
    for (const point of trendData.points) {
      if (!yearMap.has(point.year)) {
        yearMap.set(point.year, point);
      }
    }
    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [trendData.points]);

  // 计算图表尺寸
  const chartWidth = Math.max(800, yearlyData.length * 20);
  const chartHeight = 200;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // 生成路径
  const generatePath = useMemo(() => {
    if (yearlyData.length === 0) return '';

    const getValue = (point: LifeTrendPoint) => {
      if (selectedDimension === 'overall') return point.overallScore;
      return point.dimensions[selectedDimension];
    };

    const minValue = selectedDimension === 'overall' ? -100 : 0;
    const maxValue = 100;
    const range = maxValue - minValue;

    const points = yearlyData.map((point, index) => {
      const x = padding.left + (index / (yearlyData.length - 1)) * plotWidth;
      const value = getValue(point);
      const y = padding.top + plotHeight - ((value - minValue) / range) * plotHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [yearlyData, selectedDimension, plotWidth, plotHeight, padding]);

  // 生成填充路径
  const generateAreaPath = useMemo(() => {
    if (yearlyData.length === 0) return '';

    const getValue = (point: LifeTrendPoint) => {
      if (selectedDimension === 'overall') return point.overallScore;
      return point.dimensions[selectedDimension];
    };

    const minValue = selectedDimension === 'overall' ? -100 : 0;
    const maxValue = 100;
    const range = maxValue - minValue;
    const zeroY = selectedDimension === 'overall' 
      ? padding.top + plotHeight - ((0 - minValue) / range) * plotHeight
      : padding.top + plotHeight;

    const points = yearlyData.map((point, index) => {
      const x = padding.left + (index / (yearlyData.length - 1)) * plotWidth;
      const value = getValue(point);
      const y = padding.top + plotHeight - ((value - minValue) / range) * plotHeight;
      return { x, y };
    });

    const pathPoints = points.map(p => `${p.x},${p.y}`).join(' L ');
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;

    return `M ${firstX},${zeroY} L ${pathPoints} L ${lastX},${zeroY} Z`;
  }, [yearlyData, selectedDimension, plotWidth, plotHeight, padding]);

  // 渲染重大事件标记
  const renderMajorEvents = useMemo(() => {
    return yearlyData
      .filter(point => point.isMajorTransit)
      .map((point, index) => {
        const xIndex = yearlyData.findIndex(p => p.year === point.year);
        const x = padding.left + (xIndex / (yearlyData.length - 1)) * plotWidth;

        return (
          <g key={`event-${point.year}`}>
            <line
              x1={x}
              y1={padding.top}
              x2={x}
              y2={padding.top + plotHeight}
              stroke="#e94560"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
            <circle
              cx={x}
              cy={padding.top - 8}
              r="4"
              fill="#e94560"
              style={{ filter: 'drop-shadow(0 0 4px #e94560)' }}
            />
          </g>
        );
      });
  }, [yearlyData, plotWidth, plotHeight, padding]);

  // 渲染年份标记
  const renderYearMarkers = useMemo(() => {
    const step = Math.max(1, Math.floor(yearlyData.length / 20));
    return yearlyData
      .filter((_, index) => index % step === 0 || yearlyData[index].year === currentYear)
      .map((point) => {
        const xIndex = yearlyData.findIndex(p => p.year === point.year);
        const x = padding.left + (xIndex / (yearlyData.length - 1)) * plotWidth;
        const isCurrentYear = point.year === currentYear;

        return (
          <g key={`year-${point.year}`}>
            <text
              x={x}
              y={chartHeight - 5}
              textAnchor="middle"
              fill={isCurrentYear ? '#e94560' : 'rgba(255,255,255,0.5)'}
              fontSize="10"
              fontFamily="'JetBrains Mono', monospace"
            >
              {point.year}
            </text>
            {isCurrentYear && (
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + plotHeight}
                stroke="#e94560"
                strokeWidth="2"
                opacity="0.8"
              />
            )}
          </g>
        );
      });
  }, [yearlyData, currentYear, plotWidth, plotHeight, padding, chartHeight]);

  // 渲染交互层
  const renderInteractionLayer = useMemo(() => {
    return yearlyData.map((point, index) => {
      const x = padding.left + (index / (yearlyData.length - 1)) * plotWidth;
      const width = plotWidth / yearlyData.length;
      const isHovered = hoveredYear === point.year;

      const getValue = (p: LifeTrendPoint) => {
        if (selectedDimension === 'overall') return p.overallScore;
        return p.dimensions[selectedDimension];
      };
      const minValue = selectedDimension === 'overall' ? -100 : 0;
      const maxValue = 100;
      const range = maxValue - minValue;
      const value = getValue(point);
      const y = padding.top + plotHeight - ((value - minValue) / range) * plotHeight;

      return (
        <g key={`interact-${point.year}`}>
          <rect
            x={x - width / 2}
            y={padding.top}
            width={width}
            height={plotHeight}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredYear(point.year)}
            onMouseLeave={() => setHoveredYear(null)}
            onClick={() => onYearSelect?.(point.year)}
          />
          {isHovered && (
            <>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={PLANET_COLORS[point.dominantPlanet] || '#fff'}
                stroke="white"
                strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 6px ${PLANET_COLORS[point.dominantPlanet] || '#fff'})` }}
              />
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={padding.top + plotHeight}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </>
          )}
        </g>
      );
    });
  }, [yearlyData, hoveredYear, selectedDimension, plotWidth, plotHeight, padding, onYearSelect]);

  // 获取悬停年份的详情
  const hoveredPoint = hoveredYear ? yearlyData.find(p => p.year === hoveredYear) : null;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-display text-cosmic-nova">人生趋势时间线</h3>
          <div className="flex gap-2">
            {(['overall', 'career', 'relationship', 'health', 'finance', 'spiritual'] as const).map(dim => (
              <Chip
                key={dim}
                size="sm"
                variant={selectedDimension === dim ? 'solid' : 'flat'}
                color={selectedDimension === dim ? 'primary' : 'default'}
                className="cursor-pointer"
                onClick={() => setSelectedDimension(dim)}
              >
                {dim === 'overall' ? '综合' : 
                 dim === 'career' ? '事业' :
                 dim === 'relationship' ? '关系' :
                 dim === 'health' ? '健康' :
                 dim === 'finance' ? '财务' : '灵性'}
              </Chip>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {/* 趋势摘要 */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-default-400">整体趋势:</span>
            <Chip size="sm" color={
              trendData.summary.overallTrend === 'ascending' ? 'success' :
              trendData.summary.overallTrend === 'descending' ? 'warning' :
              trendData.summary.overallTrend === 'fluctuating' ? 'secondary' : 'default'
            }>
              {trendData.summary.overallTrend === 'ascending' ? '上升' :
               trendData.summary.overallTrend === 'descending' ? '下降' :
               trendData.summary.overallTrend === 'fluctuating' ? '波动' : '平稳'}
            </Chip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-default-400">高峰年:</span>
            <span className="text-success">{trendData.summary.peakYears.slice(0, 3).join(', ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-default-400">转化年:</span>
            <span className="text-secondary">{trendData.summary.transformationYears.slice(0, 3).join(', ')}</span>
          </div>
        </div>

        {/* 图表 */}
        <div className="overflow-x-auto">
          <svg width={chartWidth} height={chartHeight + 20} className="min-w-full">
            {/* 背景网格 */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} fill="url(#grid)" />

            {/* 零线 (仅综合视图) */}
            {selectedDimension === 'overall' && (
              <line
                x1={padding.left}
                y1={padding.top + plotHeight / 2}
                x2={padding.left + plotWidth}
                y2={padding.top + plotHeight / 2}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
            )}

            {/* 重大事件标记 */}
            {renderMajorEvents}

            {/* 填充区域 */}
            <path
              d={generateAreaPath}
              fill="url(#areaGradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00b4d8" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* 趋势线 */}
            <path
              d={generatePath}
              fill="none"
              stroke="#00b4d8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px #00b4d8)' }}
            />

            {/* 年份标记 */}
            {renderYearMarkers}

            {/* 交互层 */}
            {renderInteractionLayer}

            {/* Y轴标签 */}
            <text x={padding.left - 10} y={padding.top + 5} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10">
              {selectedDimension === 'overall' ? '+100' : '100'}
            </text>
            {selectedDimension === 'overall' && (
              <text x={padding.left - 10} y={padding.top + plotHeight / 2 + 3} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10">
                0
              </text>
            )}
            <text x={padding.left - 10} y={padding.top + plotHeight} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10">
              {selectedDimension === 'overall' ? '-100' : '0'}
            </text>
          </svg>
        </div>

        {/* 悬停详情 */}
        {hoveredPoint && (
          <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-display text-cosmic-nova">{hoveredPoint.year}</span>
                <span className="text-default-400">({hoveredPoint.age}岁)</span>
                {hoveredPoint.isMajorTransit && (
                  <Chip size="sm" color="danger">{hoveredPoint.majorTransitName}</Chip>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="text-2xl"
                  style={{ 
                    color: PLANET_COLORS[hoveredPoint.dominantPlanet],
                    filter: `drop-shadow(0 0 4px ${PLANET_COLORS[hoveredPoint.dominantPlanet]})`
                  }}
                >
                  {PLANETS.find(p => p.id === hoveredPoint.dominantPlanet)?.symbol}
                </span>
                <span className="text-sm text-default-400">主导</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 text-center">
              {(['career', 'relationship', 'health', 'finance', 'spiritual'] as const).map(dim => (
                <div key={dim}>
                  <div className="text-xs text-default-400">
                    {dim === 'career' ? '事业' :
                     dim === 'relationship' ? '关系' :
                     dim === 'health' ? '健康' :
                     dim === 'finance' ? '财务' : '灵性'}
                  </div>
                  <div className={`text-lg font-mono ${
                    hoveredPoint.dimensions[dim] >= 70 ? 'text-success' :
                    hoveredPoint.dimensions[dim] >= 50 ? 'text-default-300' :
                    'text-warning'
                  }`}>
                    {Math.round(hoveredPoint.dimensions[dim])}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-default-400">
              <span>年限法: 第{hoveredPoint.profection.house}宫 ({hoveredPoint.profection.theme})</span>
              <span>|</span>
              <span>推运月相: {hoveredPoint.lunarPhaseName}</span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

