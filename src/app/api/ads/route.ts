import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.META_ACCESS_TOKEN;
const API = "https://graph.facebook.com/v21.0/ads_archive";

const FIELDS = [
  "id",
  "ad_creation_time",
  "ad_delivery_start_time",
  "ad_delivery_stop_time",
  "ad_creative_bodies",
  "ad_creative_link_titles",
  "ad_creative_link_descriptions",
  "ad_creative_link_captions",
  "ad_snapshot_url",
  "page_id",
  "page_name",
  "bylines",
  "publisher_platforms",
  "spend",
  "impressions",
].join(",");

export async function GET(req: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json(
      { error: "META_ACCESS_TOKEN not set. Add it to your .env.local file." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const country = searchParams.get("country") || "US";
  const status = searchParams.get("status") || "ACTIVE";
  const after = searchParams.get("after") || "";
  const limit = searchParams.get("limit") || "30";
  const pageIds = searchParams.get("page_ids") || "";

  const params = new URLSearchParams({
    access_token: TOKEN,
    ad_reached_countries: `["${country}"]`,
    ad_active_status: status,
    ad_type: "ALL",
    fields: FIELDS,
    limit,
  });

  if (query) params.set("search_terms", query);
  if (pageIds) params.set("search_page_ids", pageIds);
  if (after) params.set("after", after);

  try {
    const res = await fetch(`${API}?${params}`);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach Meta API" }, { status: 500 });
  }
}
