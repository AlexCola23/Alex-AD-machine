export interface Ad {
  id: string;
  page_name: string;
  page_id: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_captions?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_creation_time?: string;
  ad_snapshot_url?: string;
  publisher_platforms?: string[];
  bylines?: string;
  spend?: { lower_bound: string; upper_bound: string };
  impressions?: { lower_bound: string; upper_bound: string };
}

export interface SwipeAd extends Ad {
  savedAt: string;
}

export interface Paging {
  cursors?: { before: string; after: string };
  next?: string;
}

export interface AdsApiResponse {
  data: Ad[];
  paging?: Paging;
  error?: string;
}

export interface Filters {
  countries: string[];
  status: string;
  platforms: string[];
  runTime: number;
  sortBy: "running" | "recent";
}
