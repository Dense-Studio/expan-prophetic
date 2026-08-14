import type { VercelRequest, VercelResponse } from "@vercel/node";

export function methodNotAllowed(res: VercelResponse, methods: string[]) {
  res.setHeader("Allow", methods.join(", "));
  return res.status(405).json({ error: "Method not allowed" });
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

export function sendServerError(
  res: VercelResponse,
  error: unknown,
  publicMessage = "The server could not complete this request.",
) {
  console.error(error);
  return res.status(500).json({
    error: process.env.NODE_ENV === "production" ? publicMessage : errorMessage(error),
  });
}

export function singleQueryValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export function getRequestOrigin(req: VercelRequest): string {
  const origin = req.headers.origin;
  return Array.isArray(origin) ? origin[0] || "" : origin || "";
}
