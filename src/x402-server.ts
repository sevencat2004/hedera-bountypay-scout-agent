import http from "node:http";
import { analyzeGithubIssue } from "./analyzer.js";
import { getHederaRuntimeStatus } from "./hedera.js";
import { createPaymentIntent, hasPaymentProof } from "./payment.js";

interface AnalyzeRequest {
  issueUrl?: string;
}

const port = Number(process.env.PORT || 8787);

function readJson(req: http.IncomingMessage): Promise<AnalyzeRequest> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(text) as AnalyzeRequest);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, {
        ok: true,
        hedera: await getHederaRuntimeStatus(),
        routes: ["POST /analyze"],
      });
      return;
    }

    if (req.method === "POST" && req.url === "/analyze") {
      const body = await readJson(req);
      if (!body.issueUrl) {
        sendJson(res, 400, { error: "issueUrl is required" });
        return;
      }

      if (!hasPaymentProof(req.headers)) {
        sendJson(res, 402, createPaymentIntent(body.issueUrl));
        return;
      }

      const analysis = await analyzeGithubIssue(body.issueUrl);
      sendJson(res, 200, {
        paid: true,
        hedera: await getHederaRuntimeStatus(),
        analysis,
      });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, () => {
  console.log(`BountyPay Scout x402 demo listening on http://localhost:${port}`);
  console.log("Try: POST /analyze without X-PAYMENT to receive a 402 payment intent.");
});
