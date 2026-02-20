import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function — proxies SMS requests to Arkesel.
 *
 * This replaces the Vite dev server proxy in production.
 * The ARKESEL_API_KEY must be set in Vercel Environment Variables.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ARKESEL_API_KEY;
  if (!apiKey) {
    console.error("❌ ARKESEL_API_KEY is not set");
    return res.status(500).json({ error: "SMS service not configured" });
  }

  try {
    const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();

    // Forward the upstream status and response
    res.status(response.status);
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json",
    );
    return res.send(data);
  } catch (err) {
    console.error("❌ SMS proxy error:", err);
    return res.status(502).json({ error: "Failed to reach SMS provider" });
  }
}
