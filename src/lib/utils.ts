import { NextRequest } from 'next/server';

const MC_USER = /^[a-zA-Z0-9_]{3,16}$/;
const PASS_MIN = 5;
const PASS_MAX = 32;
const EMAIL_MAX = 254;
const EMAIL_OK =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const rateBuckets = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  let b = rateBuckets.get(ip);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, b);
  }
  b.count += 1;
  if (b.count > RATE_MAX) return false;
  return true;
}

export function clientIp(req: NextRequest): string {
  const x = req.headers.get("x-forwarded-for");
  if (typeof x === "string" && x.length) return x.split(",")[0].trim();
  return req.ip || "0.0.0.0";
}

export function normalizeRank(rank: string): string {
  return rank.toLowerCase()
    .trim()
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
    .replace(/\s+/g, "");
}

export { MC_USER, PASS_MIN, PASS_MAX, EMAIL_MAX, EMAIL_OK };
