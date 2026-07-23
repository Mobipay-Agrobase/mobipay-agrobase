import { NextRequest, NextResponse } from 'next/server';
import { getGroupStats } from '@/lib/vsla-engine';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stats = await getGroupStats(id);
  return NextResponse.json({ stats });
}
