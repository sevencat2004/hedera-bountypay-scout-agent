import { analyzeGithubIssue } from "./analyzer.js";
import { getHederaRuntimeStatus, hederaFeedbackDraft } from "./hedera.js";

const [, , command, issueUrl] = process.argv;

async function main(): Promise<void> {
  if (!command || command === "help") {
    printHelp();
    return;
  }

  if (command === "status") {
    console.log(JSON.stringify(await getHederaRuntimeStatus(), null, 2));
    return;
  }

  if (command === "feedback") {
    console.log(hederaFeedbackDraft());
    return;
  }

  if (command === "analyze") {
    if (!issueUrl) {
      throw new Error("Missing GitHub issue URL.");
    }
    const result = await analyzeGithubIssue(issueUrl);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function printHelp(): void {
  console.log(`
BountyPay Scout Agent

Commands:
  npm run dev -- analyze <github-issue-url>   Analyze a bounty issue
  npm run dev -- status                       Show Hedera Agent Kit runtime status
  npm run dev -- feedback                     Print Hedera tool feedback draft
  npm run mcp                                 Start MCP stdio server
  npm run serve                               Start x402-style HTTP demo server
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
