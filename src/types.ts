export type RiskLevel = "low" | "medium" | "high";

export interface GithubIssueInput {
  issueUrl: string;
}

export interface GithubIssueRef {
  owner: string;
  repo: string;
  number: number;
  fullName: string;
}

export interface AnalysisResult {
  issueUrl: string;
  repo: string;
  number: number;
  title: string;
  amountUsd: number | null;
  score: number;
  decision: "START" | "INSPECT" | "SKIP";
  riskLevel: RiskLevel;
  summary: string;
  reasons: string[];
  risks: string[];
  relatedOpenPullRequests: string[];
  visibleAttempts: number;
  visibleRewards: number;
  checkedAt: string;
}

export interface PaymentIntent {
  x402Version: number;
  status: 402;
  message: string;
  accepts: Array<{
    scheme: "hedera-testnet-hbar";
    network: "hedera-testnet";
    payTo: string;
    amount: string;
    memo: string;
  }>;
}
