import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { requireAdmin } from "../../server/auth";
import { createCampaign, listCampaigns, processCampaign } from "../../server/campaigns";
import { errorMessage, methodNotAllowed, sendServerError } from "../../server/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!req.method || !["GET", "POST"].includes(req.method)) return methodNotAllowed(res, ["GET", "POST"]);
  if (!requireAdmin(req, res, { mutation: req.method === "POST" })) return;
  try {
    if (req.method === "GET") return res.status(200).json({ campaigns: await listCampaigns() });
    const campaign = await createCampaign(req.body || {});
    waitUntil(processCampaign(campaign.id).catch((error) => console.error("SMS campaign worker failed", error)));
    return res.status(202).json({ campaign });
  } catch (error) {
    return sendServerError(res, error, errorMessage(error));
  }
}
