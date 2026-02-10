const getBaseUrl = (): string => {
  const env = import.meta.env?.VITE_API_URL;
  if (typeof env === "string" && env.trim()) return env.replace(/\/$/, "");
  // Without proxy, dev requests go to the backend origin
  if (import.meta.env?.DEV) return "http://localhost:3000";
  return "";
};

export class ApiError extends Error {
  readonly status: number;
  readonly body?: { error?: string };

  constructor(
    message: string,
    status: number,
    body?: { error?: string }
  ) {
    super(body?.error ?? message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { method?: string; body?: unknown };

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, ...init } = options;
  const base = getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let parsed: { error?: string } | null = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text) as { error?: string };
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    throw new ApiError(
      parsed?.error ?? res.statusText ?? "Request failed",
      res.status,
      parsed ?? undefined
    );
  }

  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: (path: string) =>
    request<undefined>(path, { method: "DELETE" }),
};

export { getBaseUrl };
