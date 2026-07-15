const FALLBACK_ERROR = "সার্ভার থেকে সঠিক উত্তর পাওয়া যায়নি, আবার চেষ্টা করুন।";

export async function readErrorMessage(res: Response, fallback = FALLBACK_ERROR): Promise<string> {
  try {
    const data = await res.json();
    return data?.error ?? fallback;
  } catch {
    // response wasn't JSON (e.g. an HTML error page from the host/proxy) — use fallback
    return fallback;
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(FALLBACK_ERROR);
  }
}
