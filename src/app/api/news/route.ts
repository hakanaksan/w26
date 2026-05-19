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
const newsStore: NewsItem[] = [];

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…');
}

function stripHtml(html: string): string {
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1');
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1');
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1');
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '$1');
  text = text.replace(/<[^>]+>/g, '');
  text = decodeHtmlEntities(text);
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  return text.trim();
}

function extractImageUrl(desc: string): string | null {
  const match = desc.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

function generateId(title: string, link: string): string {
  const raw = (title + link).substring(0, 100);
  return Buffer.from(raw).toString('base64url').substring(0, 20);
}

async function fetchFeed(url: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      next: { revalidate: 1800 },
    });

    if (!response.ok) return [];

    const text = await response.text();
    const items: NewsItem[] = [];

    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];

      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);

      const title = titleMatch ? decodeHtmlEntities((titleMatch[1] || titleMatch[2] || '').trim()) : '';
      const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      const source = sourceMatch ? sourceMatch[1].trim() : '';
      const rawDesc = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
      const description = stripHtml(rawDesc).substring(0, 250);
      const imageUrl = extractImageUrl(rawDesc);
      const content = stripHtml(rawDesc);

      if (title && link) {
        items.push({
          id: generateId(title, link),
          title,
          link,
          pubDate,
          source,
          description,
          imageUrl,
          content,
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      next: { revalidate: 3600 },
    });

    if (!response.ok) return '';

    const html = await response.text();

    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i);
    if (ogDesc && ogDesc[1] && ogDesc[1].length > 100) return stripHtml(ogDesc[1]);

    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    if (metaDesc && metaDesc[1] && metaDesc[1].length > 100) return stripHtml(metaDesc[1]);

    const articleSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class=["'][^"']*story[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const selector of articleSelectors) {
      const articleMatch = html.match(selector);
      if (articleMatch) {
        const text = stripHtml(articleMatch[1]);
        if (text.length > 300) return text.substring(0, 5000);
      }
    }

    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (paragraphs && paragraphs.length > 3) {
      const text = paragraphs
        .slice(0, 30)
        .map(p => stripHtml(p))
        .filter(t => t.length > 40)
        .join('\n\n');
      if (text.length > 300) return text.substring(0, 5000);
    }

    return '';
  } catch {
    return '';
  }
}

async function refreshNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  const results = await Promise.allSettled(FEEDS.map(feed => fetchFeed(feed)));
  for (const result of results) {
    if (result.status === 'fulfilled') allItems.push(...result.value);
  }

  const seen = new Set<string>();
  const unique: NewsItem[] = [];
  for (const item of allItems) {
    const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen.has(key) && key.length > 10) {
      seen.add(key);
      unique.push(item);
    }
  }

  unique.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });

  const news = unique.slice(0, 20);

  newsStore.length = 0;
  newsStore.push(...news);

  return news;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('id');

  if (cachedNews && Date.now() - cachedNews.timestamp < CACHE_TTL && !articleId) {
    return NextResponse.json({ news: cachedNews.data });
  }

  if (!articleId) {
    try {
      const news = await refreshNews();
      cachedNews = { timestamp: Date.now(), data: news };
      return NextResponse.json({ news });
    } catch {
      return NextResponse.json({ news: cachedNews?.data || [] });
    }
  }

  const item = newsStore.find(n => n.id === articleId);
  if (!item) {
    return NextResponse.json({ error: 'Haber bulunamadı' }, { status: 404 });
  }

  let fullContent = item.content;
  if (!fullContent || fullContent.length < 200) {
    const fetched = await fetchArticleContent(item.link);
    if (fetched && fetched.length > fullContent.length) {
      fullContent = fetched;
    }
  }

  return NextResponse.json({
    ...item,
    content: fullContent || item.description,
  });
}