import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearAdminSessionCookie, hasTrustedOrigin } from "../../server/auth.js";
import { methodNotAllowed } from "../../server/http.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!hasTrustedOrigin(req)) return res.status(403).json({ error: "Request origin was not accepted." });
  res.setHeader("Set-Cookie", clearAdminSessionCookie());
  return res.status(200).json({ authenticated: false });
}
