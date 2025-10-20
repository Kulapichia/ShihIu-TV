import { getConfig, isAdmin } from '@/lib/config';
import { searchOnApi } from '@/lib/client-search';
import { NextResponse } from 'next/server';
import { ApiSite } from '@/lib/types';

export const runtime = 'edge';

async function testSource(
  sourceKey: string,
  source: ApiSite,
  keyword: string,
  timeout: number
) {
  const startTime = Date.now();
  try {
    const result = await searchOnApi(source, keyword, 1, timeout);
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (result.length > 0) {
      return {
        key: sourceKey,
        name: source.name,
        status: 'valid',
        latency,
      };
    } else {
      return {
        key: sourceKey,
        name: source.name,
        status: 'no_results',
        latency,
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        key: sourceKey,
        name: source.name,
        status: 'timeout',
        latency: timeout,
      };
    }
    return {
      key: sourceKey,
      name: source.name,
      status: 'error',
      latency,
    };
  }
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sources, keyword, timeout } = await req.json();
  const config = await getConfig();

  const promises = sources.map((sourceKey: string) => {
    const source = config.api_site[sourceKey];
    if (source) {
      return testSource(sourceKey, source, keyword, timeout);
    }
    return Promise.resolve(null);
  });

  const results = (await Promise.all(promises)).filter(Boolean);

  return NextResponse.json(results);
}
