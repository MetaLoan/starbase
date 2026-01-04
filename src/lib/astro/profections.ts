/**
 * Annual Profections Calculator
 * 年限法计算模块
 * 
 * 古典占星的"值班制度"：
 * 每一年由一个宫位 / 行星主事
 * 那一年的人生主题会围绕它展开
 */

import { 
  ZODIAC_SIGNS, 
  HOUSES, 
  PLANETS,
  type PlanetId, 
  type ZodiacId 
} from './constants';
import { type NatalChart } from './natal-chart';

export interface AnnualProfection {
  year: number;
  age: number;
  house: number;
  houseName: string;
  houseTheme: string;
  houseKeywords: string[];
  sign: ZodiacId;
  signName: string;
  lordOfYear: PlanetId;
  lordName: string;
  lordSymbol: string;
  lordNatalHouse: number;
  lordNatalSign: ZodiacId;
  description: string;
}

export interface LifeProfectionMap {
  profections: AnnualProfection[];
  currentYear: AnnualProfection | null;
  upcomingYears: AnnualProfection[];
  cycleAnalysis: CycleAnalysis;
}

export interface CycleAnalysis {
  firstCycle: { startYear: number; endYear: number; theme: string };
  secondCycle: { startYear: number; endYear: number; theme: string };
  thirdCycle: { startYear: number; endYear: number; theme: string };
  currentCycleNumber: number;
  yearsIntoCurrentCycle: number;
}

/**
 * 计算指定年龄的年限法
 */
export function calculateAnnualProfection(
  natalChart: NatalChart,
  age: number
): AnnualProfection {
  // 年限法：每年前进一个宫位，12 年一个周期
  const houseIndex = age % 12;
  const house = houseIndex + 1;
  
  // 该宫位的宫头星座
  const houseCusp = natalChart.houses[houseIndex];
  const sign = houseCusp.sign;
  const signData = ZODIAC_SIGNS.find(s => s.id === sign);
  
  // 年度主星（该星座的守护星）
  const lordOfYear = signData?.ruler as PlanetId;
  const lordPlanet = PLANETS.find(p => p.id === lordOfYear);
  
  // 年度主星在本命盘中的位置
  const lordNatalPlacement = natalChart.planets.find(p => p.id === lordOfYear);
  
  // 宫位信息
  const houseData = HOUSES.find(h => h.id === house);
  
  // 生成年度主题描述
  const description = generateProfectionDescription(
    house,
    houseData?.theme || '',
    signData?.name || '',
    lordPlanet?.name || '',
    lordNatalPlacement?.house || 1,
    lordNatalPlacement?.signName || ''
  );
  
  const birthYear = natalChart.birthData.date.getFullYear();
  
  return {
    year: birthYear + age,
    age,
    house,
    houseName: houseData?.name || `第${house}宫`,
    houseTheme: houseData?.theme || '',
    houseKeywords: [...(houseData?.keywords || [])],
    sign,
    signName: signData?.name || '',
    lordOfYear,
    lordName: lordPlanet?.name || '',
    lordSymbol: lordPlanet?.symbol || '',
    lordNatalHouse: lordNatalPlacement?.house || 1,
    lordNatalSign: lordNatalPlacement?.sign || 'aries',
    description,
  };
}

/**
 * 生成年度主题描述
 */
