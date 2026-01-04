/**
 * 全面验证所有行星位置
 * 
 * 参考数据来源：
 * - Swiss Ephemeris (astro.com)
 * - NASA JPL Horizons
 */

import { getTransitPositions, ZODIAC_SIGNS, PLANETS } from '../src/lib/astro';

// 已知的参考数据点
// 来源: astro.com 和天文年历
const REFERENCE_DATA: Record<string, { date: Date; positions: Record<string, { longitude: number; sign: string }> }> = {
  // 2000-01-01 12:00 UT - J2000 基准点附近
  'J2000': {
    date: new Date('2000-01-01T12:00:00Z'),
    positions: {
      sun: { longitude: 280.5, sign: '摩羯座' },      // 摩羯座 ~10°
      moon: { longitude: 125, sign: '狮子座' },       // 变化快，仅估算
      mercury: { longitude: 271, sign: '摩羯座' },
      venus: { longitude: 241, sign: '射手座' },
      mars: { longitude: 327, sign: '水瓶座' },
      jupiter: { longitude: 25, sign: '白羊座' },     // 白羊座 ~25°
      saturn: { longitude: 40, sign: '金牛座' },      // 金牛座 ~10°
    }
  },
  // 2024-01-01 - 更近期的验证点
  '2024': {
    date: new Date('2024-01-01T12:00:00Z'),
    positions: {
      sun: { longitude: 280.5, sign: '摩羯座' },      // 摩羯座 ~10°
      jupiter: { longitude: 35, sign: '金牛座' },     // 金牛座初 (2024年木星在金牛座)
      saturn: { longitude: 333, sign: '双鱼座' },     // 双鱼座初 (2024年土星在双鱼座)
    }
  }
};

console.log('='.repeat(70));
console.log('全行星位置验证');
console.log('='.repeat(70));

for (const [name, ref] of Object.entries(REFERENCE_DATA)) {
  console.log(`\n【${name}】${ref.date.toISOString()}\n`);
  
  const positions = getTransitPositions(ref.date);
  
  console.log('行星'.padEnd(8) + '系统计算'.padEnd(20) + '参考值'.padEnd(20) + '偏差'.padEnd(10) + '状态');
  console.log('-'.repeat(70));
  
  for (const [planetId, expected] of Object.entries(ref.positions)) {
    const calc = positions.find(p => p.id === planetId);
    if (!calc) continue;
    
    const planet = PLANETS.find(p => p.id === planetId);
    const signIndex = Math.floor(calc.longitude / 30);
    const sign = ZODIAC_SIGNS[signIndex];
    const signDeg = calc.longitude % 30;
    
    // 计算偏差（考虑跨越0°的情况）
    let diff = Math.abs(calc.longitude - expected.longitude);
    if (diff > 180) diff = 360 - diff;
    
    const status = diff < 2 ? '✅' : diff < 5 ? '⚠️' : '❌';
    
    console.log(
      (planet?.name || planetId).padEnd(8) +
      `${calc.longitude.toFixed(1)}° ${sign?.name || ''}`.padEnd(20) +
      `${expected.longitude.toFixed(1)}° ${expected.sign}`.padEnd(20) +
      `${diff.toFixed(1)}°`.padEnd(10) +
      status
    );
  }
}

// 额外测试：2025年的行星位置
console.log('\n' + '='.repeat(70));
console.log('2025年主要行星星座测试');
console.log('='.repeat(70));

// 2025年已知信息：
// - 天王星在金牛座 (2018-2026)
// - 海王星在双鱼座 (2011-2026)
// - 冥王星在水瓶座 (2024开始)
// - 土星在双鱼座 (2023-2026)

const test2025 = new Date('2025-06-01T12:00:00Z');
const pos2025 = getTransitPositions(test2025);

console.log(`\n测试日期: ${test2025.toISOString()}\n`);

const outerPlanetExpected: Record<string, string> = {
  saturn: '双鱼座',
  uranus: '金牛座',
  neptune: '双鱼座/白羊座', // 2025年3月进入白羊座
  pluto: '水瓶座',
};

for (const [planetId, expectedSign] of Object.entries(outerPlanetExpected)) {
  const calc = pos2025.find(p => p.id === planetId);
  if (!calc) continue;
  
  const planet = PLANETS.find(p => p.id === planetId);
  const signIndex = Math.floor(calc.longitude / 30);
  const sign = ZODIAC_SIGNS[signIndex];
  
  const matches = expectedSign.includes(sign?.name || '');
  const status = matches ? '✅' : '❌';
  
  console.log(
    `${planet?.name}: ${calc.longitude.toFixed(1)}° (${sign?.name}) - 预期: ${expectedSign} ${status}`
  );
}

console.log('\n' + '='.repeat(70));
console.log('精度标准:');
console.log('  ✅ < 2°   优秀');
console.log('  ⚠️ 2-5°  可接受');
console.log('  ❌ > 5°   需修正');
console.log('='.repeat(70));

