import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// A user-supplied "fetch this URL" feature is a classic SSRF vector — without
// this check, a user could point it at http://localhost, a cloud metadata
// endpoint, or another machine on this server's private network.
function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 0) return true;
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    return false;
  }
  return true; // couldn't parse — treat as unsafe
}

export async function assertPublicHttpUrl(url: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("সঠিক URL দিন।");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("শুধু http/https লিংক সাপোর্ট করে।");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("এই লিংকটা অনুমোদিত না।");
  }

  let addresses: string[];
  try {
    const results = await lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new Error("এই লিংকের হোস্ট খুঁজে পাওয়া যায়নি।");
  }

  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new Error("এই লিংকটা অনুমোদিত না।");
  }

  return parsed;
}
