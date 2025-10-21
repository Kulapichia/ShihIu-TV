import React, { useState, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import { buttonStyles } from '@/hooks/useAdminComponents';

type Site = {
  name: string;
  url: string;
};

// 假设 TVBoxCategory 和 TVBoxVideo 类型定义如下，因为找不到源文件
type TVBoxCategory = { type_id: any; type_name: string };
type TVBoxVideo = { vod_id: any; vod_pic: any; vod_name: any; vod_remarks: any; vod_douban_id: any };

const SourceBrowser: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [categories, setCategories] = useState<TVBoxCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TVBoxCategory | null>(
    null
  );
  const [videos, setVideos] = useState<TVBoxVideo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSites = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/source-browser/sites');
        if (response.ok) {
          const data = await response.json();
          setSites(data.sources || []);
        }
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSites();
  }, []);

  const fetchCategories = useCallback(async (site: Site) => {
    setIsLoading(true);
    setSelectedSite(site);
    setCategories([]);
    setVideos([]);
    setSelectedCategory(null);
    setCurrentPage(1);
    try {
      const response = await fetch(
        `/api/admin/source-browser/categories?url=${encodeURIComponent(site.url)}`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          handleCategorySelect(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVideos = useCallback(
    async (category: TVBoxCategory, page: number) => {
      if (!selectedSite) return;
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/source-browser/list?url=${encodeURIComponent(
            selectedSite.url
          )}&tid=${category.type_id}&pg=${page}`
        );
        if (response.ok) {
          const data = await response.json();
          setVideos(data.list);
          setCurrentPage(data.page);
          setTotalPages(data.pagecount);
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedSite]
  );

  const handleCategorySelect = (category: TVBoxCategory) => {
    setSelectedCategory(category);
    fetchVideos(category, 1);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !searchQuery) return;
    setIsLoading(true);
    setCategories([]);
    setSelectedCategory(null);
    setVideos([]);
    try {
      const response = await fetch(
        `/api/admin/source-browser/search?url=${encodeURIComponent(
          selectedSite.url
        )}&wd=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setVideos(data.list || data);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Failed to search videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (selectedCategory) {
      fetchVideos(selectedCategory, newPage);
    }
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">源浏览</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {sites.map((site) => (
          <button
            key={site.url}
            onClick={() => fetchCategories(site)}
            className={`${buttonStyles.secondary} ${
              selectedSite?.url === site.url
                ? 'bg-blue-600 ring-2 ring-blue-400'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {site.name}
          </button>
        ))}
      </div>

      {selectedSite && (
        <div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`在 ${selectedSite.name} 中搜索...`}
              className="flex-grow bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button type="submit" className={buttonStyles.primary}>
              搜索
            </button>
          </form>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.type_id}
              onClick={() => handleCategorySelect(cat)}
              className={`${buttonStyles.secondary} ${
                selectedCategory?.type_id === cat.type_id
                  ? 'bg-indigo-600 ring-2 ring-indigo-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {cat.type_name}
            </button>
          ))}
        </div>
      )}

      {isLoading && <p>加载中...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video.vod_id}
            id={video.vod_id.toString()}
            poster={video.vod_pic}
            title={video.vod_name}
            source={selectedSite?.name || 'Unknown'}
            remarks={video.vod_remarks}
            douban_id={video.vod_douban_id}
            from='search'
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${buttonStyles.secondary} disabled:opacity-50`}
          >
            上一页
          </button>
          <span>
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`${buttonStyles.secondary} disabled:opacity-50`}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default SourceBrowser;
