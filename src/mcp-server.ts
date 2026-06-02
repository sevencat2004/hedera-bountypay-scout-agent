import { analyzeGithubIssue } from "./analyzer.js";
import { getHederaRuntimeStatus, hederaFeedbackDraft } from "./hedera.js";
import { createPaymentIntent } from "./payment.js";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function writeMessage(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function result(id: JsonRpcRequest["id"], payload: unknown): void {
  writeMessage({ jsonrpc: "2.0", id, result: payload });
}

function error(id: JsonRpcRequest["id"], code: number, message: string): void {
  writeMessage({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handle(req: JsonRpcRequest): Promise<void> {
  if (req.method === "initialize") {
    result(req.id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: {
        name: "hedera-bountypay-scout-agent",
        version: "0.1.0",
      },
    });
    return;
  }

  if (req.method === "tools/list") {
    result(req.id, {
      tools: [
        {
          name: "request_payment_intent",
          description: "Create an x402-style Hedera payment intent for a GitHub bounty issue deep scan.",
          inputSchema: {
            type: "object",
            properties: {
              issueUrl: { type: "string" },
            },
            required: ["issueUrl"],
          },
        },
        {
          name: "analyze_bounty_issue",
          description: "Analyze a GitHub bounty issue for payout probability, competition, and PR overlap.",
          inputSchema: {
            type: "object",
            properties: {
              issueUrl: { type: "string" },
              paymentProof: { type: "string", description: "Use demo-paid for local demo mode." },
            },
            required: ["issueUrl", "paymentProof"],
          },
        },
        {
          name: "hedera_status",
          description: "Show Hedera Agent Kit runtime status without moving funds.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "hedera_feedback_draft",
          description: "Return the feedback text prepared for the Hedera bounty submission.",
          inputSchema: { type: "object", properties: {} },
        },
      ],
    });
    return;
  }

  if (req.method === "tools/call") {
    const name = String(req.params?.name ?? "");
    const args = (req.params?.arguments ?? {}) as Record<string, unknown>;
    if (name === "request_payment_intent") {
      const issueUrl = String(args.issueUrl ?? "");
      result(req.id, {
        content: [{ type: "text", text: JSON.stringify(createPaymentIntent(issueUrl), null, 2) }],
      });
      return;
    }

    if (name === "analyze_bounty_issue") {
      const issueUrl = String(args.issueUrl ?? "");
      const paymentProof = String(args.paymentProof ?? "");
      if (paymentProof !== "demo-paid" && process.env.ALLOW_FREE_DEMO !== "true") {
        result(req.id, {
          content: [{ type: "text", text: JSON.stringify(createPaymentIntent(issueUrl), null, 2) }],
          isError: true,
        });
        return;
      }
      const analysis = await analyzeGithubIssue(issueUrl);
      result(req.id, {
        content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }],
      });
      return;
    }

    if (name === "hedera_status") {
      result(req.id, {
        content: [{ type: "text", text: JSON.stringify(await getHederaRuntimeStatus(), null, 2) }],
      });
      return;
    }

    if (name === "hedera_feedback_draft") {
      result(req.id, {
        content: [{ type: "text", text: hederaFeedbackDraft() }],
      });
      return;
    }

    error(req.id, -32602, `Unknown tool: ${name}`);
    return;
  }

  if (req.method === "notifications/initialized") {
    return;
  }

  error(req.id, -32601, `Unknown method: ${req.method}`);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let index = buffer.indexOf("\n");
  while (index >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (line) {
      try {
        const req = JSON.parse(line) as JsonRpcRequest;
        void handle(req).catch((err) => error(req.id, -32000, err instanceof Error ? err.message : String(err)));
      } catch (err) {
        error(null, -32700, err instanceof Error ? err.message : String(err));
      }
    }
    index = buffer.indexOf("\n");
  }
});
