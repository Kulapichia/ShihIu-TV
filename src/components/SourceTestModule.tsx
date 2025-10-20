import React, { useState, useEffect } from 'react';
import { buttonStyles } from '@/hooks/useAdminComponents';

type Source = {
  key: string;
  name: string;
  api: string;
};

type TestResult = {
  key: string;
  name: string;
  status: 'valid' | 'no_results' | 'timeout' | 'error';
  latency: number;
};

const SourceTestModule: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [keyword, setKeyword] = useState<string>('斗罗大陆');
  const [timeout, setTimeout] = useState<number>(5000);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    const fetchSources = async () => {
      const res = await fetch('/api/admin/source-test/sources');
      const data = await res.json();
      setSources(data);
      setSelectedSources(data.map((s: Source) => s.key));
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
    const res = await fetch('/api/admin/source-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sources: selectedSources,
        keyword,
        timeout,
      }),
    });
    const data = await res.json();
    setResults(data);
    setIsTesting(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'valid':
        return 'text-green-400';
      case 'no_results':
        return 'text-yellow-400';
      case 'timeout':
        return 'text-orange-400';
      case 'error':
        return 'text-red-400';
    }
  };

  const getStatusText = (status: TestResult['status']) => {
    switch (status) {
      case 'valid':
        return '有效';
      case 'no_results':
        return '无结果';
      case 'timeout':
        return '超时';
      case 'error':
        return '错误';
    }
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">视频源可用性测试</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2">测试关键词</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block mb-2">超时时间 (ms)</label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(parseInt(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2"
          />
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">选择要测试的视频源</h3>
        <div className="flex gap-2 mb-2">
          <button onClick={handleSelectAll} className={buttonStyles.secondary}>
            全选
          </button>
          <button onClick={handleDeselectAll} className={buttonStyles.secondary}>
            全不选
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {sources.map((source) => (
            <div key={source.key} className="flex items-center">
              <input
                type="checkbox"
                id={`source-${source.key}`}
                checked={selectedSources.includes(source.key)}
                onChange={() => handleToggleSource(source.key)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"
              />
              <label
                htmlFor={`source-${source.key}`}
                className="ml-2 text-sm"
              >
                {source.name}
              </label>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={runTest}
        disabled={isTesting}
        className={`${buttonStyles.primary} bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500`}
      >
        {isTesting ? '测试中...' : '开始测试'}
      </button>
      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">测试结果</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    视频源
                  </th>
                  <th scope="col" className="px-6 py-3">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3">
                    延迟 (ms)
                  </th>
                </tr>
              </thead>
              <tbody>
                {results
                  .sort((a, b) => a.latency - b.latency)
                  .map((result) => (
                    <tr
                      key={result.key}
                      className="border-b bg-gray-800 border-gray-700"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium whitespace-nowrap text-white"
                      >
                        {result.name}
                      </th>
                      <td
                        className={`px-6 py-4 ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {getStatusText(result.status)}
                      </td>
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

export default SourceTestModule;
