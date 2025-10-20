/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { ensureAdmin } from '@/lib/admin-auth';
import { getConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const config = await getConfig();
    const sources = (config.SourceConfig || []).map((s: any) => ({
      key: s.key,
      name: s.name,
      api: s.api,
      disabled: !!s.disabled,
    }));

    return NextResponse.json(
      { sources },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: '获取源列表失败' }, { status: 500 });
  }
}
