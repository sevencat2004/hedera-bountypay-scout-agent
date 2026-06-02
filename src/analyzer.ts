import { fetchIssueBundle, GithubIssue, GithubPullRequest } from "./github.js";
import type { AnalysisResult } from "./types.js";

const BLACKLISTED_REPOS = new Set([
  "SecureBananaLabs/bug-bounty",
  "ClankerNation/OpenAgents",
  "UnsafeLabs/Bounty-Hunters",
  "UnsafeLabs/RFC-5322",
  "UnsafeLabs/Coolify-Rust-v4",
  "tine1117/oss-hunter-livefire",
  "Bu1ldTh3Futur3/bounty-hunter-test",
  "javelin-anticheat/py-workedtask",
  "rohitdash08/FinMind",
  "archestra-ai/archestra",
  "tscircuit/docs-old",
  "aqualinkorg/aqualink-app",
  "spaceandtimefdn/sxt-proof-of-sql",
  "activepieces/activepieces",
  "warpspeedopen-source/warpspeed-bounties",
  "dev-kp-eloper/BountyScout",
]);

const TEXT_BLACKLIST = [
  "not accepting new bounty attempts",
  "autonomus agents only",
  "reserved for se interview",
  ".generation_meta.json",
  ".contributor.json",
  "sandbox fixture",
  "test bounty",
  "demo issue",
  "gssoc",
  "calculate the exact value of pi",
];

export async function analyzeGithubIssue(issueUrl: string): Promise<AnalysisResult> {
  const { ref, issue, repo, comments, openPulls } = await fetchIssueBundle(issueUrl);
  const labels = issue.labels.map((label) => label.name);
  const combinedText = [
    issue.title,
    issue.body ?? "",
    labels.join(" "),
    repo.description ?? "",
  ].join("\n").toLowerCase();
  const amountUsd = extractAmountUsd(issue.title, issue.body ?? "", labels.join(" "));
  const relatedOpenPullRequests = findRelatedOpenPullRequests(issue, openPulls);
  const visibleAttempts = comments.reduce((count, comment) => {
    return count + countMatches(comment.body ?? "", /\/attempt/gi);
  }, 0);
  const visibleRewards = comments.reduce((count, comment) => {
    return count + countMatches(comment.body ?? "", /\breward\b|💰/gi);
  }, 0);

  let score = 20;
  const reasons: string[] = ["issue is reachable through GitHub API"];
  const risks: string[] = [];

  if (issue.state === "open") {
    score += 12;
    reasons.push("issue is open");
  } else {
    score -= 80;
    risks.push(`issue state is ${issue.state}`);
  }

  if (!issue.assignee) {
    score += 10;
    reasons.push("no assignee");
  } else {
    score -= 35;
    risks.push("issue is assigned");
  }

  if (amountUsd !== null) {
    score += Math.min(32, Math.max(6, Math.floor(amountUsd / 20)));
    reasons.push(`amount signal detected: $${amountUsd}`);
  } else {
    score -= 12;
    risks.push("no clear USD amount");
  }

  if (issue.comments <= 5) {
    score += 12;
    reasons.push("low comment count");
  } else if (issue.comments <= 15) {
    score += 5;
    reasons.push("moderate comment count");
  } else if (issue.comments >= 30) {
    score -= 22;
    risks.push("crowded comment thread");
  }

  if (repo.archived) {
    score -= 90;
    risks.push("repository is archived");
  }

  if (repo.stargazers_count === 0 && repo.forks_count <= 2) {
    score -= 15;
    risks.push("very low repository signal");
  }

  if (BLACKLISTED_REPOS.has(ref.fullName)) {
    score -= 90;
    risks.push("repository is on the noisy or unsafe blacklist");
  }

  for (const pattern of TEXT_BLACKLIST) {
    if (combinedText.includes(pattern)) {
      score -= 40;
      risks.push(`blacklisted text pattern: ${pattern}`);
    }
  }

  if (labels.some((label) => ["💰 Rewarded", "Reserved for SE interview", "Autonomus Agents Only", "type/proposal"].includes(label))) {
    score -= 60;
    risks.push("blacklisted label present");
  }

  if (relatedOpenPullRequests.length > 0) {
    score -= Math.min(70, 16 + relatedOpenPullRequests.length * 9);
    risks.push(`${relatedOpenPullRequests.length} related open PR(s) detected`);
  }

  if (visibleAttempts > 0) {
    score -= Math.min(50, visibleAttempts * 5);
    risks.push(`${visibleAttempts} visible /attempt marker(s)`);
  }

  if (visibleRewards > 0) {
    score += Math.min(10, visibleRewards * 2);
    reasons.push("visible reward history");
  }

  if (combinedText.includes("paid bounty") || combinedText.includes("/bounty")) {
    score += 8;
    reasons.push("explicit paid bounty wording");
  }

  const decision = score >= 60 ? "START" : score >= 35 ? "INSPECT" : "SKIP";
  const riskLevel = score >= 60 ? "low" : score >= 35 ? "medium" : "high";
  const summary = summarizeDecision(decision, score, risks);

  return {
    issueUrl,
    repo: ref.fullName,
    number: ref.number,
    title: issue.title,
    amountUsd,
    score,
    decision,
    riskLevel,
    summary,
    reasons,
    risks,
    relatedOpenPullRequests,
    visibleAttempts,
    visibleRewards,
    checkedAt: new Date().toISOString(),
  };
}

function extractAmountUsd(...texts: string[]): number | null {
  let best: number | null = null;
  for (const text of texts) {
    for (const match of text.matchAll(/\$[\s,]*(\d[\d,]*(?:\.\d+)?)\s*([kK])?/g)) {
      let amount = Number(match[1].replace(/,/g, ""));
      if (match[2]) amount *= 1000;
      if (Number.isFinite(amount)) {
        best = best === null ? amount : Math.max(best, amount);
      }
    }
  }
  return best === null ? null : Math.round(best);
}

function findRelatedOpenPullRequests(issue: GithubIssue, openPulls: GithubPullRequest[]): string[] {
  const issueWords = new Set(
    issue.title
      .toLowerCase()
      .match(/[a-z0-9]{4,}/g)
      ?.filter((word) => !["issue", "bounty", "paid", "feature", "with", "from", "this"].includes(word)) ?? [],
  );
  const urls: string[] = [];
  for (const pr of openPulls) {
    const title = pr.title.toLowerCase();
    const body = (pr.body ?? "").toLowerCase();
    if (title.includes(`#${issue.number}`) || body.includes(`#${issue.number}`)) {
      urls.push(pr.html_url);
      continue;
    }
    const overlap = [...issueWords].filter((word) => title.includes(word)).length;
    if (overlap >= Math.max(2, Math.min(4, Math.floor(issueWords.size / 2)))) {
      urls.push(pr.html_url);
    }
  }
  return urls;
}

function countMatches(text: string, regex: RegExp): number {
  return [...text.matchAll(regex)].length;
}

function summarizeDecision(decision: AnalysisResult["decision"], score: number, risks: string[]): string {
  if (decision === "START") {
    return `Start candidate: score ${score}; no blocking risk detected by automated scout.`;
  }
  if (decision === "INSPECT") {
    return `Inspect manually before claiming: score ${score}; ${risks.slice(0, 2).join("; ") || "some uncertainty remains"}.`;
  }
  return `Skip for now: score ${score}; ${risks.slice(0, 3).join("; ") || "insufficient payout signal"}.`;
}
