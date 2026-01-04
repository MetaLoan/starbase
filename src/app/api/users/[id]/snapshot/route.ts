/**
 * User Snapshot API
 * 用户状态快照接口 - 智能体主要使用这个接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserStateSnapshot } from '@/lib/services/user-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]/snapshot
 * 获取用户当前状态快照
 * 
 * 这是智能体最常用的接口，一次调用获取用户的所有实时数据
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const snapshot = getUserStateSnapshot(id);
  
  if (!snapshot) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(snapshot);
}

