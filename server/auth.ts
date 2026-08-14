import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestOrigin } from "./http.js";

const COOKIE_NAME = "expan_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return value;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function parseCookies(req: VercelRequest): Record<string, string> {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return cookies;
    cookies[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1));
    return cookies;
  }, {});
}

export function createAdminSessionCookie(): string {
  const payload = Buffer.from(JSON.stringify({
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
  })).toString("base64url");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${payload}.${signature(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearAdminSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function hasAdminSession(req: VercelRequest): boolean {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 0) return false;

  const payload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  if (!safeEqual(signature(payload), suppliedSignature)) return false;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { expiresAt?: number };
    return typeof value.expiresAt === "number" && value.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) throw new Error("ADMIN_PASSWORD is not configured.");
  return safeEqual(password, configured);
}

export function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
  options: { mutation?: boolean } = {},
): boolean {
  if (!hasAdminSession(req)) {
    res.status(401).json({ error: "Admin session expired. Please sign in again." });
    return false;
  }

  if (options.mutation && !hasTrustedOrigin(req)) {
    res.status(403).json({ error: "Request origin was not accepted." });
    return false;
  }
  return true;
}

export function hasTrustedOrigin(req: VercelRequest): boolean {
  const origin = getRequestOrigin(req);
  if (!origin) return false;

  const configured = process.env.APP_URL;
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const allowed = new Set<string>();
  if (configured) {
    try { allowed.add(new URL(configured).origin); } catch { /* handled by a mismatch */ }
  }
  if (host) {
    allowed.add(`https://${host}`);
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) allowed.add(`http://${host}`);
  }
  return allowed.has(origin);
}

export function getClientIpHash(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  return createHash("sha256").update(`${secret()}:${ip}`).digest("hex");
}
