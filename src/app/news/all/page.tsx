'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string | null;
}

export default function AllNewsPage() {
  const router = useRouter();
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
      return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors">
      <Header activeTab="fixtures" onTabChange={(tab) => router.push(`/?tab=${tab}`)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-2xl">📰</div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Dünya Kupası Haberleri</h2>
            <p className="text-gray-500 dark:text-gray-400">2026 FIFA Dünya Kupası ile ilgili en güncel haberler</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                  <div className="w-28 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">📰</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Haber bulunamadı</h3>
            <p className="text-gray-500 dark:text-gray-400">Şu anda haber kaynaklarına ulaşılamıyor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <a
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all group"
              >
                <div className="flex gap-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-28 h-20 rounded-xl object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-28 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">⚽</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {item.source && <span className="font-medium text-gray-600 dark:text-gray-400">{item.source}</span>}
                      {item.pubDate && (
                        <>
                          {item.source && <span>•</span>}
                          <span>{formatDate(item.pubDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => router.push('/')} className="btn-secondary px-8 py-3">
            ← Ana Sayfaya Dön
          </button>
        </div>
      </main>
    </div>
  );
}