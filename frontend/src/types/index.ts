export type BusinessType = "fastfood" | "cafe" | "office" | "retail" | "pharmacy";
export type AppState = "idle" | "form" | "loading" | "results" | "detail" | "contact";

// Districts: Russian display names → English API values
export const DISTRICT_MAP: Record<string, string> = {
  "Алмалы": "Almaly",
  "Медеу": "Medeu",
  "Бостандык": "Bostandyk",
  "Алатау": "Alatau",
  "Ауэзов": "Auezov",
  "Жетысу": "Zhetysu",
  "Турксиб": "Turksib",
  "Наурызбай": "Nauryzbai",
};

export const DISTRICT_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DISTRICT_MAP).map(([ru, en]) => [en, ru])
);

export type District = keyof typeof DISTRICT_MAP;

export interface ScoreBreakdown {
  footfall: number;
  competitor: number;
  transit: number;
  price: number;
  area: number;
}

export interface ScoredListing {
  listing_id: string;
  rank: number;
  title: string;
  address: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  price_tenge: number | null;
  area_sqm: number | null;
  total_score: number;
  score_breakdown: ScoreBreakdown;
  url: string;
  competitor_count: number;
  bus_stops_nearby: number;
  metro_distance_m: number | null;
  nearest_metro_name: string | null;
}

export interface SearchRequest {
  business_type: BusinessType;
  business_name: string | null;
  business_description: string | null;
  district: string | null;
  budget_tenge: number | null;
  area_sqm_min: number | null;
  competitor_tolerance: number;
}

export interface SearchResponse {
  session_id: string;
  status: string;
  message: string;
}

export interface SourceStatus {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  count: number;
}

export interface StatusMeta {
  sources?: SourceStatus[];
}

export interface PollResponse {
  session_id: string;
  status: string;
  business_type: string;
  district: string | null;
  budget_tenge: number | null;
  total_evaluated: number;
  explanation: string;
  error_message: string | null;
  status_meta: StatusMeta | null;
  results: ScoredListing[];
}

export interface ContactResponse {
  draft_ru: string;
  draft_en: string;
}

export interface SaveBusinessResponse {
  id: string;
  already_saved: boolean;
  listings_count?: number;
}

export interface SavedBusiness {
  id: string;
  user_id: string;
  business_type: BusinessType;
  business_name: string | null;
  district: string | null;
  budget_tenge: number | null;
  session_id: string;
  created_at: string;
  listings_count: number;
}

export interface SavedBusinessesResponse {
  businesses: SavedBusiness[];
  total: number;
}

export interface SavedBusinessDetailResponse {
  business: SavedBusiness;
  listings: ScoredListing[];
}
