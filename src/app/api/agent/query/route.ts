/**
 * Agent Query API
 * 智能体查询接口
 * 
 * 这个接口可以接入任何 LLM 服务
 * 当前是一个模板，需要接入实际的 AI 服务
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildAgentContext, getUser } from '@/lib/services/user-service';
import { PLANETS, ZODIAC_SIGNS } from '@/lib/astro';
import type { AgentResponse } from '@/lib/types/user';

/**
 * POST /api/agent/query
 * 智能体查询
 * 
 * Request body:
 * {
 *   userId: string,
 *   query: string,
 *   intent?: 'forecast' | 'analysis' | 'advice' | 'explanation',
 *   focusArea?: 'career' | 'relationship' | 'health' | 'finance' | 'spiritual'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, intent, focusArea } = body;
    
    if (!userId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, query' },
        { status: 400 }
      );
    }
    
    // 构建上下文
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
    
    // ============================================================
    // 这里接入你的 LLM 服务
    // 示例：OpenAI, Claude, 或自定义模型
    // ============================================================
    
    // 目前返回一个基于规则的简单响应
    // 实际使用时替换为 LLM 调用
    const response = generateRuleBasedResponse(context, query);
    
    return NextResponse.json(response);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Query failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 基于规则的简单响应生成
 * 这是一个占位实现，实际使用时应替换为 LLM 调用
 */
