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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return NextResponse.json({ imageUrl: null });
    const html = await res.text();

    // og:image is the most reliable source
    const og =
      html.match(/property="og:image"\s+content="([^"]+)"/)?.[1] ??
      html.match(/content="([^"]+)"\s+property="og:image"/)?.[1];
    if (og && !og.includes("facebook.com/images/")) {
      return NextResponse.json({ imageUrl: decodeURIComponent(og) });
    }

    // video poster thumbnail
    const poster = html.match(/poster="(https:\/\/[^"]+)"/)?.[1];
    if (poster) return NextResponse.json({ imageUrl: poster });

    // any fbcdn.net CDN image
    const cdn = html.match(
      /src="(https:\/\/[^"]*fbcdn\.net\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i
    )?.[1];
    if (cdn) return NextResponse.json({ imageUrl: cdn });

    // data-src lazy loaded images
    const dataSrc = html.match(
      /data-src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i
    )?.[1];
    if (dataSrc) return NextResponse.json({ imageUrl: dataSrc });

    return NextResponse.json({ imageUrl: null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
