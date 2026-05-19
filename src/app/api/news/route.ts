import { NextResponse } from 'next/server';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string | null;
  content: string;
}

const FEEDS = [
  'https://news.google.com/rss/search?q=2026+Dünya+Kupası+FIFA&hl=tr&gl=TR&ceid=TR:tr',
  'https://news.google.com/rss/search?q=Dünya+Kupası+hazırlıklar&hl=tr&gl=TR&ceid=TR:tr',
  'https://news.google.com/rss/search?q=FIFA+stadyum+2026&hl=tr&gl=TR&ceid=TR:tr',
];

let cachedNews: { timestamp: number; data: NewsItem[] } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

function decodeEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&apos;': "'", '&#x27;': "'", '&#8217;': "'", '&#8220;': '"', '&#8221;': '"',
    '&#8211;': '–', '&#8212;': '—', '&#8230;': '…', '&nbsp;': ' ',
  };
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char);
  }
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return result;
}

function cleanText(html: string): string {
  if (!html) return '';
  let text = html;
  text = text.replace(/<img[^>]*>/gi, '');
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1');
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1');
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1');
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '$1');
  text = text.replace(/<br\s*\/?>/gi, ' ');
  text = text.replace(/<\/p>/gi, ' ');
  text = text.replace(/<\/div>/gi, ' ');
  text = text.replace(/<\/li>/gi, ' ');
  text = text.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1');
  text = text.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  text = text.replace(/<[^>]+>/g, '');
  text = decodeEntities(text);
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

function extractImage(html: string): string | null {
  const patterns = [
    /<img[^>]+src="([^"]+)"/i,
    /<img[^>]+src='([^']+)'/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = decodeEntities(match[1]);
      if (url.startsWith('http')) return url;
    }
  }
  return null;
}

function makeId(title: string, link: string): string {
  const raw = title + '|' + link;
  return Buffer.from(raw, 'utf-8').toString('base64url').substring(0, 30);
}

async function fetchFeed(url: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; W26Bot/1.0)' },
      next: { revalidate: 1800 },
    });
    if (!response.ok) return [];

    const text = await response.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const c = match[1];

      const titleRaw = c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const linkRaw = c.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>/);
      const pubRaw = c.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const srcRaw = c.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const descRaw = c.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);

      const title = titleRaw ? decodeEntities((titleRaw[1] || titleRaw[2] || '').trim()) : '';
      const link = linkRaw ? (linkRaw[1] || linkRaw[2] || '').trim() : '';
      const pubDate = pubRaw ? pubRaw[1].trim() : '';
      const source = srcRaw ? srcRaw[1].trim() : '';
      const rawDesc = descRaw ? (descRaw[1] || descRaw[2] || '').trim() : '';

      if (!title || !link) continue;

      const description = cleanText(rawDesc).substring(0, 300);
      const content = cleanText(rawDesc);
      const imageUrl = extractImage(rawDesc);

      items.push({ id: makeId(title, link), title, link, pubDate, source, description, imageUrl, content });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('id');

  if (!articleId) {
    if (cachedNews && Date.now() - cachedNews.timestamp < CACHE_TTL) {
      return NextResponse.json({ news: cachedNews.data });
    }
    try {
      const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f)));
      const allItems: NewsItem[] = [];
      for (const r of results) { if (r.status === 'fulfilled') allItems.push(...r.value); }

      const seen = new Set<string>();
      const unique: NewsItem[] = [];
      for (const item of allItems) {
        const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!seen.has(key) && key.length > 10) { seen.add(key); unique.push(item); }
      }
      unique.sort((a, b) => {
        const da = new Date(a.pubDate).getTime(), db = new Date(b.pubDate).getTime();
        if (isNaN(da) && isNaN(db)) return 0;
        if (isNaN(da)) return 1;
        if (isNaN(db)) return -1;
        return db - da;
      });

      const news = unique.slice(0, 15);
      cachedNews = { timestamp: Date.now(), data: news };
      return NextResponse.json({ news });
    } catch {
      return NextResponse.json({ news: cachedNews?.data || [] });
    }
  }

  if (!cachedNews || cachedNews.data.length === 0) {
    try {
      const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f)));
      const allItems: NewsItem[] = [];
      for (const r of results) { if (r.status === 'fulfilled') allItems.push(...r.value); }
      const seen = new Set<string>();
      const unique: NewsItem[] = [];
      for (const item of allItems) {
        const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!seen.has(key) && key.length > 10) { seen.add(key); unique.push(item); }
      }
      unique.sort((a, b) => {
        const da = new Date(a.pubDate).getTime(), db = new Date(b.pubDate).getTime();
        if (isNaN(da) && isNaN(db)) return 0;
        if (isNaN(da)) return 1;
        if (isNaN(db)) return -1;
        return db - da;
      });
      cachedNews = { timestamp: Date.now(), data: unique.slice(0, 15) };
    } catch {}
  }

  const item = cachedNews?.data?.find(n => n.id === articleId);
  if (!item) {
    return NextResponse.json({ error: 'Haber bulunamadı' }, { status: 404 });
  }

  let content = item.content;
  if (!content || content.length < 50) content = item.description;

  return NextResponse.json({ ...item, content: content || '' });
}