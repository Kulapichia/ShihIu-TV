/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig, saveAndCacheConfig } from '@/lib/config';
import { ensureAdmin } from '@/lib/admin-auth';
import { TelegramConfig } from '@/lib/admin.types';

export const runtime = 'nodejs';

/**
 * 统一更新 Telegram 配置 (包括通知和魔法链接登录)
 * POST /api/admin/telegram
 */
export async function POST(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const newTelegramConfig: TelegramConfig = await request.json();

    const config = await getConfig();
    const currentTelegramConfig = config.SiteConfig.Telegram;

    // 验证传入的数据
    const isMagicLinkEnabled = newTelegramConfig.magicLinkLogin?.enabled;
    const isNotificationsEnabled = newTelegramConfig.registrationNotifications?.enabled;

    if ((isMagicLinkEnabled || isNotificationsEnabled) && !newTelegramConfig.botToken?.trim()) {
      return NextResponse.json({ error: '启用任何 Telegram 功能前，必须填写 Bot Token' }, { status: 400 });
    }
    if (isMagicLinkEnabled && !newTelegramConfig.botUsername?.trim()) {
      return NextResponse.json({ error: '启用魔法链接登录时，必须填写 Bot Username' }, { status: 400 });
    }
    if (isNotificationsEnabled && !newTelegramConfig.registrationNotifications?.chatId?.trim()) {
      return NextResponse.json({ error: '启用注册通知时，必须填写接收通知的 Chat ID' }, { status: 400 });
    }
    
    // 处理 Bot Token 占位符
    const finalBotToken = newTelegramConfig.botToken === '********'
      ? currentTelegramConfig.botToken
      : newTelegramConfig.botToken.trim();

    // 合并配置
    config.SiteConfig.Telegram = {
      ...currentTelegramConfig,
      ...newTelegramConfig,
      botToken: finalBotToken,
      botUsername: newTelegramConfig.botUsername?.trim(),
    };
    
    // 保存配置
    await saveAndCacheConfig(config);

    // [关键] 如果启用了魔法链接登录，自动设置 Webhook
    if (isMagicLinkEnabled && finalBotToken && newTelegramConfig.botUsername) {
      try {
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
        const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

        console.log('[Admin Telegram] Auto-setting webhook to:', webhookUrl);

        const setWebhookResponse = await fetch(`https://api.telegram.org/bot${finalBotToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] }),
        });

        const result = await setWebhookResponse.json();
        if (!result.ok) {
          console.warn('[Admin Telegram] Failed to set webhook automatically:', result.description);
          // 不阻止成功响应，仅在日志中警告
        } else {
          console.log('[Admin Telegram] Webhook set successfully.');
        }
      } catch (webhookError) {
        console.error('[Admin Telegram] Error setting webhook:', webhookError);
        // 同样不阻止成功响应
      }
    }

    return NextResponse.json({ success: true, message: 'Telegram 配置已更新' });

  } catch (e) {
    const error = e as Error;
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('更新 Telegram 配置失败:', error);
    return NextResponse.json({ error: error.message || '更新配置失败' }, { status: 500 });
  }
}
