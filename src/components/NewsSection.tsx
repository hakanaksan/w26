'use client';

import { useState, useEffect } from 'react';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string | null;
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
        }
      } catch {}
      setLoading(false);
    };
    fetchNews();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dk önce`;
      if (diffHours < 24) return `${diffHours} saat önce`;
      if (diffDays < 7) return `${diffDays} gün önce`;
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-lg">📰</div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Son Haberler</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-lg">📰</div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Son Haberler</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">2026 Dünya Kupası</p>
          </div>
        </div>
        <a href="/news/all" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline hidden sm:block">Tümünü Gör →</a>
      </div>

      <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-hide">
        {news.slice(0, 8).map((item) => (
          <a
            key={item.id}
            href={`/news/${item.id}`}
            className="block p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {item.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {item.source && <span className="font-medium">{item.source}</span>}
              {item.pubDate && (
                <>
                  {item.source && <span>•</span>}
                  <span>{formatDate(item.pubDate)}</span>
                </>
              )}
            </div>
          </a>
        ))}
      </div>

      <a href="/news/all" className="block sm:hidden mt-3 text-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Tüm Haberleri Gör →</a>
    </div>
  );
}