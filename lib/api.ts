export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };
  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : `Request failed (${response.status}).`;
    const error = new Error(message) as Error & { status?: number; data?: unknown };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as T;
}
