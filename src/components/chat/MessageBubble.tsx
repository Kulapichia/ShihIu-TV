// src/components/chat/MessageBubble.tsx
'use client';

import React from 'react';
import { ChatMessage } from '../../lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showName: boolean;
  getAvatarUrl: (username: string) => string;
  getDisplayName: (username: string) => string;
  formatMessageTime: (timestamp: number) => string;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwnMessage,
  showName,
  getAvatarUrl,
  getDisplayName,
  formatMessageTime,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showName ? 'mt-4' : 'mt-1'}`}>
      <div className={`flex items-end space-x-3 max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* 头像 */}
        <div className="flex-shrink-0">
            {/* 使用 opacity-0 占位，避免连续消息抖动 */}
            <img
              src={getAvatarUrl(message.sender_id)}
              alt={getDisplayName(message.sender_id)}
              className={`w-10 h-10 rounded-full ring-2 ring-white dark:ring-gray-600 shadow-md ${!showName ? 'opacity-0' : ''}`}
            />
        </div>

        {/* 消息内容 */}
        <div className="flex flex-col min-w-0">
          {/* 发送者名称 */}
          {!isOwnMessage && showName && (
            <div className="mb-1 px-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getDisplayName(message.sender_id)}
              </span>
            </div>
          )}

          {/* 消息气泡 */}
          <div className={`relative px-5 py-3 rounded-2xl shadow-lg ... ${isOwnMessage ? '...' : '...'}`}>
            {message.message_type === 'image' ? (
                // ... Image Message JSX ...
                <img src={message.content} ... />
            ) : (
                <div className="text-sm ...">{message.content}</div>
            )}
            {/* 消息气泡装饰尾巴 */}
            <div className={`absolute bottom-2 w-3 h-3 ...`}></div>
          </div>

          {/* 时间戳 */}
          <div className={`mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
