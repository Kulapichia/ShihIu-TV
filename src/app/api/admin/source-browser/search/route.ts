import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/config';
import { TVBoxManager } from '@/lib/tvbox';

export const runtime = 'edge';

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const wd = searchParams.get('wd');

  if (!url || !wd) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const videos = await TVBoxManager.getInstance().search(url, wd);
    return NextResponse.json(videos);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
