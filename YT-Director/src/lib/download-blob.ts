export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadProxyUrl(sourceUrl: string, filename: string): string {
  return `/api/download-proxy?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;
}
