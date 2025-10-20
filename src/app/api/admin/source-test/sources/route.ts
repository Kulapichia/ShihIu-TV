import { getConfig, isAdmin } from '@/lib/config';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await getConfig();
  return NextResponse.json(
    Object.entries(config.api_site).map(([key, value]) => ({
      key,
      name: value.name,
      api: value.api,
    }))
  );
}
