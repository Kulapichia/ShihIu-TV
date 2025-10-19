import { NextResponse } from 'next/server';
import { fetchDanmakuFromBilibili, parseBilibiliDanmaku } from '@/lib/danmaku';

// 确保 Next.js 边缘函数运行时环境
export const runtime = 'edge';

/**
 * @description Bilibili 弹幕 API 路由处理
 * @param {Request} request - Next.js 请求对象
 * @returns {Promise<NextResponse>} - 返回弹幕数据或错误信息
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bv = searchParams.get('bv');
  const p = searchParams.get('p') || '1';
  let cid = searchParams.get('cid');

  if (!bv && !cid) {
    return NextResponse.json({ error: 'Missing required parameter: bv or cid' }, { status: 400 });
  }

  try {
    if (bv) {
      console.log(`[Danmaku API] Fetching CID for BV: ${bv}, p: ${p}`);
      const page = parseInt(p, 10);
      const cidResponse = await fetch(`https://api.bilibili.com/x/player/pagelist?bvid=${bv}`);
      if (!cidResponse.ok) {
        console.error(`[Danmaku API] Failed to fetch pagelist for BV: ${bv}, Status: ${cidResponse.status}`);
        throw new Error('Failed to fetch video page list from Bilibili');
      }
      const cidData = await cidResponse.json();
      if (cidData.code !== 0 || !cidData.data || cidData.data.length === 0) {
        console.error(`[Danmaku API] Invalid pagelist response for BV: ${bv}`, cidData);
        throw new Error('Could not find CID for the provided BV ID');
      }
      const pageData = cidData.data[page - 1];
      if (!pageData || !pageData.cid) {
        console.error(`[Danmaku API] Page ${p} not found for BV: ${bv}`);
        throw new Error(`Page ${p} not found for the provided BV ID`);
      }
      cid = pageData.cid;
      console.log(`[Danmaku API] Successfully fetched CID: ${cid}`);
    }

    if (!cid) {
      return NextResponse.json({ error: 'Failed to resolve CID' }, { status: 500 });
    }

    console.log(`[Danmaku API] Fetching danmaku for CID: ${cid}`);
    const xmlData = await fetchDanmakuFromBilibili(cid as string);
    const danmus = parseBilibiliDanmaku(xmlData);

    console.log(`[Danmaku API] Successfully parsed ${danmus.length} danmakus for CID: ${cid}`);
    return NextResponse.json({
      code: 0,
      danmuku: danmus,
      count: danmus.length,
    });
  } catch (error: any) {
    console.error('[Danmaku API Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch danmaku' }, { status: 500 });
  }
}

