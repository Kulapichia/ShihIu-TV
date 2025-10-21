      'use client';
      
      import { createContext, ReactNode, useContext } from 'react';
      import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
      
      // 扩展 AuthInfo 类型以匹配 auth.ts 中的返回值
      interface AuthInfo {
        password?: string;
        username?: string;
        signature?: string;
        timestamp?: number;
        loginTime?: number;
        role?: 'owner' | 'admin' | 'user';
      }
      
      const SiteContext = createContext<{ siteName: string; announcement?: string; authInfo: AuthInfo | null }>({
        // 默认值
        siteName: 'MoonTV',
        announcement:
          '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。',
        authInfo: null,
      });
      
      export const useSite = () => useContext(SiteContext);
      
      export function SiteProvider({
        children,
        siteName,
        announcement,
      }: {
        children: ReactNode;
        siteName: string;
        announcement?: string;
      }) {
        // 在客户端组件中安全地获取 authInfo
        const authInfo = typeof window !== 'undefined' ? getAuthInfoFromBrowserCookie() : null;
      
        return (
          <SiteContext.Provider value={{ siteName, announcement, authInfo }}>
            {children}
          </SiteContext.Provider>
        );
      }
