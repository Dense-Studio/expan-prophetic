import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAdminSession } from "../../server/auth";
import { methodNotAllowed } from "../../server/http";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const authenticated = hasAdminSession(req);
  return res.status(authenticated ? 200 : 401).json({ authenticated });
}
