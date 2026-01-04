/**
 * Users API
 * 用户管理接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser, 
  getAllUserIds,
  queryUsers 
} from '@/lib/services/user-service';
import { type BirthData } from '@/lib/astro';

/**
 * GET /api/users
 * 获取所有用户列表
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // 支持筛选
  const sunSign = searchParams.get('sunSign');
  const moonSign = searchParams.get('moonSign');
  const minAge = searchParams.get('minAge');
  const maxAge = searchParams.get('maxAge');
  
  if (sunSign || moonSign || minAge || maxAge) {
    const users = queryUsers({
      sunSign: sunSign || undefined,
      moonSign: moonSign || undefined,
      ageRange: minAge && maxAge ? [parseInt(minAge), parseInt(maxAge)] : undefined,
    });
    
    return NextResponse.json({
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        birthDate: u.birthData.date,
      })),
    });
  }
  
  const userIds = getAllUserIds();
  return NextResponse.json({
    count: userIds.length,
    userIds,
  });
}

/**
 * POST /api/users
 * 创建新用户
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { id, birthData, preferences } = body as {
      id: string;
      birthData: {
        date: string;
        latitude: number;
        longitude: number;
        timezone: string;
        name?: string;
      };
      preferences?: Record<string, unknown>;
    };
    
    if (!id || !birthData) {
      return NextResponse.json(
        { error: 'Missing required fields: id, birthData' },
        { status: 400 }
      );
    }
    
    const parsedBirthData: BirthData = {
      date: new Date(birthData.date),
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      timezone: birthData.timezone,
      name: birthData.name,
    };
    
    const user = createUser(id, parsedBirthData, preferences as any);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        sunSign: user.natalChart.planets.find(p => p.id === 'sun')?.signName,
        moonSign: user.natalChart.planets.find(p => p.id === 'moon')?.signName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user', details: String(error) },
      { status: 500 }
    );
  }
}

