'use client';

import React, { useMemo } from 'react';
import { 
  type NatalChart, 
  ZODIAC_SIGNS, 
  PLANETS, 
  ASPECTS,
  type PlanetId,
  type AspectId 
} from '@/lib/astro';

interface NatalChartSVGProps {
  chart: NatalChart;
  size?: number;
  showAspects?: boolean;
  highlightPlanet?: PlanetId | null;
  onPlanetClick?: (planetId: PlanetId) => void;
}

// 行星颜色映射
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

// 元素颜色
const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff6b35',
  earth: '#7cb518',
  air: '#00b4d8',
  water: '#7209b7',
};

// 相位颜色
const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#ffd700',
  opposition: '#dc143c',
  trine: '#00b4d8',
  square: '#ff6b35',
  sextile: '#7cb518',
  quincunx: '#9370db',
};

export function NatalChartSVG({
  chart,
  size = 600,
  showAspects = true,
  highlightPlanet = null,
  onPlanetClick,
}: NatalChartSVGProps) {
  const center = size / 2;
  const outerRadius = size * 0.45;
  const zodiacRingWidth = size * 0.08;
  const houseRingWidth = size * 0.06;
  const planetRingRadius = outerRadius - zodiacRingWidth - houseRingWidth - size * 0.04;
  const innerRadius = planetRingRadius - size * 0.15;

  // 将黄经度数转换为 SVG 坐标
  const longitudeToPoint = (longitude: number, radius: number) => {
    // 占星盘从上升点（东方）开始，逆时针方向
    const angle = (180 - longitude + chart.ascendant) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(angle),
      y: center - radius * Math.sin(angle),
    };
  };

  // 生成弧形路径
  const describeArc = (
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = {
      x: cx + radius * Math.cos((startAngle * Math.PI) / 180),
      y: cy - radius * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: cx + radius * Math.cos((endAngle * Math.PI) / 180),
      y: cy - radius * Math.sin((endAngle * Math.PI) / 180),
    };
    const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // 渲染黄道十二宫
  const renderZodiacRing = useMemo(() => {
    return ZODIAC_SIGNS.map((sign, index) => {
      const startAngle = 180 - (index * 30 + chart.ascendant - 30);
      const endAngle = startAngle - 30;
      const midAngle = (startAngle + endAngle) / 2;
      const labelRadius = outerRadius - zodiacRingWidth / 2;
      const labelPos = {
        x: center + labelRadius * Math.cos((midAngle * Math.PI) / 180),
        y: center - labelRadius * Math.sin((midAngle * Math.PI) / 180),
      };

      return (
        <g key={sign.id}>
          {/* 星座扇区 */}
          <path
            d={`
              ${describeArc(center, center, outerRadius, startAngle, endAngle)}
              L ${center + (outerRadius - zodiacRingWidth) * Math.cos((endAngle * Math.PI) / 180)} 
                ${center - (outerRadius - zodiacRingWidth) * Math.sin((endAngle * Math.PI) / 180)}
              ${describeArc(center, center, outerRadius - zodiacRingWidth, endAngle, startAngle)}
              Z
            `}
            fill={`${ELEMENT_COLORS[sign.element]}15`}
            stroke={ELEMENT_COLORS[sign.element]}
            strokeWidth="0.5"
            opacity="0.8"
          />
          {/* 星座符号 */}
          <text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={ELEMENT_COLORS[sign.element]}
            fontSize={size * 0.028}
            fontFamily="serif"
            style={{ filter: `drop-shadow(0 0 3px ${ELEMENT_COLORS[sign.element]})` }}
          >
            {sign.symbol}
          </text>
        </g>
      );
    });
  }, [chart.ascendant, center, outerRadius, zodiacRingWidth, size]);

  // 渲染宫位
  const renderHouses = useMemo(() => {
    return chart.houses.map((house, index) => {
      const point = longitudeToPoint(house.longitude, outerRadius - zodiacRingWidth);
      const innerPoint = longitudeToPoint(house.longitude, innerRadius);
      const isAngular = [1, 4, 7, 10].includes(house.house);
      
      // 宫位标签位置
      const nextHouse = chart.houses[(index + 1) % 12];
      const midLong = (house.longitude + nextHouse.longitude) / 2;
      const labelPoint = longitudeToPoint(
        house.longitude < nextHouse.longitude ? midLong : midLong + 180,
        innerRadius + size * 0.04
      );

      return (
        <g key={`house-${house.house}`}>
          {/* 宫位线 */}
          <line
            x1={point.x}
            y1={point.y}
            x2={innerPoint.x}
            y2={innerPoint.y}
            stroke={isAngular ? '#e94560' : 'rgba(255,255,255,0.3)'}
            strokeWidth={isAngular ? 1.5 : 0.5}
            strokeDasharray={isAngular ? 'none' : '4,4'}
          />
          {/* 宫位数字 */}
          <text
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={isAngular ? '#e94560' : 'rgba(255,255,255,0.5)'}
            fontSize={size * 0.02}
            fontFamily="'JetBrains Mono', monospace"
          >
            {house.house}
          </text>
        </g>
      );
    });
  }, [chart.houses, chart.ascendant, center, outerRadius, zodiacRingWidth, innerRadius, size]);

  // 渲染相位线
  const renderAspects = useMemo(() => {
    if (!showAspects) return null;

    return chart.aspects.slice(0, 15).map((aspect, index) => {
      const planet1 = chart.planets.find(p => p.id === aspect.planet1);
      const planet2 = chart.planets.find(p => p.id === aspect.planet2);
      if (!planet1 || !planet2) return null;

      const point1 = longitudeToPoint(planet1.longitude, innerRadius * 0.95);
      const point2 = longitudeToPoint(planet2.longitude, innerRadius * 0.95);

      const aspectColor = ASPECT_COLORS[aspect.aspectType] || '#666';
      const isHighlighted = highlightPlanet && 
        (aspect.planet1 === highlightPlanet || aspect.planet2 === highlightPlanet);

      return (
        <line
          key={`aspect-${index}`}
          x1={point1.x}
          y1={point1.y}
          x2={point2.x}
          y2={point2.y}
          stroke={aspectColor}
          strokeWidth={isHighlighted ? 2 : 1}
          strokeOpacity={isHighlighted ? 0.9 : 0.4 * aspect.strength}
          strokeDasharray={
            aspect.aspectType === 'opposition' ? '8,4' :
            aspect.aspectType === 'square' ? '4,4' :
            'none'
          }
        />
      );
    });
  }, [chart.aspects, chart.planets, showAspects, highlightPlanet, innerRadius]);

  // 渲染行星
  const renderPlanets = useMemo(() => {
    // 处理行星堆叠
    const planetPositions = chart.planets.map(planet => ({
      ...planet,
      adjustedLongitude: planet.longitude,
    }));

    // 简单的堆叠处理
    for (let i = 0; i < planetPositions.length; i++) {
      for (let j = i + 1; j < planetPositions.length; j++) {
        const diff = Math.abs(planetPositions[i].adjustedLongitude - planetPositions[j].adjustedLongitude);
        if (diff < 8 || diff > 352) {
          planetPositions[j].adjustedLongitude += 8;
        }
      }
    }

    return planetPositions.map((planet) => {
      const point = longitudeToPoint(planet.adjustedLongitude, planetRingRadius);
      const color = PLANET_COLORS[planet.id] || '#fff';
      const isHighlighted = highlightPlanet === planet.id;

      return (
        <g
          key={planet.id}
          style={{ cursor: 'pointer' }}
          onClick={() => onPlanetClick?.(planet.id)}
        >
          {/* 行星光晕 */}
          <circle
            cx={point.x}
            cy={point.y}
            r={size * 0.025}
            fill={`${color}20`}
            filter={isHighlighted ? `drop-shadow(0 0 8px ${color})` : 'none'}
          />
          {/* 行星符号 */}
          <text
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={size * 0.032}
            fontFamily="serif"
            style={{ 
              filter: `drop-shadow(0 0 ${isHighlighted ? 6 : 3}px ${color})`,
              transition: 'all 0.3s ease',
            }}
          >
            {planet.symbol}
          </text>
          {/* 度数标注 */}
          {isHighlighted && (
            <text
              x={point.x}
              y={point.y + size * 0.04}
              textAnchor="middle"
              fill="rgba(255,255,255,0.7)"
              fontSize={size * 0.015}
              fontFamily="'JetBrains Mono', monospace"
            >
              {planet.signDegree.toFixed(1)}°{planet.signSymbol}
            </text>
          )}
        </g>
      );
    });
  }, [chart.planets, chart.ascendant, highlightPlanet, onPlanetClick, planetRingRadius, size]);

  // 渲染中心标记
  const renderCenter = useMemo(() => {
    return (
      <g>
        {/* 内圈装饰 */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        {/* 中心点 */}
        <circle
          cx={center}
          cy={center}
          r={size * 0.01}
          fill="#e94560"
          style={{ filter: 'drop-shadow(0 0 4px #e94560)' }}
        />
        {/* ASC/MC 标记 */}
        <g>
          <text
            x={center + outerRadius - zodiacRingWidth - 10}
            y={center}
            textAnchor="end"
            dominantBaseline="central"
            fill="#e94560"
            fontSize={size * 0.02}
            fontFamily="'Cinzel', serif"
            fontWeight="600"
          >
            ASC
          </text>
        </g>
      </g>
    );
  }, [center, innerRadius, outerRadius, zodiacRingWidth, size]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-2xl"
    >
      {/* 背景 */}
      <defs>
        <radialGradient id="chartBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 背景圆 */}
      <circle
        cx={center}
        cy={center}
        r={outerRadius + 5}
        fill="url(#chartBg)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />

      {/* 黄道环 */}
      {renderZodiacRing}

      {/* 宫位线 */}
      {renderHouses}

      {/* 相位线 */}
      {renderAspects}

      {/* 行星 */}
      {renderPlanets}

      {/* 中心 */}
      {renderCenter}
    </svg>
  );
}

