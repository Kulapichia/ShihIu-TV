// 客户端搜索工具 - 直接从API获取视频源配置进行搜索
import { SearchResult } from './types';
import { ApiSite } from './config';

type VideoSource = ApiSite;

// 缓存视频源列表，避免重复请求
let cachedSources: VideoSource[] | null = null;
let sourcesPromise: Promise<VideoSource[]> | null = null;

async function getSources(): Promise<VideoSource[]> {
  if (cachedSources) {
    return cachedSources;
  }
  if (sourcesPromise) {
    return sourcesPromise;
  }
  sourcesPromise = fetch('/api/sources')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch sources');
      return res.json();
    })
    .then(data => {
      cachedSources = data;
      sourcesPromise = null;
      return cachedSources as VideoSource[];
    });
  return sourcesPromise;
}


async function searchFromSource(
  source: VideoSource,
  query: string
): Promise<SearchResult[]> {
  try {
    const searchUrl = `${source.api}?ac=videolist&wd=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.warn(`搜索失败 [${source.name}]:`, response.status);
      return [];
    }
    const data = await response.json();
    if (!data?.list?.length) return [];

    // 适配项目A的SearchResult类型
    return data.list.map((item: any) => ({
      id: String(item.vod_id),
      title: item.vod_name,
      poster: item.vod_pic || '',
      source: source.key,
      // ... 其他需要的字段
    }));
  } catch (error) {
    console.error(`搜索错误 [${source.name}]:`, error);
    return [];
  }
}

/**
 * 从所有启用的视频源并发搜索 (客户端)
 */
export async function searchFromAllEnabledSources(query: string): Promise<SearchResult[]> {
  if (!query) return [];

  const sources = await getSources();
  const blockedSourcesStr = localStorage.getItem('siffcity_blocked_sources');
  const blockedSources = blockedSourcesStr ? JSON.parse(blockedSourcesStr) : [];

  const enabledSources = sources.filter(
    s => !s.disabled && !blockedSources.includes(s.key)
  );

  if (enabledSources.length === 0) {
    console.warn('没有可用的客户端搜索源');
    return [];
  }

  console.log(`客户端正在从 ${enabledSources.length} 个视频源搜索: "${query}"`);

  const results = await Promise.all(
    enabledSources.map(source => searchFromSource(source, query))
  );
  
  return results.flat();
}
