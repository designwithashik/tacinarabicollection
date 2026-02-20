const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  const url = isAbsoluteUrl(normalizedPath)
    ? normalizedPath
    : `${baseUrl}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  const rawBody = await response.text();
  if (!rawBody) {
    return null as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error("Invalid JSON response");
  }
}
