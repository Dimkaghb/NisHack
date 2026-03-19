import type {
  SearchRequest,
  SearchResponse,
  PollResponse,
  ContactResponse,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  // Read JWT from window.__locationiq_token if set at runtime by auth provider
  const token = (window as Window & { __locationiq_token?: string }).__locationiq_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function postSearch(body: SearchRequest): Promise<SearchResponse> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<SearchResponse>;
}

export async function pollSearch(sessionId: string): Promise<PollResponse> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/search/${sessionId}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<PollResponse>;
}

export async function postContact(
  sessionId: string,
  listingId: string
): Promise<ContactResponse> {
  const headers = getAuthHeaders();
  const res = await fetch(
    `${BASE_URL}/api/v1/search/${sessionId}/contact`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ listing_id: listingId }),
    }
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<ContactResponse>;
}
