/**
 * Agent Context API
 * 智能体上下文接口
 * 
 * 这是智能体获取用户完整上下文的主要接口
 * 返回格式化的数据，可直接用于 LLM 提示词
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildAgentContext, getUser } from '@/lib/services/user-service';
import { PLANETS, ZODIAC_SIGNS, HOUSES } from '@/lib/astro';

/**
 * POST /api/agent/context
 * 构建智能体上下文
 * 
 * Request body:
 * {
 *   userId: string,
 *   query?: string,
 *   intent?: 'forecast' | 'analysis' | 'advice' | 'explanation',
 *   focusArea?: 'career' | 'relationship' | 'health' | 'finance' | 'spiritual',
 *   format?: 'json' | 'text' | 'prompt'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, intent, focusArea, format = 'json' } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }
    
    const context = buildAgentContext(userId, {
      query,
      intent,
      focusArea,
    });
    
    if (!context) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // 根据格式返回不同的数据
    if (format === 'prompt') {
      // 返回可直接用于 LLM 的提示词格式
      const prompt = buildPromptContext(context);
      return NextResponse.json({ prompt });
    }
    
    if (format === 'text') {
      // 返回人类可读的文本格式
      const text = buildTextContext(context);
      return NextResponse.json({ text });
    }
    
    // 默认返回完整 JSON
    return NextResponse.json(context);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to build context', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 构建 LLM 提示词格式的上下文
 */
function buildPromptContext(context: NonNullable<ReturnType<typeof buildAgentContext>>): string {
  const { user } = context;
  
  const sunPlanet = PLANETS.find(p => p.id === 'sun');
  const moonPlanet = PLANETS.find(p => p.id === 'moon');
  const sunSign = ZODIAC_SIGNS.find(s => s.id === user.natal.sunSign);
  const moonSign = ZODIAC_SIGNS.find(s => s.id === user.natal.moonSign);
  const risingSign = ZODIAC_SIGNS.find(s => s.id === user.natal.risingSign);
  const lordPlanet = PLANETS.find(p => p.id === user.current.lordOfYear);
  
  return `## 用户占星档案

### 本命配置
- **太阳星座**: ${sunSign?.name} (${sunSign?.symbol})
- **月亮星座**: ${moonSign?.name} (${moonSign?.symbol})
- **上升星座**: ${risingSign?.name} (${risingSign?.symbol})
- **主导行星**: ${user.natal.dominantPlanets.map(id => PLANETS.find(p => p.id === id)?.name).join('、')}
- **盘主星**: ${PLANETS.find(p => p.id === user.natal.chartRuler)?.name}

### 当前状态 (${user.timestamp.toLocaleDateString('zh-CN')})
- **年龄**: ${user.current.age}岁
- **年限法**: 第${user.current.profectionHouse}宫年 (${user.current.profectionTheme})
- **年度主星**: ${lordPlanet?.name} (${lordPlanet?.symbol})
- **推运月相**: ${user.current.progressedLunarPhase}

### 今日运势
- **综合评分**: ${user.current.todayScore}/100
- **月亮星座**: ${ZODIAC_SIGNS.find(s => s.id === user.current.todayMoonSign)?.name}
- **今日主题**: ${user.current.todayTheme}

### 本周运势
- **综合评分**: ${Math.round(user.current.weekScore)}/100
- **本周主题**: ${user.current.weekTheme}

### 当前活跃行运
${user.activeTransits.slice(0, 5).map(t => {
  const transit = PLANETS.find(p => p.id === t.transitPlanet);
  const natal = PLANETS.find(p => p.id === t.natalPlanet);
  return `- ${transit?.name}${t.aspect}${natal?.name} (精确度${Math.round(t.exactness)}%): ${t.interpretation}`;
}).join('\n')}

### 即将到来的重要事件
${user.upcomingEvents.slice(0, 5).map(e => 
  `- ${e.date.toLocaleDateString('zh-CN')}: ${e.event} [${e.significance === 'high' ? '重要' : '关注'}]`
).join('\n')}

### 人生周期位置
- **土星周期**: ${user.lifeCycle.saturnCyclePhase}
- **木星周期**: ${user.lifeCycle.jupiterCyclePhase}
- **年限法周期**: 第${user.lifeCycle.profectionCycle}轮 (每轮12年)
- **整体趋势**: ${user.lifeCycle.overallTrend === 'ascending' ? '上升期' : 
                 user.lifeCycle.overallTrend === 'descending' ? '调整期' : 
                 user.lifeCycle.overallTrend === 'fluctuating' ? '波动期' : '平稳期'}

${context.query ? `\n### 用户问题\n${context.query}` : ''}
${context.focusArea ? `\n### 关注领域\n${context.focusArea === 'career' ? '事业' : 
                       context.focusArea === 'relationship' ? '关系' : 
                       context.focusArea === 'health' ? '健康' : 
                       context.focusArea === 'finance' ? '财务' : '灵性成长'}` : ''}
`;
}

/**
 * 构建人类可读的文本格式
 */
function buildTextContext(context: NonNullable<ReturnType<typeof buildAgentContext>>): string {
  const { user } = context;
  
  const sunSign = ZODIAC_SIGNS.find(s => s.id === user.natal.sunSign);
  const moonSign = ZODIAC_SIGNS.find(s => s.id === user.natal.moonSign);
  const risingSign = ZODIAC_SIGNS.find(s => s.id === user.natal.risingSign);
  
  return `
${sunSign?.name}座，月亮${moonSign?.name}，上升${risingSign?.name}，${user.current.age}岁。

当前处于年限法第${user.current.profectionHouse}宫年（${user.current.profectionTheme}），年度主星是${PLANETS.find(p => p.id === user.current.lordOfYear)?.name}。

今日运势评分 ${user.current.todayScore}/100，主题是「${user.current.todayTheme}」。

本周整体评分 ${Math.round(user.current.weekScore)}/100，「${user.current.weekTheme}」。

当前正经历：${user.activeTransits.slice(0, 3).map(t => t.interpretation).join('；')}。

近期关注：${user.upcomingEvents.slice(0, 3).map(e => `${e.date.toLocaleDateString('zh-CN')}${e.event}`).join('、')}。
`.trim();
}

