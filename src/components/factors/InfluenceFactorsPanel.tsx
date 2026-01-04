'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Progress,
  Slider,
  Switch,
  Divider,
  Accordion,
  AccordionItem,
} from '@heroui/react';
import type { AppliedFactor, InfluenceFactorConfig, FactorResult } from '@/lib/astro';

interface InfluenceFactorsPanelProps {
  factorResult: FactorResult;
  config: InfluenceFactorConfig;
  onConfigChange?: (config: InfluenceFactorConfig) => void;
  showConfig?: boolean;
}

const FACTOR_TYPE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  dignity: { label: '尊贵度', icon: '👑', color: 'warning' },
  retrograde: { label: '逆行', icon: '↩️', color: 'secondary' },
  aspectPhase: { label: '相位阶段', icon: '🔄', color: 'primary' },
  aspectOrb: { label: '相位精度', icon: '🎯', color: 'success' },
  outerPlanet: { label: '外行星周期', icon: '🪐', color: 'danger' },
  profectionLord: { label: '年限法', icon: '📅', color: 'warning' },
  lunarPhase: { label: '月相', icon: '🌙', color: 'secondary' },
  planetaryHour: { label: '行星时', icon: '⏰', color: 'primary' },
  personal: { label: '个人化', icon: '✨', color: 'success' },
  custom: { label: '自定义', icon: '🔧', color: 'default' },
};

const DIMENSION_INFO: Record<string, { label: string; icon: string }> = {
  overall: { label: '综合', icon: '⚡' },
  career: { label: '事业', icon: '💼' },
  relationship: { label: '关系', icon: '💕' },
  health: { label: '健康', icon: '🏃' },
  finance: { label: '财务', icon: '💰' },
  spiritual: { label: '灵性', icon: '🧘' },
};

