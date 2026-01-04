/**
 * Astrological Constants
 * 占星学常量定义
 */

// 黄道十二星座
export const ZODIAC_SIGNS = [
  { id: 'aries', name: '白羊座', symbol: '♈', element: 'fire', modality: 'cardinal', ruler: 'mars', degree: 0 },
  { id: 'taurus', name: '金牛座', symbol: '♉', element: 'earth', modality: 'fixed', ruler: 'venus', degree: 30 },
  { id: 'gemini', name: '双子座', symbol: '♊', element: 'air', modality: 'mutable', ruler: 'mercury', degree: 60 },
  { id: 'cancer', name: '巨蟹座', symbol: '♋', element: 'water', modality: 'cardinal', ruler: 'moon', degree: 90 },
  { id: 'leo', name: '狮子座', symbol: '♌', element: 'fire', modality: 'fixed', ruler: 'sun', degree: 120 },
  { id: 'virgo', name: '处女座', symbol: '♍', element: 'earth', modality: 'mutable', ruler: 'mercury', degree: 150 },
  { id: 'libra', name: '天秤座', symbol: '♎', element: 'air', modality: 'cardinal', ruler: 'venus', degree: 180 },
  { id: 'scorpio', name: '天蝎座', symbol: '♏', element: 'water', modality: 'fixed', ruler: 'pluto', degree: 210 },
  { id: 'sagittarius', name: '射手座', symbol: '♐', element: 'fire', modality: 'mutable', ruler: 'jupiter', degree: 240 },
  { id: 'capricorn', name: '摩羯座', symbol: '♑', element: 'earth', modality: 'cardinal', ruler: 'saturn', degree: 270 },
  { id: 'aquarius', name: '水瓶座', symbol: '♒', element: 'air', modality: 'fixed', ruler: 'uranus', degree: 300 },
  { id: 'pisces', name: '双鱼座', symbol: '♓', element: 'water', modality: 'mutable', ruler: 'neptune', degree: 330 },
] as const;

// 行星定义
export const PLANETS = [
  { id: 'sun', name: '太阳', symbol: '☉', type: 'luminary', orbitalPeriod: 365.25, color: '#ffd700' },
  { id: 'moon', name: '月亮', symbol: '☽', type: 'luminary', orbitalPeriod: 27.32, color: '#c0c0c0' },
  { id: 'mercury', name: '水星', symbol: '☿', type: 'personal', orbitalPeriod: 87.97, color: '#b5651d' },
  { id: 'venus', name: '金星', symbol: '♀', type: 'personal', orbitalPeriod: 224.7, color: '#ff69b4' },
  { id: 'mars', name: '火星', symbol: '♂', type: 'personal', orbitalPeriod: 686.98, color: '#dc143c' },
  { id: 'jupiter', name: '木星', symbol: '♃', type: 'social', orbitalPeriod: 4332.59, color: '#daa520' },
  { id: 'saturn', name: '土星', symbol: '♄', type: 'social', orbitalPeriod: 10759.22, color: '#8b7355' },
  { id: 'uranus', name: '天王星', symbol: '♅', type: 'transpersonal', orbitalPeriod: 30688.5, color: '#40e0d0' },
  { id: 'neptune', name: '海王星', symbol: '♆', type: 'transpersonal', orbitalPeriod: 60182, color: '#4169e1' },
  { id: 'pluto', name: '冥王星', symbol: '♇', type: 'transpersonal', orbitalPeriod: 90560, color: '#800080' },
  { id: 'northNode', name: '北交点', symbol: '☊', type: 'node', orbitalPeriod: 6798.38, color: '#9370db' },
  { id: 'chiron', name: '凯龙星', symbol: '⚷', type: 'asteroid', orbitalPeriod: 18500, color: '#20b2aa' },
] as const;

