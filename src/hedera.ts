export interface HederaRuntimeStatus {
  enabled: boolean;
  network: string;
  accountId: string | null;
  note: string;
}

export async function getHederaRuntimeStatus(): Promise<HederaRuntimeStatus> {
  const accountId = process.env.HEDERA_ACCOUNT_ID || null;
  const privateKey = process.env.HEDERA_PRIVATE_KEY || "";
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    return {
      enabled: false,
      network,
      accountId,
      note: "Hedera Agent Kit runtime is configured as demo-only. Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable live testnet actions.",
    };
  }

  try {
    const hederaAgentKitPackage = "@hashgraph/hedera-agent-kit";
    const standardsAgentKitPackage = "@hashgraphonline/standards-agent-kit";
    await import(hederaAgentKitPackage);
    await import(standardsAgentKitPackage);
    return {
      enabled: true,
      network,
      accountId,
      note: "Hedera Agent Kit v4 and the standards MCP toolkit package are available and credentials are present. This demo only reads configuration; it does not spend funds automatically.",
    };
  } catch (error) {
    return {
      enabled: false,
      network,
      accountId,
      note: `Hedera Agent Kit package was not available at runtime: ${String(error)}`,
    };
  }
}

export function hederaFeedbackDraft(): string {
  return [
    "Feedback for Hedera Agent Kit / AI bounty tooling:",
    "",
    "The Agent Kit is useful for building transaction-aware agents, but bounty participants need a small canonical sample that combines an MCP tool with a payment-triggered execution pattern.",
    "For this submission, I built the deep analysis flow so it can run in demo mode without moving user funds, while still exposing the Hedera account/payment destination clearly.",
    "A recommended improvement would be an official x402 + Hedera Agent Kit template that includes: payment intent generation, testnet receipt verification, safe dry-run mode, and MCP tool metadata examples.",
  ].join("\n");
}
