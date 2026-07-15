const RETRY_DELAYS_MS = [300, 900];

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = RETRY_DELAYS_MS.length
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
