/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { getConfig, saveAndCacheConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 生成随机密码
 */
function generateRandomPassword(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 生成签名
 */
async function generateSignature(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成认证 Cookie
 */
async function generateAuthCookie(
    username: string,
    role: 'owner' | 'admin' | 'user'
): Promise<string> {
    const authData: any = { role, username };
    if (process.env.PASSWORD) {
        const signature = await generateSignature(username, process.env.PASSWORD);
        authData.signature = signature;
        authData.timestamp = Date.now();
    }
    return encodeURIComponent(JSON.stringify(authData));
}


/**
 * Telegram Auth 回调处理
 * POST /api/oauth/telegram/callback
 */
export async function POST(req: NextRequest) {
  try {
    const telegramUser = await req.json();

    const config = await getConfig();
    const tgConfig = config.SiteConfig.TelegramAuth;

    if (!tgConfig || !tgConfig.enabled) {
      return NextResponse.json({ error: 'Telegram 登录未启用' }, { status: 403 });
    }
    if (!tgConfig.botToken) {
        return NextResponse.json({ error: 'Telegram Bot Token 未配置' }, { status: 500 });
    }

    // 1. 验证数据来源的真实性
    const { hash, ...dataToCheck } = telegramUser;
    const checkString = Object.keys(dataToCheck)
      .sort()
      .map(key => `${key}=${dataToCheck[key]}`)
      .join('\n');

    // 根据 Telegram 文档，secret_key 是 Bot Token 的 SHA256 哈希值
    const secretKey = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tgConfig.botToken));
    
    // 使用 secret_key 对数据字符串进行 HMAC-SHA256 签名
    const key = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(checkString));
    const hmac = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (hmac !== hash) {
      return NextResponse.json({ error: '数据验证失败，签名不匹配' }, { status: 400 });
    }

    // 2. 验证数据时效性 (auth_date)
    const auth_date = parseInt(telegramUser.auth_date, 10);
    if (Date.now() / 1000 - auth_date > 300) { // 5分钟有效期
      return NextResponse.json({ error: '登录请求已过期，请重试' }, { status: 400 });
    }

    // 3. 查找或创建用户
    const { id: telegramId, username: telegramUsername, first_name, last_name } = telegramUser;
    
    let user = config.UserConfig.Users.find(u => u.telegramId === telegramId);

    if (user) {
      // 用户已存在，更新信息并登录
      if (user.telegramUsername !== telegramUsername) {
        user.telegramUsername = telegramUsername;
        await saveAndCacheConfig(config);
      }
    } else {
      // 用户不存在，检查是否允许自动注册
      if (!tgConfig.autoRegister) {
        return NextResponse.json({ error: '此 Telegram 账户尚未关联系统用户，且自动注册已关闭' }, { status: 403 });
      }

      // 自动注册新用户
      const baseUsername = `tg_${telegramUsername || first_name || telegramId}`;
      let newUsername = baseUsername;
      let counter = 1;
      while (await db.checkUserExist(newUsername)) {
        newUsername = `${baseUsername}_${counter++}`;
      }

      const newPassword = generateRandomPassword();
      await db.registerUser(newUsername, newPassword);

      const newUserEntry = {
        username: newUsername,
        role: tgConfig.defaultRole,
        banned: false,
        createdAt: Date.now(),
        telegramId: telegramId,
        telegramUsername: telegramUsername,
      };

      config.UserConfig.Users.push(newUserEntry);
      await saveAndCacheConfig(config);
      user = newUserEntry;
    }

    // 检查用户是否被封禁
    if (user.banned) {
      return NextResponse.json({ error: '您的账户已被封禁' }, { status: 403 });
    }
    
    // 4. 生成 Cookie 并返回
    const authCookie = await generateAuthCookie(user.username, user.role);
    const response = NextResponse.json({ success: true, message: '登录成功' });

    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7天有效期

    response.cookies.set('auth', authCookie, {
      path: '/',
      expires,
      sameSite: 'lax',
      httpOnly: false, // 保持与项目其他部分一致
      secure: req.url.startsWith('https://'),
    });

    return response;

  } catch (error) {
    console.error('Telegram callback error:', error);
    return NextResponse.json({ error: '处理 Telegram 登录时发生内部错误' }, { status: 500 });
  }
}
