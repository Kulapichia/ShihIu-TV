/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react';
import { getShortDramaCategories, ShortDramaCategory } from '@/lib/shortdrama.client';

interface ShortDramaSelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const ShortDramaSelector = ({
  selectedCategory,
  onCategoryChange,
}: ShortDramaSelectorProps) => {
  const [categories, setCategories] = useState<ShortDramaCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // 胶囊选择器相关状态
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getShortDramaCategories();
        // 移除硬编码的“全部”分类，以匹配 page.tsx 的数据源和初始状态
        // 这样可以确保与父组件的数据期望完全一致
        setCategories(response);
      } catch (error) {
        console.error('获取短剧分类失败:', error);
        // 设置默认分类
        setCategories([
          { type_id: 1, type_name: '古装' },
          { type_id: 2, type_name: '现代' },
          { type_id: 3, type_name: '都市' },
          { type_id: 4, type_name: '言情' },
          { type_id: 5, type_name: '悬疑' },
          { type_id: 6, type_name: '喜剧' },
          { type_id: 7, type_name: '其他' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 更新指示器位置
  const updateIndicatorPosition = () => {
    const activeIndex = categories.findIndex(
      (cat) => cat.type_id.toString() === selectedCategory
    );

    if (
      activeIndex >= 0 &&
      buttonRefs.current[activeIndex] &&
      containerRef.current
    ) {
      const timeoutId = setTimeout(() => {
        const button = buttonRefs.current[activeIndex];
        const container = containerRef.current;
        if (button && container) {
          const buttonRect = button.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          if (buttonRect.width > 0) {
            setIndicatorStyle({
              left: buttonRect.left - containerRect.left,
              width: buttonRect.width,
            });
          }
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  };

  // 当分类数据加载完成或选中项变化时更新指示器位置
  useEffect(() => {
    if (!loading && categories.length > 0) {
      updateIndicatorPosition();
    }
  }, [loading, categories, selectedCategory]);

  // 渲染胶囊式选择器 (样式已主题化)
  const renderThemedCapsuleSelector = () => {
    if (loading) {
      // 加载骨架屏也应用主题色
      return (
        <div className='flex flex-wrap gap-2'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className='h-9 w-20 bg-purple-500/10 dark:bg-gray-800 rounded-full animate-pulse'
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        // 容器应用了与页面主题一致的、更精致的背景色和内阴影
        className='relative inline-flex bg-purple-500/10 rounded-full p-1 dark:bg-gray-800 backdrop-blur-sm shadow-inner'
      >
        {/* 滑动的渐变背景指示器 */}
        {indicatorStyle.width > 0 && (
          <div
            // 滑动指示器现在是醒目的紫粉色渐变，完美融入主题
            className='absolute top-1 bottom-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full shadow-lg transition-all duration-300 ease-out'
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        )}

        {categories.map((category, index) => {
          const isActive = selectedCategory === category.type_id.toString();
          return (
            <button
              key={category.type_id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              onClick={() => onCategoryChange(category.type_id.toString())}
              // 文本颜色和交互效果也已主题化
              className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-300 whitespace-nowrap ${isActive
                ? 'text-white' // 激活状态文本为白色，以在渐变背景上清晰显示
                : 'text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400'
                }`}
            >
              {category.type_name}
            </button>
          );
        })}
      </div>
    );
  };

  // 移除外层 wrapper 和多余的标题，使其成为一个纯粹的选择器组件
  return (
    <div className='overflow-x-auto pb-2 -mb-2'>
      {renderThemedCapsuleSelector()}
    </div>
  );
};

export default ShortDramaSelector;

