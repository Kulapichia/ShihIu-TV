import { NextResponse } from 'next/server';

import { getCacheTime } from '@/lib/config';
import { RawDoubanItemSchema } from '@/lib/schemas';
import { DoubanItem, DoubanResult } from '@/lib/types';

interface DoubanCategoryApiResponse {
  total: number;
  items: Array<any>;
}

// 封装带超时的fetch逻辑
async function fetchDoubanDataWithTimeout(url: string): Promise<DoubanCategoryApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  const fetchOptions = {
    signal: controller.signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Referer: 'https://movie.douban.com/',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://movie.douban.com',
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    // 如果是 AbortError，抛出自定义的超时错误
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求豆瓣API超时');
    }
    throw error;
  }
}

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // 获取参数
  const kind = searchParams.get('kind') || 'movie';
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const pageLimit = parseInt(searchParams.get('limit') || '20');
  const pageStart = parseInt(searchParams.get('start') || '0');

  // 验证参数
  if (!kind || !category || !type) {
    return NextResponse.json(
      { error: '缺少必要参数: kind 或 category 或 type' },
      { status: 400 }
    );
  }

  if (!['tv', 'movie'].includes(kind)) {
    return NextResponse.json(
      { error: 'kind 参数必须是 tv 或 movie' },
      { status: 400 }
    );
  }

  if (pageLimit < 1 || pageLimit > 100) {
    return NextResponse.json(
      { error: 'pageSize 必须在 1-100 之间' },
      { status: 400 }
    );
  }

  if (pageStart < 0) {
    return NextResponse.json(
      { error: 'pageStart 不能小于 0' },
      { status: 400 }
    );
  }

  const target = `https://m.douban.com/rexxar/api/v2/subject/recent_hot/${kind}?start=${pageStart}&limit=${pageLimit}&category=${category}&type=${type}`;

  try {
    console.log(`[豆瓣分类] 请求URL: ${target}`);
    
    // 调用带超时的豆瓣 API
    const doubanData = await fetchDoubanDataWithTimeout(target);
    
    console.log(`[豆瓣分类] 成功获取数据，项目数: ${doubanData.items?.length || 0}`);

    // 使用 flatMap 进行安全转换和过滤
    const list: DoubanItem[] = (doubanData.items || []).flatMap((item: any) => {
      try {
        // 1. 使用 Zod 验证原始数据
        const parsedItem = RawDoubanItemSchema.parse(item);
        
        // 2. 如果验证通过，安全地进行转换
        return [{
          id: parsedItem.id,
          title: parsedItem.title,
          poster: parsedItem.pic?.normal || parsedItem.pic?.large || '',
          rate: parsedItem.rating?.value ? parsedItem.rating.value.toFixed(1) : '',
          year: parsedItem.card_subtitle?.match(/(\d{4})/)?.[1] || '',
        }];
      } catch (error) {
        // 3. 如果验证失败，打印错误并跳过此项
        console.error('Skipping invalid Douban category item:', item, error);
        return []; // flatMap 会将空数组自动移除
      }
    });

    const response: DoubanResult = {
      code: 200,
      message: '获取成功',
      list: list,
    };

    const cacheTime = await getCacheTime();
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
        'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        'Netlify-Vary': 'query',
      },
    });
  } catch (error) {
    console.error(`[豆瓣分类] 请求失败: ${target}`, (error as Error).message);
    return NextResponse.json(
      { 
        error: '获取豆瓣数据失败', 
        details: (error as Error).message,
        url: target,
        params: { kind, category, type, pageLimit, pageStart }
      },
      { status: 500 }
    );
  }
}