// 十二宫位定义
export const HOUSES = [
  { id: 1, name: '第一宫', theme: '自我', keywords: ['身份', '外表', '人格面具', '生命力'], angularType: 'angular' },
  { id: 2, name: '第二宫', theme: '资源', keywords: ['金钱', '价值观', '物质安全', '自我价值'], angularType: 'succedent' },
  { id: 3, name: '第三宫', theme: '沟通', keywords: ['思维', '学习', '兄弟姐妹', '短途旅行'], angularType: 'cadent' },
  { id: 4, name: '第四宫', theme: '根基', keywords: ['家庭', '情感根基', '父母', '内在安全'], angularType: 'angular' },
  { id: 5, name: '第五宫', theme: '创造', keywords: ['创意', '恋爱', '子女', '娱乐', '冒险'], angularType: 'succedent' },
  { id: 6, name: '第六宫', theme: '服务', keywords: ['健康', '日常工作', '习惯', '服务他人'], angularType: 'cadent' },
  { id: 7, name: '第七宫', theme: '关系', keywords: ['伴侣', '合作', '契约', '公开敌人'], angularType: 'angular' },
  { id: 8, name: '第八宫', theme: '转化', keywords: ['共享资源', '亲密', '死亡重生', '心理深度'], angularType: 'succedent' },
  { id: 9, name: '第九宫', theme: '探索', keywords: ['高等教育', '哲学', '长途旅行', '信仰'], angularType: 'cadent' },
  { id: 10, name: '第十宫', theme: '成就', keywords: ['事业', '社会地位', '使命', '公众形象'], angularType: 'angular' },
  { id: 11, name: '第十一宫', theme: '愿景', keywords: ['友谊', '团体', '理想', '社会贡献'], angularType: 'succedent' },
  { id: 12, name: '第十二宫', theme: '超越', keywords: ['潜意识', '隐藏', '灵性', '自我消融'], angularType: 'cadent' },
] as const;

// 相位定义
export const ASPECTS = [
  { id: 'conjunction', name: '合相', symbol: '☌', angle: 0, orb: 10, nature: 'major', harmony: 'neutral', weight: 10 },
  { id: 'opposition', name: '对冲', symbol: '☍', angle: 180, orb: 10, nature: 'major', harmony: 'tense', weight: 10 },
  { id: 'trine', name: '三分', symbol: '△', angle: 120, orb: 8, nature: 'major', harmony: 'harmonious', weight: 8 },
  { id: 'square', name: '四分', symbol: '□', angle: 90, orb: 8, nature: 'major', harmony: 'tense', weight: 8 },
  { id: 'sextile', name: '六分', symbol: '⚹', angle: 60, orb: 6, nature: 'major', harmony: 'harmonious', weight: 6 },
  { id: 'quincunx', name: '梅花', symbol: '⚻', angle: 150, orb: 3, nature: 'minor', harmony: 'tense', weight: 4 },
  { id: 'semisextile', name: '半六分', symbol: '⚺', angle: 30, orb: 2, nature: 'minor', harmony: 'neutral', weight: 2 },
  { id: 'semisquare', name: '半四分', symbol: '∠', angle: 45, orb: 2, nature: 'minor', harmony: 'tense', weight: 3 },
  { id: 'sesquiquadrate', name: '补八分', symbol: '⚼', angle: 135, orb: 2, nature: 'minor', harmony: 'tense', weight: 3 },
  { id: 'quintile', name: '五分', symbol: 'Q', angle: 72, orb: 2, nature: 'minor', harmony: 'creative', weight: 3 },
  { id: 'biquintile', name: '倍五分', symbol: 'bQ', angle: 144, orb: 2, nature: 'minor', harmony: 'creative', weight: 3 },
] as const;

// 行星权重（用于计算影响力）
export const PLANET_WEIGHTS = {
  sun: 10,
  moon: 10,
  mercury: 6,
  venus: 6,
  mars: 6,
  jupiter: 8,
  saturn: 8,
  uranus: 4,
  neptune: 4,
  pluto: 4,
  northNode: 3,
  chiron: 2,
} as const;

// 元素特质
export const ELEMENTS = {
  fire: { name: '火', keywords: ['行动', '热情', '直觉', '创造'], color: '#ff6b35' },
  earth: { name: '土', keywords: ['稳定', '实际', '物质', '耐心'], color: '#7cb518' },
  air: { name: '风', keywords: ['思考', '沟通', '社交', '理性'], color: '#00b4d8' },
  water: { name: '水', keywords: ['情感', '直觉', '深度', '治愈'], color: '#7209b7' },
} as const;

// 模式特质
export const MODALITIES = {
  cardinal: { name: '本位', keywords: ['开创', '领导', '主动'] },
  fixed: { name: '固定', keywords: ['坚持', '稳定', '专注'] },
  mutable: { name: '变动', keywords: ['适应', '灵活', '变化'] },
} as const;

export type PlanetId = typeof PLANETS[number]['id'];
export type ZodiacId = typeof ZODIAC_SIGNS[number]['id'];
export type AspectId = typeof ASPECTS[number]['id'];
export type ElementType = keyof typeof ELEMENTS;
export type ModalityType = keyof typeof MODALITIES;

