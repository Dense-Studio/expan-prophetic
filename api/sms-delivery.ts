import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyDeliveryStatus } from "../server/campaigns.js";
import { methodNotAllowed, sendServerError, singleQueryValue } from "../server/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!req.method || !["GET", "POST"].includes(req.method)) return methodNotAllowed(res, ["GET", "POST"]);
  if (!process.env.SMS_CALLBACK_SECRET || singleQueryValue(req.query.secret) !== process.env.SMS_CALLBACK_SECRET) {
    return res.status(401).json({ error: "Callback authentication failed." });
  }
  try {
    const smsId = singleQueryValue(req.query.sms_id) || (typeof req.body?.sms_id === "string" ? req.body.sms_id : "");
    const status = singleQueryValue(req.query.status) || (typeof req.body?.status === "string" ? req.body.status : "");
    if (!smsId || !status) return res.status(400).json({ error: "sms_id and status are required." });
    const matched = await applyDeliveryStatus(smsId, status);
    return res.status(200).json({ received: true, matched });
  } catch (error) {
    return sendServerError(res, error);
  }
}
