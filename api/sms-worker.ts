import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, sendServerError } from "../server/http";
import { processPendingCampaigns } from "../server/campaigns";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const expected = process.env.SMS_WORKER_SECRET;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: "Worker authentication failed." });
  }
  try {
    await processPendingCampaigns();
    return res.status(200).json({ processed: true });
  } catch (error) {
    return sendServerError(res, error);
  }
}
