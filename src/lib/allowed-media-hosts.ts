// Only these hosts may be fetched through the download proxy/zip routes —
// without an allowlist, a URL-forwarding endpoint like this becomes an open
// proxy that can be abused to fetch arbitrary third-party content.
export const ALLOWED_MEDIA_HOSTS = [
  "videos.pexels.com",
  "images.pexels.com",
  "cdn.pixabay.com",
];

export function isAllowedMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && ALLOWED_MEDIA_HOSTS.includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}
