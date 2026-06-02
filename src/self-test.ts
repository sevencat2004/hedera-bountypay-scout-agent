import { createPaymentIntent } from "./payment.js";
import { parseGithubIssueUrl } from "./github.js";
import { getHederaRuntimeStatus } from "./hedera.js";

const sample = "https://github.com/gyroflow/gyroflow/issues/742";
const parsed = parseGithubIssueUrl(sample);
if (parsed.fullName !== "gyroflow/gyroflow" || parsed.number !== 742) {
  throw new Error("GitHub issue URL parser failed");
}

const intent = createPaymentIntent(sample);
if (intent.status !== 402 || intent.accepts.length !== 1) {
  throw new Error("Payment intent generation failed");
}

const status = await getHederaRuntimeStatus();
console.log(
  JSON.stringify(
    {
      ok: true,
      parser: parsed,
      paymentIntent: intent,
      hederaStatus: status,
    },
    null,
    2,
  ),
);
