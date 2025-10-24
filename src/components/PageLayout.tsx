import { useSite } from './SiteProvider'; // [滚动恢复整合] 导入 useSite
import { BackButton } from './BackButton';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import Sidebar from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface PageLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const PageLayout = ({ children, activePath = '/' }: PageLayoutProps) => {
  // [滚动恢复整合] 从 context 中获取 mainContainerRef
  const { mainContainerRef } = useSite();

  return (
    <div className='w-full min-h-screen'>
      {/* 移动端头部 */}
      <MobileHeader showBackButton={['/play', '/live'].includes(activePath)} />

      {/* 主要布局容器 */}
      {/* [滚动恢复整合] 确保在桌面端时，网格布局占据整个视口高度 */}
      <div className='flex md:grid md:grid-cols-[auto_1fr] w-full h-screen md:min-h-auto'>
        {/* 侧边栏 - 桌面端显示，移动端隐藏 */}
        <div className='hidden md:block'>
          <Sidebar activePath={activePath} />
        </div>

        {/* [滚动恢复整合] 主内容区域的容器，在桌面端它将是滚动的主体 */}
        <div
          ref={mainContainerRef} // [滚动恢复整合] 将 ref 附加到此容器
          className='relative min-w-0 flex-1 md:overflow-y-auto transition-all duration-300'
        >
          {/* 桌面端左上角返回按钮 */}
          {['/play', '/live'].includes(activePath) && (
            <div className='absolute top-3 left-1 z-20 hidden md:flex'>
              <BackButton />
            </div>
          )}

          {/* 桌面端顶部按钮 */}
          <div className='absolute top-2 right-4 z-20 hidden md:flex items-center gap-2'>
            <ThemeToggle />
            <UserMenu />
          </div>

          {/* 主内容 */}
          <main
            className='flex-1 md:min-h-0 md:mb-0 md:mt-0 mt-12'
            style={{
              // [滚动恢复整合] 在移动端，由于滚动主体是body，底部导航是fixed，所以需要这个padding
              // 在桌面端，由于滚动主体是mainContainerRef，这个padding无害
              paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className='md:hidden'>
        <MobileBottomNav activePath={activePath} />
      </div>
    </div>
  );
};

export default PageLayout;
