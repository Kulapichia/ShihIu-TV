// src/components/chat/ChatArea.tsx
'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, Paperclip, Send, Smile, Users, Image as ImageIcon, X } from 'lucide-react';
import { ChatMessage, Conversation, User } from '../../lib/types';
import { MessageBubble } from './MessageBubble';

// 定义 Props 类型
interface ChatAreaProps {
  isMobile: boolean;
  isOpen: boolean;
  selectedConversation: Conversation | null;
  onBack: () => void;
  getAvatarUrl: (username: string) => string;
  getDisplayName: (username: string) => string;
  isUserOnline: (username: string) => boolean;
  currentUser: User | null;
  messages: ChatMessage[];
  newMessage: string;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onImageUpload: (file: File) => void;
  uploadingImage: boolean;
  isConnected: boolean;
  showEmojiPicker: boolean;
  onShowEmojiPickerChange: (show: boolean) => void;
}

export function ChatArea({
  isMobile,
  isOpen,
  selectedConversation,
  onBack,
  getAvatarUrl,
  getDisplayName,
  isUserOnline,
  currentUser,
  messages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onImageUpload,
  uploadingImage,
  isConnected,
  showEmojiPicker,
  onShowEmojiPickerChange,
}: ChatAreaProps) {

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 常用表情列表
  const emojis = [ /* ... (与原文件相同) ... */ ];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 自动调整高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [newMessage]);


  const handleEmojiSelect = (emoji: string) => {
    onNewMessageChange(newMessage + emoji);
    onShowEmojiPickerChange(false);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // 清除文件选择，以便可以再次选择相同的文件
    if (event.target) {
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`
      ${isMobile ? 'w-full flex' : 'flex-1 mt-8'}
      flex-col h-full
    `}>
      {selectedConversation ? (
        <>
          {/* 聊天头部 */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center space-x-2">
            {isMobile && (
              <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {/* ... Chat Header JSX ... */}
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-1 bg-gradient-to-b from-gray-50/30 to-white/50 dark:from-gray-800/30 dark:to-gray-900/50">
              {messages.map((message, index) => (
                  <MessageBubble
                      key={message.id}
                      message={message}
                      isOwnMessage={message.sender_id === currentUser?.username}
                      showName={index === 0 || messages[index - 1].sender_id !== message.sender_id}
                      getAvatarUrl={getAvatarUrl}
                      getDisplayName={getDisplayName}
                      formatMessageTime={(ts) => new Date(ts).toLocaleTimeString()} // 简化示例
                  />
              ))}
              <div ref={messagesEndRef} />
          </div>

          {/* 消息输入区域 */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 relative">
            {/* 表情选择器 */}
            {showEmojiPicker && (
                // ... Emoji Picker JSX ...
                <div className="emoji-picker-container ...">...</div>
            )}
            {/* 主输入区域 */}
            <div className="p-2 sm:p-3">
              <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-600/80">
                {/* ... Input Toolbar, Textarea, and Send Button JSX ... */}
                 <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => onNewMessageChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSendMessage();
                      }
                    }}
                    // ... other props
                 />
                 {/* ... */}
              </div>
            </div>
          </div>
        </>
      ) : (
        !isMobile && (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            选择一个对话开始聊天
          </div>
        )
      )}
    </div>
  );
}
