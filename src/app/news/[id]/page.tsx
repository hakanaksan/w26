'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface NewsDetail {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string | null;
  content: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params.id as string;

  const [article, setArticle] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/news?id=${encodeURIComponent(newsId)}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        }
      } catch {}
      setLoading(false);
    };
    fetchArticle();
  }, [newsId]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">📰</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Haber bulunamadı</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Bu haber artık mevcut olmayabilir</p>
          <button onClick={() => router.push('/')} className="btn-primary px-6 py-3">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Geri
        </button>

        <article className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {article.imageUrl && (
            <div className="w-full h-64 sm:h-80 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {article.source && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">{article.source}</span>
              )}
              {article.pubDate && (
                <span className="text-gray-500 dark:text-gray-400 text-sm">{formatDate(article.pubDate)}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              {article.title}
            </h1>

            {article.content && article.content.length > 100 ? (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {article.content.split(/\.\s+/).reduce((paragraphs: string[][], sentence: string, index: number) => {
                  const paraIndex = Math.floor(index / 3);
                  if (!paragraphs[paraIndex]) paragraphs[paraIndex] = [];
                  paragraphs[paraIndex].push(sentence);
                  return paragraphs;
                }, []).map((sentences, index) => (
                  <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {sentences.join('. ')}{sentences.length > 0 ? '.' : ''}
                  </p>
                ))}
              </div>
            ) : article.description ? (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{article.description}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mb-6">Haber detayı yüklenemedi.</p>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                Kaynak Haberi Oku
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6H10" /></svg>
              </a>
            </div>
          </div>
        </article>

        <div className="mt-8 text-center">
          <button onClick={() => router.push('/')} className="btn-secondary px-8 py-3">
            ← Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}