import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 每次随机选择不同来源和索引
    const useBing = Math.random() < 0.7;

    if (useBing) {
      // Bing 随机壁纸(从过去 0-7 天中随机选择)
      const randomIdx = Math.floor(Math.random() * 8);
      const response = await fetch(
        `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${randomIdx}&n=1&mkt=zh-CN&_t=${Date.now()}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Bing wallpaper');
      }

      const data = await response.json();

      if (data.images && data.images[0]) {
        const imageUrl = `https://www.bing.com${data.images[0].url}`;

        return NextResponse.json({
          url: imageUrl,
          copyright: data.images[0].copyright,
          title: data.images[0].title,
          source: 'bing',
        });
      }
    }

    // 如果 Bing 失败或选择了 Lorem Picsum
    // Lorem Picsum 随机壁纸（高质量，1920x1080）
    const loremUrl = `https://picsum.photos/1920/1080?random=${Date.now()}`;

    return NextResponse.json({
      url: loremUrl,
      copyright: 'Lorem Picsum - Free random images',
      title: 'Random Photo',
      source: 'picsum',
    });
  } catch (error) {
    console.error('Error fetching wallpaper:', error);

    // 如果出错，返回 Lorem Picsum 作为备用
    const loremUrl = `https://picsum.photos/1920/1080?random=${Date.now()}`;
    return NextResponse.json({
      url: loremUrl,
      copyright: 'Lorem Picsum - Free random images',
      title: 'Random Photo',
      source: 'picsum',
    });
  }
}
