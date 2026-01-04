/**
 * 用新月日期验证月亮计算
 * 新月时：月亮黄经 ≈ 太阳黄经 (差距 < 5°)
 */

import { getTransitPositions } from '../src/lib/astro';

// 已知的新月日期 (来源: timeanddate.com)
const newMoons = [
  { date: new Date('2024-01-11T11:57:00Z'), name: '2024年1月新月' },
  { date: new Date('2024-02-09T22:59:00Z'), name: '2024年2月新月' },
  { date: new Date('2024-03-10T09:00:00Z'), name: '2024年3月新月' },
  { date: new Date('2024-12-01T06:21:00Z'), name: '2024年12月新月' },
  { date: new Date('2025-01-29T12:36:00Z'), name: '2025年1月新月' },
];

// 已知的满月日期 (月亮应该比太阳多 180°)
const fullMoons = [
  { date: new Date('2024-01-25T17:54:00Z'), name: '2024年1月满月' },
  { date: new Date('2024-02-24T12:30:00Z'), name: '2024年2月满月' },
];

console.log('=== 新月验证 (月亮 ≈ 太阳) ===\n');

for (const nm of newMoons) {
  const positions = getTransitPositions(nm.date);
  const sun = positions.find(p => p.id === 'sun');
  const moon = positions.find(p => p.id === 'moon');
  
  if (!sun || !moon) continue;
  
  let diff = Math.abs(moon.longitude - sun.longitude);
  if (diff > 180) diff = 360 - diff;
  
  const status = diff < 5 ? '✅' : diff < 15 ? '⚠️' : '❌';
  
  console.log(`${nm.name}:`);
  console.log(`  太阳: ${sun.longitude.toFixed(1)}°`);
  console.log(`  月亮: ${moon.longitude.toFixed(1)}°`);
  console.log(`  差距: ${diff.toFixed(1)}° ${status}`);
  console.log();
}

console.log('=== 满月验证 (月亮 ≈ 太阳 + 180°) ===\n');

for (const fm of fullMoons) {
  const positions = getTransitPositions(fm.date);
  const sun = positions.find(p => p.id === 'sun');
  const moon = positions.find(p => p.id === 'moon');
  
  if (!sun || !moon) continue;
  
  const expected = (sun.longitude + 180) % 360;
  let diff = Math.abs(moon.longitude - expected);
  if (diff > 180) diff = 360 - diff;
  
  const status = diff < 5 ? '✅' : diff < 15 ? '⚠️' : '❌';
  
  console.log(`${fm.name}:`);
  console.log(`  太阳: ${sun.longitude.toFixed(1)}°`);
  console.log(`  预期月亮: ${expected.toFixed(1)}°`);
  console.log(`  实际月亮: ${moon.longitude.toFixed(1)}°`);
  console.log(`  差距: ${diff.toFixed(1)}° ${status}`);
  console.log();
}

console.log('=== 精度标准 ===');
console.log('✅ < 5°   优秀');
console.log('⚠️ 5-15° 可接受');
console.log('❌ > 15°  需修正');

