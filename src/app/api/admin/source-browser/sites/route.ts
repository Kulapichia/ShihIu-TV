import { NextResponse } from 'next/server';
import { getConfig, isAdmin } from '@/lib/config';
import { TVBoxSource, parseTVBoxSource } from '@/lib/tvbox';

export const runtime = 'edge';

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await getConfig();
  const sites: TVBoxSource[] = [];

  for (const key in config.api_site) {
    const site = config.api_site[key];
    if (site.api.endsWith('.json') || site.api.endsWith('.js')) {
      sites.push(
        parseTVBoxSource({
          name: site.name,
          url: site.api,
        })
      );
    }
  }

  return NextResponse.json(sites);
}
