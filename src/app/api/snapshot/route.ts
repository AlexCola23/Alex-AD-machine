import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.META_ACCESS_TOKEN;

export async function GET(req: NextRequest) {
  // Accept either a full snapshot URL or just the ad ID
  const snapUrl = req.nextUrl.searchParams.get("snapUrl");
  const id = req.nextUrl.searchParams.get("id");

  if (!TOKEN) return NextResponse.json({ imageUrl: null });
  if (!snapUrl && !id) return NextResponse.json({ imageUrl: null });

  const fetchUrl = snapUrl
    ? decodeURIComponent(snapUrl)
    : `https://www.facebook.com/ads/archive/render_ad/?id=${id}&access_token=${TOKEN}`;

  // Try 1: fetch the snapshot page and extract image
  try {
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.facebook.com/",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const html = await res.text();

      // og:image — most reliable
      const og =
        html.match(/property="og:image"\s+content="([^"]+)"/)?.[1] ??
        html.match(/content="([^"]+)"\s+property="og:image"/)?.[1];
      if (og && !og.includes("facebook.com/images/") && !og.includes("static.xx.fbcdn") && og.startsWith("http")) {
        return NextResponse.json({ imageUrl: decodeURIComponent(og) });
      }

      // video poster
      const poster = html.match(/poster="(https:\/\/[^"]+)"/)?.[1];
      if (poster) return NextResponse.json({ imageUrl: poster });

      // fbcdn CDN image src
      const cdn = html.match(/src="(https:\/\/[^"]*fbcdn\.net\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
      if (cdn) return NextResponse.json({ imageUrl: cdn });

      // scontent CDN
      const sc = html.match(/(https:\/\/scontent[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/i)?.[1];
      if (sc) return NextResponse.json({ imageUrl: sc });

      // data-src lazy
      const dataSrc = html.match(/data-src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
      if (dataSrc) return NextResponse.json({ imageUrl: dataSrc });

      // JSON-embedded image URL (e.g. in __html or data props)
      const jsonImg = html.match(/"uri"\s*:\s*"(https:\\\/\\\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
      if (jsonImg) return NextResponse.json({ imageUrl: jsonImg.replace(/\\\//g, "/") });
    }
  } catch {
    // fall through to try 2
  }

  // Try 2: Graph API creative fields (works for some ad types)
  if (id || snapUrl) {
    const adId = id ?? snapUrl?.match(/id=(\d+)/)?.[1];
    if (adId) {
      try {
        const gRes = await fetch(
          `https://graph.facebook.com/v21.0/${adId}?fields=creative{image_url,thumbnail_url}&access_token=${TOKEN}`,
          { next: { revalidate: 3600 } }
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          const img = gData?.creative?.image_url ?? gData?.creative?.thumbnail_url;
          if (img) return NextResponse.json({ imageUrl: img });
        }
      } catch {
        // fall through
      }
    }
  }

  return NextResponse.json({ imageUrl: null });
}
