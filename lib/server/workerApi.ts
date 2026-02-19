const WORKER_API_URL = process.env.NEXT_PUBLIC_API_URL;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

const withJsonHeaders = (headers?: HeadersInit) => {
  const normalized = new Headers(headers);
  if (!normalized.has("Content-Type")) {
    normalized.set("Content-Type", "application/json");
  }
  if (ADMIN_API_TOKEN && !normalized.has("Authorization")) {
    normalized.set("Authorization", `Bearer ${ADMIN_API_TOKEN}`);
  }
  return normalized;
};

export async function workerApiFetch(path: string, init: RequestInit = {}) {
  if (!WORKER_API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${WORKER_API_URL}${normalizedPath}`, {
    ...init,
    headers: withJsonHeaders(init.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(rawError || `Worker API request failed: ${response.status}`);
  }

  return response;
}