export function InfluenceFactorsPanel({
  factorResult,
  config,
  onConfigChange,
  showConfig = false,
}: InfluenceFactorsPanelProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(showConfig);

  const positiveFactors = factorResult.appliedFactors.filter(f => f.adjustment > 0);
  const negativeFactors = factorResult.appliedFactors.filter(f => f.adjustment < 0);

  // 按类型分组
  const factorsByType = factorResult.appliedFactors.reduce((acc, factor) => {
    if (!acc[factor.type]) acc[factor.type] = [];
    acc[factor.type].push(factor);
    return acc;
  }, {} as Record<string, AppliedFactor[]>);

  return (
    <div className="space-y-4">
      {/* 总览卡片 */}
      <Card className="bg-black/40 border border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold text-white/90">
              🔮 影响因子分析
            </h3>
            <div className="flex items-center gap-2">
              <Chip
                size="sm"
                color={factorResult.totalAdjustment >= 0 ? 'success' : 'danger'}
                variant="flat"
              >
                {factorResult.totalAdjustment >= 0 ? '+' : ''}
                {factorResult.totalAdjustment.toFixed(1)}
              </Chip>
              {onConfigChange && (
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setIsConfigOpen(!isConfigOpen)}
                >
                  ⚙️ 配置
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-white/60 text-sm mb-4">{factorResult.summary}</p>

          {/* 维度分数 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {Object.entries(factorResult.adjustedScores.dimensions).map(([dim, score]) => {
              const info = DIMENSION_INFO[dim];
              return (
                <div key={dim} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{info?.icon}</span>
                    <span className="text-white/70 text-sm">{info?.label}</span>
                    <span className="ml-auto text-white font-medium">
                      {Math.round(score)}
                    </span>
                  </div>
                  <Progress
                    size="sm"
                    value={score}
                    maxValue={100}
                    color={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'danger'}
                    className="h-1"
                  />
                </div>
              );
            })}
          </div>

          <Divider className="my-4 bg-white/10" />

          {/* 正面/负面因子对比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 正面因子 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                <span>✅</span> 有利因子 ({positiveFactors.length})
              </h4>
              <AnimatePresence>
                {positiveFactors.slice(0, 5).map((factor, idx) => (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <FactorItem factor={factor} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {positiveFactors.length === 0 && (
                <p className="text-white/40 text-sm">当前无显著有利因子</p>
              )}
            </div>

            {/* 负面因子 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-400 flex items-center gap-2">
                <span>⚠️</span> 需注意 ({negativeFactors.length})
              </h4>
              <AnimatePresence>
                {negativeFactors.slice(0, 5).map((factor, idx) => (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <FactorItem factor={factor} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {negativeFactors.length === 0 && (
                <p className="text-white/40 text-sm">当前无显著不利因子</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 因子详情折叠 */}
      <Card className="bg-black/40 border border-white/10">
        <CardBody>
          <Accordion>
            <AccordionItem
              key="details"
              aria-label="因子详情"
              title={
                <span className="text-white/90">
                  📊 按类型查看因子 ({factorResult.appliedFactors.length})
                </span>
              }
            >
              <div className="space-y-4 py-2">
                {Object.entries(factorsByType).map(([type, factors]) => {
                  const typeInfo = FACTOR_TYPE_INFO[type] || {
                    label: type,
                    icon: '📌',
                    color: 'default',
                  };
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span>{typeInfo.icon}</span>
                        <Chip size="sm" color={typeInfo.color as any} variant="flat">
                          {typeInfo.label}
                        </Chip>
                        <span className="text-white/50 text-xs">
                          {factors.length}个因子
                        </span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {factors.map(factor => (
                          <div
                            key={factor.id}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <span className="text-white/70">{factor.name}</span>
                            <span
                              className={
                                factor.adjustment >= 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }
                            >
                              {factor.adjustment >= 0 ? '+' : ''}
                              {factor.adjustment.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionItem>
          </Accordion>
        </CardBody>
      </Card>

      {/* 配置面板 */}
      <AnimatePresence>
        {isConfigOpen && onConfigChange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FactorConfigPanel config={config} onChange={onConfigChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 单个因子项
 */
function FactorItem({ factor }: { factor: AppliedFactor }) {
  const typeInfo = FACTOR_TYPE_INFO[factor.type] || {
    label: factor.type,
    icon: '📌',
    color: 'default',
  };
  const dimInfo = DIMENSION_INFO[factor.dimension] || {
    label: factor.dimension,
    icon: '•',
  };

  return (
    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{typeInfo.icon}</span>
        <span className="text-white/90 font-medium">{factor.name}</span>
        <Chip size="sm" variant="flat" className="ml-auto">
          {dimInfo.icon} {dimInfo.label}
        </Chip>
        <span
          className={`font-bold ${
            factor.adjustment >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {factor.adjustment >= 0 ? '+' : ''}
          {factor.adjustment.toFixed(1)}
        </span>
      </div>
      <p className="text-white/50 text-xs pl-7">{factor.reason}</p>
    </div>
  );
}

/**
 * 因子配置面板
 */
function FactorConfigPanel({
  config,
  onChange,
}: {
  config: InfluenceFactorConfig;
  onChange: (config: InfluenceFactorConfig) => void;
}) {
  const handleWeightChange = (key: keyof InfluenceFactorConfig['weights'], value: number) => {
    onChange({
      ...config,
      weights: {
        ...config.weights,
        [key]: value,
      },
    });
  };

  const handleToggle = () => {
    onChange({
      ...config,
      enabled: !config.enabled,
    });
  };

  return (
    <Card className="bg-black/40 border border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-white/90">⚙️ 因子权重配置</h3>
          <Switch isSelected={config.enabled} onValueChange={handleToggle} size="sm">
            {config.enabled ? '已启用' : '已禁用'}
          </Switch>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <p className="text-white/50 text-sm mb-4">
          调整各类因子的影响权重。权重越高，该类因子对最终分数的影响越大。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.weights).map(([key, value]) => {
            const typeInfo = FACTOR_TYPE_INFO[key] || { label: key, icon: '📌' };
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    <span>{typeInfo.icon}</span>
                    {typeInfo.label}
                  </span>
                  <span className="text-white/50 text-xs">
                    {Math.round(value * 100)}%
                  </span>
                </div>
                <Slider
                  size="sm"
                  step={0.1}
                  minValue={0}
                  maxValue={1}
                  value={value}
                  onChange={(v) =>
                    handleWeightChange(
                      key as keyof InfluenceFactorConfig['weights'],
                      v as number
                    )
                  }
                  className="max-w-full"
                  isDisabled={!config.enabled}
                />
              </div>
            );
          })}
        </div>

        <Divider className="my-4 bg-white/10" />

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              onChange({
                ...config,
                weights: {
                  dignity: 0.5,
                  retrograde: 0.3,
                  aspectPhase: 0.4,
                  aspectOrb: 0.6,
                  outerPlanet: 0.5,
                  profectionLord: 0.4,
                  lunarPhase: 0.3,
                  planetaryHour: 0.1,
                  personal: 0.5,
                  custom: 1.0,
                },
              })
            }
          >
            保守模式
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              onChange({
                ...config,
                weights: {
                  dignity: 0.8,
                  retrograde: 0.6,
                  aspectPhase: 0.7,
                  aspectOrb: 0.9,
                  outerPlanet: 0.85,
                  profectionLord: 0.75,
                  lunarPhase: 0.5,
                  planetaryHour: 0.3,
                  personal: 0.8,
                  custom: 1.0,
                },
              })
            }
          >
            标准模式
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              onChange({
                ...config,
                weights: {
                  dignity: 1.0,
                  retrograde: 0.9,
                  aspectPhase: 0.9,
                  aspectOrb: 1.0,
                  outerPlanet: 1.0,
                  profectionLord: 0.9,
                  lunarPhase: 0.7,
                  planetaryHour: 0.5,
                  personal: 1.0,
                  custom: 1.0,
                },
              })
            }
          >
            激进模式
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default InfluenceFactorsPanel;

