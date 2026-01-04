/**
 * User Detail API
 * 单个用户详情接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getUser, 
  updateUser, 
  deleteUser 
} from '@/lib/services/user-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 * 获取用户详情
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const user = getUser(id);
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    birthData: {
      date: user.birthData.date,
      latitude: user.birthData.latitude,
      longitude: user.birthData.longitude,
      timezone: user.birthData.timezone,
    },
    natalChart: {
      planets: user.natalChart.planets.map(p => ({
        id: p.id,
        name: p.name,
        symbol: p.symbol,
        sign: p.sign,
        signName: p.signName,
        house: p.house,
        degree: p.signDegree,
      })),
      ascendant: user.natalChart.ascendant,
      midheaven: user.natalChart.midheaven,
      dominantPlanets: user.natalChart.dominantPlanets,
      chartRuler: user.natalChart.chartRuler,
      elementBalance: user.natalChart.elementBalance,
      modalityBalance: user.natalChart.modalityBalance,
    },
    preferences: user.preferences,
  });
}

/**
 * PATCH /api/users/[id]
 * 更新用户信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const updated = updateUser(id, body);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * 删除用户
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const deleted = deleteUser(id);
  
  if (!deleted) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: `User ${id} deleted`,
  });
}

