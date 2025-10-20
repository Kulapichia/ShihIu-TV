'use client';

import { ArrowLeftIcon, MagnifyingGlassIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth'; // 引入项目A的认证工具
import SourceTestModule from '@/components/SourceTestModule';

export default function SourceTestPage() {
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

  useEffect(() => {
    // 使用项目A的认证方式
    const auth = getAuthInfoFromBrowserCookie();
    if (auth && (auth.role === 'admin' || auth.role === 'owner')) {
      setAccessStatus('authorized');
    } else {
      setAccessStatus('unauthorized');
    }
  }, []);

  if (accessStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          正在校验访问权限...
        </div>
      </div>
    );
  }

  if (accessStatus === 'unauthorized') {
    // 如果无权限，则重定向到登录页
    router.replace('/login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-8 text-center space-y-4">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl mx-auto">
            <ShieldExclamationIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            无访问权限
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-6">
            源检测功能仅向管理员开放。正在重定向到登录页面...
          </p>
        </div>
      </div>
    );
  }
  
  // 适配项目A的SourceTestModule组件，它有不同的API请求路径
  // 我们将项目B的SourceTestModule代码直接内联并修改
  const AdaptedSourceTestModule = () => {
      const [sources, setSources] = useState<any[]>([]);
      const [selectedSources, setSelectedSources] = useState<string[]>([]);
      const [keyword, setKeyword] = useState<string>('斗罗大陆');
      const [timeout, setTimeoutVal] = useState<number>(5000);
      const [results, setResults] = useState<any[]>([]);
      const [isTesting, setIsTesting] = useState<boolean>(false);
      const { buttonStyles } = { buttonStyles: "px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-500" };

      useEffect(() => {
        const fetchSources = async () => {
          // 更新API路径
          const res = await fetch('/api/admin/source-test/sources');
          const data = await res.json();
          setSources(data);
          setSelectedSources(data.map((s: any) => s.key));
        };
        fetchSources();
      }, []);

      const handleToggleSource = (key: string) => {
        setSelectedSources((prev) =>
          prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
        );
      };

      const handleSelectAll = () => {
        setSelectedSources(sources.map((s) => s.key));
      };

      const handleDeselectAll = () => {
        setSelectedSources([]);
      };

      const runTest = async () => {
        setIsTesting(true);
        setResults([]);
        // 更新API路径
        const res = await fetch('/api/admin/source-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources: selectedSources, keyword, timeout }),
        });
        const data = await res.json();
        setResults(data);
        setIsTesting(false);
      };

      const getStatusColor = (status: any) => {
        switch (status) {
          case 'valid': return 'text-green-400';
          case 'no_results': return 'text-yellow-400';
          case 'timeout': return 'text-orange-400';
          case 'error': return 'text-red-400';
        }
      };

      const getStatusText = (status: any) => {
        switch (status) {
          case 'valid': return '有效';
          case 'no_results': return '无结果';
          case 'timeout': return '超时';
          case 'error': return '错误';
        }
      };

      return (
        <div className="p-4 bg-gray-800/50 rounded-lg text-white">
          <h2 className="text-xl font-bold mb-4">视频源可用性测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">测试关键词</label>
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2" />
            </div>
            <div>
              <label className="block mb-2">超时时间 (ms)</label>
              <input type="number" value={timeout} onChange={(e) => setTimeoutVal(parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2" />
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">选择要测试的视频源</h3>
            <div className="flex gap-2 mb-2">
              <button onClick={handleSelectAll} className={buttonStyles}>全选</button>
              <button onClick={handleDeselectAll} className={buttonStyles}>全不选</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {sources.map((source) => (
                <div key={source.key} className="flex items-center">
                  <input type="checkbox" id={`source-${source.key}`} checked={selectedSources.includes(source.key)} onChange={() => handleToggleSource(source.key)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2" />
                  <label htmlFor={`source-${source.key}`} className="ml-2 text-sm">{source.name}</label>
                </div>
              ))}
            </div>
          </div>
          <button onClick={runTest} disabled={isTesting} className={`${buttonStyles} bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500`}>
            {isTesting ? '测试中...' : '开始测试'}
          </button>
          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">测试结果</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">视频源</th>
                      <th scope="col" className="px-6 py-3">状态</th>
                      <th scope="col" className="px-6 py-3">延迟 (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.sort((a, b) => a.latency - b.latency).map((result) => (
                      <tr key={result.key} className="border-b bg-gray-800 border-gray-700">
                        <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-white">{result.name}</th>
                        <td className={`px-6 py-4 ${getStatusColor(result.status)}`}>{getStatusText(result.status)}</td>
                        <td className="px-6 py-4">{result.latency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部导航 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MagnifyingGlassIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    源测试工具
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    测试各个源的搜索性能和质量
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdaptedSourceTestModule />
      </div>
    </div>
  );
}

