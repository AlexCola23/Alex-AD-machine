import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.META_ACCESS_TOKEN;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !TOKEN) return NextResponse.json({ imageUrl: null });

  try {
    const res = await fetch(
      `https://www.facebook.com/ads/archive/render_ad/?id=${id}&access_token=${TOKEN}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return NextResponse.json({ imageUrl: null });
    const html = await res.text();

    // 1. og:image — most reliable
    const og =
      html.match(/property="og:image"\s+content="([^"]+)"/)?.[1] ??
      html.match(/content="([^"]+)"\s+property="og:image"/)?.[1];
    if (og && !og.includes("facebook.com/images/") && !og.includes("static.xx.fbcdn")) {
      return NextResponse.json({ imageUrl: decodeURIComponent(og) });
    }

    // 2. video poster thumbnail
    const poster = html.match(/poster="(https:\/\/[^"]+)"/)?.[1];
    if (poster) return NextResponse.json({ imageUrl: poster });

    // 3. fbcdn.net CDN image in src= attribute
    const cdn = html.match(
      /src="(https:\/\/[^"]*fbcdn\.net\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i
    )?.[1];
    if (cdn) return NextResponse.json({ imageUrl: cdn });

    // 4. scontent CDN (alternate domain pattern)
    const scontent = html.match(
      /(https:\/\/scontent[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/i
    )?.[1];
    if (scontent) return NextResponse.json({ imageUrl: scontent });

    // 5. data-src lazy-loaded
    const dataSrc = html.match(
      /data-src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i
    )?.[1];
    if (dataSrc) return NextResponse.json({ imageUrl: dataSrc });

    // 6. any https image in the HTML (last resort)
    const anyImg = html.match(
      /"(https:\/\/[^"]*fbcdn\.net\/[^"]{20,})"/
    )?.[1];
    if (anyImg && (anyImg.includes(".jpg") || anyImg.includes(".png") || anyImg.includes(".webp"))) {
      return NextResponse.json({ imageUrl: anyImg });
    }

    return NextResponse.json({ imageUrl: null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