function generateProfectionDescription(
  house: number,
  theme: string,
  signName: string,
  lordName: string,
  lordNatalHouse: number,
  lordNatalSign: string
): string {
  const houseThemes: Record<number, string> = {
    1: `这是聚焦自我的一年。${signName}的能量染色你的身份表达。年度主星${lordName}在你的第${lordNatalHouse}宫，这一年的成长方向与该领域紧密相关。`,
    2: `这是关于资源与价值的一年。${signName}的特质影响你如何看待金钱与自我价值。注意${lordName}在第${lordNatalHouse}宫的位置，它指引财务与价值观的发展方向。`,
    3: `这是沟通与学习的一年。${signName}的方式将主导你的思维与表达。${lordName}所在的第${lordNatalHouse}宫领域会成为你学习和交流的重点。`,
    4: `这是关于家庭与根基的一年。${signName}的能量渗透进你的私人生活与情感安全感。${lordName}在第${lordNatalHouse}宫提示你内在安全感的来源。`,
    5: `这是创造与表达的一年。${signName}的色彩为你的创意和恋爱生活染上独特基调。${lordName}在第${lordNatalHouse}宫指向你喜悦和创造的源泉。`,
    6: `这是服务与健康的一年。${signName}的方式影响你的日常习惯和工作态度。关注${lordName}在第${lordNatalHouse}宫的位置，它提示健康和效率的关键。`,
    7: `这是关系与合作的一年。${signName}的特质会显著影响你的伴侣关系和重要合作。${lordName}在第${lordNatalHouse}宫揭示关系发展的关键领域。`,
    8: `这是深度转化的一年。${signName}的能量引导你探索共享资源、亲密关系与心理深度。${lordName}在第${lordNatalHouse}宫指示蜕变的方向。`,
    9: `这是探索与扩展的一年。${signName}的方式影响你的信仰、学习与远行。${lordName}在第${lordNatalHouse}宫提示智慧增长的路径。`,
    10: `这是事业与成就的一年。${signName}的能量为你的公众形象和职业发展染色。${lordName}在第${lordNatalHouse}宫指向事业突破的关键。`,
    11: `这是愿景与社群的一年。${signName}的特质影响你的理想与友谊。${lordName}在第${lordNatalHouse}宫揭示你在社群中的角色和目标。`,
    12: `这是内省与超越的一年。${signName}的能量引导你探索潜意识与灵性维度。${lordName}在第${lordNatalHouse}宫提示需要释放和整合的领域。`,
  };
  
  return houseThemes[house] || `第${house}宫年：${theme}`;
}

/**
 * 计算人生年限法地图
 */
export function calculateLifeProfectionMap(
  natalChart: NatalChart,
  currentAge: number,
  yearsToShow: number = 12
): LifeProfectionMap {
  const profections: AnnualProfection[] = [];
  
  // 计算从 0 岁到 100 岁的所有年限
  for (let age = 0; age <= 100; age++) {
    profections.push(calculateAnnualProfection(natalChart, age));
  }
  
  // 当前年份
  const currentYear = profections.find(p => p.age === currentAge) || null;
  
  // 未来几年
  const upcomingYears = profections.filter(
    p => p.age > currentAge && p.age <= currentAge + yearsToShow
  );
  
  // 周期分析
  const cycleAnalysis = analyzeCycles(natalChart, currentAge);
  
  return {
    profections,
    currentYear,
    upcomingYears,
    cycleAnalysis,
  };
}

/**
 * 分析人生周期
 */
function analyzeCycles(natalChart: NatalChart, currentAge: number): CycleAnalysis {
  const birthYear = natalChart.birthData.date.getFullYear();
  
  // 第一个 12 年周期：0-11 岁 —— 建立基础
  // 第二个 12 年周期：12-23 岁 —— 探索与形成
  // 第三个 12 年周期：24-35 岁 —— 巩固与实现
  // 之后每 12 年重复...
  
  const currentCycleNumber = Math.floor(currentAge / 12) + 1;
  const yearsIntoCurrentCycle = currentAge % 12;
  
  const cycleThemes: Record<number, string> = {
    1: '建立基础：形成自我认知与基本生存能力',
    2: '探索形成：社会化、教育与身份探索',
    3: '巩固实现：事业建立、关系稳定、责任承担',
    4: '深化整合：中年调整、价值重估、成熟智慧',
    5: '传承贡献：经验分享、社会角色转变',
    6: '智慧沉淀：人生整合、精神深化',
    7: '超越圆满：放下与超越',
    8: '圆融归一：晚年智慧',
    9: '无限延续：生命的延续',
  };
  
  return {
    firstCycle: {
      startYear: birthYear,
      endYear: birthYear + 11,
      theme: cycleThemes[1],
    },
    secondCycle: {
      startYear: birthYear + 12,
      endYear: birthYear + 23,
      theme: cycleThemes[2],
    },
    thirdCycle: {
      startYear: birthYear + 24,
      endYear: birthYear + 35,
      theme: cycleThemes[3],
    },
    currentCycleNumber,
    yearsIntoCurrentCycle,
  };
}

