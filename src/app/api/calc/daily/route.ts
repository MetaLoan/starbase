/**
 * Daily Forecast Calculation API
 * 每日预测计算接口（无需创建用户）
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  calculateNatalChart, 
  processDailyForecast,
  calculateDailyForecast,
  type BirthData 
} from '@/lib/astro';

/**
 * POST /api/calc/daily
 * 直接计算每日预测
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { birthData: bd, date, withFactors = true } = body;
    
    if (!bd || !bd.date || bd.latitude === undefined || bd.longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required birthData fields' },
        { status: 400 }
      );
    }
    
    const birthData: BirthData = {
      name: bd.name || 'Anonymous',
      date: new Date(bd.date),
      latitude: bd.latitude,
      longitude: bd.longitude,
      timezone: bd.timezone || 'UTC',
    };
    
    const chart = calculateNatalChart(birthData);
    const targetDate = date ? new Date(date) : new Date();
    
    if (withFactors) {
      const forecast = processDailyForecast(chart, targetDate);
      
      return NextResponse.json({
        type: 'daily',
        processed: true,
        date: forecast.date.toISOString(),
        dayOfWeek: forecast.dayOfWeek,
        overallScore: forecast.overallScore,
        rawScore: forecast.rawScore,
        dimensions: forecast.dimensions,
        rawDimensions: forecast.rawDimensions,
        factors: {
          totalAdjustment: forecast.factorResult.totalAdjustment,
          summary: forecast.factorResult.summary,
          appliedFactors: forecast.factorResult.appliedFactors,
        },
        topFactors: forecast.topFactors,
        moonPhase: forecast.moonPhase,
        moonSign: forecast.moonSign,
        moonSignName: forecast.moonSignName,
        planetaryDay: forecast.planetaryDay,
        planetaryHour: forecast.planetaryHour,
        theme: forecast.theme,
        advice: forecast.advice,
        luckyHours: forecast.luckyHours,
        challengingHours: forecast.challengingHours,
        hourlyBreakdown: forecast.hourlyBreakdown?.map(h => ({
          hour: h.hour,
          score: h.score,
          mood: h.mood,
          moonSign: h.moonSign,
          moonSignName: h.moonSignName,
          moonHouse: h.moonHouse,
          keywords: h.keywords,
          bestFor: h.bestFor,
          avoidFor: h.avoidFor,
        })) || [],
        activeAspects: forecast.activeAspects?.map(a => ({
          transitPlanet: a.transitPlanet,
          natalPlanet: a.natalPlanet,
          aspectType: a.aspectType,
          exactness: a.exactness,
          applying: a.applying,
          interpretation: a.interpretation,
        })) || [],
      });
    } else {
      const forecast = calculateDailyForecast(targetDate, chart);
      
      return NextResponse.json({
        type: 'daily',
        processed: false,
        date: forecast.date.toISOString(),
        dayOfWeek: forecast.dayOfWeek,
        overallScore: forecast.overallScore,
        dimensions: forecast.dimensions,
        moonPhase: forecast.moonPhase,
        moonSign: forecast.moonSign,
        moonSignName: forecast.moonSignName,
        planetaryDay: forecast.planetaryDay,
        planetaryHour: forecast.planetaryHour,
        theme: forecast.theme,
        advice: forecast.advice,
        luckyHours: forecast.luckyHours,
        challengingHours: forecast.challengingHours,
        hourlyBreakdown: forecast.hourlyBreakdown?.map(h => ({
          hour: h.hour,
          score: h.score,
          mood: h.mood,
          moonSign: h.moonSign,
          moonSignName: h.moonSignName,
          moonHouse: h.moonHouse,
          keywords: h.keywords,
          bestFor: h.bestFor,
          avoidFor: h.avoidFor,
        })) || [],
        activeAspects: forecast.activeAspects?.map(a => ({
          transitPlanet: a.transitPlanet,
          natalPlanet: a.natalPlanet,
          aspectType: a.aspectType,
          exactness: a.exactness,
          applying: a.applying,
          interpretation: a.interpretation,
        })) || [],
      });
    }
  } catch (error) {
    console.error('Daily forecast error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate daily forecast' },
      { status: 500 }
    );
  }
}

