export type Platform = "android" | "ios" | "pc";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "pc";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  // iOS, iPadOS (modern iPads report as Mac with touch), or any Apple mobile
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/macintosh|mac os x/i.test(ua) && "ontouchend" in document) return "ios";
  // Mac desktop / Windows / Linux → PC (Steam / web)
  return "pc";
}

export interface GameLinks {
  android: string;
  ios: string;
  pc: string;
}

export function pickLink(links: GameLinks, platform: Platform): string {
  return links[platform];
}
