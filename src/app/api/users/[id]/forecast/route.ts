/**
 * User Forecast API
 * 用户预测接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserDailyForecast,
  getUserWeeklyForecast,
  getUserProcessedDailyForecast,
  getUserProcessedWeeklyForecast,
  getUserLifeTrend,
  getUserProfection,
  getUserProgression
} from '@/lib/services/user-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]/forecast
 * 获取用户预测数据
 * 
 * Query params:
 * - type: 'daily' | 'weekly' | 'yearly' | 'profection' | 'progression'
 * - date: ISO date string (optional)
 * - startYear: number (for yearly)
 * - endYear: number (for yearly)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  
  const type = searchParams.get('type') || 'daily';
  const dateStr = searchParams.get('date');
  const date = dateStr ? new Date(dateStr) : new Date();
  
  // 是否使用影响因子处理
  const withFactors = searchParams.get('withFactors') === 'true';
  
  switch (type) {
    case 'daily': {
      if (withFactors) {
        const forecast = getUserProcessedDailyForecast(id, date);
        if (!forecast) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({
          type: 'daily',
          processed: true,
          date: forecast.date,
          overallScore: forecast.overallScore,
          rawScore: forecast.rawScore,
          dimensions: forecast.dimensions,
          factors: {
            totalAdjustment: forecast.factorResult.totalAdjustment,
            summary: forecast.factorResult.summary,
            appliedFactors: forecast.factorResult.appliedFactors.map(f => ({
              id: f.id,
              name: f.name,
              type: f.type,
              adjustment: f.adjustment,
              dimension: f.dimension,
              reason: f.reason,
            })),
          },
          topFactors: forecast.topFactors,
          moonPhase: forecast.moonPhase,
          moonSign: forecast.moonSign,
          planetaryDay: forecast.planetaryDay,
          theme: forecast.theme,
        });
      } else {
        const forecast = getUserDailyForecast(id, date);
        if (!forecast) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({
          type: 'daily',
          processed: false,
          ...forecast,
        });
      }
    }
    
    case 'weekly': {
      if (withFactors) {
        const forecast = getUserProcessedWeeklyForecast(id, date);
        if (!forecast) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({
          type: 'weekly',
          processed: true,
          startDate: forecast.startDate,
          endDate: forecast.endDate,
          overallScore: forecast.overallScore,
          weeklyTheme: forecast.weeklyTheme,
          weeklyInsight: forecast.weeklyInsight,
          weeklyFactors: {
            positive: forecast.weeklyFactors.positive.map(f => ({
              name: f.name,
              adjustment: f.adjustment,
              reason: f.reason,
            })),
            negative: forecast.weeklyFactors.negative.map(f => ({
              name: f.name,
              adjustment: f.adjustment,
              reason: f.reason,
            })),
          },
          dimensionTrends: forecast.dimensionTrends,
          days: forecast.days.map(d => ({
            date: d.date,
            overallScore: d.overallScore,
            rawScore: d.rawScore,
            dimensions: d.dimensions,
            topFactors: d.topFactors.slice(0, 3),
          })),
        });
      } else {
        const forecast = getUserWeeklyForecast(id, date);
        if (!forecast) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({
          type: 'weekly',
          processed: false,
          ...forecast,
        });
      }
    }
    
    case 'yearly': {
      const startYear = parseInt(searchParams.get('startYear') || String(new Date().getFullYear()));
      const endYear = parseInt(searchParams.get('endYear') || String(startYear + 10));
      
      const trend = getUserLifeTrend(id, startYear, endYear);
      if (!trend) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({
        type: 'yearly',
        ...trend,
      });
    }
    
    case 'profection': {
      const age = searchParams.get('age');
      const profection = getUserProfection(id, age ? parseInt(age) : undefined);
      if (!profection) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({
        type: 'profection',
        ...profection,
      });
    }
    
    case 'progression': {
      const progression = getUserProgression(id, date);
      if (!progression) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({
        type: 'progression',
        targetDate: progression.targetDate,
        lunarPhase: progression.lunarPhase,
        planets: progression.planets.map(p => ({
          id: p.id,
          name: p.name,
          sign: p.sign,
          signName: p.signName,
          signChanged: p.signChanged,
          movement: p.movement,
        })),
      });
    }
    
    default:
      return NextResponse.json(
        { error: `Unknown forecast type: ${type}` },
        { status: 400 }
      );
  }
}

