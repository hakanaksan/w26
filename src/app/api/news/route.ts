import { NextResponse } from 'next/server';

const FEEDS = [
  { url: 'https://news.google.com/rss/search?q=FIFA+2026+World+Cup&hl=en-US&gl=US&ceid=US:en', lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=2026+Dünya+Kupası&hl=tr&gl=TR&ceid=TR:tr', lang: 'tr' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', lang: 'en' },
];

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string | null;
}

let cachedNews: { timestamp: number; data: NewsItem[] } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function extractImageUrl(desc: string): string | null {
  const match = desc.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

async function fetchFeed(url: string, lang: string): Promise<NewsItem[]> {
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
      const itemContent = match[1];

      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);

      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      const source = sourceMatch ? sourceMatch[1].trim() : '';
      const rawDesc = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
      const description = stripHtml(rawDesc).substring(0, 200);
      const imageUrl = extractImageUrl(rawDesc);

      if (title && link) {
        items.push({ title, link, pubDate, source, description, imageUrl });
      }
    }

    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  if (cachedNews && Date.now() - cachedNews.timestamp < CACHE_TTL) {
    return NextResponse.json({ news: cachedNews.data });
  }

  try {
    const allItems: NewsItem[] = [];

    for (const feed of FEEDS) {
      const items = await fetchFeed(feed.url, feed.lang);
      allItems.push(...items);
    }

    const seen = new Set<string>();
    const unique: NewsItem[] = [];
    for (const item of allItems) {
      const key = item.title.toLowerCase().trim();
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

    const news = unique.slice(0, 12);

    cachedNews = { timestamp: Date.now(), data: news };
    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: [] });
  }
}