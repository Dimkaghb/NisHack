export type BusinessType = "fastfood" | "office" | "retail" | "pharmacy" | "other";
export type AppState = "idle" | "loading" | "results" | "detail" | "contact";
export type District =
  | "Алмалы"
  | "Медеу"
  | "Бостандык"
  | "Алатау"
  | "Ауэзов"
  | "Жетысу"
  | "Турксиб"
  | "Наурызбай";

export interface ScoreBreakdown {
  footfall: number;
  competitor: number;
  transit: number;
  price: number;
  area: number;
}

export interface ScoredListing {
  id: string;
  address: string;
  lat: number;
  lng: number;
  price_tenge: number;
  area_sqm: number;
  total_score: number;
  score_breakdown: ScoreBreakdown;
  explanation: string;
  source: "krisha" | "olx";
  external_url: string | null;
}

export interface SearchRequest {
  business_type: BusinessType;
  district: string | null;
  budget_tenge: number;
  area_sqm_min: number;
  competitor_tolerance: number;
}

export interface SearchResponse {
  session_id: string;
}

export interface PollResponse {
  status: string;
  top_listings: ScoredListing[] | null;
  error_message: string | null;
}

export interface ContactResponse {
  draft_ru: string;
  draft_en: string;
}
