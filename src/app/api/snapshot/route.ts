import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.META_ACCESS_TOKEN;

export async function GET(req: NextRequest) {
  const snapUrl = req.nextUrl.searchParams.get("snapUrl");
  const id = req.nextUrl.searchParams.get("id");

  if (!TOKEN) return NextResponse.json({ imageUrl: null });
  if (!snapUrl && !id) return NextResponse.json({ imageUrl: null });

  const adId = id ?? snapUrl?.match(/id=(\d+)/)?.[1];

  // Try 1: Graph API creative fields (most reliable — direct asset URLs)
  if (adId) {
    try {
      const gRes = await fetch(
        `https://graph.facebook.com/v21.0/${adId}?fields=creative{image_url,thumbnail_url,video_id}&access_token=${TOKEN}`,
        { next: { revalidate: 3600 } }
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        const creative = gData?.creative;

        // Static ad: image_url is the primary image asset
        if (creative?.image_url) {
          return NextResponse.json({ imageUrl: creative.image_url });
        }

        // Video ad: thumbnail_url directly available
        if (creative?.thumbnail_url) {
          return NextResponse.json({ imageUrl: creative.thumbnail_url });
        }

        // Video ad: fetch preferred thumbnail via video_id
        if (creative?.video_id) {
          try {
            const vRes = await fetch(
              `https://graph.facebook.com/v21.0/${creative.video_id}?fields=thumbnails{uri,is_preferred}&access_token=${TOKEN}`,
              { next: { revalidate: 3600 } }
            );
            if (vRes.ok) {
              const vData = await vRes.json();
              const thumbs: { uri: string; is_preferred?: boolean }[] = vData?.thumbnails?.data ?? [];
              const preferred = thumbs.find((t) => t.is_preferred)?.uri ?? thumbs[0]?.uri;
              if (preferred) return NextResponse.json({ imageUrl: preferred });
            }
          } catch {
            // fall through to snapshot scraping
          }
        }
      }
    } catch {
      // fall through to snapshot scraping
    }
  }

  // Try 2: Scrape the snapshot page HTML for image URLs
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

      const dataSrc = html.match(/data-src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
      if (dataSrc) return NextResponse.json({ imageUrl: dataSrc });

      const jsonImg = html.match(/"uri"\s*:\s*"(https:\\\/\\\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
      if (jsonImg) return NextResponse.json({ imageUrl: jsonImg.replace(/\\\//g, "/") });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ imageUrl: null });
}
