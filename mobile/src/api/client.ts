export const defaultApiBase =
  process.env.EXPO_PUBLIC_API_URL ?? "https://cheluisfit-api.onrender.com/api";

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
          ? body.message
          : typeof body === "string" && body.trim()
            ? body
            : "Request failed");
    throw new Error(message);
  }

  if (body === undefined || body === null) {
    return null as T;
  }

  return body as T;
}