/**
 * 获取年限法轮盘数据（用于可视化）
 */
export function getProfectionWheelData(
  natalChart: NatalChart,
  currentAge: number
): Array<{
  house: number;
  sign: ZodiacId;
  signSymbol: string;
  lordSymbol: string;
  isCurrentYear: boolean;
  theme: string;
}> {
  const wheelData: Array<{
    house: number;
    sign: ZodiacId;
    signSymbol: string;
    lordSymbol: string;
    isCurrentYear: boolean;
    theme: string;
  }> = [];
  
  const currentHouse = (currentAge % 12) + 1;
  
  for (let i = 0; i < 12; i++) {
    const house = i + 1;
    const houseCusp = natalChart.houses[i];
    const signData = ZODIAC_SIGNS.find(s => s.id === houseCusp.sign);
    const lordPlanet = PLANETS.find(p => p.id === signData?.ruler);
    const houseData = HOUSES.find(h => h.id === house);
    
    wheelData.push({
      house,
      sign: houseCusp.sign,
      signSymbol: signData?.symbol || '',
      lordSymbol: lordPlanet?.symbol || '',
      isCurrentYear: house === currentHouse,
      theme: houseData?.theme || '',
    });
  }
  
  return wheelData;
}

/**
 * 查找重要的年限法年份
 */
export function findSignificantProfectionYears(
  natalChart: NatalChart,
  fromAge: number,
  toAge: number
): Array<{
  age: number;
  year: number;
  significance: string;
  description: string;
}> {
  const significant: Array<{
    age: number;
    year: number;
    significance: string;
    description: string;
  }> = [];
  
  const birthYear = natalChart.birthData.date.getFullYear();
  
  for (let age = fromAge; age <= toAge; age++) {
    const profection = calculateAnnualProfection(natalChart, age);
    
    // 角宫年份（1, 4, 7, 10 宫）通常更重要
    if ([1, 4, 7, 10].includes(profection.house)) {
      significant.push({
        age,
        year: birthYear + age,
        significance: '角宫年',
        description: `${profection.houseName}（${profection.houseTheme}）年份，通常带来更显著的外在变化和人生转折点`,
      });
    }
    
    // 年度主星与太阳或月亮相同
    if (profection.lordOfYear === 'sun') {
      significant.push({
        age,
        year: birthYear + age,
        significance: '太阳主宰年',
        description: '自我表达和创造力的重要年份，适合追求个人目标',
      });
    }
    
    if (profection.lordOfYear === 'saturn') {
      significant.push({
        age,
        year: birthYear + age,
        significance: '土星主宰年',
        description: '结构化和责任承担的年份，可能面临限制但也能建立长久成果',
      });
    }
  }
  
  return significant;
}

/**
 * 比较两个年限法年份
 */
export function compareProfectionYears(
  profection1: AnnualProfection,
  profection2: AnnualProfection
): {
  sameHouse: boolean;
  sameLord: boolean;
  sameSign: boolean;
  similarity: number;  // 0-100
  comparison: string;
} {
  const sameHouse = profection1.house === profection2.house;
  const sameLord = profection1.lordOfYear === profection2.lordOfYear;
  const sameSign = profection1.sign === profection2.sign;
  
  let similarity = 0;
  if (sameHouse) similarity += 50;
  if (sameLord) similarity += 30;
  if (sameSign) similarity += 20;
  
  let comparison = '';
  if (similarity >= 80) {
    comparison = '这两年的主题高度相似，可以参考之前年份的经验';
  } else if (similarity >= 50) {
    comparison = '这两年有共同的主题元素，但表现方式会有所不同';
  } else {
    comparison = '这两年的主题差异较大，需要不同的应对策略';
  }
  
  return {
    sameHouse,
    sameLord,
    sameSign,
    similarity,
    comparison,
  };
}

