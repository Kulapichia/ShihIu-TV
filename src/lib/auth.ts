import { NextRequest } from 'next/server';

import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// 定义一个联合类型，使其可以接收 NextRequest 对象或 ReadonlyRequestCookies 对象
type CookieSource = NextRequest | ReadonlyRequestCookies;

// 从cookie获取认证信息 (服务端使用，兼容中间件和服务器组件)
export function getAuthInfoFromCookie(source: CookieSource): {
  password?: string;
  username?: string;
  signature?: string;
  timestamp?: number;
  loginTime?: number;
  role?: 'owner' | 'admin' | 'user';
} | null {
  let authCookie;

  // 通过检查 'cookies' 属性是否存在来判断传入的是 NextRequest 还是 ReadonlyRequestCookies
  if ('cookies' in source) {
    // 这是 NextRequest 对象
    authCookie = source.cookies.get('auth');
  } else {
    // 这是 ReadonlyRequestCookies 对象
    authCookie = source.get('auth');
  }

  if (!authCookie) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decoded);
    return authData;
  } catch (error) {
    return null;
  }
}

// 从cookie获取认证信息 (客户端使用)
export function getAuthInfoFromBrowserCookie(): {
  password?: string;
  username?: string;
  signature?: string;
  timestamp?: number;
  loginTime?: number;
  role?: 'owner' | 'admin' | 'user';
} | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // 解析 document.cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const trimmed = cookie.trim();
      const firstEqualIndex = trimmed.indexOf('=');

      if (firstEqualIndex > 0) {
        const key = trimmed.substring(0, firstEqualIndex);
        const value = trimmed.substring(firstEqualIndex + 1);
        if (key && value) {
          acc[key] = value;
        }
      }

      return acc;
    }, {} as Record<string, string>);

    const authCookie = cookies['auth'];
    if (!authCookie) {
      return null;
    }

    // 处理可能的双重编码
    let decoded = decodeURIComponent(authCookie);

    // 如果解码后仍然包含 %，说明是双重编码，需要再次解码
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded);
    }

    const authData = JSON.parse(decoded);
    return authData;
  } catch (error) {
    return null;
  }
}
