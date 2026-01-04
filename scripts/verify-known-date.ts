/**
 * 验证已知日期的天文数据
 * 使用 J2000.0 (2000-01-01 12:00 TT) 作为参考点
 */

import { dateToJulianDay, normalizeAngle } from '../src/lib/astro/ephemeris';

// J2000.0 = 2000年1月1日 12:00 TT
// 儒略日 2451545.0

const testDates = [
  { date: new Date('2000-01-01T12:00:00Z'), name: 'J2000.0' },
  { date: new Date('2024-01-01T12:00:00Z'), name: '2024元旦' },
];

console.log('儒略日验证:\n');
for (const test of testDates) {
  const jd = dateToJulianDay(test.date);
  console.log(`${test.name}: ${test.date.toISOString()}`);
  console.log(`  计算儒略日: ${jd.toFixed(4)}`);
  console.log(`  参考值 (J2000 = 2451545.0)`);
  console.log();
}

// 验证太阳位置公式
console.log('\n太阳位置公式验证:\n');

const J2000 = 2451545.0;
const DEG_TO_RAD = Math.PI / 180;

function testSunPosition(date: Date, expectedLong: number) {
  const jd = dateToJulianDay(date);
  const T = (jd - J2000) / 36525;
  
  // 新公式
  const L0 = normalizeAngle(280.4664567 + 36000.76983 * T + 0.0003032 * T * T);
  const M = normalizeAngle(357.5291092 + 35999.0502909 * T) * DEG_TO_RAD;
  const C = (1.9146 - 0.004817 * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.00029 * Math.sin(3 * M);
  const longitude = normalizeAngle(L0 + C);
  
  const signIndex = Math.floor(longitude / 30);
  const signs = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
  const signDeg = longitude % 30;
  
  console.log(`${date.toISOString().split('T')[0]}:`);
  console.log(`  T = ${T.toFixed(6)} 世纪`);
  console.log(`  计算: ${longitude.toFixed(2)}° = ${signs[signIndex]}座 ${signDeg.toFixed(2)}°`);
  console.log(`  预期: ~${expectedLong}°`);
  console.log(`  偏差: ${Math.abs(longitude - expectedLong).toFixed(2)}°`);
  console.log();
}

// 测试几个已知日期
// 2000-03-20 春分点，太阳应该在约 0° (白羊座 0°)
testSunPosition(new Date('2000-03-20T12:00:00Z'), 0);

// 2000-06-21 夏至，太阳应该在约 90° (巨蟹座 0°)
testSunPosition(new Date('2000-06-21T12:00:00Z'), 90);

// 2000-09-22 秋分点，太阳应该在约 180° (天秤座 0°)
testSunPosition(new Date('2000-09-22T12:00:00Z'), 180);

// 2000-12-21 冬至，太阳应该在约 270° (摩羯座 0°)
testSunPosition(new Date('2000-12-21T12:00:00Z'), 270);

// 2026-01-04
testSunPosition(new Date('2026-01-04T12:00:00Z'), 284);

console.log('='.repeat(50));
console.log('注意: 春分/夏至/秋分/冬至精确日期每年略有不同');
console.log('以上测试预期值是近似值');

