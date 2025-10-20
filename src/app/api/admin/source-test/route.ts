/* eslint-disable @typescript-eslint/no-explicit-any,no-console */
import { NextRequest, NextResponse } from 'next/server';

import { ensureAdmin } from '@/lib/admin-auth';
import { API_CONFIG, getConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const sourceKey = searchParams.get('source');

    if (!query || !sourceKey) {
      return NextResponse.json(
        { error: '缺少必要参数: q (查询关键词) 和 source (源标识)' },
        { status: 400 }
      );
    }

    const config = await getConfig();
    const targetSource = config.SourceConfig.find(
      (s: any) => s.key === sourceKey
    );
    if (!targetSource) {
      return NextResponse.json(
        { error: `未找到源: ${sourceKey}` },
        { status: 404 }
      );
    }

    const searchUrl = `${targetSource.api}?ac=videolist&wd=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const startedAt = Date.now();
      const response = await fetch(searchUrl, {
        headers: API_CONFIG.search.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `源接口返回错误: HTTP ${response.status}`,
            sourceError: `${response.status} ${response.statusText}`,
            sourceUrl: searchUrl,
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        return NextResponse.json(
          {
            error: '源接口返回数据格式错误',
            sourceError: '返回数据不是有效的JSON对象',
            sourceUrl: searchUrl,
          },
          { status: 502 }
        );
      }

      if (data.code && data.code !== 1) {
        return NextResponse.json(
          {
            error: `源接口返回错误: ${data.msg || '未知错误'}`,
            sourceError: data.msg || `错误代码: ${data.code}`,
            sourceUrl: searchUrl,
          },
          { status: 502 }
        );
      }

      const results = data.list || data.data || [];
      const durationMs = Date.now() - startedAt;
      const resultCount = Array.isArray(results) ? results.length : 0;
      const lowerQ = (query || '').toLowerCase();
      const matched = Array.isArray(results)
        ? results.filter((item: any) =>
            String(item.vod_name || item.title || '')
              .toLowerCase()
              .includes(lowerQ)
          )
        : [];
      const matchRate = resultCount > 0 ? matched.length / resultCount : 0;
      const topMatches = matched
        .slice(0, 3)
        .map((it: any) => it.vod_name || it.title || '');

      return NextResponse.json({
        success: true,
        source: sourceKey,
        sourceName: targetSource.name || sourceKey,
        sourceUrl: searchUrl,
        results: results,
        total: resultCount,
        disabled: targetSource.disabled || false,
        durationMs,
        resultCount,
        matchRate,
        topMatches,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: '请求超时 (15秒)', sourceError: '连接超时', sourceUrl: searchUrl },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: `网络请求失败: ${fetchError.message}`, sourceError: fetchError.message, sourceUrl: searchUrl },
        { status: 502 }
      );
    }
  } catch (error: any) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('源测试API错误:', error);
    return NextResponse.json(
      { error: `服务器内部错误: ${error.message}`, sourceError: error.message },
      { status: 500 }
    );
  }
}
