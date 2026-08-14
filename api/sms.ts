import type { VercelRequest, VercelResponse } from "@vercel/node";

/** The former unrestricted SMS proxy is intentionally retired. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: "This SMS endpoint has been retired. Use the protected campaign or public attendance endpoints.",
  });
}
