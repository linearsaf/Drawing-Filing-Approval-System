export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(path, {
    credentials: "include",
    headers: isFormData
      ? init?.headers
      : {
          "Content-Type": "application/json",
          ...(init?.headers ?? {})
        },
    ...init
  });

  const hasJsonBody = response.headers.get("content-type")?.includes("application/json");
  const payload = hasJsonBody ? await response.json() : null;

  if (!response.ok) {
    throw new ApiClientError(
      payload?.error ?? "Permintaan ke server gagal diproses.",
      response.status,
      payload?.details
    );
  }

  return payload as T;
}

export function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    searchParams.set(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
