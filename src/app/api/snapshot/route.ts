import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.META_ACCESS_TOKEN;

// Domains that are social platforms — not useful as OG image sources
const SKIP_DOMAINS = new Set([
  "facebook.com", "fb.com", "instagram.com", "threads.net",
  "twitter.com", "x.com", "youtube.com", "tiktok.com",
  "linkedin.com", "pinterest.com", "snapchat.com",
]);

function isSkippedDomain(domain: string) {
  return SKIP_DOMAINS.has(domain.replace(/^www\./, "").toLowerCase());
}

export async function GET(req: NextRequest) {
  const snapUrl = req.nextUrl.searchParams.get("snapUrl");
  const id = req.nextUrl.searchParams.get("id");
  const domain = req.nextUrl.searchParams.get("domain"); // e.g. "meleso.com"

  if (!TOKEN) return NextResponse.json({ imageUrl: null });
  if (!snapUrl && !id && !domain) return NextResponse.json({ imageUrl: null });

  const adId = id ?? snapUrl?.match(/id=(\d+)/)?.[1];

  // Try 1: Fetch OG image from the advertiser's website
  if (domain && !isSkippedDomain(domain)) {
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0];
      const res = await fetch(`https://${cleanDomain}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 86400 }, // cache 24h — site OG images don't change often
      });

      if (res.ok) {
        const html = await res.text();
        const og =
          html.match(/property="og:image"\s+content="([^"]+)"/)?.[1] ??
          html.match(/content="([^"]+)"\s+property="og:image"/)?.[1] ??
          html.match(/name="twitter:image"\s+content="([^"]+)"/)?.[1] ??
          html.match(/content="([^"]+)"\s+name="twitter:image"/)?.[1];
        if (og && og.startsWith("http")) {
          return NextResponse.json({ imageUrl: og });
        }
      }
    } catch {
      // fall through
    }
  }

  // Try 2: Scrape the Facebook ad snapshot page HTML
  if (adId) {
    const fetchUrl = snapUrl
      ? decodeURIComponent(snapUrl)
      : `https://www.facebook.com/ads/archive/render_ad/?id=${adId}&access_token=${TOKEN}`;

    try {
      const res = await fetch(fetchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.facebook.com/",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const html = await res.text();

        const og =
          html.match(/property="og:image"\s+content="([^"]+)"/)?.[1] ??
          html.match(/content="([^"]+)"\s+property="og:image"/)?.[1];
        if (og && !og.includes("facebook.com/images/") && !og.includes("static.xx.fbcdn") && og.startsWith("http")) {
          return NextResponse.json({ imageUrl: decodeURIComponent(og) });
        }

        const poster = html.match(/poster="(https:\/\/[^"]+)"/)?.[1];
        if (poster) return NextResponse.json({ imageUrl: poster });

        const cdn = html.match(/src="(https:\/\/[^"]*fbcdn\.net\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
        if (cdn) return NextResponse.json({ imageUrl: cdn });

        const sc = html.match(/(https:\/\/scontent[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/i)?.[1];
        if (sc) return NextResponse.json({ imageUrl: sc });

        const jsonImg = html.match(/"uri"\s*:\s*"(https:\\\/\\\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
        if (jsonImg) return NextResponse.json({ imageUrl: jsonImg.replace(/\\\//g, "/") });
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json({ imageUrl: null });
}
