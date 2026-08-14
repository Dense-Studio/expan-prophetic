import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { requireAdmin } from "../../server/auth.js";
import { campaignAction, processCampaign } from "../../server/campaigns.js";
import { errorMessage, methodNotAllowed, sendServerError } from "../../server/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!requireAdmin(req, res, { mutation: true })) return;
  try {
    const campaignId = typeof req.body?.campaignId === "string" ? req.body.campaignId : "";
    const action = typeof req.body?.action === "string" ? req.body.action : "";
    if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return res.status(400).json({ error: "Invalid campaign ID." });
    const campaign = await campaignAction(campaignId, action);
    if (action !== "cancel") {
      waitUntil(processCampaign(campaign.id).catch((error) => console.error("SMS campaign worker failed", error)));
    }
    return res.status(200).json({ campaign });
  } catch (error) {
    return sendServerError(res, error, errorMessage(error));
  }
}
