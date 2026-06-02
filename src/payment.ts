import type { PaymentIntent } from "./types.js";

export function createPaymentIntent(issueUrl: string): PaymentIntent {
  const payTo = process.env.PAYMENT_RECEIVER_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID || "0.0.demo";
  const amount = process.env.PAYMENT_AMOUNT_HBAR || "0.10";
  return {
    x402Version: 1,
    status: 402,
    message: "Deep bounty analysis is payment-triggered. Provide X-PAYMENT: demo-paid for the demo flow.",
    accepts: [
      {
        scheme: "hedera-testnet-hbar",
        network: "hedera-testnet",
        payTo,
        amount: `${amount} HBAR`,
        memo: `bounty-scout:${shortHash(issueUrl)}`,
      },
    ],
  };
}

export function hasPaymentProof(headers: Record<string, string | string[] | undefined>): boolean {
  if (process.env.ALLOW_FREE_DEMO === "true") {
    return true;
  }
  const value = headers["x-payment"] || headers["X-PAYMENT"];
  const text = Array.isArray(value) ? value[0] : value;
  return text === "demo-paid";
}

function shortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
