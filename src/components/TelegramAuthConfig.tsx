'use client';

import { AlertCircle, CheckCircle2, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TelegramConfig } from '@/lib/admin.types'; // 1. 引入统一的类型
import { buttonStyles } from '@/hooks/useAdminComponents'; // 2. 引入统一的按钮样式

// 3. 更新 Props 接口以使用统一的 TelegramConfig 类型
interface UnifiedTelegramConfigProps {
  config: TelegramConfig;
  onSave: (config: TelegramConfig) => Promise<void>;
}

// 4. 组件名保持 TelegramAuthConfig 不变，但功能已统一
export function TelegramAuthConfig({ config, onSave }: UnifiedTelegramConfigProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // 5. 更新本地 state 初始化逻辑，以处理占位符
    setLocalConfig({
      ...config,
      botToken: config.botToken ? '********' : '',
    });
  }, [config]);

  useEffect(() => {
    // 6. 更新变更检测逻辑
    const originalConfigForCompare = {
        ...config,
        botToken: config.botToken ? '********' : '',
    };
    const changed = JSON.stringify(localConfig) !== JSON.stringify(originalConfigForCompare);
    setHasChanges(changed);
  }, [localConfig, config]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // 7. 更新保存逻辑，正确处理未修改的 token
      const configToSave = {
        ...localConfig,
        botToken: localConfig.botToken === '********' ? config.botToken : localConfig.botToken,
      };
      await onSave(configToSave);
      setMessage({ type: 'success', text: '保存成功' });
      setHasChanges(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `保存失败: ${(error as Error).message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* 标题和说明 (已更新为统一文案) */}
      <div className='border-b border-gray-200 dark:border-gray-700 pb-4'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
          <Send className='w-5 h-5 text-blue-500' />
          Telegram 统一配置
        </h2>
        <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
          统一管理 Telegram Bot，用于新用户注册通知和魔法链接登录。
        </p>
      </div>

      {/* 配置提示 */}
      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
        <div className='flex gap-3'>
          <AlertCircle className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-blue-800 dark:text-blue-200 space-y-2'>
            <p className='font-semibold'>配置步骤：</p>
            <ol className='list-decimal list-inside space-y-1 ml-2'>
              <li>与 <a href='https://t.me/botfather' target='_blank' rel='noopener noreferrer' className='underline hover:text-blue-600'>@BotFather</a> 对话创建 Bot</li>
              <li>复制 Bot Token 和 Bot Username 填入下方</li>
              <li>根据需要启用“新用户通知”或“魔法链接登录”功能</li>
              <li>保存配置</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 重要提示：一个 Bot 只能绑定一个域名 */}
      <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
        <div className='flex gap-3'>
          <AlertCircle className='w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-yellow-800 dark:text-yellow-200 space-y-2'>
            <p className='font-semibold'>⚠️ 重要提示：Webhook 绑定限制</p>
            <ul className='list-disc list-inside space-y-1 ml-2'>
              <li><strong>一个 Telegram Bot 只能绑定一个 Webhook URL（域名）</strong></li>
              <li>如果您有多个部署（如 Vercel、自建服务器等），它们<strong>不能共用同一个 Bot</strong></li>
              <li>解决方案：为每个部署创建独立的 Bot，或只在一个域名上启用 Telegram 登录</li>
              <li>当您启用“魔法链接登录”并保存时，系统会自动将 Webhook 设置到当前访问的域名</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bot 核心配置 */}
      <div className='space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30'>
         <h3 className='text-md font-semibold text-gray-800 dark:text-gray-200'>核心 Bot 设置</h3>
         <div>
          <label htmlFor='botToken' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Bot Token <span className='text-red-500'>*</span>
          </label>
          <input
            type='password'
            id='botToken'
            value={localConfig.botToken}
            onChange={(e) => setLocalConfig({ ...localConfig, botToken: e.target.value })}
            className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            placeholder='1234567890:ABCdefGHIjklMNOpqrsTUVwxyz'
          />
          <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
            从 @BotFather 获取。已保存的 Token 将显示为 ********。如需修改，请直接输入新的 Token。
          </p>
        </div>

        <div>
          <label htmlFor='botUsername' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Bot Username <span className='text-gray-400'>(魔法链接登录需要)</span>
          </label>
          <input
            type='text'
            id='botUsername'
            value={localConfig.botUsername || ''}
            onChange={(e) => setLocalConfig({ ...localConfig, botUsername: e.target.value.replace(/^@/, '') })}
            className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            placeholder='YourBotUsername'
          />
          <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
            Bot 的用户名（不含 @），用于生成魔法链接和自动设置 Webhook。
          </p>
        </div>
      </div>

      {/* 功能模块分区 (新增) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 新用户注册通知 (从 TelegramConfigComponent 吸收) */}
        <div className='space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg'>
          <div className='flex items-center justify-between'>
            <h3 className='text-md font-semibold text-gray-800 dark:text-gray-200'>新用户注册通知</h3>
            <button
              type='button'
              onClick={() => setLocalConfig(prev => ({ ...prev, registrationNotifications: { ...prev.registrationNotifications, enabled: !prev.registrationNotifications.enabled } }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${localConfig.registrationNotifications.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localConfig.registrationNotifications.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <p className='text-sm text-gray-600 dark:text-gray-400'>当有新用户注册时，通过 Telegram Bot 发送通知给管理员。</p>
          <div>
            <label htmlFor='chatId' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              接收通知的 Chat ID
            </label>
            <input
              type='text'
              id='chatId'
              value={localConfig.registrationNotifications.chatId || ''}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, registrationNotifications: { ...prev.registrationNotifications, chatId: e.target.value } }))}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              placeholder='频道/群组/用户 ID'
            />
          </div>
        </div>
        
        {/* 魔法链接登录 (从原 TelegramAuthConfig 保留并改造) */}
        <div className='space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg'>
          <div className='flex items-center justify-between'>
            <h3 className='text-md font-semibold text-gray-800 dark:text-gray-200'>魔法链接登录</h3>
            <button
              type='button'
              onClick={() => setLocalConfig(prev => ({ ...prev, magicLinkLogin: { ...prev.magicLinkLogin, enabled: !prev.magicLinkLogin.enabled } }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${localConfig.magicLinkLogin.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localConfig.magicLinkLogin.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <p className='text-sm text-gray-600 dark:text-gray-400'>允许用户通过点击发送到 Telegram 的链接来一键登录。</p>
          
          <div className='flex items-center justify-between pt-2'>
            <label htmlFor='autoRegister' className='text-sm font-medium text-gray-900 dark:text-gray-100'>
              自动注册新用户
            </label>
            <button
              type='button'
              onClick={() => setLocalConfig(prev => ({ ...prev, magicLinkLogin: { ...prev.magicLinkLogin, autoRegister: !prev.magicLinkLogin.autoRegister } }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${localConfig.magicLinkLogin.autoRegister ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localConfig.magicLinkLogin.autoRegister ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div>
            <label htmlFor='defaultRole' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              自动注册默认角色
            </label>
            <select
              id='defaultRole'
              value={localConfig.magicLinkLogin.defaultRole}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, magicLinkLogin: { ...prev.magicLinkLogin, defaultRole: e.target.value as 'user' | 'admin' } }))}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            >
              <option value='user'>普通用户</option>
              <option value='admin'>管理员</option>
            </select>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className='w-5 h-5 flex-shrink-0' />
          ) : (
            <AlertCircle className='w-5 h-5 flex-shrink-0' />
          )}
          <span className='text-sm'>{message.text}</span>
        </div>
      )}

      {/* 保存按钮 */}
      <div className='flex justify-end pt-4'>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={saving || !hasChanges ? buttonStyles.disabled : buttonStyles.success}
        >
          <Save className='w-4 h-4 mr-2' />
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
