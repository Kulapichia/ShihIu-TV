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

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    const categories = await TVBoxManager.getInstance().getCategories(url);
    return NextResponse.json(categories);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
