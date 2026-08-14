import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../../server/auth";
import { exportCampaignRecipients, getCampaignDetail } from "../../../server/campaigns";
import { errorMessage, methodNotAllowed, sendServerError, singleQueryValue } from "../../../server/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  if (!requireAdmin(req, res)) return;
  try {
    const id = singleQueryValue(req.query.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "Invalid campaign ID." });
    if (singleQueryValue(req.query.format) === "csv") {
      const csv = await exportCampaignRecipients(id);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="expan-sms-campaign-${id}.csv"`);
      return res.status(200).send(csv);
    }
    return res.status(200).json({ detail: await getCampaignDetail(id, singleQueryValue(req.query.search)) });
  } catch (error) {
    return sendServerError(res, error, errorMessage(error));
  }
}
