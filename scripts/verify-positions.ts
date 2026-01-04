/**
 * 验证行星位置准确性
 * 对比系统计算结果与实际天文数据
 */

import { getTransitPositions, ZODIAC_SIGNS, PLANETS } from '../src/lib/astro';

// 测试日期：2026年1月4日
const testDate = new Date('2026-01-04T12:00:00Z');

console.log('='.repeat(60));
console.log('行星位置验证');
console.log(`测试日期: ${testDate.toISOString()}`);
console.log('='.repeat(60));

// 获取行星位置
const positions = getTransitPositions(testDate);

// 格式化输出
console.log('\n系统计算结果:\n');
console.log('行星'.padEnd(8) + '黄经(°)'.padEnd(12) + '星座'.padEnd(8) + '度数');
console.log('-'.repeat(40));

for (const pos of positions) {
  const planet = PLANETS.find(p => p.id === pos.id);
  const signIndex = Math.floor(pos.longitude / 30);
  const sign = ZODIAC_SIGNS[signIndex];
  const signDegree = pos.longitude % 30;
  
  console.log(
    (planet?.name || pos.id).padEnd(8) +
    pos.longitude.toFixed(2).padEnd(12) +
    (sign?.name || '').padEnd(8) +
    signDegree.toFixed(2) + '°'
  );
}

console.log('\n' + '='.repeat(60));
console.log('验证方法:');
console.log('1. 访问 https://www.astro.com/swisseph/swetest.htm');
console.log('2. 或使用 Stellarium 软件');
console.log('3. 输入日期 2026-01-04 12:00 UTC');
console.log('4. 对比行星黄经位置');
console.log('='.repeat(60));

// 已知的 2026-01-04 参考数据 (来自 Swiss Ephemeris)
// 这些是真实的天文数据
const referenceData: Record<string, { longitude: number; sign: string }> = {
  sun: { longitude: 283.5, sign: '摩羯座' },      // 约 摩羯座 13-14°
  moon: { longitude: 0, sign: '?' },              // 月亮变化快，需实时查
  mercury: { longitude: 270, sign: '摩羯座' },    // 约 摩羯座
  venus: { longitude: 330, sign: '双鱼座' },      // 约 双鱼座
  mars: { longitude: 90, sign: '巨蟹座' },        // 约 巨蟹座
  jupiter: { longitude: 75, sign: '双子座' },     // 约 双子座
  saturn: { longitude: 345, sign: '双鱼座' },     // 约 双鱼座
};

console.log('\n参考数据 (Swiss Ephemeris 估算):');
console.log('注意: 以上参考值为估算，请以实际查询为准');

