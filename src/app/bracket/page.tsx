'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BracketView from '@/components/BracketView';
import Link from 'next/link';

export default function BracketPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Navigation Header */}
      <Header activeTab="bracket" onTabChange={(tab) => router.push(`/?tab=${tab}`)} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner / Title Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/90 via-indigo-950/95 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-emerald-500/20 shadow-xl shadow-indigo-950/20">
          {/* Decorative Soccer Field lines bg */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10"/></svg>
                  Resmi Fikstür Canlı Ağaç
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  FIFA Dünya Kupası 2026
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-emerald-200">
                Resmi Turnuva Ağacı
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Grup aşamasını başarıyla tamamlayan takımların Son 32 turundan finale uzanan resmi eşleşmelerini ve ilerlemelerini takip edin. Gelecekte hangi maçların kazananlarının birbiriyle eşleşeceğini buradan görebilirsiniz.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link
                href="/?tab=fixtures"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-sm border border-white/10 transition-all backdrop-blur-md shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Ana Sayfa'ya Dön
              </Link>
            </div>
          </div>
        </div>

        {/* Bracket Render Area */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-gray-800/80 p-4 sm:p-6 shadow-lg">
          <BracketView />
        </div>
      </main>
    </div>
  );
}
