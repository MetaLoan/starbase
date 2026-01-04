'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Divider, Chip, Progress } from '@heroui/react';
import { 
  type NatalChart, 
  PLANETS, 
  ELEMENTS, 
  MODALITIES,
  type PlanetId,
  type ElementType,
  type ModalityType 
} from '@/lib/astro';

interface ChartInfoProps {
  chart: NatalChart;
  selectedPlanet?: PlanetId | null;
  onPlanetSelect?: (planetId: PlanetId | null) => void;
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

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#ff6b35',
  earth: '#7cb518',
  air: '#00b4d8',
  water: '#7209b7',
};

export function ChartInfo({ chart, selectedPlanet, onPlanetSelect }: ChartInfoProps) {
  // 计算元素平衡的最大值
  const maxElement = Math.max(...Object.values(chart.elementBalance));
  const maxModality = Math.max(...Object.values(chart.modalityBalance));

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <h3 className="text-lg font-display text-cosmic-nova">核心配置</h3>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className="text-xs text-default-400">太阳</div>
              <div className="text-lg" style={{ color: PLANET_COLORS.sun }}>
                {chart.planets.find(p => p.id === 'sun')?.signSymbol}
              </div>
              <div className="text-xs text-default-500">
                {chart.planets.find(p => p.id === 'sun')?.signName}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-default-400">月亮</div>
              <div className="text-lg" style={{ color: PLANET_COLORS.moon }}>
                {chart.planets.find(p => p.id === 'moon')?.signSymbol}
              </div>
              <div className="text-xs text-default-500">
                {chart.planets.find(p => p.id === 'moon')?.signName}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-default-400">上升</div>
              <div className="text-lg text-cosmic-nova">
                {chart.houses[0]?.sign ? 
                  (['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'][
                    ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'].indexOf(chart.houses[0].sign)
                  ]) : '?'
                }
              </div>
              <div className="text-xs text-default-500">
                {chart.ascendant.toFixed(1)}°
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 行星列表 */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <h3 className="text-lg font-display text-cosmic-nova">行星位置</h3>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
            {chart.planets.map((planet) => (
              <div
                key={planet.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                  selectedPlanet === planet.id 
                    ? 'bg-white/10 ring-1 ring-white/20' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => onPlanetSelect?.(selectedPlanet === planet.id ? null : planet.id)}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xl"
                    style={{ 
                      color: PLANET_COLORS[planet.id],
                      filter: `drop-shadow(0 0 3px ${PLANET_COLORS[planet.id]})`
                    }}
                  >
                    {planet.symbol}
                  </span>
                  <span className="text-sm text-default-300">{planet.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-default-400">
                    {planet.signDegree.toFixed(1)}°
                  </span>
                  <span className="text-sm">{planet.signSymbol}</span>
                  <Chip size="sm" variant="flat" className="text-xs">
                    {planet.house}宫
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 元素平衡 */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <h3 className="text-lg font-display text-cosmic-nova">元素平衡</h3>
        </CardHeader>
        <CardBody className="pt-0 space-y-3">
          {(Object.entries(chart.elementBalance) as [ElementType, number][]).map(([element, value]) => (
            <div key={element} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span style={{ color: ELEMENT_COLORS[element] }}>
                  {ELEMENTS[element].name}
                </span>
                <span className="text-default-400">{value}</span>
              </div>
              <Progress
                size="sm"
                value={(value / maxElement) * 100}
                classNames={{
                  indicator: `bg-gradient-to-r from-transparent`,
                }}
                style={{
                  // @ts-ignore
                  '--tw-gradient-to': ELEMENT_COLORS[element],
                }}
              />
            </div>
          ))}
        </CardBody>
      </Card>

      {/* 模式平衡 */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <h3 className="text-lg font-display text-cosmic-nova">模式平衡</h3>
        </CardHeader>
        <CardBody className="pt-0 space-y-3">
          {(Object.entries(chart.modalityBalance) as [ModalityType, number][]).map(([modality, value]) => (
            <div key={modality} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-default-300">
                  {MODALITIES[modality].name}
                </span>
                <span className="text-default-400">{value}</span>
              </div>
              <Progress
                size="sm"
                value={(value / maxModality) * 100}
                color="secondary"
              />
            </div>
          ))}
        </CardBody>
      </Card>

      {/* 相位图案 */}
      {chart.patterns.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-display text-cosmic-nova">相位图案</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-2">
              {chart.patterns.map((pattern, index) => (
                <div key={index} className="p-2 rounded-lg bg-white/5">
                  <div className="text-sm text-default-200">{pattern.description}</div>
                  <div className="flex gap-1 mt-1">
                    {pattern.planets.map((planetId) => {
                      const planet = chart.planets.find(p => p.id === planetId);
                      return (
                        <Chip key={planetId} size="sm" variant="dot">
                          {planet?.symbol} {planet?.name}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

