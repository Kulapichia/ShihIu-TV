// src/types/artplayer-plugin-chromecast.d.ts

// 从 artplayer 库导入主类型，让 'art' 参数不再是 any
import type Artplayer from 'artplayer';

declare module '@/lib/artplayer-plugin-chromecast' {
  // 定义一个可复用的状态类型
  type CastState = 'connected' | 'connecting' | 'disconnected' | 'disconnecting';

  interface ChromecastPluginOptions {
    icon?: string;
    sdk?: string;
    url?: string;
    mimeType?: string;
    // 使用我们新定义的 CastState 类型
    onStateChange?: (state: CastState) => void;
    onCastAvailable?: (available: boolean) => void;
    onCastStart?: () => void;
    onError?: (error: Error) => void;
  }

  interface ChromecastPlugin {
    name: 'artplayerPluginChromecast';
    // 将 getCastState 的返回值从 any 修改为更具体的 CastState
    // 考虑到初始状态可能不存在，我们允许它返回 null
    getCastState: () => CastState | null;
    isCasting: () => boolean;
  }

  // 将 art 参数的类型从 any 修改为 Artplayer
  function artplayerPluginChromecast(options?: ChromecastPluginOptions): (art: Artplayer) => Promise<ChromecastPlugin>;
  export default artplayerPluginChromecast;
}
