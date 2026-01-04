'use client';

import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { 
  type NatalChart,
  getProfectionWheelData,
  calculateAnnualProfection,
  ZODIAC_SIGNS,
  PLANETS,
  type AnnualProfection
} from '@/lib/astro';

interface ProfectionWheelProps {
  chart: NatalChart;
  currentAge: number;
  onAgeSelect?: (age: number) => void;
}

// 元素颜色
const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff6b35',
  earth: '#7cb518',
  air: '#00b4d8',
  water: '#7209b7',
};

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
};

export function ProfectionWheel({ chart, currentAge, onAgeSelect }: ProfectionWheelProps) {
  const size = 400;
  const center = size / 2;
  const outerRadius = size * 0.42;
  const innerRadius = size * 0.25;
  const middleRadius = (outerRadius + innerRadius) / 2;

  // 获取年限法轮盘数据
  const wheelData = useMemo(() => {
    return getProfectionWheelData(chart, currentAge);
  }, [chart, currentAge]);

  // 获取当前年份的详细信息
  const currentProfection = useMemo(() => {
    return calculateAnnualProfection(chart, currentAge);
  }, [chart, currentAge]);

  // 渲染轮盘扇区
  const renderSectors = useMemo(() => {
    return wheelData.map((sector, index) => {
      const startAngle = -90 + index * 30; // 从顶部开始
      const endAngle = startAngle + 30;
      const midAngle = (startAngle + endAngle) / 2;

      const sign = ZODIAC_SIGNS.find(s => s.id === sector.sign);
      const elementColor = ELEMENT_COLORS[sign?.element || 'fire'];

      // 计算扇区路径
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const midRad = (midAngle * Math.PI) / 180;

      const x1Outer = center + outerRadius * Math.cos(startRad);
      const y1Outer = center + outerRadius * Math.sin(startRad);
      const x2Outer = center + outerRadius * Math.cos(endRad);
      const y2Outer = center + outerRadius * Math.sin(endRad);
      const x1Inner = center + innerRadius * Math.cos(startRad);
      const y1Inner = center + innerRadius * Math.sin(startRad);
      const x2Inner = center + innerRadius * Math.cos(endRad);
      const y2Inner = center + innerRadius * Math.sin(endRad);

      const labelX = center + middleRadius * Math.cos(midRad);
      const labelY = center + middleRadius * Math.sin(midRad);

      return (
        <g 
          key={sector.house}
          style={{ cursor: 'pointer' }}
          onClick={() => onAgeSelect?.(index)}
        >
          {/* 扇区背景 */}
          <path
            d={`
              M ${x1Inner} ${y1Inner}
              L ${x1Outer} ${y1Outer}
              A ${outerRadius} ${outerRadius} 0 0 1 ${x2Outer} ${y2Outer}
              L ${x2Inner} ${y2Inner}
              A ${innerRadius} ${innerRadius} 0 0 0 ${x1Inner} ${y1Inner}
            `}
            fill={sector.isCurrentYear ? `${elementColor}40` : `${elementColor}15`}
            stroke={sector.isCurrentYear ? elementColor : `${elementColor}60`}
            strokeWidth={sector.isCurrentYear ? 2 : 0.5}
            style={{
              transition: 'all 0.3s ease',
              filter: sector.isCurrentYear ? `drop-shadow(0 0 8px ${elementColor})` : 'none',
            }}
          />

          {/* 宫位数字 */}
          <text
            x={center + (innerRadius - 15) * Math.cos(midRad)}
            y={center + (innerRadius - 15) * Math.sin(midRad)}
            textAnchor="middle"
            dominantBaseline="central"
            fill={sector.isCurrentYear ? '#fff' : 'rgba(255,255,255,0.5)'}
            fontSize="12"
            fontFamily="'JetBrains Mono', monospace"
          >
            {sector.house}
          </text>

          {/* 星座符号 */}
          <text
            x={labelX}
            y={labelY - 8}
            textAnchor="middle"
            dominantBaseline="central"
            fill={elementColor}
            fontSize="16"
            style={{ filter: `drop-shadow(0 0 2px ${elementColor})` }}
          >
            {sector.signSymbol}
          </text>

          {/* 守护星符号 */}
          <text
            x={labelX}
            y={labelY + 10}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.6)"
            fontSize="12"
          >
            {sector.lordSymbol}
          </text>

          {/* 主题标签 */}
          <text
            x={center + (outerRadius + 15) * Math.cos(midRad)}
            y={center + (outerRadius + 15) * Math.sin(midRad)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
            transform={`rotate(${midAngle + 90}, ${center + (outerRadius + 15) * Math.cos(midRad)}, ${center + (outerRadius + 15) * Math.sin(midRad)})`}
          >
            {sector.theme}
          </text>
        </g>
      );
    });
  }, [wheelData, center, outerRadius, innerRadius, middleRadius, onAgeSelect]);

  // 渲染中心信息
  const renderCenter = useMemo(() => {
    const lordPlanet = PLANETS.find(p => p.id === currentProfection.lordOfYear);
    const lordColor = PLANET_COLORS[currentProfection.lordOfYear] || '#fff';

    return (
      <g>
        {/* 中心圆 */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius - 10}
          fill="rgba(10, 10, 15, 0.8)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* 年龄 */}
        <text
          x={center}
          y={center - 30}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize="12"
        >
          {currentProfection.age}岁
        </text>

        {/* 年份 */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          fill="#e94560"
          fontSize="24"
          fontFamily="'Cinzel', serif"
          fontWeight="600"
        >
          {currentProfection.year}
        </text>

        {/* 年度主星 */}
        <text
          x={center}
          y={center + 20}
          textAnchor="middle"
          fill={lordColor}
          fontSize="28"
          style={{ filter: `drop-shadow(0 0 6px ${lordColor})` }}
        >
          {lordPlanet?.symbol}
        </text>

        {/* 年度主星名称 */}
        <text
          x={center}
          y={center + 45}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize="12"
        >
          {lordPlanet?.name}年
        </text>
      </g>
    );
  }, [currentProfection, center, innerRadius]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-display text-cosmic-nova">年限法轮盘</h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* 背景 */}
          <defs>
            <radialGradient id="profectionBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#0a0a0f" />
            </radialGradient>
          </defs>
          <circle cx={center} cy={center} r={outerRadius + 5} fill="url(#profectionBg)" />

          {/* 扇区 */}
          {renderSectors}

          {/* 中心 */}
          {renderCenter}
        </svg>

        {/* 当前年份描述 */}
        <div className="mt-4 text-center max-w-sm">
          <p className="text-sm text-default-300 leading-relaxed">
            {currentProfection.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1 justify-center">
            {currentProfection.houseKeywords.map((keyword, i) => (
              <span 
                key={i} 
                className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-default-400"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