function generateRuleBasedResponse(
  context: NonNullable<ReturnType<typeof buildAgentContext>>,
  query: string
): AgentResponse {
  const { user } = context;
  
  const sunSign = ZODIAC_SIGNS.find(s => s.id === user.natal.sunSign);
  const moonSign = ZODIAC_SIGNS.find(s => s.id === user.natal.moonSign);
  const lordPlanet = PLANETS.find(p => p.id === user.current.lordOfYear);
  
  // 检测查询类型
  const isAskingAboutToday = /今[天日]|today/i.test(query);
  const isAskingAboutWeek = /[本这]周|week/i.test(query);
  const isAskingAboutCareer = /事业|工作|career|job|work/i.test(query);
  const isAskingAboutRelationship = /感情|关系|爱情|relationship|love/i.test(query);
  
  let content: string;
  let keyPoints: string[] = [];
  let advice: string[] = [];
  
  if (isAskingAboutToday) {
    content = `今天是${user.current.todayMoonSign ? ZODIAC_SIGNS.find(s => s.id === user.current.todayMoonSign)?.name : ''}月亮日，整体能量评分 ${user.current.todayScore}/100。

${user.current.todayTheme}

作为${sunSign?.name}座的你，今天适合${user.current.todayScore >= 60 ? '积极行动，推进重要事项' : '稳扎稳打，处理日常事务'}。`;
    
    keyPoints = [
      `今日评分: ${user.current.todayScore}/100`,
      `月亮在${ZODIAC_SIGNS.find(s => s.id === user.current.todayMoonSign)?.name}座`,
      user.current.todayTheme,
    ];
    
    advice = user.current.todayScore >= 60 
      ? ['适合开始新项目', '人际沟通会比较顺利', '把握机会表达自己']
      : ['避免重大决策', '多关注身体状态', '适合处理细节工作'];
      
  } else if (isAskingAboutWeek) {
    content = `本周整体能量评分 ${Math.round(user.current.weekScore)}/100。

${user.current.weekTheme}

你当前正经历${user.activeTransits[0]?.interpretation || '平稳期'}，建议${user.current.weekScore >= 60 ? '积极把握机会' : '稳健前行'}。`;
    
    keyPoints = [
      `本周评分: ${Math.round(user.current.weekScore)}/100`,
      user.current.weekTheme,
    ];
    
  } else if (isAskingAboutCareer) {
    const careerHouses = [2, 6, 10]; // 财务、工作、事业宫
    const isCareerYear = careerHouses.includes(user.current.profectionHouse);
    
    content = `从占星角度看你的事业：

你今年处于年限法第${user.current.profectionHouse}宫（${user.current.profectionTheme}），年度主星是${lordPlanet?.name}。${isCareerYear ? '这是事业发展的重要年份。' : '今年的重点不在事业本身，但可以稳步积累。'}

${sunSign?.name}座的你，天生具有${sunSign?.id === 'aries' ? '开拓精神' : sunSign?.id === 'taurus' ? '稳健务实' : sunSign?.id === 'leo' ? '领导才能' : '独特优势'}。

当前行运提示：${user.activeTransits.filter(t => ['saturn', 'jupiter', 'sun', 'mars'].includes(t.transitPlanet)).map(t => t.interpretation).join('；') || '平稳期'}`;
    
    keyPoints = [
      `年限法第${user.current.profectionHouse}宫年`,
      `年度主星: ${lordPlanet?.name}`,
      isCareerYear ? '事业发展年' : '积累准备年',
    ];
    
    advice = isCareerYear 
      ? ['主动寻求机会', '展示你的能力', '建立专业形象']
      : ['深耕现有领域', '提升技能储备', '维护人脉关系'];
      
  } else if (isAskingAboutRelationship) {
    const relationshipHouses = [5, 7, 8]; // 恋爱、婚姻、亲密宫
    const isRelationshipYear = relationshipHouses.includes(user.current.profectionHouse);
    
    content = `从占星角度看你的感情：

月亮${moonSign?.name}座的你，内心渴望${moonSign?.id === 'cancer' ? '安全感与归属' : moonSign?.id === 'leo' ? '被欣赏与重视' : moonSign?.id === 'scorpio' ? '深度的情感连接' : '真实的情感交流'}。

今年是年限法第${user.current.profectionHouse}宫年（${user.current.profectionTheme}），${isRelationshipYear ? '感情生活会有重要发展。' : '重心可能不在感情，但也不排斥美好的邂逅。'}

推运月相目前在「${user.current.progressedLunarPhase}」，${user.current.progressedLunarPhase.includes('新') ? '适合开始新的情感篇章' : user.current.progressedLunarPhase.includes('满') ? '情感关系会迎来高潮或转折' : '情感上在稳步发展'}。`;
    
    keyPoints = [
      `月亮${moonSign?.name}座`,
      `年限法第${user.current.profectionHouse}宫年`,
      `推运月相: ${user.current.progressedLunarPhase}`,
    ];
    
  } else {
    // 通用回复
    content = `作为${sunSign?.name}座、月亮${moonSign?.name}座的你：

**当前状态**
- 年龄: ${user.current.age}岁
- 年限法: 第${user.current.profectionHouse}宫年（${user.current.profectionTheme}）
- 年度主星: ${lordPlanet?.name}
- 推运月相: ${user.current.progressedLunarPhase}

**今日运势**
评分 ${user.current.todayScore}/100，${user.current.todayTheme}

**近期关注**
${user.upcomingEvents.slice(0, 3).map(e => `- ${e.date.toLocaleDateString('zh-CN')}: ${e.event}`).join('\n')}

有什么具体想了解的吗？我可以为你分析事业、感情、健康等各方面的运势。`;
    
    keyPoints = [
      `${sunSign?.name}座 / 月亮${moonSign?.name}`,
      `今日评分: ${user.current.todayScore}/100`,
      `年限法第${user.current.profectionHouse}宫年`,
    ];
  }
  
  return {
    content,
    structured: {
      summary: content.split('\n\n')[0],
      keyPoints,
      advice,
    },
    references: user.activeTransits.slice(0, 3).map(t => ({
      type: 'transit' as const,
      description: t.interpretation,
    })),
    suggestedFollowUps: [
      '今天适合做什么？',
      '本周有什么需要注意的？',
      '我的事业运势如何？',
      '感情方面有什么建议？',
    ],
  };
}

