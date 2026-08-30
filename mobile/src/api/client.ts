export const defaultApiBase =
  process.env.EXPO_PUBLIC_API_URL ?? "https://cheluisfit-api.onrender.com/api";

const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let body: Record<string, unknown> | null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("Invalid server response", response.status);
  }

  if (!response.ok) {
    throw new ApiError((body?.error as string) ?? "Request failed", response.status);
  }

  return body as T;
}

export function createTimeoutSignal(): AbortSignal {
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}
