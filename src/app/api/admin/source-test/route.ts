/* eslint-disable @typescript-eslint/no-explicit-any,no-console */
import { NextRequest, NextResponse } from 'next/server';

import { ensureAdmin } from '@/lib/admin-auth';
import { API_CONFIG, getConfig } from '@/lib/config';
import { getAuthInfoFromCookie } from '@/lib/auth';

export const runtime = 'nodejs';

async function getAdminRoleFromRequest(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return null;
  }
  const username = authInfo.username;
  if (username === process.env.USERNAME) {
    return 'owner';
  }
  const config = await getConfig();
  const user = config.UserConfig.Users.find(
    (u) => u.username === username && !u.banned
  );
  return user?.role === 'admin' ? 'admin' : null;
}
export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const role = await getAdminRoleFromRequest(request);
    if (!role) {
      return NextResponse.json({ error: '你没有权限访问源检测功能' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const sourceKey = searchParams.get('source');
    // 从前端获取超时设置，并提供一个默认值
    const timeout = parseInt(searchParams.get('timeout') || '15000', 10);

    if (!query || !sourceKey) {
      return NextResponse.json(
        { error: '缺少必要参数: q (查询关键词) 和 source (源标识)' },
        { status: 400 }
      );
    }

    const config = await getConfig();
    // 查找指定的源（包括禁用的源）
    const targetSource = config.SourceConfig.find(
      (s: any) => s.key === sourceKey
    );
    if (!targetSource) {
      // 如果找不到源，也返回一个符合前端期望的错误结构
      return NextResponse.json(
        {
          key: sourceKey,
          name: `${sourceKey} (未找到)`,
          status: 'error',
          latency: -1,
        },
        { status: 404 }
      );
    }

    const searchUrl = `${targetSource.api}?ac=videolist&wd=${encodeURIComponent(query)}`;
    // 直接请求源接口，不使用缓存
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startedAt = Date.now();

    try {
      const response = await fetch(searchUrl, {
        headers: API_CONFIG.search.headers,
        signal: controller.signal,
      });

      const durationMs = Date.now() - startedAt;

      if (!response.ok) {
        return NextResponse.json({
          key: sourceKey,
          name: targetSource.name,
          status: 'error',
          latency: durationMs,
        });
      }

      const data = await response.json();

      // 检查接口返回的数据格式或是否有错误信息
      if (!data || typeof data !== 'object' || (data.code && data.code !== 1)) {
        return NextResponse.json({
          key: sourceKey,
          name: targetSource.name,
          status: 'error',
          latency: durationMs,
        });
      }

      // 提取搜索结果
      const results = data.list || data.data || [];
      
      // 根据是否有结果来判断状态
      const status = results.length > 0 ? 'valid' : 'no_results';

      return NextResponse.json({
        key: sourceKey,
        name: targetSource.name,
        status: status,
        latency: durationMs,
      });
    } catch (fetchError: any) {
      const durationMs = Date.now() - startedAt;
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          key: sourceKey,
          name: targetSource.name,
          status: 'timeout',
          latency: durationMs,
        });
      }
      // 其他网络错误
      return NextResponse.json({
        key: sourceKey,
        name: targetSource.name,
        status: 'error',
        latency: durationMs,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('源测试API错误:', error);
    return NextResponse.json(
      { error: `服务器内部错误: ${error.message}` },
      { status: 500 }
    );
  }
}
