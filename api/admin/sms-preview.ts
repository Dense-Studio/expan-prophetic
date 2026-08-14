import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth";
import { errorMessage, methodNotAllowed, sendServerError } from "../../server/http";
import { previewCampaign } from "../../server/campaigns";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!requireAdmin(req, res, { mutation: true })) return;
  try {
    const preview = await previewCampaign(req.body || {});
    return res.status(200).json({ preview });
  } catch (error) {
    return sendServerError(res, error, errorMessage(error));
  }
}
